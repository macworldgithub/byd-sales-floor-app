import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { Delivery } from '../lib/types';
import { deliveryApi } from '../lib/api';

interface DeliveriesScreenProps {
  deliveries: Delivery[];
  onCompleteHandover?: (delivery: Delivery) => void;
}

const STAGES = ['All', 'Ready for Pickup', 'PDI', 'In Transit', 'Scheduled', 'Delivered'];

const getStageColor = (stage?: string) => {
  switch (stage) {
    case 'Ready for Pickup': return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' };
    case 'PDI': return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' };
    case 'In Transit': return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
    case 'Delivered': return { bg: '#f0fdf4', text: '#14532d', border: '#86efac' };
    case 'Scheduled': return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };
    default: return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };
  }
};

const getStageIcon = (stage?: string) => {
  switch (stage) {
    case 'Ready for Pickup': return 'checkmark-circle-outline';
    case 'PDI': return 'construct-outline';
    case 'In Transit': return 'car-outline';
    case 'Delivered': return 'ribbon-outline';
    case 'Scheduled': return 'calendar-outline';
    default: return 'ellipse-outline';
  }
};

const AVATAR_COLORS = ['#6366f1', '#0f172a', '#10b981', Colors.brand, '#f59e0b', '#8b5cf6'];

export default function DeliveriesScreen({ deliveries, onCompleteHandover }: DeliveriesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('All');
  const [deliveriesList, setDeliveriesList] = useState<Delivery[]>(deliveries);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDeliveries = useCallback(async (stage: string, query: string) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (stage !== 'All') params.stage = stage;
      if (query.trim()) params.q = query.trim();
      const res = await deliveryApi.getClients(params);
      if (res.success && res.data && res.data.length > 0) {
        setDeliveriesList(res.data);
      } else {
        let filtered = deliveries;
        if (stage !== 'All') filtered = filtered.filter(d => (d.stage || '').toLowerCase() === stage.toLowerCase());
        if (query.trim()) {
          const q = query.toLowerCase();
          filtered = filtered.filter(d =>
            d.name?.toLowerCase().includes(q) ||
            d.rego?.toLowerCase().includes(q) ||
            d.vehicle?.toLowerCase().includes(q)
          );
        }
        setDeliveriesList(filtered);
      }
    } catch {
      let filtered = deliveries;
      if (stage !== 'All') filtered = filtered.filter(d => (d.stage || '').toLowerCase() === stage.toLowerCase());
      setDeliveriesList(filtered);
    } finally {
      setIsLoading(false);
    }
  }, [deliveries]);

  useEffect(() => {
    const t = setTimeout(() => fetchDeliveries(selectedStage, searchQuery), 300);
    return () => clearTimeout(t);
  }, [selectedStage, searchQuery, fetchDeliveries]);

  const handleHandover = (delivery: Delivery) => {
    Alert.alert(
      'Complete Handover',
      `Mark ${delivery.name}'s ${delivery.vehicle} as delivered?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Handover',
          style: 'default',
          onPress: () => onCompleteHandover?.(delivery),
        },
      ]
    );
  };

  const renderDelivery = ({ item: delivery, index }: { item: Delivery; index: number }) => {
    const stageColor = getStageColor(delivery.stage);
    const stageIcon = getStageIcon(delivery.stage);
    const isReady = delivery.stage === 'Ready for Pickup';
    const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
    const initials = delivery.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
      <View style={[styles.deliveryCard, isReady && styles.deliveryCardReady]}>
        {/* Header */}
        <View style={styles.deliveryCardHeader}>
          <View style={[styles.deliveryAvatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.deliveryAvatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.deliveryName}>{delivery.name}</Text>
            <Text style={styles.deliveryVehicle} numberOfLines={1}>{delivery.vehicle}</Text>
          </View>
          <View style={[styles.stageBadge, { backgroundColor: stageColor.bg, borderColor: stageColor.border }]}>
            <Ionicons name={stageIcon as any} size={11} color={stageColor.text} style={{ marginRight: 3 }} />
            <Text style={[styles.stageBadgeText, { color: stageColor.text }]}>{delivery.stage}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.deliveryDetails}>
          {[
            { icon: 'calendar-outline', label: 'Date', value: delivery.date || delivery.delivery_date || 'TBC' },
            { icon: 'card-outline', label: 'Rego', value: delivery.rego || 'Pending', mono: true },
            { icon: 'barcode-outline', label: 'VIN', value: delivery.vin || '—', mono: true },
            { icon: 'person-outline', label: 'Agent', value: delivery.agent || delivery.salesperson || '—' },
          ].map((row) => (
            <View key={row.label} style={styles.deliveryDetailRow}>
              <View style={styles.deliveryDetailLeft}>
                <Ionicons name={row.icon as any} size={13} color={Colors.textMuted} />
                <Text style={styles.deliveryDetailLabel}>{row.label}</Text>
              </View>
              <Text style={[styles.deliveryDetailValue, row.mono && { fontFamily: 'monospace' }]}>
                {row.value}
              </Text>
            </View>
          ))}
          <View style={styles.deliveryDetailRow}>
            <View style={styles.deliveryDetailLeft}>
              <Ionicons name="call-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.deliveryDetailLabel}>Contact</Text>
            </View>
            <View style={[styles.contactBadge, { backgroundColor: delivery.status === 'Contacted' ? '#f0fdf4' : '#fef2f2' }]}>
              <Text style={[styles.contactBadgeText, { color: delivery.status === 'Contacted' ? '#166534' : '#991b1b' }]}>
                {delivery.status || delivery.contact_status || 'Not contacted'}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        {isReady && (
          <TouchableOpacity
            style={styles.handoverBtn}
            onPress={() => handleHandover(delivery)}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.handoverBtnText}>Complete Handover</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Delivery Centre</Text>
          <Text style={styles.headerTitle}>DELIVERIES</Text>
        </View>
        <View style={styles.countBadge}>
          <Ionicons name="cube-outline" size={13} color={Colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={styles.countBadgeText}>{deliveriesList.length} vehicles</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, rego, vehicle…"
            placeholderTextColor={Colors.textMuted}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stage Filters */}
      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {STAGES.map(stage => {
            const isActive = selectedStage === stage;
            return (
              <TouchableOpacity
                key={stage}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setSelectedStage(stage)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {stage}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.brand} />
        </View>
      )}

      <FlatList
        data={deliveriesList}
        keyExtractor={(item) => String(item._id || item.id)}
        renderItem={renderDelivery}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="car-outline" size={36} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No deliveries found</Text>
            <Text style={styles.emptySubtitle}>Check back when handovers are scheduled.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.light },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerEyebrow: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
    letterSpacing: -0.5,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  countBadgeText: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.semibold },

  searchRow: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sm, padding: 0 },

  filterWrap: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
  },
  filterContent: {
    paddingHorizontal: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: Colors.brand,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  loadingRow: { padding: Spacing.sm, alignItems: 'center' },

  listContent: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing.xl },

  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  deliveryCardReady: {
    borderColor: '#bbf7d0',
    borderLeftWidth: 3,
  },
  deliveryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  deliveryAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  deliveryAvatarText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.bold },
  deliveryName: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.bold },
  deliveryVehicle: { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 1 },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  stageBadgeText: { fontSize: Typography.xs - 1, fontWeight: Typography.semibold },

  deliveryDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: Spacing.md,
    gap: Spacing.xs + 2,
  },
  deliveryDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deliveryDetailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  deliveryDetailLabel: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.medium },
  deliveryDetailValue: { color: Colors.textPrimary, fontSize: Typography.xs, fontWeight: Typography.semibold },
  contactBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  contactBadgeText: { fontSize: Typography.xs - 1, fontWeight: Typography.bold },

  handoverBtn: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    ...Shadows.sm,
    shadowColor: '#10b981',
  },
  handoverBtnText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.bold },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#f8fafc',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.bold },
  emptySubtitle: { color: Colors.textMuted, fontSize: Typography.sm, marginTop: Spacing.xs },
});
