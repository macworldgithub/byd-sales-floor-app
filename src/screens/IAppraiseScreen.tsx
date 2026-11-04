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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { IAppraiseRecord, Lead } from '../lib/types';
import { regoApi, appraisalApi } from '../lib/api';
import PPSRCertificateModal, { PPSRCertificateData } from '../components/PPSRCertificateModal';
import LicenceScannerModal, { ScannedLicenceData } from '../components/LicenceScannerModal';

interface IAppraiseScreenProps {
  lead?: Lead | null;
  onAppraisalCompleted?: (record: IAppraiseRecord) => void;
  onNavigateBack?: () => void;
}

const DEFAULT_ANGLES = [
  { angle: 'front_left', label: 'Front 3/4 Driver', captured: true },
  { angle: 'driver_side', label: 'Driver Profile', captured: false },
  { angle: 'rear', label: 'Rear & Tailgate', captured: false },
  { angle: 'passenger_side', label: 'Passenger Profile', captured: false },
  { angle: 'interior', label: 'Cabin & Steering', captured: false },
  { angle: 'odometer', label: 'Odometer Display', captured: true },
];

export default function IAppraiseScreen({
  lead,
  onAppraisalCompleted,
  onNavigateBack,
}: IAppraiseScreenProps) {
  // Vehicle Identity
  const [rego, setRego] = useState(lead?.tradeInRego || '1BX7QF');
  const [vin, setVin] = useState(lead?.tradeInVin || 'JM0KF4W7A00239102');
  const [make, setMake] = useState('Mazda');
  const [model, setModel] = useState('CX-5 Maxx Sport');
  const [year, setYear] = useState('2020');
  const [odometer, setOdometer] = useState('48,200');
  const [customerName, setCustomerName] = useState(lead?.name || 'Sarah Mitchell');
  const [isLookingUp, setIsLookingUp] = useState(false);

  // PPSR Status
  const [ppsrStatus, setPpsrStatus] = useState<'Clear' | 'Encumbered' | 'Error'>('Clear');
  const [ppsrFinancier, setPpsrFinancier] = useState<string | null>(null);
  const [ppsrCertVisible, setPpsrCertVisible] = useState(false);
  const [ppsrCertData, setPpsrCertData] = useState<PPSRCertificateData | null>(null);
  const [isLoadingPpsrCert, setIsLoadingPpsrCert] = useState(false);
  const [licenceScannerVisible, setLicenceScannerVisible] = useState(false);

  // Photo Inspection Checkpoints
  const [photos, setPhotos] = useState(DEFAULT_ANGLES);

  // Damage Tagger
  const [damages, setDamages] = useState<Array<{
    id: string;
    location: string;
    type: string;
    severity: 'Minor' | 'Moderate' | 'Severe';
    notes?: string;
  }>>([
    { id: 'dmg-1', location: 'Passenger Front Door', type: 'Stone Chip', severity: 'Minor', notes: 'Paint touch-up required' },
  ]);
  const [newDamageLocation, setNewDamageLocation] = useState('Rear Bumper Lip');
  const [newDamageType, setNewDamageType] = useState('Scuff');
  const [newDamageSeverity, setNewDamageSeverity] = useState<'Minor' | 'Moderate' | 'Severe'>('Minor');

  // Valuation & Loan Car
  const [appraisedValue, setAppraisedValue] = useState('24,500');
  const [loanCarSigned, setLoanCarSigned] = useState(false);
  const [loanCarRego, setLoanCarRego] = useState('1BY-DEMO2');
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [signerName, setSignerName] = useState(lead?.name || 'Sarah Mitchell');
  const [hasAgreedTerms, setHasAgreedTerms] = useState(false);

  // Rego Lookup
  const handleLookupRego = async () => {
    if (!rego.trim()) return;
    setIsLookingUp(true);
    try {
      const res = await regoApi.lookupRego(rego);
      if (res.data) {
        setVin(res.data.vin);
        setMake(res.data.make);
        setModel(res.data.model);
        setYear(String(res.data.year));
        setPpsrStatus(res.data.ppsrStatus);
        if (res.data.ppsrDetails?.financier) {
          setPpsrFinancier(res.data.ppsrDetails.financier);
        } else {
          setPpsrFinancier(null);
        }
      }
    } catch {
      Alert.alert('Notice', 'No registration record found for plate.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleOpenPpsrCert = async () => {
    setIsLoadingPpsrCert(true);
    try {
      const cert = await regoApi.orderPpsrCertificate({
        vin,
        rego,
        make,
        model,
        year: parseInt(year) || 2020,
        searcherName: 'BYD Sales Floor Team',
        financier: ppsrFinancier || undefined,
        encumbered: ppsrStatus === 'Encumbered',
      });
      setPpsrCertData(cert);
      setPpsrCertVisible(true);
    } catch {
      Alert.alert('PPSR Error', 'Unable to retrieve official PPSR certificate.');
    } finally {
      setIsLoadingPpsrCert(false);
    }
  };

  const handleTogglePhoto = (index: number) => {
    setPhotos(prev => prev.map((p, idx) => idx === index ? { ...p, captured: !p.captured } : p));
  };

  const handleAddDamage = () => {
    setDamages(prev => [
      ...prev,
      {
        id: `dmg-${Date.now()}`,
        location: newDamageLocation,
        type: newDamageType,
        severity: newDamageSeverity,
      },
    ]);
  };

  const handleSignLoanCar = () => {
    if (!hasAgreedTerms) {
      Alert.alert('Terms Required', 'Please confirm customer agrees to loan car insurance conditions.');
      return;
    }
    setLoanCarSigned(true);
    setShowLoanModal(false);
  };

  const handleCompleteAppraisal = async () => {
    const record: IAppraiseRecord = {
      id: `APP-${Date.now().toString().slice(-4)}`,
      leadId: lead?._id || String(lead?.id || '1'),
      customerName,
      rego: rego.toUpperCase(),
      vin,
      make,
      model,
      year: parseInt(year) || 2021,
      odometer: parseInt(odometer.replace(/,/g, '')) || 45000,
      transmission: 'Automatic',
      ppsrStatus,
      photos,
      damages,
      appraisedValue: parseInt(appraisedValue.replace(/,/g, '')) || 24000,
      status: 'Completed',
      loanCarSigned,
      loanCarRego: loanCarSigned ? loanCarRego : undefined,
      createdAt: 'Just now',
    };

    await appraisalApi.createAppraisal(record);
    onAppraisalCompleted?.(record);
    Alert.alert('Appraisal Saved', 'Inspection record and PPSR status successfully attached to customer profile and deal timeline.');
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>AI-ASSISTED VEHICLE INSPECTION</Text>
          <Text style={styles.headerTitle}>I-Appraise Studio</Text>
        </View>
        {onNavigateBack && (
          <TouchableOpacity onPress={onNavigateBack} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {/* Customer & Trade-in Identity */}
        <Text style={styles.sectionTitle}>1. VEHICLE IDENTIFICATION & PPSR</Text>
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.fieldLabel}>Customer</Text>
            <TouchableOpacity
              style={styles.scanLicenceMiniBtn}
              onPress={() => setLicenceScannerVisible(true)}
            >
              <Ionicons name="camera-outline" size={12} color={Colors.brand} />
              <Text style={styles.scanLicenceMiniText}>Scan Licence</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.fieldInput}
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Customer name"
            placeholderTextColor={Colors.textMuted}
          />
          <View style={styles.fieldDivider} />

          <Text style={styles.fieldLabel}>Registration Plate</Text>
          <View style={styles.regoRow}>
            <TextInput
              style={[styles.fieldInput, styles.regoPlate]}
              value={rego}
              onChangeText={setRego}
              placeholder="e.g. 1BX7QF"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.lookupBtn} onPress={handleLookupRego} activeOpacity={0.85} disabled={isLookingUp}>
              <Ionicons name="search" size={14} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.lookupBtnText}>{isLookingUp ? 'Searching…' : 'Decode'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.vehicleDecodedRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.decodedTitle}>{year} {make} {model}</Text>
              <Text style={styles.decodedVin}>VIN: {vin}</Text>
            </View>
            <TouchableOpacity
              style={[styles.ppsrPill, ppsrStatus === 'Clear' ? styles.ppsrClear : styles.ppsrEncumbered]}
              onPress={handleOpenPpsrCert}
              disabled={isLoadingPpsrCert}
            >
              <Ionicons
                name={ppsrStatus === 'Clear' ? 'shield-checkmark' : 'alert-circle'}
                size={13}
                color={ppsrStatus === 'Clear' ? '#166534' : '#991b1b'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.ppsrPillText, { color: ppsrStatus === 'Clear' ? '#166534' : '#991b1b' }]}>
                {isLoadingPpsrCert ? 'Fetching...' : `PPSR: ${ppsrStatus}`}
              </Text>
              <Ionicons name="document-text-outline" size={12} color={ppsrStatus === 'Clear' ? '#166534' : '#991b1b'} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {ppsrFinancier && (
            <View style={styles.financierNotice}>
              <Ionicons name="information-circle" size={14} color="#991b1b" style={{ marginRight: 4 }} />
              <Text style={styles.financierText}>Security Interest: {ppsrFinancier}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.viewOfficialCertRow} onPress={handleOpenPpsrCert}>
            <Ionicons name="shield-checkmark-outline" size={14} color={Colors.brand} />
            <Text style={styles.viewOfficialCertText}>View Official AFSA PPSR Certificate (B2G NEVDIS)</Text>
            <Ionicons name="chevron-forward" size={12} color={Colors.brand} />
          </TouchableOpacity>

          <View style={styles.fieldDivider} />
          <Text style={styles.fieldLabel}>Current Odometer (km)</Text>
          <TextInput
            style={styles.fieldInput}
            value={odometer}
            onChangeText={setOdometer}
            placeholder="e.g. 48,200"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
          />
        </View>

        {/* 360 Guided Walk-around Photo Capture */}
        <Text style={styles.sectionTitle}>2. 360° GUIDED WALK-AROUND PHOTOS ({photos.filter(p => p.captured).length}/6)</Text>
        <View style={styles.card}>
          <Text style={styles.helperText}>Tap checkpoint to capture or simulate photo upload:</Text>
          <View style={styles.photoGrid}>
            {photos.map((p, idx) => (
              <TouchableOpacity
                key={p.angle}
                style={[styles.photoCard, p.captured && styles.photoCardCaptured]}
                onPress={() => handleTogglePhoto(idx)}
                activeOpacity={0.8}
              >
                <View style={[styles.photoIconCircle, p.captured && styles.photoIconCircleCaptured]}>
                  <Ionicons
                    name={p.captured ? 'checkmark' : 'camera-outline'}
                    size={16}
                    color={p.captured ? '#fff' : Colors.textMuted}
                  />
                </View>
                <Text style={styles.photoLabel}>{p.label}</Text>
                <Text style={styles.photoStatus}>{p.captured ? 'Verified Photo' : 'Required'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* AI Damage Detection & Override */}
        <Text style={styles.sectionTitle}>3. AI DAMAGE DETECTION & LOG ({damages.length})</Text>
        <View style={styles.card}>
          {damages.map((dmg) => (
            <View key={dmg.id} style={styles.damageRow}>
              <View style={styles.damageBadge}>
                <Ionicons name="warning-outline" size={13} color="#b45309" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.damageLocation}>{dmg.location} · <Text style={{ fontWeight: '400' }}>{dmg.type}</Text></Text>
                {dmg.notes && <Text style={styles.damageNotes}>{dmg.notes}</Text>}
              </View>
              <View style={[styles.severityPill, dmg.severity === 'Severe' && { backgroundColor: '#fee2e2' }]}>
                <Text style={styles.severityText}>{dmg.severity}</Text>
              </View>
            </View>
          ))}

          {/* Add Damage Tool */}
          <View style={styles.addDamageBox}>
            <Text style={styles.subFieldLabel}>Add Observed Damage (AI Override)</Text>
            <View style={styles.damageInputRow}>
              <TextInput
                style={[styles.fieldInput, { flex: 1, backgroundColor: '#fff', paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.border }]}
                value={newDamageLocation}
                onChangeText={setNewDamageLocation}
                placeholder="Location (e.g. Tailgate Scuff)"
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity style={styles.addDmgBtn} onPress={handleAddDamage} activeOpacity={0.8}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.addDmgBtnText}>Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Loan Car Agreement with Digital Signing */}
        <Text style={styles.sectionTitle}>4. LOAN CAR AGREEMENT (SIGN ON DEVICE)</Text>
        <View style={styles.card}>
          <View style={styles.loanStatusRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.loanTitle}>Loan Vehicle: {loanCarRego}</Text>
              <Text style={styles.loanSubtitle}>
                {loanCarSigned ? 'Signed & Executed on Device' : 'Customer inspection loan agreement required'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.signLoanBtn, loanCarSigned && styles.signLoanBtnSigned]}
              onPress={() => setShowLoanModal(true)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={loanCarSigned ? 'checkmark-circle' : 'create-outline'}
                size={14}
                color={loanCarSigned ? '#166534' : '#fff'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.signLoanText, loanCarSigned && { color: '#166534' }]}>
                {loanCarSigned ? 'Signed' : 'Sign on Device'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Final Valuation */}
        <Text style={styles.sectionTitle}>5. FINAL APPRAISED WHOLESALE VALUE</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Agreed Trade-in Allowance ($AUD)</Text>
          <View style={styles.valuationRow}>
            <Text style={styles.dollarSymbol}>$</Text>
            <TextInput
              style={styles.valuationInput}
              value={appraisedValue}
              onChangeText={setAppraisedValue}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Complete Appraisal Button */}
        <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteAppraisal} activeOpacity={0.85}>
          <Ionicons name="checkmark-done" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.completeBtnText}>Submit Appraisal to Deal Record</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Loan Car Signature Modal */}
      <Modal visible={showLoanModal} animationType="slide" transparent={true} onRequestClose={() => setShowLoanModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>CUSTOMER LOAN VEHICLE AGREEMENT</Text>
                <Text style={styles.modalTitle}>Sign on Device</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLoanModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: Spacing.base }}>
              <Text style={styles.legalNotice}>
                I, <Text style={{ fontWeight: '700' }}>{signerName}</Text>, acknowledge receipt of BYD Loan Car <Text style={{ fontWeight: '700' }}>{loanCarRego}</Text>. I agree to maintain comprehensive cover, not exceed standard urban demonstration bounds, return vehicle with matching battery charge, and assume liability for traffic infringements during the loan period.
              </Text>

              <TouchableOpacity
                style={styles.agreeCheckRow}
                onPress={() => setHasAgreedTerms(!hasAgreedTerms)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, hasAgreedTerms && styles.checkboxActive]}>
                  {hasAgreedTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.agreeCheckText}>I confirm the customer has reviewed terms and signed below.</Text>
              </TouchableOpacity>

              {/* Digital Signature Simulation Box */}
              <View style={styles.signatureCanvas}>
                <Ionicons name="pencil" size={16} color={Colors.textMuted} style={{ position: 'absolute', top: 12, left: 12 }} />
                <Text style={styles.signatureScript}>{hasAgreedTerms ? signerName : 'Customer sign here with stylus or finger...'}</Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>AUTHORIZED CUSTOMER DIGITAL SIGNATURE</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleSignLoanCar} activeOpacity={0.85}>
                <Ionicons name="checkmark" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.modalConfirmText}>Accept & Attach Signature</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <PPSRCertificateModal
        visible={ppsrCertVisible}
        certificate={ppsrCertData}
        onClose={() => setPpsrCertVisible(false)}
      />

      <LicenceScannerModal
        visible={licenceScannerVisible}
        onClose={() => setLicenceScannerVisible(false)}
        onLicenceScanned={(data) => {
          if (data.fullName) {
            setCustomerName(data.fullName);
            setSignerName(data.fullName);
          }
        }}
      />
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
  regoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  regoPlate: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  lookupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  lookupBtnText: { color: '#fff', fontSize: Typography.xs, fontWeight: '700' },
  vehicleDecodedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: BorderRadius.md,
  },
  decodedTitle: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  decodedVin: { fontSize: 10, color: Colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 },
  ppsrPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  ppsrClear: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  ppsrEncumbered: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5' },
  ppsrPillText: { fontSize: 11, fontWeight: '700' },
  financierNotice: { flexDirection: 'row', alignItems: 'center', marginTop: 6, paddingHorizontal: 4 },
  financierText: { fontSize: 11, color: '#991b1b', fontWeight: '600' },
  scanLicenceMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  scanLicenceMiniText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.brand,
  },
  viewOfficialCertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  viewOfficialCertText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brand,
    marginHorizontal: 6,
  },
  helperText: { fontSize: Typography.xs, color: Colors.textMuted, marginBottom: 12 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCardCaptured: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  photoIconCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  photoIconCircleCaptured: { backgroundColor: '#10b981' },
  photoLabel: { fontSize: 11, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  photoStatus: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  damageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 8,
  },
  damageBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' },
  damageLocation: { fontSize: Typography.xs, fontWeight: '600', color: Colors.textPrimary },
  damageNotes: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  severityPill: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  severityText: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
  addDamageBox: { marginTop: 12, backgroundColor: '#f8fafc', padding: 10, borderRadius: BorderRadius.md },
  subFieldLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  damageInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addDmgBtn: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  addDmgBtnText: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  loanStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loanTitle: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  loanSubtitle: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  signLoanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  signLoanBtnSigned: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#86efac' },
  signLoanText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  valuationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dollarSymbol: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  valuationInput: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    ...Shadows.md,
  },
  completeBtnText: { color: '#fff', fontSize: Typography.base, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalEyebrow: { fontSize: 10, fontWeight: '700', color: Colors.brand, letterSpacing: 0.8 },
  modalTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  legalNotice: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginBottom: 16 },
  agreeCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  agreeCheckText: { fontSize: 12, color: Colors.textPrimary, fontWeight: '500', flex: 1 },
  signatureCanvas: {
    height: 120,
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  signatureScript: { fontSize: 20, fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif', color: '#1e293b' },
  signatureLine: { width: '80%', height: 1, backgroundColor: Colors.border, marginTop: 12 },
  signatureLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '700', letterSpacing: 0.8, marginTop: 4 },
  modalFooter: { padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border },
  modalConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
  },
  modalConfirmText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
