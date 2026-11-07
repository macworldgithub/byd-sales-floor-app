import React, { useEffect } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import { AuthProvider, useAuth } from '../lib/auth';
import { FloorProvider } from '../lib/floorContext';
import { acknowledgePush, refreshPushRegistration } from '../lib/deviceFeatures';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });

function NotificationBridge() {
  const { user } = useAuth();
  const pathname = usePathname();
  useEffect(() => {
    const open = (response: Notifications.NotificationResponse) => {
      if (__DEV__ && response.notification.request.content.data?.localTest) {
        if (pathname !== '/notification-test') router.push('/notification-test');
        return; // The local test screen consumes and clears this response.
      }
      if (!user?.id) return; // Keep remote responses until staff sign in.
      void acknowledgePush(response.notification, 'opened').catch(() => undefined);
      const leadId = response.notification.request.content.data?.leadId;
      router.push({ pathname: '/[view]', params: { view: 'alerts', ...(typeof leadId === 'string' ? { leadId } : {}) } });
      Notifications.clearLastNotificationResponse();
    };
    const last = Notifications.getLastNotificationResponse();
    if (last) open(last);
    const received = Notifications.addNotificationReceivedListener(notification => { if (user?.id) void acknowledgePush(notification, 'received').catch(() => undefined); });
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    const refresh = () => { if (user?.id) void refreshPushRegistration(user.id).catch(() => undefined); };
    const token = Notifications.addPushTokenListener(refresh);
    const appState = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    refresh();
    return () => { subscription.remove(); received.remove(); token.remove(); appState.remove(); };
  }, [user?.id, pathname]);
  return null;
}
export default function RootLayout() {
  return <AuthProvider><FloorProvider><NotificationBridge /><Stack screenOptions={{ headerShown: false }} /></FloorProvider></AuthProvider>;
}
