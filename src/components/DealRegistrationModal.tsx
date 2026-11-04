import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { DealRecord, InventoryVehicle, Lead } from '../lib/types';
import { dealApi, inventoryApi } from '../lib/api';

interface DealRegistrationModalProps {
  visible: boolean;
  onClose: () => void;
  lead?: Lead | null;
  selectedVehicle?: InventoryVehicle | null;
  onDealRegistered: (deal: DealRecord) => void;
}

export default function DealRegistrationModal({
  visible,
  onClose,
  lead,
  selectedVehicle,
  onDealRegistered,
}: DealRegistrationModalProps) {
  const [customerName, setCustomerName] = useState(lead?.name || 'Marcus Vance');
  const [vehicleName, setVehicleName] = useState(
    selectedVehicle ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model} ${selectedVehicle.variant}` : '2026 BYD SEALION 7 Premium AWD'
  );
  const [vin, setVin] = useState(selectedVehicle?.vin || 'LC0CE4CC3R0018921');
  const [salePrice, setSalePrice] = useState(selectedVehicle ? String(selectedVehicle.advertisedPrice) : '65990');
  const [tradeInValue, setTradeInValue] = useState(lead?.tradeInModel ? '24500' : '0');
  const [financeType, setFinanceType] = useState<'Cash' | 'Financed' | 'Novated Lease'>('Novated Lease');
  const [dmsDestination, setDmsDestination] = useState<'virtualyard' | 'erapower'>('virtualyard');
  const [franchise, setFranchise] = useState<'BYD' | 'Kia' | 'Chery' | 'Lepas'>('BYD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pushedSuccess, setPushedSuccess] = useState<string | null>(null);

  const parsedSalePrice = parseInt(salePrice) || 0;
  const parsedTradeIn = parseInt(tradeInValue) || 0;
  const netPayable = parsedSalePrice - parsedTradeIn;

  const handleRegisterDeal = async () => {
    if (!customerName.trim()) {
      Alert.alert('Required', 'Please enter customer name.');
      return;
    }
    setIsSubmitting(true);
    try {
      const statusLabel = dmsDestination === 'erapower' ? 'Pushed to eraPower' : 'Pushed to Virtual Yard';
      const deal: DealRecord = {
        id: `DEAL-${Date.now().toString().slice(-4)}`,
        leadId: lead?._id || String(lead?.id || '1'),
        customerName: customerName.trim(),
        vehicleName,
        vin,
        rego: selectedVehicle?.rego,
        salePrice: parsedSalePrice,
        tradeInValue: parsedTradeIn > 0 ? parsedTradeIn : undefined,
        tradeInPpsr: lead?.ppsrStatus === 'Encumbered' ? 'Encumbered' : 'Clear',
        financeType,
        status: statusLabel,
        consultant: lead?.consultant || 'Alex Morgan',
        createdAt: 'Today',
      };

      if (selectedVehicle) {
        await inventoryApi.markDealPending(selectedVehicle.id, deal.id);
      }

      await dealApi.createDeal(deal);

      if (dmsDestination === 'erapower') {
        await dealApi.pushToEraPower(deal.id);
        setPushedSuccess(`Pushed to eraPower (${franchise})!`);
      } else {
        await dealApi.pushToVirtualYard(deal.id);
        setPushedSuccess('Pushed to Virtual Yard!');
      }

      setTimeout(() => {
        onDealRegistered(deal);
        onClose();
        setPushedSuccess(null);
      }, 1200);
    } catch {
      Alert.alert('Error', 'Unable to register deal in DMS.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>DMS INTEGRATION · VIRTUAL YARD & ERA</Text>
            <Text style={styles.headerTitle}>Register New Deal</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
          {/* Customer */}
          <Text style={styles.sectionTitle}>1. CUSTOMER ENTITY</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Customer Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="e.g. Sarah Mitchell"
            />
            {lead?.businessName && (
              <View style={styles.businessTag}>
                <Ionicons name="business" size={12} color="#475569" style={{ marginRight: 4 }} />
                <Text style={styles.businessTagText}>Entity: {lead.businessName}</Text>
              </View>
            )}
          </View>

          {/* Contracted Vehicle */}
          <Text style={styles.sectionTitle}>2. CONTRACTED VEHICLE & STOCK BLOCK</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Vehicle Model & Spec</Text>
            <TextInput
              style={styles.fieldInput}
              value={vehicleName}
              onChangeText={setVehicleName}
            />
            <View style={styles.fieldDivider} />
            <Text style={styles.fieldLabel}>VIN (Blocks Vehicle in Inventory)</Text>
            <TextInput
              style={[styles.fieldInput, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}
              value={vin}
              onChangeText={setVin}
            />
            <View style={styles.stockBlockNotice}>
              <Ionicons name="lock-closed" size={13} color="#1d4ed8" style={{ marginRight: 6 }} />
              <Text style={styles.stockBlockText}>
                Registering this deal automatically switches vehicle status to 'Deal Pending' across all dealership consoles.
              </Text>
            </View>
          </View>

          {/* DMS Routing & Multi-Franchise Target */}
          <Text style={styles.sectionTitle}>3. DMS DESTINATION & MULTI-FRANCHISE</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Target DMS Pipeline</Text>
            <View style={styles.dmsSegmentRow}>
              <TouchableOpacity
                style={[styles.dmsSegmentBtn, dmsDestination === 'virtualyard' && styles.dmsSegmentBtnActive]}
                onPress={() => setDmsDestination('virtualyard')}
              >
                <Ionicons
                  name="cube-outline"
                  size={14}
                  color={dmsDestination === 'virtualyard' ? '#ffffff' : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.dmsSegmentText,
                    dmsDestination === 'virtualyard' && styles.dmsSegmentTextActive,
                  ]}
                >
                  Virtual Yard (BYD)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dmsSegmentBtn, dmsDestination === 'erapower' && styles.dmsSegmentBtnActive]}
                onPress={() => setDmsDestination('erapower')}
              >
                <Ionicons
                  name="git-branch-outline"
                  size={14}
                  color={dmsDestination === 'erapower' ? '#ffffff' : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.dmsSegmentText,
                    dmsDestination === 'erapower' && styles.dmsSegmentTextActive,
                  ]}
                >
                  eraPower DMS
                </Text>
              </TouchableOpacity>
            </View>

            {dmsDestination === 'erapower' && (
              <View style={styles.franchiseRow}>
                <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Multi-Franchise Selection</Text>
                <View style={styles.franchiseChips}>
                  {(['BYD', 'Kia', 'Chery', 'Lepas'] as const).map((brand) => (
                    <TouchableOpacity
                      key={brand}
                      style={[
                        styles.brandChip,
                        franchise === brand && styles.brandChipActive,
                      ]}
                      onPress={() => setFranchise(brand)}
                    >
                      <Text
                        style={[
                          styles.brandChipText,
                          franchise === brand && styles.brandChipTextActive,
                        ]}
                      >
                        {brand}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.eraPowerBadge}>
                  <Ionicons name="checkmark-done" size={13} color="#0284c7" />
                  <Text style={styles.eraPowerBadgeText}>
                    eraPower REST Gateway: PO & Delivery Sync active for {franchise}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Trade-In & PPSR */}
          <Text style={styles.sectionTitle}>4. TRADE-IN DEDUCTION & PPSR</Text>
          <View style={styles.card}>
            <View style={styles.tradeInRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Trade-in Value ($AUD)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={tradeInValue}
                  onChangeText={setTradeInValue}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              {lead?.ppsrStatus && (
                <View style={[styles.ppsrPill, lead.ppsrStatus === 'Clear' ? styles.ppsrClear : styles.ppsrEncumbered]}>
                  <Text style={[styles.ppsrText, { color: lead.ppsrStatus === 'Clear' ? '#166534' : '#991b1b' }]}>
                    PPSR: {lead.ppsrStatus}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Financials & Settlement */}
          <Text style={styles.sectionTitle}>5. FINANCIAL SUMMARY & METHOD</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Finance Type</Text>
            <View style={styles.financeTypeRow}>
              {(['Cash', 'Financed', 'Novated Lease'] as const).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.financePill, financeType === type && styles.financePillActive]}
                  onPress={() => setFinanceType(type)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.financePillText, financeType === type && styles.financePillTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.fieldDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceRowLabel}>Agreed Sale Price:</Text>
              <Text style={styles.priceRowVal}>${(parsedSalePrice || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceRowLabel}>Less Trade-in Allowance:</Text>
              <Text style={[styles.priceRowVal, { color: '#166534' }]}>-${(parsedTradeIn || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Balance Payable:</Text>
              <Text style={styles.totalVal}>${(netPayable || 0).toLocaleString()}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer Action */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { opacity: 0.8 }]}
            onPress={handleRegisterDeal}
            activeOpacity={0.85}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : pushedSuccess ? (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>{pushedSuccess}</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>
                  {dmsDestination === 'erapower' ? `Register & Push to eraPower (${franchise})` : 'Register Deal & Push to Virtual Yard'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
  headerEyebrow: { fontSize: Typography.xxs, fontWeight: '700', color: Colors.brand, letterSpacing: 0.8 },
  headerTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  body: { flex: 1 },
  bodyContent: { padding: Spacing.base, paddingBottom: 40 },
  sectionTitle: {
    fontSize: Typography.xxs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  fieldLabel: { fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  fieldInput: { fontSize: Typography.sm, color: Colors.textPrimary, paddingVertical: 4 },
  fieldDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  businessTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  businessTagText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  stockBlockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: BorderRadius.sm,
    padding: 8,
    marginTop: 8,
  },
  stockBlockText: { fontSize: 11, color: '#1e40af', flex: 1, lineHeight: 15 },
  tradeInRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ppsrPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  ppsrClear: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  ppsrEncumbered: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5' },
  ppsrText: { fontSize: 11, fontWeight: '700' },
  financeTypeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  financePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  financePillActive: { backgroundColor: Colors.brand },
  financePillText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  financePillTextActive: { color: '#fff', fontWeight: '700' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  priceRowLabel: { fontSize: Typography.xs, color: Colors.textSecondary },
  priceRowVal: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  totalLabel: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  totalVal: { fontSize: Typography.lg, fontWeight: '800', color: Colors.brand },
  footer: { padding: Spacing.base, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.border },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  submitBtnText: { color: '#fff', fontSize: Typography.sm, fontWeight: '700' },
  dmsSegmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  dmsSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dmsSegmentBtnActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  dmsSegmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dmsSegmentTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  franchiseRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  franchiseChips: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  brandChip: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: BorderRadius.sm,
  },
  brandChipActive: {
    borderColor: Colors.brand,
    backgroundColor: '#eff6ff',
  },
  brandChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  brandChipTextActive: {
    color: Colors.brand,
    fontWeight: '700',
  },
  eraPowerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    marginTop: 8,
  },
  eraPowerBadgeText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    color: '#0284c7',
  },
});
