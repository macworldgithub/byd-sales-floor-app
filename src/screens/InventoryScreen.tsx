import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { InventoryVehicle, UserRole } from '../lib/types';
import { inventoryApi } from '../lib/api';

interface InventoryScreenProps {
  role: UserRole;
  onSelectVehicleForDeal?: (vehicle: InventoryVehicle) => void;
  onOpenBookDrive?: (model: string) => void;
}

const AGEING_BUCKETS = ['All', '0-30', '31-60', '90+'];
const STATUS_OPTIONS = ['All', 'In Stock', 'Deal Pending', 'In Transit'];

export default function InventoryScreen({
  role,
  onSelectVehicleForDeal,
  onOpenBookDrive,
}: InventoryScreenProps) {
  const [vehicles, setVehicles] = useState<InventoryVehicle[]>([]);
  const [selectedBucket, setSelectedBucket] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCostPrice, setShowCostPrice] = useState(role === 'manager' || role === 'principal' || role === 'super_admin');

  const isManagement = role === 'manager' || role === 'principal' || role === 'super_admin';

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const data = await inventoryApi.getInventory();
      setVehicles(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const filteredVehicles = vehicles.filter((v) => {
    const matchesBucket = selectedBucket === 'All' || v.ageingBucket === selectedBucket;
    const matchesStatus = selectedStatus === 'All' || v.status === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (v.model || '').toLowerCase().includes(q) ||
      (v.stockNumber || '').toLowerCase().includes(q) ||
      (v.vin || '').toLowerCase().includes(q) ||
      (v.rego && v.rego.toLowerCase().includes(q)) ||
      (v.variant || '').toLowerCase().includes(q);
    return matchesBucket && matchesStatus && matchesSearch;
  });

  const getAgeingTone = (days: number) => {
    if (days <= 30) return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0', label: 'Fresh Stock' };
    if (days <= 60) return { bg: '#fffbeb', text: '#92400e', border: '#fde68a', label: 'Medium Age' };
    return { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5', label: 'Ageing 90+ Priority' };
  };

  const getStatusTone = (status: InventoryVehicle['status']) => {
    switch (status) {
      case 'In Stock': return { bg: '#f0fdf4', text: '#166534', dot: '#10b981' };
      case 'Deal Pending': return { bg: '#eff6ff', text: '#1e40af', dot: '#3b82f6' };
      case 'In Transit': return { bg: '#f8fafc', text: '#475569', dot: '#94a3b8' };
      default: return { bg: '#f8fafc', text: '#475569', dot: '#64748b' };
    }
  };

  // Bucket count badges
  const count0_30 = vehicles.filter(v => v.ageingBucket === '0-30').length;
  const count31_60 = vehicles.filter(v => v.ageingBucket === '31-60').length;
  const count90Plus = vehicles.filter(v => v.ageingBucket === '90+').length;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>ERA LIVE FEED · STOCK MANAGEMENT</Text>
          <Text style={styles.headerTitle}>Floor Inventory</Text>
        </View>
        {isManagement && (
          <TouchableOpacity
            style={[styles.costToggleBtn, showCostPrice && styles.costToggleBtnActive]}
            onPress={() => setShowCostPrice(!showCostPrice)}
            activeOpacity={0.8}
          >
            <Ionicons name={showCostPrice ? 'eye' : 'eye-off'} size={14} color={showCostPrice ? '#fff' : Colors.textSecondary} />
            <Text style={[styles.costToggleText, showCostPrice && { color: '#fff' }]}>Cost & Margin</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search stock #, model, VIN or rego..."
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

      {/* Stock Ageing Buckets (Scope Part B §2) */}
      <View style={styles.filterWrap}>
        <Text style={styles.filterSectionTitle}>AGEING BUCKETS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[
            { id: 'All', label: `All Stock (${vehicles.length})` },
            { id: '0-30', label: `0–30 Days (${count0_30})` },
            { id: '31-60', label: `31–60 Days (${count31_60})` },
            { id: '90+', label: `90+ Days (${count90Plus})` },
          ].map(b => {
            const isActive = selectedBucket === b.id;
            return (
              <TouchableOpacity
                key={b.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedBucket(b.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {b.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Vehicle List */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.brand} />
          <Text style={styles.loadingText}>Syncing live inventory from ERA...</Text>
        </View>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
          {filteredVehicles.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="car-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No vehicles match this filter</Text>
              <Text style={styles.emptySub}>Try clearing filters or checking other stock buckets.</Text>
            </View>
          ) : (
            filteredVehicles.map((v) => {
              const ageTone = getAgeingTone(v.daysInStock || 0);
              const statusTone = getStatusTone(v.status || 'In Stock');
              const advertised = typeof v.advertisedPrice === 'number' ? v.advertisedPrice : 0;
              const cost = typeof v.costPrice === 'number' ? v.costPrice : 0;
              const margin = Math.max(0, advertised - cost);

              return (
                <View key={v.id} style={styles.vehicleCard}>
                  {/* Card Top Header */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.stockIdentity}>
                      <Text style={styles.stockNumber}>{v.stockNumber}</Text>
                      <Text style={styles.vehicleTitle}>{v.year} {v.make} {v.model}</Text>
                      <Text style={styles.vehicleVariant}>{v.variant} · {v.colour}</Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: statusTone.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusTone.dot }]} />
                      <Text style={[styles.statusText, { color: statusTone.text }]}>{v.status}</Text>
                    </View>
                  </View>

                  {/* Stock Ageing & Technical Specs */}
                  <View style={styles.metaRow}>
                    <View style={[styles.ageingPill, { backgroundColor: ageTone.bg, borderColor: ageTone.border }]}>
                      <Ionicons name="time-outline" size={12} color={ageTone.text} style={{ marginRight: 4 }} />
                      <Text style={[styles.ageingPillText, { color: ageTone.text }]}>
                        {v.daysInStock} Days in Stock ({ageTone.label})
                      </Text>
                    </View>

                    {v.rego && (
                      <View style={styles.regoPill}>
                        <Text style={styles.regoPillText}>Plate: {v.rego}</Text>
                      </View>
                    )}
                  </View>

                  {/* Specs */}
                  {v.specs && (
                    <View style={styles.specsRow}>
                      {v.specs.battery && (
                        <View style={styles.specChip}>
                          <Ionicons name="flash-outline" size={11} color={Colors.textMuted} />
                          <Text style={styles.specChipText}>{v.specs.battery}</Text>
                        </View>
                      )}
                      {v.specs.range && (
                        <View style={styles.specChip}>
                          <Ionicons name="navigate-outline" size={11} color={Colors.textMuted} />
                          <Text style={styles.specChipText}>{v.specs.range}</Text>
                        </View>
                      )}
                      {v.specs.drivetrain && (
                        <View style={styles.specChip}>
                          <Ionicons name="speedometer-outline" size={11} color={Colors.textMuted} />
                          <Text style={styles.specChipText}>{v.specs.drivetrain}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Pricing Row (Role-based Cost Visibility) */}
                  <View style={styles.priceContainer}>
                    <View>
                      <Text style={styles.priceLabel}>Advertised Drive-Away</Text>
                      <Text style={styles.priceValue}>${advertised.toLocaleString()}</Text>
                    </View>

                    {showCostPrice && isManagement && (
                      <View style={styles.costBox}>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.costLabel}>Dealer Cost</Text>
                          <Text style={styles.costValue}>${cost.toLocaleString()}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', marginLeft: 16 }}>
                          <Text style={styles.marginLabel}>Front Gross</Text>
                          <Text style={styles.marginValue}>+${margin.toLocaleString()}</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Footer Actions */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.bookDriveBtn}
                      onPress={() => onOpenBookDrive?.(`${v.model} (${v.variant})`)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="calendar-outline" size={14} color={Colors.brand} style={{ marginRight: 4 }} />
                      <Text style={styles.bookDriveBtnText}>Book Test Drive</Text>
                    </TouchableOpacity>

                    {v.status === 'In Stock' && (
                      <TouchableOpacity
                        style={styles.dealBtn}
                        onPress={() => onSelectVehicleForDeal?.(v)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="document-text-outline" size={14} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.dealBtnText}>Register Deal</Text>
                      </TouchableOpacity>
                    )}

                    {v.status === 'Deal Pending' && (
                      <View style={styles.dealBlockedBtn}>
                        <Ionicons name="lock-closed" size={13} color="#475569" style={{ marginRight: 4 }} />
                        <Text style={styles.dealBlockedText}>Sale Blocked (Deal Pending)</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.light },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerEyebrow: {
    fontSize: Typography.xxs,
    fontWeight: '700',
    color: Colors.brand,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  costToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  costToggleBtnActive: {
    backgroundColor: '#0f172a',
  },
  costToggleText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  searchWrap: {
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    padding: 0,
  },
  filterWrap: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterSectionTitle: {
    fontSize: Typography.xxs - 1,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.base,
    marginBottom: 6,
  },
  filterRow: {
    paddingHorizontal: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.brand,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  body: { flex: 1 },
  bodyContent: { padding: Spacing.base, paddingBottom: 40 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 12, fontSize: Typography.sm, color: Colors.textMuted },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    ...Shadows.sm,
  },
  emptyTitle: { fontSize: Typography.md, fontWeight: '700', color: Colors.textPrimary, marginTop: 12 },
  emptySub: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stockIdentity: { flex: 1 },
  stockNumber: {
    fontSize: Typography.xxs,
    fontWeight: '700',
    color: Colors.brand,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  vehicleTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  vehicleVariant: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusText: { fontSize: Typography.xxs, fontWeight: '700' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 8,
    flexWrap: 'wrap',
  },
  ageingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  ageingPillText: { fontSize: Typography.xxs, fontWeight: '600' },
  regoPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  regoPillText: {
    fontSize: Typography.xxs,
    color: Colors.textSecondary,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  specChipText: { fontSize: 10, color: Colors.textSecondary, fontWeight: '500' },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  priceLabel: { fontSize: Typography.xxs, color: Colors.textMuted, fontWeight: '600' },
  priceValue: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  costBox: { flexDirection: 'row', alignItems: 'center' },
  costLabel: { fontSize: Typography.xxs, color: Colors.textMuted },
  costValue: { fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary },
  marginLabel: { fontSize: Typography.xxs, color: '#166534' },
  marginValue: { fontSize: Typography.xs, fontWeight: '700', color: '#166534' },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
  },
  bookDriveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#fff',
  },
  bookDriveBtnText: { fontSize: Typography.xs, color: Colors.textPrimary, fontWeight: '600' },
  dealBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.brand,
    ...Shadows.sm,
  },
  dealBtnText: { fontSize: Typography.xs, color: '#fff', fontWeight: '700' },
  dealBlockedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: '#f1f5f9',
  },
  dealBlockedText: { fontSize: Typography.xs, color: '#475569', fontWeight: '600' },
});
