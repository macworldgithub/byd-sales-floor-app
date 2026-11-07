const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
function fixture({ projectId = '11111111-1111-4111-8111-111111111111', expoGo = false } = {}) {
  const calls = [], store = new Map(); let prompts = 0, scheduled = null;
  const notifications = {
    AndroidImportance: { HIGH: 4 }, SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
    setNotificationChannelAsync: async () => calls.push('channel'),
    getPermissionsAsync: async () => ({ granted: true }), requestPermissionsAsync: async () => { prompts++; return { granted: true }; },
    getExpoPushTokenAsync: async input => { calls.push({ expo: input }); return { data: 'ExpoPushToken[fixture-device]' }; },
    scheduleNotificationAsync: async input => { scheduled = input; return 'local-notification'; },
  };
  const constants = { expoConfig: { extra: { eas: { projectId } } }, executionEnvironment: expoGo ? 'storeClient' : 'bare' };
  const secure = { getItemAsync: async key => store.get(key) || null, setItemAsync: async (key, value) => store.set(key, value), deleteItemAsync: async key => store.delete(key) };
  const source = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../src/lib/deviceFeatures.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, { module, exports: module.exports, process: { env: {} }, URLSearchParams, require(name) {
    if (name === 'expo-notifications') return notifications;
    if (name === 'expo') return { isRunningInExpoGo: () => expoGo };
    if (name === 'expo-constants') return { __esModule: true, default: constants, ExecutionEnvironment: { StoreClient: 'storeClient' } };
    if (name === 'expo-secure-store') return secure;
    if (name === 'react-native') return { Platform: { OS: 'android' } };
    if (name === './mobileApi') return { request: async (url, body, method) => { calls.push({ url, body, method }); return { userId: 'staff-1', notificationId: 'test-1', state: 'submitted' }; } };
    return {};
  } });
  return { api: module.exports, calls, store, notifications, get prompts() { return prompts; }, get scheduled() { return scheduled; } };
}
test('remote registration creates an Android channel first and records the project, platform and authenticated owner', async () => {
  const f = fixture(); await f.api.enablePush();
  assert.equal(f.calls[0], 'channel');
  const registration = f.calls.find(row => row.url === '/mobile/push-token');
  assert.equal(registration.body.platform, 'android'); assert.equal(registration.body.projectId, '11111111-1111-4111-8111-111111111111');
  assert.equal(JSON.parse([...f.store.values()][0]).userId, 'staff-1');
  await f.api.refreshPushRegistration('different-account'); assert.equal(f.calls.filter(row => row.url === '/mobile/push-token').length, 1);
  await f.api.refreshPushRegistration('staff-1'); assert.equal(f.prompts, 0);
});
test('Expo Go and a missing project never masquerade as remote registration; local emulator testing still works', async () => {
  const f = fixture({ expoGo: true }); await assert.rejects(f.api.enablePush(), /app build/);
  await f.api.testLocalNotification(); assert.equal(f.scheduled.trigger.seconds, 2); assert.equal(f.scheduled.content.data.localTest, true);
  assert.equal(f.calls.includes('channel'), false); assert.equal(f.scheduled.trigger.channelId, undefined);
  assert.equal(f.calls.filter(row => row.url).length, 0);
  await assert.rejects(fixture({ projectId: '' }).api.enablePush(), /project ID/);
});
test('remote tests target the enrolled device and app acknowledgments contain the matching notification ID', async () => {
  const f = fixture(); await f.api.enablePush(); await f.api.testRemotePush('stable-test-request');
  const request = f.calls.find(row => row.url === '/mobile/push-test'); assert.equal(request.body.requestId, 'stable-test-request');
  await f.api.acknowledgePush({ request: { content: { data: { notificationId: 'test-1' } } } }, 'opened');
  assert.equal(f.calls.find(row => row.url === '/mobile/push-receipts').body.event, 'opened');
  await f.api.disablePush(); assert.equal(f.store.size, 0);
  assert.equal(f.calls.find(row => row.method === 'DELETE').body.token, 'ExpoPushToken[fixture-device]');
});
