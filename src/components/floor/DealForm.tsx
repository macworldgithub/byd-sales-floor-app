import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useFloor, useResource } from '../../lib/floorContext';
import { mobileApi, recordId, requestId, Row } from '../../lib/mobileApi';
import { Button, ErrorBox, Field, Pick, Sheet, styles } from './Controls';
import { VehicleCheckStatus } from './VehicleCheckStatus';

export function DealForm({ initialLead, initialDeal, onClose }: { initialLead?: Row; initialDeal?: Row; onClose: () => void }) {
  const floor = useFloor(), stock = useResource(() => mobileApi.inventory(), `deal-stock:${floor.site}`, { data: [], counts: {}, total: 0 });
  const [leadId, setLeadId] = useState(recordId(initialLead)), [vehicleId, setVehicleId] = useState(''), [salePrice, setSalePrice] = useState(''), [tradeInValue, setTradeInValue] = useState('0');
  const [financeType, setFinanceType] = useState('Cash'), [rego, setRego] = useState(initialLead?.tradeInRego || ''), [regoState, setRegoState] = useState('VIC'), [vin, setVin] = useState(initialLead?.tradeInVin || '');
  const [check, setCheck] = useState<Row | null>(null), [deal, setDeal] = useState<Row | null>(initialDeal || null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const key = useRef(requestId());
  const vehicleKeys = useRef<Record<string, string>>({});
  const checkKey = (type: string) => { const fingerprint = JSON.stringify([type, leadId, deal?.dealId, type === 'rego' ? [rego, regoState] : vin]); return vehicleKeys.current[fingerprint] ||= requestId(); };
  const selectedLead = floor.leads.find(row => recordId(row) === leadId) || initialLead;
  const run = async (work: () => Promise<void>) => { if (busy) return; setBusy(true); setError(''); try { await work(); await floor.refresh(); } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); } };
  return <Sheet title="Register BYD deal" onClose={onClose}><ErrorBox message={error || stock.error} />
    {notice && <View style={styles.success}><Text style={styles.text}>{notice}</Text></View>}
    {!deal ? <View style={styles.card}>
      <Pick label="Customer" value={leadId} rows={floor.leads.map(row => ({ id: recordId(row), name: `${row.name} · ${row.phone}` }))} onChange={value => { setLeadId(value); setCheck(null); setVin(''); setRego(''); }} />
      {floor.hasMore && <Button title="Load more customers" secondary onPress={() => { void floor.loadMore(); }} />}
      {selectedLead?.businessName && <Text style={styles.text}>Company: {selectedLead.businessName}</Text>}
      <Pick label="Available vehicle" value={vehicleId} rows={stock.data.data.filter(row => row.status === 'In Stock').map(row => ({ id: row.id, name: `${row.stockNumber} · ${row.model} ${row.variant}` }))} onChange={value => { setVehicleId(value); const vehicle = stock.data.data.find(row => row.id === value); setSalePrice(vehicle?.advertisedPrice === null ? '' : String(vehicle?.advertisedPrice ?? '')); }} />
      <Field label="Agreed sale price (AUD)" value={salePrice} onChange={setSalePrice} keyboard="decimal-pad" /><Field label="Trade-in allowance (AUD)" value={tradeInValue} onChange={setTradeInValue} keyboard="decimal-pad" />
      <Pick label="Payment method" value={financeType} rows={['Cash', 'Financed', 'Novated Lease'].map(id => ({ id, name: id }))} onChange={setFinanceType} />
      <Button title="Register deal" busy={busy} disabled={!leadId || !vehicleId || !salePrice} onPress={() => { void run(async () => { const saved = await mobileApi.createDeal({ bookingRequestId: key.current, leadId, inventoryId: vehicleId, salePrice: Number(salePrice), tradeInValue: Number(tradeInValue), financeType }); setDeal(saved); setNotice('Deal registered. Push it to Virtual Yard below. Delivery starts after the signed contract is returned.'); }); }} />
    </View> : <View style={styles.card}><Text style={styles.subtitle}>{deal.dealId}</Text><Text style={styles.text}>{deal.buyerName} · {deal.vehicle?.model}</Text><Text style={styles.text}>Virtual Yard: {deal.virtualYard?.status || 'Pending Sync'}</Text>
      {deal.virtualYard?.virtualYardOrderId && <Text style={styles.text}>Order #{deal.virtualYard.virtualYardOrderId}</Text>}
      <Button title="Push deal to Virtual Yard" busy={busy} disabled={['Pushed', 'Contract Signed', 'Delivered'].includes(deal.virtualYard?.status)} onPress={() => { void run(async () => { const synced = await mobileApi.pushDeal(recordId(deal)); setDeal(synced); setNotice(`Confirmed Virtual Yard order ${synced.virtualYard.virtualYardOrderId}. Awaiting signed contract.`); }); }} />
    </View>}
    <View style={styles.card}><Text style={styles.subtitle}>Trade-in Rego / PPSR</Text><Text style={styles.muted}>Results are attached to the customer{deal ? ' and this deal' : ''}. An unavailable check remains unverified.</Text>
      <VehicleCheckStatus />
      <Field label="Trade-in registration" value={rego} onChange={setRego} /><Pick label="State" value={regoState} rows={['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'].map(id => ({ id, name: id }))} onChange={setRegoState} />
      <Button title="Look up Rego → VIN" secondary busy={busy} disabled={!leadId || !rego} onPress={() => { void run(async () => { const result = await mobileApi.rego({ rego, state: regoState, leadId, dealId: deal?.dealId, requestId: checkKey('rego') }); setVin(result.vin); setCheck(result); }); }} />
      <Field label="Trade-in VIN" value={vin} onChange={setVin} />
      <Button title="Run PPSR check" secondary busy={busy} disabled={!leadId || !vin} onPress={() => { void run(async () => { setCheck(await mobileApi.ppsr({ vin, leadId, dealId: deal?.dealId, requestId: checkKey('ppsr') })); }); }} />
      {check && <View style={styles.card}><Text style={styles.text}>{check.vin} · {check.status || check.ppsrStatus || 'Pending'}</Text>{(check.certificateNumber || check.searchCertificateNumber) && <Text style={styles.text}>Certificate: {check.certificateNumber || check.searchCertificateNumber}</Text>}</View>}
    </View>
  </Sheet>;
}
