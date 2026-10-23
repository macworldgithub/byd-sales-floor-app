import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';

export interface NotificationItem {
  id: string;
  type: 'allocation' | 'sms' | 'appointment' | 'delivery' | 'sla';
  title: string;
  body: string;
  time: string;
  read: boolean;
  priority?: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'allocation',
    title: 'New Lead Allocated · Carsales Connect',
    body: 'Marcus Vance allocated to your floor book (SEALION 7). SLA clock active (14m remaining).',
    time: '2 mins ago',
    read: false,
    priority: true,
  },
  {
    id: 'notif-2',
    type: 'sms',
    title: 'Inbound SMS · Sarah Mitchell',
    body: '"Can we do the test drive on Saturday at 10:30am instead?"',
    time: '18 mins ago',
    read: false,
  },
  {
    id: 'notif-3',
    type: 'appointment',
    title: 'Test Drive in 60 Minutes',
    body: 'David Chen scheduled for SEAL Performance test drive loop at 10:00 AM (Showroom Bay 1).',
    time: '35 mins ago',
    read: false,
  },
  {
    id: 'notif-4',
    type: 'delivery',
    title: 'Delivery Tomorrow · Priya Nair',
    body: 'SEALION 7 handover scheduled for tomorrow at 10:30 AM. Paperwork verified.',
    time: '1 hr ago',
    read: true,
  },
  {
    id: 'notif-5',
    type: 'sla',
    title: 'First-Touch SLA Met',
    body: 'Your response time for Liam O\'Connor was 6.4 minutes. Excellent speed-to-lead.',
    time: '3 hrs ago',
    read: true,
  },
];

interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAction?: (item: NotificationItem) => void;
}

export default function NotificationCenterModal({
  visible,
  onClose,
  onSelectAction,
}: NotificationCenterModalProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [pushEnabled, setPushEnabled] = useState(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const getIcon = (type: NotificationItem['type']): { name: string; color: string; bg: string } => {
    switch (type) {
      case 'allocation': return { name: 'person-add-outline', color: '#6366f1', bg: '#f0f0ff' };
      case 'sms': return { name: 'chatbubble-outline', color: '#0ea5e9', bg: '#f0f9ff' };
      case 'appointment': return { name: 'calendar-outline', color: Colors.brand, bg: 'rgba(230,0,18,0.08)' };
      case 'delivery': return { name: 'cube-outline', color: '#10b981', bg: '#f0fdf4' };
      case 'sla': return { name: 'timer-outline', color: '#f59e0b', bg: '#fffbeb' };
      default: return { name: 'notifications-outline', color: Colors.textSecondary, bg: '#f8fafc' };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerEyebrow}>FLOOR PULSE & ALERTS</Text>
              <View style={styles.titleRow}>
                <Text style={styles.headerTitle}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Action & Filter Bar */}
          <View style={styles.toolbar}>
            <View style={styles.filterGroup}>
              <TouchableOpacity
                style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
                onPress={() => setFilter('all')}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterBtn, filter === 'unread' && styles.filterBtnActive]}
                onPress={() => setFilter('unread')}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
                  Unread ({unreadCount})
                </Text>
              </TouchableOpacity>
            </View>

            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead} activeOpacity={0.7}>
                <Text style={styles.markReadText}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Notifications List */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {filtered.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No notifications found.</Text>
              </View>
            ) : (
              filtered.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, !item.read && styles.itemUnread]}
                  onPress={() => {
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
                    );
                    onSelectAction?.(item);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.itemIconWrap, { backgroundColor: getIcon(item.type).bg }]}>
                    <Ionicons name={getIcon(item.type).name as any} size={18} color={getIcon(item.type).color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemTitle, !item.read && styles.itemTitleUnread]}>
                        {item.title}
                      </Text>
                      <Text style={styles.itemTime}>{item.time}</Text>
                    </View>
                    <Text style={styles.itemBody}>{item.body}</Text>
                  </View>
                  {!item.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              ))
            )}

            {/* Push Settings */}
            <View style={styles.settingsBox}>
              <View style={styles.settingRow}>
                <View>
                  <Text style={styles.settingLabel}>Push Notifications</Text>
                  <Text style={styles.settingSub}>Receive lead SLA & handover pings</Text>
                </View>
                <Switch
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  trackColor={{ false: '#e2e8f0', true: 'rgba(230,0,18,0.3)' }}
                  thumbColor={pushEnabled ? Colors.brand : '#94a3b8'}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.brand,
    letterSpacing: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  unreadBadge: {
    backgroundColor: 'rgba(230,0,18,0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.brand,
  },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: {},  // deprecated - using Ionicons directly

  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  filterBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  filterBtnActive: {
    backgroundColor: Colors.dark,
  },
  filterText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.semibold,
  },
  filterTextActive: {
    color: '#fff',
  },
  markReadText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.brand,
  },

  list: {
    padding: Spacing.base,
  },
  emptyWrap: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemUnread: {
    borderColor: '#fca5a5',
    backgroundColor: '#fffdfa',
  },
  itemIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIcon: {
    fontSize: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: Typography.xs + 1,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  itemTitleUnread: {
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  itemTime: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  itemBody: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.brand,
    marginTop: 6,
  },

  settingsBox: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: Typography.xs + 1,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  settingSub: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
    marginTop: 1,
  },

  footer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
  },
  doneBtn: {
    backgroundColor: Colors.dark,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
});
