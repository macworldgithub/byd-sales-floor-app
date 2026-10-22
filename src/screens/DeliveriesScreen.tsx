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

  const renderDelivery = ({ item: delivery }: { item: Delivery }) => {
    const stageColor = getStageColor(delivery.stage);
    const isReady = delivery.stage === 'Ready for Pickup';

    return (
      <View style={styles.deliveryCard}>
        {/* Header */}
        <View style={styles.deliveryCardHeader}>
          <View style={styles.deliveryAvatar}>
            <Text style={styles.deliveryAvatarText}>
              {delivery.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.deliveryName}>{delivery.name}</Text>
            <Text style={styles.deliveryVehicle} numberOfLines={1}>{delivery.vehicle}</Text>
          </View>
          <View style={[styles.stageBadge, { backgroundColor: stageColor.bg, borderColor: stageColor.border }]}>
            <Text style={[styles.stageBadgeText, { color: stageColor.text }]}>{delivery.stage}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.deliveryDetails}>
          <View style={styles.deliveryDetailRow}>
            <Text style={styles.deliveryDetailLabel}>📅 Date</Text>
            <Text style={styles.deliveryDetailValue}>{delivery.date || delivery.delivery_date || 'TBC'}</Text>
          </View>
          <View style={styles.deliveryDetailRow}>
            <Text style={styles.deliveryDetailLabel}>🚗 Rego</Text>
            <Text style={[styles.deliveryDetailValue, { fontFamily: 'monospace' }]}>{delivery.rego || 'Pending'}</Text>
          </View>
          <View style={styles.deliveryDetailRow}>
            <Text style={styles.deliveryDetailLabel}>🔍 VIN</Text>
            <Text style={[styles.deliveryDetailValue, { fontFamily: 'monospace' }]}>{delivery.vin || '—'}</Text>
          </View>
          <View style={styles.deliveryDetailRow}>
            <Text style={styles.deliveryDetailLabel}>👤 Agent</Text>
            <Text style={styles.deliveryDetailValue}>{delivery.agent || delivery.salesperson || '—'}</Text>
          </View>
          <View style={styles.deliveryDetailRow}>
            <Text style={styles.deliveryDetailLabel}>📞 Contact</Text>
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
            <Text style={styles.handoverBtnText}>✅ Complete Handover</Text>
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
          <Text style={styles.countBadgeText}>{deliveriesList.length} vehicles</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, rego, vehicle…"
            placeholderTextColor={Colors.textMuted}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Stage Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {STAGES.map(stage => (
          <TouchableOpacity
            key={stage}
            style={[styles.filterTab, selectedStage === stage && styles.filterTabActive]}
            onPress={() => setSelectedStage(stage)}
          >
            <Text style={[styles.filterTabText, selectedStage === stage && styles.filterTabTextActive]}>
              {stage}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
            <Text style={styles.emptyIcon}>🚗</Text>
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
    borderBottomColor: Colors.lightBorder,
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
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: Colors.lightBorder,
  },
  countBadgeText: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.semibold },

  searchRow: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBorder,
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
  searchIcon: { fontSize: Typography.base },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sm, padding: 0 },

  filterRow: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.lightBorder },
  filterContent: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.xs },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: '#f1f5f9',
  },
  filterTabActive: { backgroundColor: Colors.brand },
  filterTabText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textSecondary },
  filterTabTextActive: { color: '#fff' },

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
  deliveryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  deliveryAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#0f172a',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  deliveryAvatarText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.bold },
  deliveryName: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.bold },
  deliveryVehicle: { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 1 },
  stageBadge: {
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
  deliveryDetailLabel: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.medium },
  deliveryDetailValue: { color: Colors.textPrimary, fontSize: Typography.xs, fontWeight: Typography.semibold },
  contactBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  contactBadgeText: { fontSize: Typography.xs - 1, fontWeight: Typography.bold },

  handoverBtn: {
    marginTop: Spacing.md,
    backgroundColor: '#10b981',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
    shadowColor: '#10b981',
  },
  handoverBtnText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.bold },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.md },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.bold },
  emptySubtitle: { color: Colors.textMuted, fontSize: Typography.sm, marginTop: Spacing.xs },
});
