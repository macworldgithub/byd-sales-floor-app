import React, { useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import { useFloor, useResource } from '../../lib/floorContext';
import { useAuth } from '../../lib/auth';
import { melbourneDate, mobileApi, recordId, Row } from '../../lib/mobileApi';
import { Button, ErrorBox, Field, Pick, styles } from '../../components/floor/Controls';
import { CommunicationsSetup } from '../../components/floor/CommunicationsSetup';
import { JourneySetup } from '../../components/floor/JourneySetup';

export function AllocationView() {
  const floor = useFloor(), staff = useResource(() => mobileApi.staff(), `allocation-staff:${floor.site}`, [] as Row[]);
  const [leadId, setLeadId] = useState(''), [email, setEmail] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [sourceLeadId, setSourceLeadId] = useState('');
  return <View style={styles.card}><Text style={styles.title}>Team allocation</Text><ErrorBox message={error || staff.error} />{notice && <Text style={styles.text}>{notice}</Text>}
    <Pick label="Lead" value={leadId} rows={floor.leads.map(row => ({ id: recordId(row), name: `${row.name} · ${row.allocatedPersonFullName || 'Unassigned'}` }))} onChange={setLeadId} />
    {floor.hasMore && <Button title="Load more leads" secondary onPress={() => { void floor.loadMore(); }} />}
    <Pick label="Assign to consultant" value={email} rows={staff.data.filter(row => ['sales_consultant', 'consultant', 'sales_manager', 'manager', 'agent'].includes(row.role)).map(row => ({ id: row.email, name: row.name }))} onChange={setEmail} />
    <Button title="Save allocation" busy={busy} disabled={!leadId || !email} onPress={() => { setBusy(true); mobileApi.updateLead(leadId, { assignedTo: email }).then(() => { setNotice('Allocation saved.'); void floor.refresh(); }).catch(cause => setError(cause.message)).finally(() => setBusy(false)); }} />
    <Text style={styles.subtitle}>Merge duplicate records</Text><Text style={styles.muted}>Keep the selected lead above as the target. Only records with a matching mobile or email at the same site can merge. The source record is archived and its history is retained.</Text>
    <Pick label="Duplicate source lead" value={sourceLeadId} rows={floor.leads.filter(row => recordId(row) !== leadId).map(row => ({ id: recordId(row), name: `${row.name} · ${row.phone} · ${row.email}` }))} onChange={setSourceLeadId} />
    <Button title="Review and merge duplicate" secondary busy={busy} disabled={!leadId || !sourceLeadId} onPress={() => Alert.alert('Merge these customer records?', 'Notes and linked history will move to the selected target. The source remains archived for audit.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Merge', onPress: () => { setBusy(true); mobileApi.mergeLeads(leadId, sourceLeadId).then(() => { setSourceLeadId(''); setNotice('Duplicate merged.'); void floor.refresh(); }).catch(cause => setError(cause.message)).finally(() => setBusy(false)); } }])} />
  </View>;
}

export function SiteSettingsView() {
  const floor = useFloor(), resource = useResource(() => mobileApi.settings(), `settings:${floor.site}`, {} as Row), knowledge = useResource(() => mobileApi.knowledge(), `knowledge:${floor.site}`, [] as Row[]);
  const { user } = useAuth();
  const staff = useResource(() => mobileApi.staff(), `target-staff:${floor.site}`, [] as Row[]);
  const [targetEmail, setTargetEmail] = useState(''), [targetUnits, setTargetUnits] = useState(''), [targetPeriod, setTargetPeriod] = useState(melbourneDate().slice(0, 7)), [cookie, setCookie] = useState('');
  const session = useResource(() => mobileApi.virtualyardSession(), `vy-session:${floor.site}`, {} as Row);
  const [draft, setDraft] = useState<Row | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [sourceTitle, setSourceTitle] = useState(''), [sourceUrl, setSourceUrl] = useState(''), [sourceText, setSourceText] = useState('');
  const values = draft || resource.data, dirty = draft !== null;
  const change = (key: string, value: unknown) => { setDraft(current => ({ ...(current || resource.data), [key]: value })); };
  const run = async (work: () => Promise<void>) => { setBusy(true); setError(''); try { await work(); } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); } };
  const numeric = (label: string, key: string) => <Field key={key} label={label} value={String(values[key] ?? '')} onChange={value => change(key, Number(value))} keyboard="decimal-pad" />;
  const geo = values.geofence || {};
  return <><View style={styles.card}><Text style={styles.title}>Site settings · {floor.site}</Text><ErrorBox message={error || resource.error} />{notice && <Text style={styles.text}>{notice}</Text>}
    <Text style={styles.subtitle}>PULSE traffic lights</Text>
    {numeric('Follow-up amber threshold (hours)', 'followupAmberHours')}{numeric('Follow-up red threshold (hours)', 'followupRedHours')}{numeric('Conversion red below (%)', 'conversionAmber')}{numeric('Conversion green from (%)', 'conversionGreen')}
    <Text style={styles.subtitle}>High-signal alerts</Text>
    {[['High Buyer', 'high_buyer'], ['Price Objection', 'price_objection'], ['High Risk', 'high_risk']].map(([label, key]) => <View key={key} style={styles.row}><Switch accessibilityLabel={label} value={Boolean(values.alertTypes?.includes(key))} onValueChange={enabled => change('alertTypes', enabled ? [...(values.alertTypes || []), key] : (values.alertTypes || []).filter((type: string) => type !== key))} /><Text style={styles.text}>{label}</Text></View>)}
    <Text style={styles.subtitle}>AI suggestions</Text><Pick label="AI follow-up mode" value={values.aiMode || 'approval'} rows={[{ id: 'off', name: 'Disabled' }, { id: 'approval', name: 'Staff review and approval' }]} onChange={value => change('aiMode', value)} />
    {numeric('Allow suggestions after human inactivity (hours; 0 keeps paused)', 'aiResumeHours')}
    <Text style={styles.subtitle}>Messaging and BYD journey</Text><Field label="Verified site SMS sender" value={values.smsSenderId || ''} onChange={value => change('smsSenderId', value)} />
    <Field label="General vehicle video links (one HTTPS link per line)" value={(values.videoUrls || []).join('\n')} onChange={value => change('videoUrls', value.split('\n').map(text => text.trim()).filter(Boolean))} multiline />
    <Field label="21-day satisfaction survey link (optional)" value={values.surveyUrl || ''} onChange={value => change('surveyUrl', value)} />
    <JourneySetup settings={values} onChange={value => change('journey', value)} />
    <View style={styles.row}><Switch accessibilityLabel="Sales staff see advertised prices" value={Boolean(values.salesSeePrice)} onValueChange={value => change('salesSeePrice', value)} /><Text style={styles.text}>Sales staff see advertised prices</Text></View>
    <View style={styles.row}><Switch accessibilityLabel="Sales staff see cost prices" value={Boolean(values.salesSeeCost)} onValueChange={value => change('salesSeeCost', value)} /><Text style={styles.text}>Sales staff see dealer cost</Text></View>
    <Text style={styles.subtitle}>Dealership geofence</Text>
    {[['Latitude', 'latitude'], ['Longitude', 'longitude'], ['Radius in metres', 'radiusMeters']].map(([label, key]) => <Field key={key} label={label} value={geo[key] === undefined ? '' : String(geo[key])} onChange={value => change('geofence', { ...geo, [key]: Number(value) })} keyboard="decimal-pad" />)}
    <Button title="Save site settings" busy={busy} disabled={!dirty} onPress={() => { void run(async () => { await mobileApi.saveSettings(floor.site, values); setDraft(null); resource.reload(); await floor.refresh(); setNotice('Site settings saved.'); }); }} />
  </View><CommunicationsSetup onSenderSelect={sender => change('smsSenderId', sender)} /><View style={styles.card}><Text style={styles.subtitle}>Monthly sales targets</Text><ErrorBox message={staff.error} />
    <Pick label="Consultant" value={targetEmail} rows={staff.data.filter(row => ['sales_consultant', 'consultant', 'sales_manager', 'manager'].includes(row.role)).map(row => ({ id: row.email, name: row.name }))} onChange={setTargetEmail} />
    <Field label="Month (YYYY-MM)" value={targetPeriod} onChange={setTargetPeriod} /><Field label="Unit target" value={targetUnits} onChange={setTargetUnits} keyboard="decimal-pad" />
    <Button title="Save monthly target" busy={busy} disabled={!targetEmail || targetUnits === ''} onPress={() => { void run(async () => { await mobileApi.saveTarget({ email: targetEmail, period: targetPeriod, targetUnits: Number(targetUnits) }); await floor.refresh(); setNotice('Monthly target saved.'); }); }} />
  </View><View style={styles.card}><Text style={styles.subtitle}>Virtual Yard connection</Text><ErrorBox message={session.error} /><Text style={styles.text}>{session.data.connected ? 'Connected' : 'Not connected / session expired'}</Text>
    <Button title="Check connection" secondary onPress={session.reload} />
    {['site_admin', 'super_admin'].includes(user?.role || '') && <><Field label="Virtual Yard session cookie" value={cookie} onChange={setCookie} secure /><Button title="Connect Virtual Yard session" busy={busy} disabled={!cookie.trim()} onPress={() => { void run(async () => { await mobileApi.connectVirtualyard(cookie); setCookie(''); session.reload(); setNotice('Virtual Yard session connected.'); }); }} /></>}
  </View><View style={styles.card}><Text style={styles.subtitle}>Approved OEM / dealer knowledge</Text><ErrorBox message={knowledge.error} /><Text style={styles.muted}>Only approved product and dealership information is supplied to AI drafts. Staff review each draft before sending.</Text>
    {knowledge.data.map(row => <View key={recordId(row)} style={styles.card}><Text style={styles.text}>{row.title}</Text><Text style={styles.muted}>{row.sourceUrl}</Text></View>)}
    <Field label="Document / manual title" value={sourceTitle} onChange={setSourceTitle} /><Field label="Official OEM or dealer source URL" value={sourceUrl} onChange={setSourceUrl} /><Field label="Approved product features / opening hours" value={sourceText} onChange={setSourceText} multiline />
    <Button title="Approve knowledge source" busy={busy} disabled={!sourceTitle || !sourceUrl || !sourceText} onPress={() => { void run(async () => { await mobileApi.saveKnowledge({ title: sourceTitle, sourceUrl, content: sourceText }); setSourceTitle(''); setSourceUrl(''); setSourceText(''); knowledge.reload(); setNotice('Knowledge source approved.'); }); }} />
  </View></>;
}
