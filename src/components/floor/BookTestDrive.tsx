import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Switch, Text, View } from 'react-native';
import { useFloor, useResource } from '../../lib/floorContext';
import { melbourneBookingTime, melbourneDate, mobileApi, recordId, requestId, Row } from '../../lib/mobileApi';
import { chooseMedia, uploadLicence } from '../../lib/deviceFeatures';
import { Button, ErrorBox, Field, Pick, Sheet, styles } from './Controls';

function useLookup(kind: string, enabled: boolean, scope: string) {
  const [query, setQuery] = useState(''), [limit, setLimit] = useState(1000);
  const [result, setResult] = useState<{ key: string; rows: Row[]; error: string; hasMore: boolean }>({ key: '', rows: [], error: '', hasMore: false });
  const key = `${scope}:${kind}:${query}:${limit}`;
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController(); let active = true;
    const timer = setTimeout(() => { mobileApi.virtualyardLookup(kind, query, limit, controller.signal).then(result => {
      if (active) setResult({ key, rows: result.rows, hasMore: result.hasMore, error: '' });
    }).catch(cause => { if (active && cause.name !== 'AbortError') setResult({ key, error: cause.message, rows: [], hasMore: false }); }); }, 300);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [kind, query, limit, key, enabled]);
  const current = enabled && result.key === key;
  return { rows: current ? result.rows : [], error: current ? result.error : '', loading: enabled && !current, search: (text: string) => { setQuery(text); setLimit(1000); }, more: current && result.hasMore && limit < 50000 ? () => setLimit(value => Math.min(50000, value + 1000)) : undefined };
}

export function BookTestDrive({ lead: initialLead, onClose }: { lead?: Row; onClose: () => void }) {
  const floor = useFloor();
  const [leadId, setLeadId] = useState(recordId(initialLead)), [yardSelection, setYardId] = useState(''), [vehicleId, setVehicleId] = useState(''), [userId, setUserId] = useState(''), [driverId, setDriverId] = useState('');
  const [createDriver, setCreateDriver] = useState(false);
  const [licence, setLicence] = useState<Row | null>(null), [licenceId, setLicenceId] = useState(''), [licenceBusy, setLicenceBusy] = useState(false);
  const [licenceName, setLicenceName] = useState(''), [licenceNumber, setLicenceNumber] = useState(''), [licenceState, setLicenceState] = useState('VIC'), [licenceExpiry, setLicenceExpiry] = useState('');
  const [date, setDate] = useState(melbourneDate()), [time, setTime] = useState(''), [duration, setDuration] = useState('45'), [notes, setNotes] = useState('');
  const [status, setStatus] = useState('C'), [bookingType, setBookingType] = useState('T');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState<Row | null>(null);
  const requestKey = useRef(requestId()), inFlight = useRef(false);
  const [lookupRevision, setLookupRevision] = useState(0);
  const meta = useResource(() => mobileApi.virtualyardOptions(), `vy-options:${floor.site}`, {} as Row);
  const lookupScope = `${floor.site}:${lookupRevision}`;
  const vehicles = useLookup('vehicles', Boolean(meta.data.yards?.length), lookupScope), users = useLookup('users', Boolean(meta.data.yards?.length), lookupScope), drivers = useLookup('customers', Boolean(meta.data.yards?.length), lookupScope);
  const customers = initialLead && !floor.leads.some(row => recordId(row) === recordId(initialLead)) ? [initialLead, ...floor.leads] : floor.leads;
  const lead = customers.find(row => recordId(row) === leadId);
  const siteKey = (value: string) => value.toLowerCase().replace(/^byd\s+/, '').replace(/[^a-z0-9]/g, '').replace(/^melbourne$/, 'melbournecity');
  const yardId = yardSelection || meta.data.yards?.find((row: Row) => siteKey(row.name) === siteKey(lead?.dealer || floor.site))?.id || '';
  const submit = async () => {
    if (inFlight.current) return;
    if (!lead || !yardId || !vehicleId || !userId || (!driverId && !createDriver)) { setError('Select a customer, yard, demo vehicle, salesperson and Virtual Yard driver.'); return; }
    inFlight.current = true; setBusy(true); setError('');
    try {
      const vehicle = vehicles.rows.find(row => row.id === vehicleId), person = users.rows.find(row => row.id === userId), driver = drivers.rows.find(row => row.id === driverId);
      if (!meta.data.yards?.some((row: Row) => row.id === yardId) || !vehicle || !person || (!driver && !createDriver)) throw new Error('Select current Virtual Yard yard, demo vehicle, salesperson and driver options.');
      const result = await mobileApi.book({ bookingRequestId: requestKey.current, leadId, type: 'Test Drive', when: melbourneBookingTime(date, time),
        durationMinutes: Number(duration), vehicle: vehicle?.name, consultantName: person?.name, notes, status: ({ P: 'Pending', C: 'Confirmed', I: 'In-Progress', F: 'Completed', R: 'Rescheduled', X: 'Cancelled', M: 'No Show' } as Record<string, string>)[status],
        licenceId: licenceId || undefined, createVirtualyardCustomer: createDriver && !driverId, virtualyard: { vehicleId, vehicleName: vehicle?.name, userId, userName: person?.name,
          ...(driver ? { customerId: driver.id, customerName: driver.name } : {}), locationId: yardId, bookingType, status } });
      setSaved(result); await floor.refresh();
      if (result.virtualyardSync?.state === 'synced') {
        Alert.alert('Test drive saved', `Virtual Yard booking #${result.virtualyardSync.externalId}`);
        onClose();
      }
    } catch (cause) { setError((cause as Error).message); }
    finally { inFlight.current = false; setBusy(false); }
  };
  return <Sheet title="Book test drive" onClose={() => { if (!inFlight.current && !licenceBusy) onClose(); }}>
    <Text style={styles.muted}>Save to Sales Floor and Virtual Yard · Melbourne time</Text>
    <ErrorBox message={error || meta.error} />
    {saved ? <View style={styles.card}>
      <Text style={styles.subtitle}>{saved.virtualyardSync?.state === 'synced' ? 'Confirmed in Virtual Yard' : 'Saved; Virtual Yard confirmation pending'}</Text>
      <Text style={styles.text}>Status: {saved.virtualyardSync?.state || 'pending'}</Text>
      {saved.virtualyardSync?.externalId && <Text style={styles.text}>Virtual Yard booking #{saved.virtualyardSync.externalId}</Text>}
      {saved.virtualyardSync?.message && <Text style={styles.text}>{saved.virtualyardSync.message}</Text>}
      <Text style={styles.muted}>Review this booking in Calendar. Do not create a second booking while confirmation is pending.</Text>
      <Button title="Done" onPress={onClose} />
    </View> : <View style={styles.card}>
      <Button title="Refresh Virtual Yard dropdowns" secondary disabled={busy || licenceBusy || meta.loading} onPress={() => { setVehicleId(''); setUserId(''); setDriverId(''); setLookupRevision(value => value + 1); meta.reload(); }} />
      {meta.loading && <ActivityIndicator />}
      <Pick label="Sales Floor customer" value={leadId} rows={customers.map(row => ({ id: recordId(row), name: `${row.name} · ${row.phone}` }))} onChange={value => { setLeadId(value); setLicence(null); setLicenceId(''); setYardId(''); setVehicleId(''); }} />
      {floor.hasMore && <Button title="Load more customers" secondary onPress={() => { void floor.loadMore(); }} />}
      <Pick label="Virtual Yard yard" value={yardId} rows={meta.data.yards || []} onChange={value => { setYardId(value); setVehicleId(''); }} />
      <Pick label="Demo vehicle" value={vehicleId} rows={vehicles.rows.map(row => ({ ...row, name: `${row.name}${row.locationId ? ` · ${meta.data.yards?.find((yard: Row) => yard.id === row.locationId)?.name || row.locationId}` : ''}` }))} onChange={value => { setVehicleId(value); const vehicle = vehicles.rows.find(row => row.id === value); if (vehicle?.locationId && meta.data.yards?.some((yard: Row) => yard.id === vehicle.locationId)) setYardId(vehicle.locationId); }} onSearch={query => { vehicles.search(query); setVehicleId(''); }} loading={vehicles.loading} error={vehicles.error} more={vehicles.more} />
      <Pick label="Salesperson" value={userId} rows={users.rows} onChange={setUserId} onSearch={query => { users.search(query); setUserId(''); }} loading={users.loading} error={users.error} more={users.more} />
      <Pick label="Existing Virtual Yard driver" value={driverId} rows={drivers.rows} onChange={value => { setDriverId(value); setCreateDriver(false); }} onSearch={query => { drivers.search(query); setDriverId(''); }} loading={drivers.loading} error={drivers.error} more={drivers.more} />
      {!drivers.loading && !drivers.error && !drivers.rows.length && <Text style={styles.muted}>No matching Virtual Yard drivers. Search by name, phone or customer ID, or add the driver in Virtual Yard first.</Text>}
      <View style={styles.row}><Switch accessibilityLabel="Find or create customer in Virtual Yard" value={createDriver} onValueChange={value => { setCreateDriver(value); if (value) setDriverId(''); }} /><Text style={[styles.text, { flex: 1 }]}>Find by mobile or create this customer in Virtual Yard</Text></View>
      {createDriver && <Text style={styles.muted}>Uses {lead?.name || 'the selected customer'}’s mobile and email. An existing matching customer is reused.</Text>}
      <Pick label="Booking type" value={bookingType} rows={meta.data.bookingTypes || []} onChange={setBookingType} />
      <Pick label="Status" value={status} rows={meta.data.statuses || []} onChange={setStatus} />
      <Field label="Date (YYYY-MM-DD)" value={date} onChange={setDate} />
      <Field label="Time in Melbourne (HH:MM)" value={time} onChange={setTime} />
      <Pick label="Duration" value={duration} rows={['30', '45', '60'].map(value => ({ id: value, name: `${value} minutes` }))} onChange={setDuration} />
      <Field label="Notes" value={notes} onChange={setNotes} multiline />
      <Button title="Capture driver licence" secondary disabled={!leadId || busy} busy={licenceBusy} onPress={() => {
        setLicenceBusy(true); setError('');
        chooseMedia(true, true).then(async asset => { if (!asset) return; const result = await uploadLicence(asset, floor.site, leadId); setLicence(result); setLicenceId(''); const fields = result.suggestions || {}; setLicenceName(fields.fullName || lead?.name || ''); setLicenceNumber(fields.licenceNumber || ''); setLicenceState(fields.state || 'VIC'); setLicenceExpiry(fields.expiryDate || ''); }).catch(cause => setError(cause.message)).finally(() => setLicenceBusy(false));
      }} />
      {licence && <View style={styles.card}><Text style={styles.subtitle}>Review licence details</Text><Text style={styles.muted}>{licence.suggestions ? 'Review the scanned details and correct any errors.' : 'Photo captured. Enter and verify the details shown on the licence.'}</Text><ErrorBox message={licence.ocrError} />
        <Field label="Licence holder" value={licenceName} onChange={text => { setLicenceName(text); setLicenceId(''); }} /><Field label="Licence number" value={licenceNumber} onChange={text => { setLicenceNumber(text); setLicenceId(''); }} />
        <Pick label="Issuing state" value={licenceState} rows={['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'].map(id => ({ id, name: id }))} onChange={text => { setLicenceState(text); setLicenceId(''); }} />
        <Field label="Licence expiry (YYYY-MM-DD)" value={licenceExpiry} onChange={text => { setLicenceExpiry(text); setLicenceId(''); }} />
        <Button title={licenceId ? 'Licence verified and attached' : 'Confirm licence details'} secondary disabled={Boolean(licenceId)} busy={licenceBusy} onPress={() => { setLicenceBusy(true); mobileApi.reviewLicence(leadId, { imageId: licence.id, fullName: licenceName, licenceNumber, state: licenceState, expiryDate: licenceExpiry }).then(result => setLicenceId(result.id)).catch(cause => setError(cause.message)).finally(() => setLicenceBusy(false)); }} />
      </View>}
      <Button title="Confirm booking" busy={busy} disabled={licenceBusy || Boolean(licence && !licenceId) || meta.loading || !meta.data.yards?.length || vehicles.loading || users.loading || drivers.loading || !lead || !yardId || !vehicleId || !userId || (!driverId && !createDriver) || !date || !time} onPress={() => { void submit(); }} />
    </View>}
  </Sheet>;
}
