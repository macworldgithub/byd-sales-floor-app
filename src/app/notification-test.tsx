import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { testLocalNotification } from '../lib/deviceFeatures';
import { Button, ErrorBox, styles } from '../components/floor/Controls';

export default function NotificationTest() {
  const [status, setStatus] = useState('Ready'), [error, setError] = useState('');
  useEffect(() => {
    if (!__DEV__) return;
    const last = Notifications.getLastNotificationResponse();
    if (last?.notification.request.content.data?.localTest) {
      // The notification may have launched the experience before this screen
      // mounted, so consume the initial response as well as later events.
      Promise.resolve().then(() => setStatus('Notification tapped successfully'));
      Notifications.clearLastNotificationResponse();
    }
    const received = Notifications.addNotificationReceivedListener(notification => { if (notification.request.content.data?.localTest) setStatus('Local notification received by this app'); });
    const opened = Notifications.addNotificationResponseReceivedListener(response => { if (response.notification.request.content.data?.localTest) { setStatus('Notification tapped successfully'); Notifications.clearLastNotificationResponse(); } });
    return () => { received.remove(); opened.remove(); };
  }, []);
  if (!__DEV__) return <Redirect href="/" />;
  return <SafeAreaView style={styles.page}><View style={styles.content}><View style={styles.card}>
    <Text style={styles.title}>Emulator notification test</Text><Text style={styles.text}>{status}</Text><ErrorBox message={error} />
    <Text style={styles.muted}>This tests local display and tap handling. It sends no SMS and makes no remote push request. Remote push requires an Expo project and an app build with push credentials.</Text>
    <Button title="Show test notification" onPress={() => { setError(''); setStatus('Scheduling local test…'); testLocalNotification().then(() => setStatus('Scheduled; waiting for notification')).catch(cause => { setStatus('Local test failed'); setError(cause.message); }); }} />
  </View></View></SafeAreaView>;
}
