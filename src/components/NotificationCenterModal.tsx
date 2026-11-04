import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';

export interface NotificationItem {
  id: string;
  type: 'high_buyer' | 'price_objection' | 'high_risk' | 'allocation' | 'sms' | 'appointment' | 'delivery' | 'sla';
  title: string;
  body: string;
  triggerPhrase?: string;
  time: string;
  read: boolean;
  priority?: boolean;
  aiHandled?: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'ai-1',
    type: 'high_buyer',
    title: 'High Buyer Alert · Marcus Vance',
    body: '"Can I come in today at 3pm to finalise finance and drive the SEALION 7 home?"',
    triggerPhrase: 'Ready to buy · Finance enquiry',
    time: '2 mins ago',
    read: false,
    priority: true,
    aiHandled: true,
  },
  {
    id: 'ai-2',
    type: 'price_objection',
    title: 'Price Objection Alert · Daniel Cho',
    body: '"Looking for a better deal — Tesla just offered $2,000 off Model Y inventory. Can you do any better?"',
    triggerPhrase: 'Competitor quote · Better deal request',
    time: '14 mins ago',
    read: false,
    priority: true,
    aiHandled: true,
  },
  {
    id: 'ai-3',
    type: 'high_risk',
    title: 'High Risk Alert · Priya Nair',
    body: 'No customer engagement for 3+ days following written novated lease proposal.',
    triggerPhrase: 'No response after quote (3+ days)',
    time: '45 mins ago',
    read: false,
    priority: true,
    aiHandled: false,
  },
  {
    id: 'notif-1',
    type: 'allocation',
    title: 'New Lead Allocated · Carsales Connect',
    body: 'Sarah Mitchell allocated to your floor book (SEALION 7). SLA clock active (12m remaining).',
    time: '1 hr ago',
    read: true,
  },
  {
    id: 'notif-4',
    type: 'delivery',
    title: 'Handover Bay Ready · David Chen',
    body: 'SEALION 7 handover scheduled for 10:30 AM in Bay 2. PDI & accessory checklist complete.',
    time: '2 hrs ago',
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
  const [filter, setFilter] = useState<'all' | 'high_buyer' | 'price_objection' | 'high_risk'>('all');
  const [pushEnabled, setPushEnabled] = useState(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleTakeover = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, aiHandled: false, read: true } : n));
  };

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const getAlertBadge = (type: NotificationItem['type']) => {
    switch (type) {
      case 'high_buyer':
        return { label: 'HIGH BUYER', bg: '#fef2f2', text: '#dc2626', icon: 'flame', border: '#fca5a5' };
      case 'price_objection':
        return { label: 'PRICE OBJECTION', bg: '#fffbeb', text: '#b45309', icon: 'pricetag', border: '#fde68a' };
      case 'high_risk':
        return { label: 'HIGH RISK', bg: '#fef2f2', text: '#991b1b', icon: 'alert-circle', border: '#fecaca' };
      case 'allocation':
        return { label: 'ALLOCATION', bg: '#eff6ff', text: '#1e40af', icon: 'person-add', border: '#bfdbfe' };
      case 'delivery':
        return { label: 'DELIVERY', bg: '#f0fdf4', text: '#166534', icon: 'cube', border: '#bbf7d0' };
      default:
        return { label: 'NOTIFICATION', bg: '#f8fafc', text: '#475569', icon: 'notifications', border: '#e2e8f0' };
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerEyebrow}>AI HIGH-SIGNAL NOTIFICATIONS</Text>
              <Text style={styles.headerTitle}>Floor Pulse & Alerts</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* AI Category Filter Tabs */}
          <View style={styles.categoryScrollWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              {[
                { id: 'all', label: `All Alerts (${notifications.length})` },
                { id: 'high_buyer', label: '🔥 High Buyer' },
                { id: 'price_objection', label: '💰 Price Objection' },
                { id: 'high_risk', label: '⚠️ High Risk' },
              ].map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catPill, filter === cat.id && styles.catPillActive]}
                  onPress={() => setFilter(cat.id as any)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.catPillText, filter === cat.id && styles.catPillTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Notification List */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {filtered.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="notifications-off-outline" size={36} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No alerts in this category</Text>
              </View>
            ) : (
              filtered.map((item) => {
                const badge = getAlertBadge(item.type);
                return (
                  <View key={item.id} style={[styles.alertCard, !item.read && styles.alertCardUnread]}>
                    <View style={styles.alertHeader}>
                      <View style={[styles.typeBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                        <Ionicons name={badge.icon as any} size={11} color={badge.text} style={{ marginRight: 4 }} />
                        <Text style={[styles.typeBadgeText, { color: badge.text }]}>{badge.label}</Text>
                      </View>
                      <Text style={styles.alertTime}>{item.time}</Text>
                    </View>

                    <Text style={styles.alertTitle}>{item.title}</Text>
                    <Text style={styles.alertBody}>{item.body}</Text>

                    {item.triggerPhrase && (
                      <View style={styles.triggerBox}>
                        <Ionicons name="flash-outline" size={11} color={Colors.textMuted} style={{ marginRight: 4 }} />
                        <Text style={styles.triggerText}>Trigger: {item.triggerPhrase}</Text>
                      </View>
                    )}

                    {/* AI Human Takeover Action */}
                    {item.type.startsWith('high_') || item.type === 'price_objection' ? (
                      <View style={styles.takeoverRow}>
                        <View style={styles.aiStatusPill}>
                          <View style={[styles.aiDot, { backgroundColor: item.aiHandled ? '#10b981' : '#94a3b8' }]} />
                          <Text style={styles.aiStatusText}>
                            {item.aiHandled ? 'AI Knowledge Agent Active' : 'Human Takeover (AI Paused)'}
                          </Text>
                        </View>

                        {item.aiHandled && (
                          <TouchableOpacity
                            style={styles.takeoverBtn}
                            onPress={() => handleTakeover(item.id)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="hand-right-outline" size={12} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.takeoverBtnText}>Take Over</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.pushToggleRow}>
              <Ionicons name="notifications-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.pushToggleLabel}>High-Signal Push Alerts</Text>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ true: Colors.brand, false: Colors.border }}
              />
            </View>

            {unreadCount > 0 && (
              <TouchableOpacity style={styles.markReadBtn} onPress={markAllAsRead} activeOpacity={0.8}>
                <Text style={styles.markReadText}>Mark all as read</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerEyebrow: { fontSize: 10, fontWeight: '700', color: Colors.brand, letterSpacing: 0.8 },
  headerTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  categoryScrollWrap: { backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  categoryRow: { paddingHorizontal: Spacing.base, flexDirection: 'row', gap: 6 },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  catPillActive: { backgroundColor: Colors.brand },
  catPillText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  catPillTextActive: { color: '#fff', fontWeight: '700' },
  body: { flex: 1 },
  bodyContent: { padding: Spacing.base, paddingBottom: 20 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 8 },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.sm,
  },
  alertCardUnread: { borderLeftWidth: 4, borderLeftColor: Colors.brand },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  typeBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  alertTime: { fontSize: 10, color: Colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  alertTitle: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  alertBody: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 4, lineHeight: 16 },
  triggerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  triggerText: { fontSize: 10, color: Colors.textMuted, fontStyle: 'italic' },
  takeoverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  aiStatusPill: { flexDirection: 'row', alignItems: 'center' },
  aiDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  aiStatusText: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
  takeoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  takeoverBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  footer: {
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#fff',
    gap: 8,
  },
  pushToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pushToggleLabel: { flex: 1, fontSize: Typography.xs, fontWeight: '600', color: Colors.textPrimary },
  markReadBtn: { alignItems: 'center', paddingVertical: 4 },
  markReadText: { fontSize: Typography.xs, fontWeight: '600', color: Colors.brand },
});
