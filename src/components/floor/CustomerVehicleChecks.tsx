import React, { useRef, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { useResource } from '../../lib/floorContext';
import { mobileApi, recordId, requestId, Row } from '../../lib/mobileApi';
import { Button, ErrorBox, Field, Pick, styles } from './Controls';
import { VehicleCheckStatus } from './VehicleCheckStatus';

export function CustomerVehicleChecks({ lead, onSaved }: { lead: Row; onSaved: () => void }) {
  const leadId = recordId(lead), history = useResource(() => mobileApi.vehicleChecks(leadId), `vehicle-checks:${leadId}`, [] as Row[]);
  const [rego, setRego] = useState(lead.tradeInRego || ''), [state, setState] = useState('VIC'), [vin, setVin] = useState(lead.tradeInVin || '');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const keys = useRef<Record<string, string>>({});
  const run = async (type: string) => {
    if (busy) return;
    setBusy(true); setError('');
    const fingerprint = JSON.stringify([type, leadId, type === 'rego' ? [rego, state] : vin]);
    const key = keys.current[fingerprint] ||= requestId();
    try {
      const result = type === 'rego' ? await mobileApi.rego({ rego, state, leadId, requestId: key }) : await mobileApi.ppsr({ vin, leadId, requestId: key });
      setVin(result.vin); history.reload(); onSaved();
    } catch (cause) { setError((cause as Error).message); onSaved(); } finally { setBusy(false); }
  };
  return <View style={styles.card}><Text style={styles.subtitle}>Customer trade-in verification</Text><VehicleCheckStatus /><ErrorBox message={error || history.error} />
    <Text style={styles.text}>Current PPSR status: {lead.ppsrStatus || 'Pending'} · VIN {lead.tradeInVin || 'Not verified'}</Text>
    <Field label="Trade-in registration" value={rego} onChange={setRego} /><Pick label="Registration state" value={state} rows={['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'].map(id => ({ id, name: id }))} onChange={setState} />
    <Button title="Look up customer Rego → VIN" secondary busy={busy} disabled={!rego} onPress={() => { void run('rego'); }} />
    <Field label="Trade-in VIN" value={vin} onChange={setVin} /><Button title="Check customer PPSR" secondary busy={busy} disabled={!vin} onPress={() => { void run('ppsr'); }} />
    <Text style={styles.muted}>Checks remain attached to this customer. Creating a deal carries the verified vehicle details and PPSR certificate forward.</Text>
    <Text style={styles.subtitle}>Recorded check history</Text>
    {history.data.map(row => <View key={recordId(row)} style={styles.card}><Text style={styles.text}>{row.vin} · {row.status || row.ppsrStatus}</Text><Text style={styles.muted}>{row.rego || ''} {row.make || ''} {row.model || ''} {row.year || ''}</Text>
      {row.certificateNumber && <Text style={styles.text}>PPSR certificate {row.certificateNumber}</Text>}
      <Text style={styles.muted}>Checked {new Date(row.checkedAt || row.verifiedAt || row.createdAt).toLocaleString()}</Text>
      {typeof row.certificateUrl === 'string' && row.certificateUrl.startsWith('https://') && <Button title="View provider certificate" secondary onPress={() => { void Linking.openURL(row.certificateUrl).catch(cause => setError(cause.message)); }} />}
    </View>)}
  </View>;
}
