const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the actual form handlers with native views and providers substituted.
// No device, network, licence upload or Virtual Yard write is performed.
function fixture(sync = { state: 'synced', externalId: 'actual-booking-1' }) {
  let cursor = 0, pending = [], tree, closed = 0, refreshes = 0, metadataRefreshes = 0;
  const slots = [], calls = [], alerts = [], lookups = [];
  const lead = { _id: 'preselected-lead', name: 'Customer', phone: '+61400000000', dealer: 'BYD Fairfield' };
  const options = { yards: [{ id: '4840', name: 'Fairfield' }, { id: '4850', name: 'Nunawading' }], bookingTypes: [{ id: 'T', name: 'Test drive' }], statuses: [{ id: 'C', name: 'Confirmed' }] };
  const rows = { vehicles: [{ id: 'vehicle-1', name: 'SEAL demo', locationId: '4850' }], users: [{ id: 'user-1', name: 'Salesperson' }], customers: [{ id: 'driver-1', name: 'VY Driver' }] };
  const react = {
    createElement(type, props, ...children) { return { type, props: { ...props, children } }; },
    useState(initial) { const at = cursor++; if (!slots[at]) slots[at] = { value: typeof initial === 'function' ? initial() : initial }; return [slots[at].value, next => { slots[at].value = typeof next === 'function' ? next(slots[at].value) : next; }]; },
    useRef(initial) { const at = cursor++; return slots[at] ||= { current: initial }; },
    useEffect(effect, deps) { const at = cursor++, previous = slots[at]; if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) { previous?.cleanup?.(); slots[at] = { deps }; pending.push(() => { slots[at].cleanup = effect(); }); } },
  };
  const module = { exports: {} }, floor = { site: 'BYD Fairfield', leads: [], hasMore: false, refresh: async () => { refreshes++; } };
  const api = {
    virtualyardOptions: async () => options,
    virtualyardLookup: async kind => { lookups.push(kind); return { rows: rows[kind], hasMore: false }; },
    book: async payload => { calls.push(payload); return { _id: 'local-appointment', virtualyardSync: sync }; },
  };
  const controls = Object.fromEntries(['Button', 'ErrorBox', 'Field', 'Pick', 'Sheet'].map(name => [name, name]));
  const source = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../src/components/floor/BookTestDrive.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, AbortController, setTimeout: callback => { callback(); return 1; }, clearTimeout() {},
    require(name) {
      if (name === 'react') return { __esModule: true, default: react, ...react };
      if (name === 'react-native') return { ActivityIndicator: 'ActivityIndicator', Switch: 'Switch', Text: 'Text', View: 'View', Alert: { alert: (...args) => alerts.push(args) } };
      if (name.endsWith('floorContext')) return { useFloor: () => floor, useResource: () => ({ data: options, error: '', loading: false, reload: () => { metadataRefreshes++; } }) };
      if (name.endsWith('mobileApi')) return { mobileApi: api, recordId: row => row?._id || '', requestId: () => 'stable-form-request', melbourneDate: () => '2026-11-20', melbourneBookingTime: (date, time) => { if (date !== '2026-11-20' || time !== '10:00') throw Error('Invalid time'); return '2026-11-19T23:00:00.000Z'; } };
      if (name.endsWith('deviceFeatures')) return {};
      if (name.endsWith('Controls')) return { ...controls, styles: {} };
      throw Error(`Unexpected module ${name}`);
    },
  });
  const render = () => { cursor = 0; tree = module.exports.BookTestDrive({ lead, onClose: () => { closed++; } }); const effects = pending; pending = []; effects.forEach(effect => effect()); return tree; };
  const nodes = node => !node || typeof node !== 'object' ? [] : [node, ...(node.props?.children || []).flat(Infinity).flatMap(child => nodes(child))];
  const get = (type, property, value) => { const node = nodes(tree).find(node => node.type === type && node.props[property] === value); assert(node, `Missing ${type} ${value}`); return node.props; };
  const settle = async () => { for (let i = 0; i < 6; i++) { await Promise.resolve(); render(); } };
  const choose = (label, value) => { get('Pick', 'label', label).onChange(value); render(); };
  const ready = async () => { render(); await settle(); choose('Demo vehicle', 'vehicle-1'); choose('Salesperson', 'user-1'); choose('Existing Virtual Yard driver', 'driver-1'); get('Field', 'label', 'Time in Melbourne (HH:MM)').onChange('10:00'); render(); };
  return { ready, render, settle, get, choose, api, calls, alerts, lookups, get closed() { return closed; }, get refreshes() { return refreshes; }, get metadataRefreshes() { return metadataRefreshes; } };
}

test('CRM-style booking preserves a preselected customer, selects the demo yard and closes only on confirmed sync', async () => {
  const form = fixture(); await form.ready();
  assert.equal(form.get('Pick', 'label', 'Sales Floor customer').rows[0].id, 'preselected-lead');
  assert.equal(form.get('Pick', 'label', 'Virtual Yard yard').value, '4850');
  assert.equal(form.get('Button', 'title', 'Confirm booking').disabled, false);
  form.get('Button', 'title', 'Confirm booking').onPress(); await form.settle();
  assert.equal(form.calls.length, 1); assert.equal(form.closed, 1); assert.equal(form.refreshes, 1);
  const payload = form.calls[0];
  assert.equal(payload.leadId, 'preselected-lead'); assert.equal(payload.when, '2026-11-19T23:00:00.000Z'); assert.equal(payload.durationMinutes, 45);
  assert.deepEqual(JSON.parse(JSON.stringify(payload.virtualyard)), { vehicleId: 'vehicle-1', vehicleName: 'SEAL demo', userId: 'user-1', userName: 'Salesperson', customerId: 'driver-1', customerName: 'VY Driver', locationId: '4850', bookingType: 'T', status: 'C' });
  assert.match(form.alerts[0][1], /actual-booking-1/);
});

test('a saved but unsynced booking remains visible and rapid duplicate confirmation submits only once', async () => {
  const form = fixture({ state: 'failed', message: 'Session expired.' }); await form.ready();
  const submit = form.get('Button', 'title', 'Confirm booking').onPress;
  submit(); submit(); await form.settle();
  assert.equal(form.calls.length, 1); assert.equal(form.closed, 0); assert.equal(form.alerts.length, 0);
  assert.equal(typeof form.get('Button', 'title', 'Done').onPress, 'function');
});

test('refresh reloads all VY dropdowns and clears selections; a booking time must be explicitly entered', async () => {
  const form = fixture(); form.render(); await form.settle();
  assert.equal(form.get('Field', 'label', 'Time in Melbourne (HH:MM)').value, '');
  assert.equal(form.get('Button', 'title', 'Confirm booking').disabled, true);
  await form.ready();
  form.get('Button', 'title', 'Refresh Virtual Yard dropdowns').onPress(); form.render(); await form.settle();
  assert.equal(form.metadataRefreshes, 1); assert.equal(form.lookups.length, 6);
  for (const label of ['Demo vehicle', 'Salesperson', 'Existing Virtual Yard driver']) assert.equal(form.get('Pick', 'label', label).value, '');
  assert.equal(form.get('Button', 'title', 'Confirm booking').disabled, true); assert.equal(form.calls.length, 0);
});
