import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import * as SecureStore from 'expo-secure-store';
import { File, Paths } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { BASE_URL, getToken } from './api';
import { request, Row } from './mobileApi';

export async function chooseMedia(camera = false, imagesOnly = false): Promise<ImagePicker.ImagePickerAsset | null> {
  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('Camera permission is required to take a photo.');
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: imagesOnly || camera ? ['images'] : ['images', 'videos'], quality: 0.8, videoMaxDuration: 180, allowsMultipleSelection: false };
  const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.type === 'video' && (!asset.duration || asset.duration > 180000)) throw new Error('Choose a video that is three minutes or shorter.');
  if (asset.fileSize && asset.fileSize > 65 * 1024 * 1024) throw new Error('Choose media smaller than 65 MB.');
  return asset;
}
export async function uploadMedia(asset: ImagePicker.ImagePickerAsset, site: string, reference: { leadId?: string; clientId?: string; accessoryId?: string; latitude?: string; longitude?: string }): Promise<Row> {
  const query = new URLSearchParams(Object.entries(reference).filter(([, value]) => value) as [string, string][]);
  const contentType = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
  const result = await expoFetch(`${BASE_URL}/mobile/media?${query}`, { method: 'POST', headers: { Authorization: `Bearer ${await getToken()}`, 'X-Site': site, 'Content-Type': contentType }, body: new File(asset.uri) });
  const json = await result.json();
  if (!result.ok || !json.success) throw new Error(json.message || 'Media upload failed.');
  return json.data;
}
export async function devicePosition() {
  const permissions = await Location.requestForegroundPermissionsAsync();
  if (!permissions.granted) throw new Error('Location permission is needed to report your on-site status.');
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy };
}
export async function uploadLicence(asset: ImagePicker.ImagePickerAsset, site: string, leadId: string): Promise<Row> {
  const response = await expoFetch(`${BASE_URL}/mobile/leads/${leadId}/licence-image`, { method: 'POST', headers: { Authorization: `Bearer ${await getToken()}`, 'X-Site': site, 'Content-Type': asset.mimeType || 'image/jpeg' }, body: new File(asset.uri) });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || 'Licence capture failed.');
  return result.data;
}
const PUSH_KEY = 'floor_push_token';
type PushRegistration = { token: string; userId: string };
async function savedPush(): Promise<PushRegistration | null> {
  const saved = await SecureStore.getItemAsync(PUSH_KEY);
  if (!saved) return null;
  try { return JSON.parse(saved); } catch { return { token: saved, userId: '' }; }
}
async function notificationPermission(prompt: boolean) {
  if (Platform.OS === 'web') throw new Error('Notifications require the native Android or iOS app.');
  // Use Expo Go's default channel for its local-only test. Native app builds
  // create and use the dedicated Sales Floor channel.
  if (Platform.OS === 'android' && !isRunningInExpoGo()) await Notifications.setNotificationChannelAsync('sales-floor-alerts', { name: 'Buyer, risk and delivery alerts', importance: AndroidImportance.HIGH });
  let permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted && prompt) permissions = await Notifications.requestPermissionsAsync();
  if (!permissions.granted) throw new Error('Notification permission is required. You can still read the activity feed.');
}
async function registerPush(prompt: boolean) {
  if (isRunningInExpoGo()) throw new Error('Remote push requires an app build. Use the local notification test in Expo Go.');
  const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId || process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (!projectId) throw new Error('Configure the Expo project ID in this app build to enable push notifications.');
  await notificationPermission(prompt);
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const result = await request('/mobile/push-token', { token, projectId, platform: Platform.OS });
  await SecureStore.setItemAsync(PUSH_KEY, JSON.stringify({ token, userId: result.userId }));
  return token;
}
export async function enablePush() { return registerPush(true); }
export async function refreshPushRegistration(userId: string) {
  const saved = await savedPush();
  if (saved?.userId === userId) await registerPush(false);
}
export async function disablePush() {
  const saved = await savedPush();
  if (saved?.token) await request('/mobile/push-token', { token: saved.token }, 'DELETE');
  await SecureStore.deleteItemAsync(PUSH_KEY);
}
export async function testRemotePush(testRequestId: string) {
  const saved = await savedPush();
  if (!saved?.token) throw new Error('Enable device push first.');
  return request('/mobile/push-test', { token: saved.token, requestId: testRequestId });
}
export async function acknowledgePush(notification: Notifications.Notification, event: 'received' | 'opened') {
  const saved = await savedPush(), notificationId = notification.request.content.data?.notificationId;
  if (saved?.token && typeof notificationId === 'string') await request('/mobile/push-receipts', { token: saved.token, notificationId, event });
}
export async function testLocalNotification() {
  await notificationPermission(true);
  return Notifications.scheduleNotificationAsync({ content: { title: 'Sales Floor emulator test', body: 'Local notification display works. Remote push requires a separate server test.', data: { localTest: true }, sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2, ...(!isRunningInExpoGo() ? { channelId: 'sales-floor-alerts' } : {}) } });
}
export async function exportReport(site: string, period = 'mtd', kind = 'summary') {
  const query = new URLSearchParams({ period, kind });
  const response = await expoFetch(`${BASE_URL}/mobile/reports.csv?${query}`, { headers: { Authorization: `Bearer ${await getToken()}`, 'X-Site': site } });
  if (!response.ok) throw new Error('Report export failed.');
  const file = new File(Paths.cache, `byd-report-${Date.now()}.csv`);
  await file.write(await response.text());
  if (!await Sharing.isAvailableAsync()) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export BYD sales report' });
}
