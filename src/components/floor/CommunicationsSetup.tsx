import React, { useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useFloor, useResource } from '../../lib/floorContext';
import { mobileApi, requestId, Row } from '../../lib/mobileApi';
import { Button, ErrorBox, Field, Pick, styles } from './Controls';

export function CommunicationsSetup({ onSenderSelect }: { onSenderSelect: (sender: string) => void }) {
  const floor = useFloor(), resource = useResource(() => mobileApi.communications(), `communications:${floor.site}`, {} as Row);
  const [senders, setSenders] = useState<Row[]>([]), [phone, setPhone] = useState(''), [step, setStep] = useState('congratulations');
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  const [test, setTest] = useState<Row | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const testKey = useRef(requestId());
  const run = async (work: () => Promise<void>) => { setBusy(true); setError(''); try { await work(); } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); } };
  const sms = resource.data.sms || {}, push = resource.data.push || {};
  return <View style={styles.card}><Text style={styles.subtitle}>Push and post-delivery SMS setup</Text><ErrorBox message={error || resource.error} />
    <Text style={styles.text}>SMS credentials: {sms.credentialsConfigured ? 'Configured' : 'Missing'} · {sms.simulationMode ? 'Simulation enabled; live sends blocked' : 'Live mode'}</Text>
    <Text style={styles.text}>Saved site sender: {sms.sender || 'Not configured'}</Text><Text style={styles.muted}>Video links: {sms.videoLinksConfigured ? 'Configured' : 'Needed for the video journey step'} · Survey link: {sms.surveyConfigured ? 'Configured' : 'Optional'}</Text>
    <Button title="Load approved SMS senders" secondary busy={busy} onPress={() => { void run(async () => { setSenders(await mobileApi.approvedSenders()); }); }} />
    {senders.length > 0 && <><Pick label="Approved sender for this BYD site" value={selectedSender ?? sms.sender ?? ''} rows={senders.map(row => ({ id: row.sender, name: `${row.label} · ${row.sender}` }))} onChange={sender => { setSelectedSender(sender); onSenderSelect(sender); }} /><Text style={styles.muted}>Save site settings above after selecting the sender.</Text></>}
    <Text style={styles.text}>Remote push project: {push.projectConfigured ? 'Server project configured' : 'Set the real Expo project ID in the app and server environment'}</Text>
    <Text style={styles.muted}>Your registered devices: {push.registeredDevices || 0}. Use Alerts to enable, test and inspect device push. Local notification testing also works in an emulator.</Text>
    <Field label="Your test mobile number" value={phone} onChange={setPhone} keyboard="phone-pad" />
    <Pick label="Post-delivery template to test" value={step} rows={[['congratulations', 'Congratulations'], ['welcome', 'Welcome'], ['feature_videos', 'Helpful videos'], ['satisfaction_21_day', '21-day satisfaction']].map(([id, name]) => ({ id, name }))} onChange={setStep} />
    <Button title="Send one live test SMS" busy={busy} disabled={!phone.trim() || !sms.senderConfigured || Boolean(test)} onPress={() => Alert.alert('Send a live test SMS?', `One test message will be sent to ${phone} using the saved site sender.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Send test', onPress: () => { void run(async () => { setTest(await mobileApi.testSms({ phone, step, requestId: testKey.current })); }); } }])} />
    {test && <><Text style={styles.text}>Test submission: {test.state} · Delivery: {test.deliveryStatus}</Text><ErrorBox message={test.error} />
      <Text style={styles.muted}>{test.verifiedDeliveredAt ? 'Delivery confirmed by MobileMessage message-history lookup.' : 'Provider acceptance is not delivery confirmation.'}</Text>
      {test.providerMessageId && <Text style={styles.muted}>Provider message {test.providerMessageId}</Text>}
      <Button title="Check test SMS delivery" secondary busy={busy} onPress={() => { void run(async () => { setTest(await mobileApi.smsTestReceipt(test.id)); }); }} />
      <Button title="Prepare another SMS test" secondary disabled={busy} onPress={() => { testKey.current = requestId(); setTest(null); }} />
    </>}
    <Button title="Refresh setup status" secondary disabled={busy} onPress={resource.reload} />
  </View>;
}
