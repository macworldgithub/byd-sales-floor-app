import React, { useRef, useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { useFloor, useResource } from '../../lib/floorContext';
import { melbourneBookingTime, melbourneDate, mobileApi, recordId, requestId, Row } from '../../lib/mobileApi';
import { chooseMedia, uploadMedia } from '../../lib/deviceFeatures';
import { Button, ErrorBox, Field, Pick, Sheet, styles } from './Controls';
import { VehicleCheckStatus } from './VehicleCheckStatus';
import { CustomerVehicleChecks } from './CustomerVehicleChecks';

export function ProspectForm({ onClose }: { onClose: () => void }) {
  const floor = useFloor();
  const [name, setName] = useState(''), [phone, setPhone] = useState(''), [email, setEmail] = useState(''), [businessName, setBusinessName] = useState(''), [model, setModel] = useState(''), [notes, setNotes] = useState('');
  const [contacts, setContacts] = useState<Row[]>([]), [contact, setContact] = useState(''), [contactPhone, setContactPhone] = useState(''), [contactEmail, setContactEmail] = useState('');
  const [rego, setRego] = useState(''), [state, setState] = useState('VIC'), [vehicle, setVehicle] = useState<Row | null>(null);
  const vehicleRequest = useRef(requestId());
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const run = async (work: () => Promise<void>) => { setBusy(true); setError(''); try { await work(); } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); } };
  return <Sheet title="Add prospect" onClose={onClose}><View style={styles.card}>
    <Text style={styles.muted}>Matching mobiles at this site are merged into the existing prospect. Customers at other sites remain separate.</Text>
    <ErrorBox message={error} />
    <Field label="Full name *" value={name} onChange={setName} /><Field label="Mobile *" value={phone} onChange={setPhone} keyboard="phone-pad" /><Field label="Email *" value={email} onChange={setEmail} keyboard="email-address" />
    <Field label="Vehicle interest *" value={model} onChange={setModel} /><Field label="Business / company name (optional)" value={businessName} onChange={setBusinessName} />
    {businessName.trim() !== '' && <View style={{ gap: 10 }}><Text style={styles.subtitle}>Business contacts</Text>
      {contacts.map((row, index) => <View key={index} style={styles.card}><Text style={styles.text}>{row.name} · {row.phone} · {row.email}</Text><Button title="Remove contact" secondary onPress={() => setContacts(rows => rows.filter((_, i) => i !== index))} /></View>)}
      <Field label="Contact name" value={contact} onChange={setContact} /><Field label="Contact mobile" value={contactPhone} onChange={setContactPhone} keyboard="phone-pad" /><Field label="Contact email" value={contactEmail} onChange={setContactEmail} keyboard="email-address" />
      <Button title="Link contact" secondary disabled={!contact.trim() || !contactPhone.trim() || !contactEmail.trim()} onPress={() => { setContacts(rows => [...rows, { name: contact.trim(), phone: contactPhone, email: contactEmail }]); setContact(''); setContactPhone(''); setContactEmail(''); }} />
    </View>}
    <Field label="Notes" value={notes} onChange={setNotes} multiline />
    <Text style={styles.subtitle}>Trade-in vehicle (optional)</Text>
    <VehicleCheckStatus />
    <Field label="Registration plate" value={rego} onChange={value => { setRego(value); setVehicle(null); vehicleRequest.current = requestId(); }} />
    <Pick label="Registration state" value={state} rows={['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'].map(id => ({ id, name: id }))} onChange={value => { setState(value); setVehicle(null); vehicleRequest.current = requestId(); }} />
    <Button title="Look up Rego → VIN" secondary busy={busy} disabled={!rego} onPress={() => { void run(async () => { setVehicle(await mobileApi.rego({ rego, state, requestId: vehicleRequest.current })); }); }} />
    {vehicle && <Text style={styles.text}>{vehicle.year} {vehicle.make} {vehicle.model} · VIN {vehicle.vin} · PPSR Pending</Text>}
    <Button title="Save prospect" busy={busy} disabled={!name.trim() || !phone.trim() || !email.trim() || !model.trim()} onPress={() => { void run(async () => {
      const saved = await mobileApi.createLead({ name, phone, email, model, businessName, companyContacts: contacts, notes, site: floor.site, tradeInRego: rego, vehicleCheckId: vehicle?.checkId });
      await floor.refresh(); Alert.alert(saved.merged ? 'Existing customer updated' : 'Prospect saved', saved.name); onClose();
    }); }} />
  </View></Sheet>;
}

export function CustomerDetails({ lead: initial, onClose, onBook, onDeal, onAppraise }: { lead: Row; onClose: () => void; onBook: (lead: Row) => void; onDeal: (lead: Row) => void; onAppraise: (lead: Row) => void }) {
  const floor = useFloor(), value = recordId(initial);
  const resource = useResource(() => mobileApi.lead(value), `lead:${value}`, initial);
  const timeline = useResource(() => mobileApi.timeline(value), `timeline:${value}`, [] as Row[]);
  const threads = useResource(() => mobileApi.threads(), `customer-threads:${value}`, [] as Row[]);
  const lead = resource.data;
  const [name, setName] = useState(initial.name || ''), [email, setEmail] = useState(initial.email || ''), [phone, setPhone] = useState(initial.phone || '');
  const [businessName, setBusinessName] = useState(initial.businessName || ''), [contacts, setContacts] = useState<Row[]>(initial.companyContacts || []), [vehicleInterest, setVehicleInterest] = useState(initial.vehicle || initial.model || '');
  const [body, setBody] = useState(''), [note, setNote] = useState(''), [task, setTask] = useState(''), [dueDate, setDueDate] = useState(melbourneDate()), [dueTime, setDueTime] = useState('09:00');
  const [outcome, setOutcome] = useState('Connected'), [question, setQuestion] = useState(''), [aiDraft, setAiDraft] = useState(false), [media, setMedia] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const sendKey = useRef(requestId());
  const run = async (work: () => Promise<void>) => { if (busy) return; setBusy(true); setError(''); setNotice(''); try { await work(); resource.reload(); timeline.reload(); await floor.refresh(); } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); } };
  const attach = (camera: boolean) => run(async () => { const asset = await chooseMedia(camera); if (asset) { const uploaded = await uploadMedia(asset, floor.site, { leadId: value }); setMedia(previous => [...previous, { ...asset, ...uploaded }]); } });
  const stageOptions = ['NEW ENQUIRIES', 'IN FOLLOW-UP', 'AI QUALIFYING', 'TEST DRIVE BOOKED', 'COMMITTED', 'DELIVERED', 'LOST'].map(id => ({ id, name: id.replaceAll('_', ' ') }));
  return <Sheet title={lead.name || 'Customer 360'} onClose={onClose}>
    <ErrorBox message={error || resource.error || timeline.error} />{notice && <View style={styles.success}><Text style={styles.text}>{notice}</Text></View>}
    <View style={styles.card}>
      <Text style={styles.subtitle}>{lead.name}</Text><Text style={styles.text}>{lead.phone} · {lead.email}</Text><Text style={styles.muted}>{lead.dealer} · {lead.vehicle || lead.model} · {lead.businessName || 'Individual customer'}</Text>
      {lead.companyContacts?.map((contact: Row, index: number) => <Text key={index} style={styles.text}>{contact.name} · {contact.phone} · {contact.email}</Text>)}
      <View style={styles.row}><Button title="Call" secondary onPress={() => { void Linking.openURL(`tel:${lead.phone}`).catch(cause => setError(cause.message)); }} /><Button title="Book test drive" onPress={() => onBook(lead)} /><Button title="Register deal" secondary onPress={() => onDeal(lead)} /><Button title="I-Appraise" secondary onPress={() => onAppraise(lead)} /></View>
      <Field label="Customer name" value={name} onChange={setName} /><Field label="Mobile" value={phone} onChange={setPhone} keyboard="phone-pad" /><Field label="Email" value={email} onChange={setEmail} keyboard="email-address" />
      <Field label="Vehicle interest" value={vehicleInterest} onChange={setVehicleInterest} />
      <Field label="Business / company name (optional)" value={businessName} onChange={setBusinessName} />
      {contacts.map((contact, index) => <View key={index} style={styles.card}>
        <Field label="Contact name" value={contact.name || ''} onChange={name => setContacts(rows => rows.map((row, i) => i === index ? { ...row, name } : row))} />
        <Field label="Contact mobile" value={contact.phone || ''} keyboard="phone-pad" onChange={phone => setContacts(rows => rows.map((row, i) => i === index ? { ...row, phone } : row))} />
        <Field label="Contact email" value={contact.email || ''} keyboard="email-address" onChange={email => setContacts(rows => rows.map((row, i) => i === index ? { ...row, email } : row))} />
        <Button title="Remove contact" secondary onPress={() => setContacts(rows => rows.filter((_, i) => i !== index))} />
      </View>)}
      {Boolean(businessName.trim()) && <Button title="Add business contact" secondary onPress={() => setContacts(rows => [...rows, { name: '', phone: '', email: '' }])} />}
      <Button title="Save details" secondary busy={busy} onPress={() => { void run(async () => { await mobileApi.updateLead(value, { name, phone, email, businessName, companyContacts: contacts, vehicle: vehicleInterest }); setNotice('Customer details saved.'); }); }} />
      <Pick label="Stage" value={lead.stage || ''} rows={stageOptions} onChange={stage => { void run(async () => { await mobileApi.updateLead(value, { stage }); }); }} />
      <Text style={styles.text}>AI suggestions: {floor.bootstrap.settings?.aiMode === 'off' ? 'Disabled at this site' : lead.aiPaused ? 'Paused · human takeover' : 'Enabled · staff approval required'}</Text>
      <Button title={lead.aiPaused ? 'Re-enable AI suggestions' : 'Take over and pause AI'} secondary onPress={() => { void run(async () => { await mobileApi.updateLead(value, { aiPaused: !lead.aiPaused }); }); }} />
    </View>
    <View style={styles.card}><Text style={styles.subtitle}>Conversation</Text>
      <ErrorBox message={threads.error} />
      {threads.data.filter(thread => String(thread.phone).replace(/\D/g, '').slice(-9) === String(lead.phone).replace(/\D/g, '').slice(-9)).flatMap(thread => thread.messages || []).map((message: Row, index: number) => <View key={message.id || index} style={styles.card}><Text style={styles.muted}>{message.sender === 'user' ? lead.name : 'Sales team'} · {message.createdAt ? new Date(message.createdAt).toLocaleString() : message.time}</Text><Text style={styles.text}>{message.text}</Text><Text style={styles.muted}>{message.status}</Text></View>)}
      <Field label="SMS message" value={body} onChange={text => { setBody(text); setAiDraft(false); }} multiline />
      {media.map((item, index) => <View key={index} style={styles.row}><Text style={styles.muted}>{item.kind === 'video' ? `Video · ${item.durationSeconds}s` : 'Photo'} attached</Text><Button title="Remove" secondary onPress={() => setMedia(rows => rows.filter((_, i) => i !== index))} /></View>)}
      <View style={styles.row}><Button title="Attach photo/video" secondary busy={busy} onPress={() => { void attach(false); }} /><Button title="Take photo" secondary busy={busy} onPress={() => { void attach(true); }} /></View>
      <Text style={styles.muted}>Videos are limited to three minutes. Media is shared as secure links in the SMS.</Text>
      <Button title={aiDraft ? 'Approve and send AI draft' : 'Send SMS'} busy={busy} disabled={!body.trim()} onPress={() => { void run(async () => {
        const result = await mobileApi.send(value, { body, requestId: sendKey.current, mediaIds: media.map(item => item.id), aiDraft });
        setNotice(`Message ${result.status} · ${result.messageId}`); setBody(''); setMedia([]); setAiDraft(false); sendKey.current = requestId();
      }); }} />
      <Field label="Question for approved product information" value={question} onChange={setQuestion} />
      <Button title="Prepare AI draft for review" secondary busy={busy} disabled={!question.trim()} onPress={() => { void run(async () => { const result = await mobileApi.draft(value, question); setBody(result.text); setAiDraft(true); setNotice('Draft only. Review it before approving Send.'); }); }} />
    </View>
    <View style={styles.card}><Text style={styles.subtitle}>Notes and calls</Text><Field label="Internal note / call details" value={note} onChange={setNote} multiline />
      <Button title="Save internal note" secondary busy={busy} disabled={!note.trim()} onPress={() => { void run(async () => { await mobileApi.note(value, note); setNote(''); setNotice('Note saved to customer timeline.'); }); }} />
      <Pick label="Call outcome" value={outcome} rows={['Connected', 'Left voicemail', 'No answer', 'Test drive booked', 'Quote sent'].map(id => ({ id, name: id }))} onChange={setOutcome} />
      <Button title="Log call and sync to Virtual Yard" secondary busy={busy} onPress={() => { void run(async () => { const result = await mobileApi.call(value, { outcome, notes: note }); setNotice(result.virtualyardSync?.state === 'synced' ? 'Call synced to Virtual Yard.' : `Call saved. ${result.virtualyardSync?.message || 'Virtual Yard sync is pending.'}`); setNote(''); }); }} />
    </View>
    {floor.isManager && <View style={styles.card}><Text style={styles.subtitle}>Assign a task</Text><Field label="Task" value={task} onChange={setTask} /><Field label="Due date (YYYY-MM-DD)" value={dueDate} onChange={setDueDate} /><Field label="Due time in Melbourne (HH:MM)" value={dueTime} onChange={setDueTime} />
      <Button title="Add task and notify consultant" busy={busy} disabled={!task.trim()} onPress={() => { void run(async () => { await mobileApi.task(value, task, melbourneBookingTime(dueDate, dueTime)); setTask(''); setNotice('Task added to consultant activity and calendar.'); }); }} />
    </View>}
    <CustomerVehicleChecks key={value} lead={lead} onSaved={() => { resource.reload(); timeline.reload(); void floor.refresh(); }} />
    <View style={styles.card}><Text style={styles.subtitle}>Customer timeline</Text>{!timeline.data.length && <Text style={styles.muted}>No recorded interactions yet.</Text>}
      {timeline.data.map(row => <View key={row.event_id || recordId(row)} style={styles.card}><Text style={styles.label}>{row.title || row.type}</Text><Text style={styles.text}>{row.body || row.content}</Text><Text style={styles.muted}>{new Date(row.occurred_at || row.createdAt).toLocaleString()} · {row.author_name || row.author}</Text></View>)}
    </View>
  </Sheet>;
}
