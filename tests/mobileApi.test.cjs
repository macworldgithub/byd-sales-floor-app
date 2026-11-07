const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
function fixture(fetchApi) {
  const source = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../src/lib/mobileApi.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = { exports: {}, URLSearchParams, Intl, Date, Math, require: name => { if (name === './api') return { fetchApi }; throw new Error(name); } };
  vm.runInNewContext(source, context); return context.exports;
}
test('Melbourne booking conversion handles summer/winter and rejects DST gaps and ambiguous times', () => {
  const api = fixture();
  assert.equal(api.melbourneBookingTime('2026-11-20', '10:00'), '2026-11-19T23:00:00.000Z');
  assert.equal(api.melbourneBookingTime('2026-07-01', '10:00'), '2026-07-01T00:00:00.000Z');
  assert.throws(() => api.melbourneBookingTime('2026-10-04', '02:30'));
  assert.throws(() => api.melbourneBookingTime('2026-04-05', '02:30'));
  assert.throws(() => api.melbourneBookingTime('2026-02-31', '10:00'));
});
test('booking makes one canonical request and keeps upstream failure as failure', async () => {
  const calls = []; let fail = false;
  const api = fixture(async (endpoint, options) => { calls.push({ endpoint, options }); return fail ? { success: false, message: 'Virtual Yard unavailable.' } : { success: true, data: { _id: 'appointment', virtualyardSync: { state: 'failed', message: 'Session expired.' } } }; });
  const payload = { bookingRequestId: 'stable-request', leadId: 'lead-1', when: '2026-11-19T23:00:00Z', virtualyard: { vehicleId: '8', userId: '9', customerId: '10' } };
  const response = await api.mobileApi.book(payload);
  assert.equal(calls.length, 1); assert.equal(calls[0].endpoint, '/mobile/appointments'); assert.deepEqual(JSON.parse(calls[0].options.body), payload);
  assert.equal(response.virtualyardSync.state, 'failed'); fail = true;
  await assert.rejects(api.mobileApi.book(payload), /Virtual Yard unavailable/);
});
test('deal push, messages and PPSR never convert a rejected request into success', async () => {
  const api = fixture(async () => { throw new Error('Provider unavailable.'); });
  for (const work of [() => api.mobileApi.pushDeal('deal'), () => api.mobileApi.send('lead', { body: 'Hello' }), () => api.mobileApi.ppsr({ vin: 'LVVDB21B8RD000001' })]) await assert.rejects(work(), /Provider unavailable/);
});
