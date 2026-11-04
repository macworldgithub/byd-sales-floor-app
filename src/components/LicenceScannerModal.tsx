import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';

export interface ScannedLicenceData {
  fullName: string;
  licenceNumber: string;
  state: string;
  dateOfBirth: string;
  expiryDate: string;
  cardNo?: string;
  address: string;
  classType: string;
  verified: boolean;
}

interface LicenceScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onLicenceScanned: (data: ScannedLicenceData) => void;
  initialState?: string;
}

const PRESET_SAMPLE_LICENCES: ScannedLicenceData[] = [
  {
    fullName: 'Lachlan Peter Vance',
    licenceNumber: '08492019',
    state: 'VIC',
    dateOfBirth: '14/08/1988',
    expiryDate: '14/08/2028',
    cardNo: '994821',
    address: '42 Maroondah Hwy, Ringwood VIC 3134',
    classType: 'CAR (C)',
    verified: true,
  },
  {
    fullName: 'Sarah Elizabeth Chen',
    licenceNumber: '29810482',
    state: 'NSW',
    dateOfBirth: '22/11/1992',
    expiryDate: '22/11/2027',
    cardNo: '883921',
    address: '15 Oxford St, Paddington NSW 2021',
    classType: 'CAR (C)',
    verified: true,
  },
  {
    fullName: 'David James Miller',
    licenceNumber: '91823719',
    state: 'QLD',
    dateOfBirth: '05/03/1981',
    expiryDate: '05/03/2029',
    cardNo: '772109',
    address: '77 Eagle St, Brisbane City QLD 4000',
    classType: 'CAR (C)',
    verified: true,
  },
];

export default function LicenceScannerModal({
  visible,
  onClose,
  onLicenceScanned,
  initialState = 'VIC',
}: LicenceScannerModalProps) {
  const [scanState, setScanState] = useState<'viewfinder' | 'processing' | 'review'>('viewfinder');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);

  // Form review state
  const [fullName, setFullName] = useState('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [state, setState] = useState(initialState);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cardNo, setCardNo] = useState('');
  const [address, setAddress] = useState('');
  const [classType, setClassType] = useState('CAR (C)');

  // Laser animation line
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setScanState('viewfinder');
      const preset = PRESET_SAMPLE_LICENCES[0];
      setFullName(preset.fullName);
      setLicenceNumber(preset.licenceNumber);
      setState(preset.state);
      setDateOfBirth(preset.dateOfBirth);
      setExpiryDate(preset.expiryDate);
      setCardNo(preset.cardNo || '');
      setAddress(preset.address);
      setClassType(preset.classType);

      // Start laser scan animation
      scanLineAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const handleTriggerScan = (presetIndex?: number) => {
    const idx = presetIndex !== undefined ? presetIndex : selectedPresetIndex;
    const preset = PRESET_SAMPLE_LICENCES[idx % PRESET_SAMPLE_LICENCES.length];

    setScanState('processing');

    setTimeout(() => {
      setFullName(preset.fullName);
      setLicenceNumber(preset.licenceNumber);
      setState(preset.state);
      setDateOfBirth(preset.dateOfBirth);
      setExpiryDate(preset.expiryDate);
      setCardNo(preset.cardNo || '');
      setAddress(preset.address);
      setClassType(preset.classType);
      setScanState('review');
    }, 1100);
  };

  const handleConfirm = () => {
    if (!licenceNumber.trim() || !fullName.trim()) {
      Alert.alert('Validation Error', 'Licence number and full name are required.');
      return;
    }

    onLicenceScanned({
      fullName: fullName.trim(),
      licenceNumber: licenceNumber.trim(),
      state,
      dateOfBirth: dateOfBirth.trim(),
      expiryDate: expiryDate.trim(),
      cardNo: cardNo.trim(),
      address: address.trim(),
      classType,
      verified: true,
    });
    onClose();
  };

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 180],
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Driver Licence OCR Scanner</Text>
            <Text style={styles.headerSubtitle}>Australian Government NEVDIS Formats</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
            <Text style={styles.headerBadgeText}>NEVDIS OK</Text>
          </View>
        </View>

        {scanState === 'viewfinder' && (
          <View style={styles.viewfinderContainer}>
            <View style={styles.cameraDarkMask}>
              <Text style={styles.cameraInstructions}>
                Position Australian Driver's Licence within the frame
              </Text>

              {/* Viewfinder Card */}
              <View style={styles.viewfinderCard}>
                <View style={[styles.cornerMarker, styles.cornerTL]} />
                <View style={[styles.cornerMarker, styles.cornerTR]} />
                <View style={[styles.cornerMarker, styles.cornerBL]} />
                <View style={[styles.cornerMarker, styles.cornerBR]} />

                {/* Animated Scan Line */}
                <Animated.View
                  style={[styles.scanLine, { transform: [{ translateY }] }]}
                />

                <View style={styles.cardSilhouette}>
                  <View style={styles.cardHeaderRow}>
                    <Ionicons name="card-outline" size={20} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.cardStateLabel}>VICTORIA · DRIVER LICENCE</Text>
                  </View>
                  <View style={styles.cardAvatarPlaceholder} />
                  <View style={styles.cardLinesPlaceholder}>
                    <View style={styles.cardLineWide} />
                    <View style={styles.cardLineMed} />
                    <View style={styles.cardLineNarrow} />
                  </View>
                </View>
              </View>

              {/* State presets quick selector */}
              <View style={styles.presetSection}>
                <Text style={styles.presetHeaderTitle}>Simulate Optical Hardware Capture:</Text>
                <View style={styles.presetButtonsRow}>
                  {PRESET_SAMPLE_LICENCES.map((sample, idx) => (
                    <TouchableOpacity
                      key={sample.state}
                      style={[
                        styles.presetChip,
                        selectedPresetIndex === idx && styles.presetChipActive,
                      ]}
                      onPress={() => {
                        setSelectedPresetIndex(idx);
                        handleTriggerScan(idx);
                      }}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          selectedPresetIndex === idx && styles.presetChipTextActive,
                        ]}
                      >
                        {sample.state} · {sample.fullName.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.viewfinderActions}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={() => handleTriggerScan(selectedPresetIndex)}
                  activeOpacity={0.8}
                >
                  <View style={styles.captureInnerCircle}>
                    <Ionicons name="camera" size={28} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.captureTip}>Tap to capture & run OCR parser</Text>
              </View>
            </View>
          </View>
        )}

        {scanState === 'processing' && (
          <View style={styles.processingContainer}>
            <View style={styles.processingCard}>
              <Ionicons name="scan-circle-outline" size={64} color={Colors.primary} />
              <Text style={styles.processingTitle}>Analyzing Licence Card...</Text>
              <Text style={styles.processingSubtitle}>
                Running optical character recognition & NEVDIS checksum verification
              </Text>
              <View style={styles.processingProgressBar}>
                <View style={styles.processingProgressFill} />
              </View>
            </View>
          </View>
        )}

        {scanState === 'review' && (
          <ScrollView style={styles.reviewScrollView} contentContainerStyle={styles.reviewContent}>
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.successBannerTitle}>Licence OCR Extracted Successfully</Text>
                <Text style={styles.successBannerSubtitle}>
                  Verified against Australian jurisdictional schema ({state})
                </Text>
              </View>
            </View>

            {/* Editable Fields */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>FULL NAME (AS ON LICENCE)</Text>
              <TextInput
                style={styles.fieldInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Full Name"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            <View style={styles.twoColumnRow}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>LICENCE NUMBER</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={licenceNumber}
                  onChangeText={setLicenceNumber}
                  placeholder="e.g. 08492019"
                  placeholderTextColor={Colors.textTertiary}
                  autoCapitalize="characters"
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 0.6 }]}>
                <Text style={styles.fieldLabel}>STATE</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={state}
                  onChangeText={setState}
                  placeholder="VIC"
                  placeholderTextColor={Colors.textTertiary}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.twoColumnRow}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>DATE OF BIRTH</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>EXPIRY DATE</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            </View>

            <View style={styles.twoColumnRow}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>CARD NUMBER (SECURITY)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={cardNo}
                  onChangeText={setCardNo}
                  placeholder="Card Number"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>CLASS</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={classType}
                  onChangeText={setClassType}
                  placeholder="CAR (C)"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>RESIDENTIAL ADDRESS</Text>
              <TextInput
                style={[styles.fieldInput, { height: 60 }]}
                value={address}
                onChangeText={setAddress}
                placeholder="Residential Address"
                placeholderTextColor={Colors.textTertiary}
                multiline
              />
            </View>

            {/* Bottom Actions */}
            <View style={styles.reviewActions}>
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => setScanState('viewfinder')}
              >
                <Ionicons name="refresh" size={18} color={Colors.textPrimary} />
                <Text style={styles.retakeBtnText}>Scan Again</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>Attach to Test Drive</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: 54,
    paddingBottom: Spacing.md,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  closeBtn: {
    padding: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#334155',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  headerTitle: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    ...Typography.caption,
    color: '#94A3B8',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  headerBadgeText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '700',
  },
  viewfinderContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraDarkMask: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  cameraInstructions: {
    ...Typography.bodyMedium,
    color: '#E2E8F0',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  viewfinderCard: {
    width: 320,
    height: 200,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Colors.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 0,
    height: 3,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  cardSilhouette: {
    width: '85%',
    height: '75%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardStateLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
  },
  cardAvatarPlaceholder: {
    width: 44,
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    position: 'absolute',
    bottom: 12,
    left: 10,
  },
  cardLinesPlaceholder: {
    position: 'absolute',
    bottom: 16,
    left: 64,
    right: 10,
    gap: 6,
  },
  cardLineWide: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    width: '90%',
  },
  cardLineMed: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4,
    width: '70%',
  },
  cardLineNarrow: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4,
    width: '45%',
  },
  presetSection: {
    width: '100%',
    alignItems: 'center',
  },
  presetHeaderTitle: {
    ...Typography.caption,
    color: '#94A3B8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetChipActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0, 102, 204, 0.25)',
  },
  presetChipText: {
    ...Typography.caption,
    color: '#94A3B8',
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: '#38BDF8',
  },
  viewfinderActions: {
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  captureInnerCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureTip: {
    ...Typography.caption,
    color: '#94A3B8',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  processingCard: {
    backgroundColor: '#1E293B',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#334155',
  },
  processingTitle: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: Spacing.md,
  },
  processingSubtitle: {
    ...Typography.bodySmall,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: Spacing.lg,
  },
  processingProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },
  processingProgressFill: {
    width: '70%',
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  reviewScrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  reviewContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  successBannerTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.success,
  },
  successBannerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  fieldInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  twoColumnRow: {
    flexDirection: 'row',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.lg,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  retakeBtnText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  confirmBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  confirmBtnText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
