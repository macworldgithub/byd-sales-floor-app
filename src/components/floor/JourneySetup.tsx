import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { mobileApi, Row } from '../../lib/mobileApi';
import { Button, ErrorBox, Field, styles } from './Controls';

const defaults = [
  { key: 'congratulations', day: 0, template: 'Congratulations {firstName} on your new {vehicle}! Thank you for choosing BYD.' },
  { key: 'welcome', day: 1, template: 'Welcome {firstName}! Your BYD team is here to help you get to know your {vehicle}.' },
  { key: 'feature_videos', day: 3, template: 'Hi {firstName}, helpful videos for your {vehicle}: {videoLinks}' },
  { key: 'satisfaction_21_day', day: 21, template: 'Hi {firstName}, how are you enjoying your {vehicle}? {surveyUrl} {contact}' },
];
export function JourneySetup({ settings, onChange }: { settings: Row; onChange: (value: Row) => void }) {
  const [name, setName] = useState('Test Customer'), [vehicle, setVehicle] = useState('BYD ATTO 3');
  const [preview, setPreview] = useState<Row | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const journey = settings.journey || { steps: defaults.map(step => ({ ...step, ...(step.key === 'welcome' && settings.welcomeText ? { template: settings.welcomeText } : {}) })), contact: 'Contact your BYD team with any questions or feedback.', modelVideos: [] };
  const update = (patch: Row) => { setPreview(null); onChange({ ...journey, ...patch }); };
  return <View style={styles.card}><Text style={styles.subtitle}>BYD post-delivery messages</Text>
    <Text style={styles.muted}>Day 0 congratulations and day 21 satisfaction follow the BYD scope. Welcome and video timing can be changed. Each due message requires staff approval. Saving updates pending messages; sent and cancelled messages retain their history.</Text>
    <Text style={styles.muted}>Variables: {'{firstName}, {name}, {vehicle}, {site}, {videoLinks}, {surveyUrl}, {contact}'}</Text>
    {journey.steps.map((step: Row, index: number) => <View key={step.key} style={styles.card}><Text style={styles.text}>{step.key.replaceAll('_', ' ')}</Text>
      {index === 0 || index === 3 ? <Text style={styles.muted}>Day {step.day} after handover</Text> : <Field label="Days after handover" value={String(step.day)} keyboard="decimal-pad" onChange={value => update({ steps: journey.steps.map((row: Row, i: number) => i === index ? { ...row, day: value.trim() ? Number(value) : -1 } : row) })} />}
      <Field label="Message template" value={step.template} multiline onChange={template => update({ steps: journey.steps.map((row: Row, i: number) => i === index ? { ...row, template } : row) })} />
    </View>)}
    <Field label="BYD contact details for satisfaction follow-up" value={journey.contact} multiline onChange={contact => update({ contact })} />
    <Text style={styles.muted}>Model video sets override the general video links above when the delivered vehicle matches the model.</Text>
    {journey.modelVideos.map((row: Row, index: number) => <View key={index} style={styles.card}>
      <Field label="Vehicle model" value={row.model} onChange={model => update({ modelVideos: journey.modelVideos.map((item: Row, i: number) => i === index ? { ...item, model } : item) })} />
      <Field label="Approved HTTPS video URLs (one per line)" value={row.urls.join('\n')} multiline onChange={value => update({ modelVideos: journey.modelVideos.map((item: Row, i: number) => i === index ? { ...item, urls: value.split('\n').map(line => line.trim()).filter(Boolean) } : item) })} />
      <Button title="Remove model video set" secondary onPress={() => update({ modelVideos: journey.modelVideos.filter((_: Row, i: number) => i !== index) })} />
    </View>)}
    <Button title="Add model video set" secondary onPress={() => update({ modelVideos: [...journey.modelVideos, { model: '', urls: [] }] })} />
    <Text style={styles.subtitle}>Preview without sending</Text><Field label="Preview customer name" value={name} onChange={value => { setName(value); setPreview(null); }} /><Field label="Preview delivered vehicle" value={vehicle} onChange={value => { setVehicle(value); setPreview(null); }} />
    <ErrorBox message={error} /><Button title="Validate and preview journey" secondary busy={busy} onPress={() => { setBusy(true); setError(''); setPreview(null); const signature = JSON.stringify(settings); mobileApi.journeyPreview({ settings: { ...settings, journey }, name, vehicle }).then(result => setPreview({ ...result, signature })).catch(cause => setError(cause.message)).finally(() => setBusy(false)); }} />
    {preview?.signature === JSON.stringify(settings) && <><Text style={styles.text}>{preview.ready ? 'All four messages have content and a configured sender.' : 'Journey needs configuration.'}</Text>{!preview.senderConfigured && <Text style={styles.muted}>Select an approved site sender before sending.</Text>}{preview.steps.map((step: Row) => <View key={step.key} style={styles.card}><Text style={styles.text}>Day {step.day} · {step.key.replaceAll('_', ' ')}</Text><Text style={styles.text}>{step.body}</Text><Text style={styles.muted}>Example due time: {new Date(step.dueAt).toLocaleString()}</Text><ErrorBox message={step.configurationIssues.join(' ')} /></View>)}</>}
  </View>;
}
