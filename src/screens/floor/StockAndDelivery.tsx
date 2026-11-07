import React, { useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import { useFloor, useResource } from '../../lib/floorContext';
import { useAuth } from '../../lib/auth';
import { melbourneBookingTime, melbourneDate, mobileApi, recordId, requestId, Row } from '../../lib/mobileApi';
import { chooseMedia, devicePosition, uploadMedia } from '../../lib/deviceFeatures';
import { Button, ErrorBox, Field, Metrics, Pick, styles } from '../../components/floor/Controls';

export function DealsView({ onOpen, onNew }: { onOpen: (deal: Row) => void; onNew: () => void }) {
  const floor = useFloor(), resource = useResource(() => mobileApi.deals(), `deals:${floor.site}`, [] as Row[]);
  const [status, setStatus] = useState('All');
  return <><View style={styles.card}><Text style={styles.title}>Deals and pipeline</Text><ErrorBox message={resource.error} /><Button title="Register BYD deal" onPress={onNew} />
    <Pick label="Pipeline status" value={status} rows={['All', 'Registered', 'DMS Synced', 'Won / Delivered'].map(id => ({ id, name: id }))} onChange={setStatus} />
  </View>{resource.data.filter(row => status === 'All' || row.status === status).map(row => <View key={recordId(row)} style={styles.card}>
    <Text style={styles.subtitle}>{row.buyerName}</Text><Text style={styles.text}>{row.vehicle?.model} · {row.vehicle?.stockNumber}</Text><Text style={styles.muted}>{row.dealId} · {row.consultantName}</Text>
    {row.businessName && <Text style={styles.text}>{row.businessName}</Text>}
    <Text style={styles.pill}>{row.status} · Virtual Yard {row.virtualYard?.status || 'Pending Sync'}</Text>
    {row.virtualYard?.syncMessage && <Text style={styles.text}>{row.virtualYard.syncMessage}</Text>}
    {row.contractSignedAt && <Text style={styles.muted}>Contract signed {new Date(row.contractSignedAt).toLocaleString()}</Text>}
    <Button title="Open deal / sync status" secondary onPress={() => onOpen(row)} />
  </View>)}{!resource.data.length && <Text style={styles.muted}>No registered deals in this scope.</Text>}</>;
}

export function InventoryView({ onDeal, onBook }: { onDeal: () => void; onBook: () => void }) {
  const floor = useFloor(), [bucket, setBucket] = useState('All'), [status, setStatus] = useState('All'), [group, setGroup] = useState(false), [query, setQuery] = useState('');
  const resource = useResource(() => mobileApi.inventory({ ageingBucket: bucket, status, group, q: query, ...(group ? { site: 'All Sites' } : {}) }), `inventory:${floor.site}:${bucket}:${status}:${group}:${query}`, { data: [], counts: {}, total: 0 });
  return <><View style={styles.card}><Text style={styles.title}>Inventory</Text><ErrorBox message={resource.error} />
    {floor.isManager && floor.bootstrap.user?.all_sites && <View style={styles.row}><Switch accessibilityLabel="Group inventory" value={group} onValueChange={setGroup} /><Text style={styles.text}>Group view · in-stock only</Text></View>}
    <Field label="Search model, stock number or VIN" value={query} onChange={setQuery} />
    <Pick label="Stock age" value={bucket} rows={['All', '0-30', '31-60', '61-89', '90+', 'Unknown'].map(id => ({ id, name: id === 'All' ? `All (${resource.data.total})` : `${id} days (${(resource.data.counts as Record<string, number>)[id] || 0})` }))} onChange={setBucket} />
    <Pick label="Stock status" value={status} rows={['All', 'In Stock', 'Deal Pending', 'In Transit', 'Sold', 'Unknown'].map(id => ({ id, name: id }))} onChange={setStatus} />
  </View>{resource.data.data.map(row => <View key={row.id} style={styles.card}><Text style={styles.subtitle}>{row.year || ''} {row.make} {row.model}</Text><Text style={styles.text}>{row.variant} · {row.colour}</Text><Text style={styles.muted}>Stock {row.stockNumber} · VIN {row.vin || 'Unavailable'}</Text><Text style={styles.pill}>{row.status} · {row.daysInStock === null ? 'Age unavailable' : `${row.daysInStock} days in stock`}</Text>
    <Metrics values={[{ label: 'Advertised price', value: row.advertisedPrice === null ? 'Unavailable / restricted' : `$${row.advertisedPrice}` }, ...(row.costPrice !== null ? [{ label: 'Dealer cost', value: `$${row.costPrice}` }] : [])]} />
    <View style={styles.row}><Button title="Book test drive" secondary onPress={onBook} />{row.status === 'In Stock' ? <Button title="Register deal" onPress={onDeal} /> : <Text style={styles.muted}>Sale blocked · {row.status}</Text>}</View>
  </View>)}{!resource.data.data.length && <Text style={styles.muted}>No stock matches these filters.</Text>}</>;
}

export function DeliveriesView() {
  const floor = useFloor(), resource = useResource(() => mobileApi.deliveries(), `deliveries:${floor.site}`, [] as Row[]);
  const staff = useResource(() => mobileApi.staff(), `delivery-staff:${floor.site}`, [] as Row[]);
  return <><View style={styles.card}><Text style={styles.title}>Delivery Centre</Text><Text style={styles.muted}>Signed contracts create delivery jobs. Handover requires PDI and completion photos for fitted accessories.</Text><ErrorBox message={resource.error || staff.error} /></View>
    {resource.data.map(client => <DeliveryCard key={recordId(client)} client={client} staff={staff.data} reload={resource.reload} />)}
    {!resource.data.length && <Text style={styles.muted}>No delivery jobs in your scope.</Text>}</>;
}
function DeliveryCard({ client, staff, reload }: { client: Row; staff: Row[]; reload: () => void }) {
  const floor = useFloor(), { user } = useAuth();
  const [accessoryName, setAccessoryName] = useState(''), [contractorId, setContractorId] = useState('');
  const [date, setDate] = useState(client.delivery_date ? String(client.delivery_date).slice(0, 10) : melbourneDate()), [time, setTime] = useState('10:00');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const canCoordinate = floor.isManager || ['delivery', 'delivery_consultant'].includes(user?.role || '');
  const run = async (work: () => Promise<void>) => { if (busy) return; setBusy(true); setError(''); try { await work(); reload(); await floor.refresh(); } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); } };
  const proof = (index: number) => run(async () => {
    const asset = await chooseMedia(true, true); if (!asset) return;
    const position = await devicePosition();
    const accessory = client.accessories[index];
    const image = await uploadMedia(asset, floor.site, { clientId: recordId(client), accessoryId: String(accessory.id || accessory._id), latitude: String(position.latitude), longitude: String(position.longitude) });
    await mobileApi.updateDelivery(recordId(client), { accessories: (client.accessories || []).map((row: Row, i: number) => i === index ? { ...row, status: 'Fitted', proofId: image.id } : row) });
    setNotice('Completion photo saved.');
  });
  return <View style={styles.card}><Text style={styles.subtitle}>{client.name}</Text><Text style={styles.text}>{client.vehicle} · {client.vin || 'VIN unavailable'}</Text><Text style={styles.pill}>{client.stage || client.status}</Text><ErrorBox message={error} />{notice && <Text style={styles.text}>{notice}</Text>}
    <Text style={styles.muted}>Virtual Yard order {client.vy_order_id || 'Unavailable'} · Contract {client.contractSignedAt ? 'Signed' : 'Not verified'}</Text>
    {canCoordinate && client.stage !== 'Delivered' && <><Field label="Delivery date (YYYY-MM-DD)" value={date} onChange={setDate} /><Field label="Handover time in Melbourne (HH:MM)" value={time} onChange={setTime} />
      <Button title="Save delivery booking" secondary busy={busy} onPress={() => { void run(async () => { await mobileApi.updateDelivery(recordId(client), { delivery_date: melbourneBookingTime(date, time) }); }); }} />
      <View style={styles.row}><Switch accessibilityLabel="PDI complete" value={Boolean(client.pdiComplete)} disabled={busy} onValueChange={value => { void run(async () => { await mobileApi.updateDelivery(recordId(client), { pdiComplete: value }); }); }} /><Text style={styles.text}>PDI complete</Text></View>
    </>}
    {(client.accessories || []).map((row: Row, index: number) => <View key={row.id || row._id || index} style={styles.card}><Text style={styles.text}>{row.name} · {row.status}</Text><Text style={styles.muted}>{staff.find(person => recordId(person) === row.contractorId)?.name || 'No contractor assigned'} · {row.proofId ? 'Completion photo attached' : 'Photo proof outstanding'}</Text>
      {(canCoordinate || row.contractorId === user?.id) && client.stage !== 'Delivered' && <Pick label="Accessory status" value={row.status} rows={['Pending Order', 'Ordered', 'On Hand', ...(row.proofId ? ['Fitted'] : [])].map(id => ({ id, name: id }))} onChange={status => { void run(async () => { await mobileApi.updateDelivery(recordId(client), { accessories: client.accessories.map((item: Row, i: number) => i === index ? { ...item, status } : item) }); }); }} />}
      {canCoordinate && client.stage !== 'Delivered' && <Pick label="Assigned contractor" value={row.contractorId || ''} rows={[{ id: '', name: 'Unassigned' }, ...staff.filter(person => person.role === 'contractor').map(person => ({ id: recordId(person), name: person.name }))]} onChange={contractorId => { void run(async () => { await mobileApi.updateDelivery(recordId(client), { accessories: client.accessories.map((item: Row, i: number) => i === index ? { ...item, contractorId: contractorId || null } : item) }); }); }} />}
      {(canCoordinate || row.contractorId === user?.id) && client.stage !== 'Delivered' && <Button title="Capture completion photo" secondary busy={busy} onPress={() => { void proof(index); }} />}
    </View>)}
    {canCoordinate && client.stage !== 'Delivered' && <><Field label="Accessory / contractor job" value={accessoryName} onChange={setAccessoryName} /><Pick label="Assign contractor" value={contractorId} rows={staff.filter(person => person.role === 'contractor').map(person => ({ id: recordId(person), name: person.name }))} onChange={setContractorId} />
      <Button title="Add accessory job" secondary busy={busy} disabled={!accessoryName.trim()} onPress={() => { void run(async () => { await mobileApi.updateDelivery(recordId(client), { accessories: [...(client.accessories || []), { id: requestId(), name: accessoryName.trim(), status: 'Pending Order', contractorId: contractorId || null }] }); setAccessoryName(''); }); }} />
      <Button title="Complete handover" busy={busy} onPress={() => Alert.alert('Complete handover?', 'This marks the vehicle delivered and schedules the BYD welcome and 21-day follow-ups for staff approval.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Complete', onPress: () => { void run(async () => { const result = await mobileApi.handover(recordId(client)); setNotice(result.journey); }); } }])} />
    </>}
  </View>;
}
export function FollowupsView() {
  const floor = useFloor(), resource = useResource(() => mobileApi.followups(), `followups:${floor.site}`, [] as Row[]), [error, setError] = useState(''), [busy, setBusy] = useState('');
  return <><View style={styles.card}><Text style={styles.title}>BYD post-delivery journey</Text><Text style={styles.muted}>Congratulations, welcome, feature videos and the 21-day satisfaction check. Review each message before sending.</Text><ErrorBox message={error || resource.error} /></View>
    {resource.data.map(row => <FollowupCard key={recordId(row)} row={row} busy={busy === recordId(row)} run={work => { setBusy(recordId(row)); setError(''); work().then(() => resource.reload()).catch(cause => setError(cause.message)).finally(() => setBusy('')); }} />)}{!resource.data.length && <Text style={styles.muted}>Journeys appear after a completed handover.</Text>}</>;
}
function FollowupCard({ row, busy, run }: { row: Row; busy: boolean; run: (work: () => Promise<unknown>) => void }) {
  const [reason, setReason] = useState('');
  return <View style={styles.card}><Text style={styles.subtitle}>{row.key.replaceAll('_', ' ')}</Text><Text style={styles.text}>{row.phone} · {row.status}</Text><Text style={styles.text}>{row.body || 'Configure this journey message in Site settings.'}</Text><Text style={styles.muted}>Due {new Date(row.dueAt).toLocaleString()}</Text>
      <ErrorBox message={row.configurationIssues?.join(' ') || row.error} />
      {row.cancellationReason && <Text style={styles.muted}>Cancelled: {row.cancellationReason}</Text>}
      {(row.providerMessageId || ['sending', 'unknown'].includes(row.status)) && <><Text style={styles.text}>SMS delivery: {row.verifiedDeliveredAt ? 'Delivered · provider verified' : row.deliveryStatus || 'Submission requires reconciliation'}</Text>{row.providerMessageId && <Text style={styles.muted}>Provider message {row.providerMessageId}</Text>}
        <Button title="Check SMS delivery" secondary busy={busy} onPress={() => run(() => mobileApi.followupReceipt(recordId(row)))} />
      </>}
      {row.status === 'awaiting_approval' && <Button title="Approve and send" busy={busy} disabled={new Date(row.dueAt) > new Date()} onPress={() => Alert.alert('Approve this journey SMS?', `Send to ${row.phone}:\n\n${row.body}`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Send', onPress: () => run(() => mobileApi.approveFollowup(recordId(row), row.reviewToken)) }])} />}
      {['awaiting_approval', 'needs_configuration'].includes(row.status) && <><Field label="Reason to cancel this follow-up" value={reason} onChange={setReason} /><Button title="Cancel follow-up" secondary busy={busy} disabled={!reason.trim()} onPress={() => run(() => mobileApi.cancelFollowup(recordId(row), reason))} /></>}
    </View>;
}
