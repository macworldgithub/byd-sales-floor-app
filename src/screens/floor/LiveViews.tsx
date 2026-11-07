import React, { useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useFloor, useResource } from '../../lib/floorContext';
import { melbourneBookingTime, melbourneDate, mobileApi, recordId, requestId, Row } from '../../lib/mobileApi';
import { devicePosition, disablePush, enablePush, exportReport, testLocalNotification, testRemotePush } from '../../lib/deviceFeatures';
import { Button, ErrorBox, Field, Metrics, Pick, Sheet, styles } from '../../components/floor/Controls';

type LeadAction = (lead: Row) => void;
export function Dashboard({ onLead, onAdd, onBook }: { onLead: LeadAction; onAdd: () => void; onBook: () => void }) {
  const floor = useFloor(), [period, setPeriod] = useState('today');
  const summary = useResource(() => mobileApi.summary(period), `summary:${floor.site}:${period}`, {} as Row);
  const tasks = useResource(() => mobileApi.tasks(), `tasks:${floor.site}`, [] as Row[]);
  const [error, setError] = useState('');
  const values = [['Current active leads', 'activeLeads'], ['Unactioned leads', 'unactionedLeads'], ['Appointments / drives booked', 'appointmentsBooked'], ['Overdue SLA activities', 'overdueSla'],
    ['Deals completed', 'dealsCompleted'], ['Lead-to-sale conversion %', 'conversionRate'], ['Videos sent', 'videosSent'], ['Monthly target', 'monthlyTarget']];
  return <><View style={styles.card}><Text style={styles.title}>{floor.isManager ? 'Good morning · BYD floor' : 'Your sales floor'}</Text><Text style={styles.muted}>{floor.site} · {melbourneDate()} · Updates every 30 seconds</Text>
    <View style={styles.row}><Button title="Add prospect" onPress={onAdd} /><Button title="Book test drive" secondary onPress={onBook} /></View>
    <Pick label="Staff summary period" value={period} rows={[{ id: 'today', name: 'Today' }, { id: 'weekly', name: 'Last 7 days' }, { id: 'mtd', name: 'Month to date' }]} onChange={setPeriod} />
    <ErrorBox message={summary.error || error} /><Metrics values={values.map(([label, key]) => ({ label, value: summary.data[key] }))} />
    <Text style={styles.muted}>A dash means the underlying value is unavailable. Active leads and overdue activities show the current backlog.</Text>
  </View><View style={styles.card}><Text style={styles.subtitle}>Your activity list</Text><ErrorBox message={tasks.error} />
    {!tasks.data.filter(row => row.status === 'open').length && <Text style={styles.muted}>No outstanding assigned tasks.</Text>}
    {tasks.data.filter(row => row.status === 'open').map(row => <View key={recordId(row)} style={styles.card}><Text style={styles.text}>{row.title}</Text><Text style={styles.muted}>Due {new Date(row.dueAt).toLocaleString()}</Text><Button title="Complete task" secondary onPress={() => { mobileApi.completeTask(recordId(row)).then(() => { tasks.reload(); void floor.refresh(); }).catch(cause => setError(cause.message)); }} /></View>)}
  </View><View style={styles.card}><Text style={styles.subtitle}>Prospects to follow up</Text>{floor.leads.filter(row => !['DELIVERED', 'LOST'].includes(row.stage)).slice(0, 8).map(row => <LeadCard key={recordId(row)} lead={row} onPress={() => onLead(row)} />)}
    <Button title="Log walk-in without contact details" secondary onPress={() => { mobileApi.logWalkIn().then(() => { void floor.refresh(); }).catch(cause => setError(cause.message)); }} />
  </View></>;
}
export function LeadCard({ lead, onPress }: { lead: Row; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" onPress={onPress} style={styles.card}><Text style={styles.subtitle}>{lead.name}</Text><Text style={styles.text}>{lead.vehicle || lead.model || 'Vehicle interest not recorded'}</Text><View style={styles.row}><Text style={styles.pill}>{lead.stage}</Text><Text style={styles.muted}>{lead.phone}</Text></View><Text style={styles.muted}>{lead.dealer} · {lead.allocatedPersonFullName || 'Unassigned'}</Text></TouchableOpacity>;
}
export function LeadsView({ onLead, onAdd }: { onLead: LeadAction; onAdd: () => void }) {
  const floor = useFloor(), [query, setQuery] = useState('');
  const results = useResource(() => mobileApi.leads(1, query), `search:${floor.site}:${query}`, { rows: [], pagination: {} });
  const rows = query ? results.data.rows : floor.leads;
  return <><View style={styles.card}><Text style={styles.title}>Leads and customers</Text><Field label="Search all leads" value={query} onChange={setQuery} placeholder="Name, mobile, email or vehicle" /><Button title="Add prospect" onPress={onAdd} /><ErrorBox message={query ? results.error : floor.error} /></View>
    {rows.map(row => <LeadCard key={recordId(row)} lead={row} onPress={() => onLead(row)} />)}
    {!rows.length && <Text style={styles.muted}>No matching prospects.</Text>}
    {!query && floor.hasMore && <Button title="Load more leads" busy={floor.loading} onPress={() => { void floor.loadMore(); }} />}
  </>;
}
export function InboxView({ onLead }: { onLead: LeadAction }) {
  const floor = useFloor(), threads = useResource(() => mobileApi.threads(), `threads:${floor.site}`, [] as Row[]), [error, setError] = useState('');
  const open = async (thread: Row) => {
    try {
      const match = floor.leads.find(row => recordId(row) === String(thread.leadId) || String(row.phone).replace(/\D/g, '').slice(-9) === String(thread.phone).replace(/\D/g, '').slice(-9));
      if (match) onLead(match); else if (thread.leadId) onLead(await mobileApi.lead(String(thread.leadId))); else setError('Open this conversation from its customer record.');
    } catch (cause) { setError((cause as Error).message); }
  };
  return <><Text style={styles.title}>Conversations</Text><ErrorBox message={error || threads.error} />{threads.data.map((thread, index) => <TouchableOpacity accessibilityRole="button" key={thread.id || recordId(thread) || index} onPress={() => { void open(thread); }} style={styles.card}><Text style={styles.subtitle}>{thread.prospectName || thread.name}</Text><Text style={styles.text}>{thread.lastMessage}</Text><Text style={styles.muted}>{thread.phone} · {thread.messages?.length || 0} recorded messages</Text></TouchableOpacity>)}{!threads.data.length && <Text style={styles.muted}>No conversations in your current scope.</Text>}</>;
}
export function PulseView({ onLead }: { onLead: LeadAction }) {
  const floor = useFloor(), resource = useResource(() => mobileApi.pulse(), `pulse:${floor.site}`, {} as Row), [owner, setOwner] = useState('All'), [error, setError] = useState('');
  const rows: Row[] = resource.data.consultants || [];
  return <><View style={styles.card}><Text style={styles.title}>PULSE · morning briefing</Text><ErrorBox message={resource.error || error} /><Pick label="Consultant" value={owner} rows={[{ id: 'All', name: 'Whole team' }, ...rows.map(row => ({ id: row.name, name: row.name }))]} onChange={setOwner} /></View>
    {rows.filter(row => owner === 'All' || row.name === owner).map(row => <View key={row.name} style={styles.card}><View style={styles.row}><Text style={styles.subtitle}>{row.name}</Text><Text style={[styles.pill, { color: row.trafficLight === 'red' ? '#b91c1c' : row.trafficLight === 'amber' ? '#92400e' : '#166534' }]}>{row.trafficLight.toUpperCase()}</Text></View>
      <Metrics values={[{ label: 'Active leads', value: row.activeLeads }, { label: 'Overdue follow-ups', value: row.overdueSla }, { label: 'Close ratio %', value: row.conversionRate }, { label: 'Oldest follow-up (hours)', value: Math.round(row.maxFollowupHours) }]} />
      {row.flaggedLeads.map((lead: Row) => <View key={lead.id} style={styles.card}><Text style={styles.text}>{lead.name} · {lead.age} · {lead.reason}</Text><View style={styles.row}><Button title="Open customer" secondary onPress={() => { mobileApi.lead(lead.id).then(onLead).catch(cause => setError(cause.message)); }} /><Button title="Ping consultant" secondary onPress={() => { mobileApi.task(lead.id, 'PULSE: contact this customer', new Date().toISOString()).then(() => { void floor.refresh(); }).catch(cause => setError(cause.message)); }} /></View></View>)}
    </View>)}{!rows.length && !resource.loading && <Text style={styles.muted}>No PULSE records for this site.</Text>}
  </>;
}
export function CalendarView({ onBook }: { onBook: () => void }) {
  const floor = useFloor(), [date, setDate] = useState(melbourneDate()), [owner, setOwner] = useState(''), [error, setError] = useState('');
  const [add, setAdd] = useState(false);
  const resource = useResource(() => mobileApi.calendar(date, owner || undefined), `calendar:${floor.site}:${date}:${owner}`, [] as Row[]);
  const staff = useResource(() => mobileApi.staff(), `calendar-staff:${floor.site}`, [] as Row[]);
  const action = (work: Promise<unknown>) => { work.then(() => resource.reload()).catch(cause => setError(cause.message)); };
  return <><View style={styles.card}><Text style={styles.title}>Calendar</Text><Field label="Date (YYYY-MM-DD, Melbourne)" value={date} onChange={setDate} />
    {floor.isManager && <Pick label="Salesperson's day" value={owner} rows={[{ id: '', name: 'Whole team' }, ...staff.data.map(row => ({ id: row.name, name: row.name }))]} onChange={setOwner} />}
    <View style={styles.row}><Button title="Book test drive" onPress={onBook} /><Button title="Add appointment / event" secondary onPress={() => setAdd(true)} /></View><ErrorBox message={error || resource.error} /></View>
    {resource.data.map(row => <View key={`${row.category}:${row.id}`} style={styles.card}><Text style={styles.subtitle}>{row.title}</Text><Text style={styles.text}>{new Date(row.date).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}</Text><Text style={styles.muted}>{row.owner} · {row.status}</Text>
      {row.category === 'appointment' && <><Text style={styles.text}>Virtual Yard: {row.virtualyardSync?.state || 'Not applicable'}{row.virtualyardSync?.externalId ? ` · #${row.virtualyardSync.externalId}` : ''}</Text>{row.virtualyardSync?.message && <Text style={styles.muted}>{row.virtualyardSync.message}</Text>}
        <View style={styles.row}>{['Completed', 'No Show', 'Cancelled'].map(status => <Button key={status} title={status} secondary onPress={() => action(mobileApi.outcome(row.id, status))} />)}
          {['failed', 'pending'].includes(row.virtualyardSync?.state) && <Button title="Retry Virtual Yard sync" secondary onPress={() => action(mobileApi.retryBooking(row.id))} />}</View></>}
    </View>)}{!resource.data.length && <Text style={styles.muted}>No events on this date.</Text>}
    {add && <CalendarEventForm date={date} staff={staff.data} onClose={() => { setAdd(false); resource.reload(); }} />}
  </>;
}
function CalendarEventForm({ date: initialDate, staff, onClose }: { date: string; staff: Row[]; onClose: () => void }) {
  const floor = useFloor(), [date, setDate] = useState(initialDate), [time, setTime] = useState('09:00'), [duration, setDuration] = useState('30');
  const [category, setCategory] = useState('appointment'), [type, setType] = useState('Showroom Visit'), [title, setTitle] = useState(''), [owner, setOwner] = useState(''), [leadId, setLeadId] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState('');
  const key = useRef(requestId());
  return <Sheet title="Add calendar event" onClose={onClose}><View style={styles.card}><ErrorBox message={error} />
    {saved ? <><Text style={styles.text}>{saved}</Text><Button title="Done" onPress={onClose} /></> : <>
      <Pick label="Event category" value={category} rows={[{ id: 'appointment', name: 'Customer appointment' }, { id: 'walkin', name: 'Walk-in' }, { id: 'lunch', name: 'Lunch / break' }, { id: 'personal', name: 'Other scheduled activity' }]} onChange={setCategory} />
      {category === 'appointment' ? <><Pick label="Customer" value={leadId} rows={floor.leads.map(row => ({ id: recordId(row), name: row.name }))} onChange={setLeadId} />
        <Pick label="Appointment type" value={type} rows={['Showroom Visit', 'Callback'].map(id => ({ id, name: id }))} onChange={setType} /></> : <Field label="Activity title" value={title} onChange={setTitle} />}
      {floor.isManager && <Pick label="Team member" value={owner} rows={[{ id: '', name: 'My calendar' }, ...staff.map(row => ({ id: row.email, name: row.name }))]} onChange={setOwner} />}
      <Field label="Date (YYYY-MM-DD)" value={date} onChange={setDate} /><Field label="Time in Melbourne (HH:MM)" value={time} onChange={setTime} /><Field label="Duration (minutes)" value={duration} onChange={setDuration} keyboard="decimal-pad" />
      <Button title="Save event" busy={busy} disabled={category === 'appointment' ? !leadId : !title.trim()} onPress={() => {
        setBusy(true); setError('');
        const submit = async () => {
          const when = melbourneBookingTime(date, time);
          if (category === 'appointment') { const result = await mobileApi.book({ bookingRequestId: key.current, leadId, type, when, durationMinutes: Number(duration), consultantName: staff.find(row => row.email === owner)?.name }); setSaved(result.virtualyardSync?.state === 'synced' ? `Saved and confirmed in Virtual Yard · ${result.virtualyardSync.externalId}` : `Appointment saved. ${result.virtualyardSync?.message || 'Virtual Yard confirmation pending.'} Review its Calendar sync status before retrying.`); }
          else { await mobileApi.addCalendarBlock({ title, date: when, durationMinutes: Number(duration), category, ownerEmail: owner || undefined }); setSaved('Calendar activity saved.'); }
          await floor.refresh();
        };
        submit().catch(cause => setError(cause.message)).finally(() => setBusy(false));
      }} />
    </>}
  </View></Sheet>;
}
export function StaffView() {
  const floor = useFloor(), resource = useResource(() => mobileApi.staff(), `staff:${floor.site}`, [] as Row[]), [busy, setBusy] = useState(false), [error, setError] = useState('');
  return <><View style={styles.card}><Text style={styles.title}>Team and presence</Text><Text style={styles.muted}>Presence uses device GPS and the configured site boundary. Readings older than ten minutes are marked stale.</Text><ErrorBox message={error || resource.error} />
    <Button title="Update my GPS presence" busy={busy} onPress={() => { setBusy(true); devicePosition().then(position => mobileApi.updatePresence({ ...position, site: floor.site })).then(() => { resource.reload(); void floor.refresh(); }).catch(cause => setError(cause.message)).finally(() => setBusy(false)); }} /></View>
    {resource.data.map(person => { const presence = person.presence; return <View key={recordId(person)} style={styles.card}><Text style={styles.subtitle}>{person.name}</Text><Text style={styles.text}>{person.role} · {person.site}</Text><Text style={styles.text}>{presence?.fresh ? presence.isInsideGeofence ? 'On-site' : 'Off-site' : 'Presence unavailable / stale'}</Text>{presence?.updatedAt && <Text style={styles.muted}>Last GPS reading {new Date(presence.updatedAt).toLocaleString()} · {presence.distanceMeters}m from site centre</Text>}</View>; })}
  </>;
}
export function AlertsView({ onLead }: { onLead: LeadAction }) {
  const floor = useFloor(), [filter, setFilter] = useState('all'), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [pushTest, setPushTest] = useState<Row | null>(null), [busy, setBusy] = useState(false), pushRequest = useRef(requestId());
  const run = async (work: () => Promise<void>) => { setBusy(true); setError(''); try { await work(); } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); } };
  return <><View style={styles.card}><Text style={styles.title}>Activity and high-signal alerts</Text><ErrorBox message={error} />{notice && <Text style={styles.text}>{notice}</Text>}
    <Pick label="Category" value={filter} rows={[{ id: 'all', name: 'All activity' }, { id: 'high_buyer', name: 'High Buyer' }, { id: 'price_objection', name: 'Price Objection' }, { id: 'high_risk', name: 'High Risk' }]} onChange={setFilter} />
    <View style={styles.row}><Button title="Enable device push" secondary busy={busy} onPress={() => { void run(async () => { await enablePush(); setNotice('High-signal push enabled on this device.'); }); }} /><Button title="Disable device push" secondary busy={busy} onPress={() => { void run(async () => { await disablePush(); setNotice('Push disabled.'); }); }} /></View>
    <Button title="Test local notification / emulator" secondary busy={busy} onPress={() => { void run(async () => { await testLocalNotification(); setNotice('A local test notification is scheduled in two seconds. This does not test remote delivery.'); }); }} />
    <Button title="Send remote push to this device" secondary busy={busy} disabled={Boolean(pushTest)} onPress={() => { void run(async () => { setPushTest(await testRemotePush(pushRequest.current)); }); }} />
    {pushTest && <><Text style={styles.text}>Remote push: {pushTest.state}</Text><Text style={styles.muted}>Submitted means Expo accepted the request. Provider accepted means APNs/FCM accepted it. Received confirms the app acknowledged it.</Text>
      {pushTest.deliveries?.map((row: Row) => <Text key={row.id} style={styles.muted}>{row.state}{row.error ? ` · ${row.error}` : ''}</Text>)}
      <Button title="Check push delivery" secondary busy={busy} onPress={() => { void run(async () => { setPushTest(await mobileApi.pushTestStatus(pushTest.notificationId)); }); }} />
      <Button title="Prepare another push test" secondary disabled={busy} onPress={() => { pushRequest.current = requestId(); setPushTest(null); }} />
    </>}
  </View>{floor.notifications.filter(row => filter === 'all' || row.type === filter).map(row => <View key={recordId(row)} style={styles.card}><Text style={styles.pill}>{row.type.replaceAll('_', ' ').toUpperCase()}{row.read ? ' · READ' : ''}</Text><Text style={styles.subtitle}>{row.title}</Text><Text style={styles.text}>{row.body}</Text><Text style={styles.muted}>{new Date(row.createdAt).toLocaleString()}</Text>
    <View style={styles.row}><Button title="Mark read" secondary onPress={() => { mobileApi.readNotification(recordId(row)).then(() => { void floor.refresh(); }).catch(cause => setError(cause.message)); }} />
      {row.leadId && <Button title="Open customer" secondary onPress={() => { mobileApi.lead(row.leadId).then(onLead).catch(cause => setError(cause.message)); }} />}</View>
  </View>)}</>;
}
export function ReportsView() {
  const floor = useFloor(), [period, setPeriod] = useState('mtd'), [error, setError] = useState('');
  const resource = useResource(() => mobileApi.reports(period), `reports:${floor.site}:${period}`, {} as Row);
  return <><View style={styles.card}><Text style={styles.title}>Management reporting</Text><Pick label="Period" value={period} rows={[{ id: 'today', name: 'Today' }, { id: 'weekly', name: 'Last 7 days' }, { id: 'mtd', name: 'Month to date' }]} onChange={setPeriod} /><ErrorBox message={resource.error || error} />
    <Metrics values={[['Leads captured', 'dailyLeads'], ['Walk-ins', 'walkIns'], ['Videos sent', 'videosSent'], ['Sold units', 'soldUnits'], ['Capture rate %', 'captureRate'], ['Lead-to-sale %', 'conversionRate']].map(([label, key]) => ({ label, value: resource.data[key] }))} />
    <Button title="Export selected period CSV" secondary onPress={() => { exportReport(floor.site, period).catch(cause => setError(cause.message)); }} />
    <Button title="Export consultant PULSE CSV" secondary onPress={() => { exportReport(floor.site, period, 'consultants').catch(cause => setError(cause.message)); }} />
  </View><View style={styles.card}><Text style={styles.subtitle}>Sold model mix</Text>{resource.data.modelMix?.map((row: Row) => <Text key={row.model} style={styles.text}>{row.model}: {row.units}</Text>)}</View><View style={styles.card}><Text style={styles.subtitle}>Site comparison</Text>{resource.data.sites?.map((row: Row) => <Text key={row.site} style={styles.text}>{row.site}: {row.leads} leads · {row.sold} sold</Text>)}</View></>;
}
