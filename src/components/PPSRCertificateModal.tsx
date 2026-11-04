import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';

export interface PPSRCertificateData {
  searchCertificateNumber: string;
  searchNumber: string;
  searchDateAEST: string;
  searchType: string;
  requestedBy: string;
  status: 'Clear' | 'Encumbered' | 'Error';
  summary: {
    hasEncumbrance: boolean;
    securityInterestCount: number;
    isStolen: boolean;
    isWrittenOff: boolean;
    nevdisMatched: boolean;
  };
  vehicleDetails: {
    vin: string;
    rego: string;
    make: string;
    model: string;
    year: number;
    bodyType: string;
    engineNumber?: string;
    complianceDate?: string;
  };
  securityInterests?: Array<{
    registrationNumber: string;
    securedParty: string;
    securedPartyId?: string;
    collateralType: string;
    registrationStartTime?: string;
    registrationEndTime?: string;
  }>;
}

interface PPSRCertificateModalProps {
  visible: boolean;
  certificate: PPSRCertificateData | null;
  onClose: () => void;
  onAttachToDeal?: (certificate: PPSRCertificateData) => void;
}

export default function PPSRCertificateModal({
  visible,
  certificate,
  onClose,
  onAttachToDeal,
}: PPSRCertificateModalProps) {
  if (!visible || !certificate) return null;

  const isClear = certificate.status === 'Clear';

  const handleShare = async () => {
    try {
      await Share.share({
        title: `PPSR Search Certificate #${certificate.searchCertificateNumber}`,
        message: `Official Australian PPSR Certificate\nCertificate No: ${certificate.searchCertificateNumber}\nVIN: ${certificate.vehicleDetails.vin}\nPlate: ${certificate.vehicleDetails.rego}\nStatus: ${certificate.status.toUpperCase()}\nSecurity Interests: ${certificate.summary.securityInterestCount}\nSearched: ${certificate.searchDateAEST}`,
      });
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.govBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#0284c7" />
                <Text style={styles.govBadgeText}>AFSA · AUSTRALIAN PPSR REGISTER</Text>
              </View>
              <Text style={styles.title}>Search Certificate</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {/* Status Hero Card */}
            <View style={[styles.statusHero, isClear ? styles.statusHeroClear : styles.statusHeroEncumbered]}>
              <View style={styles.statusHeroRow}>
                <View style={[styles.statusIconWrap, isClear ? styles.statusIconClear : styles.statusIconEncumbered]}>
                  <Ionicons
                    name={isClear ? 'checkmark-circle' : 'alert-circle'}
                    size={28}
                    color={isClear ? '#16a34a' : '#dc2626'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusHeroLabel, isClear ? { color: '#166534' } : { color: '#991b1b' }]}>
                    {isClear ? 'PPSR TITLE CLEAR' : 'ENCUMBRANCE RECORDED'}
                  </Text>
                  <Text style={styles.statusHeroSub}>
                    {isClear
                      ? 'No security interests registered against this vehicle VIN.'
                      : 'Active financier interest identified. Payout letter required before trade settlement.'}
                  </Text>
                </View>
              </View>

              <View style={styles.certMetaRow}>
                <View style={styles.certMetaItem}>
                  <Text style={styles.certMetaKey}>Certificate No.</Text>
                  <Text style={styles.certMetaVal}>{certificate.searchCertificateNumber}</Text>
                </View>
                <View style={styles.certMetaItem}>
                  <Text style={styles.certMetaKey}>Search Time</Text>
                  <Text style={styles.certMetaVal}>{certificate.searchDateAEST || 'Today AEST'}</Text>
                </View>
              </View>
            </View>

            {/* Vehicle Identification (NEVDIS Matched) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="car-sport-outline" size={16} color={Colors.brand} />
                <Text style={styles.sectionTitle}>NEVDIS Government Vehicle Specs</Text>
              </View>
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Registration Plate</Text>
                  <Text style={styles.gridValue}>{certificate.vehicleDetails.rego}</Text>
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Year / Make / Model</Text>
                  <Text style={styles.gridValue}>
                    {certificate.vehicleDetails.year} {certificate.vehicleDetails.make} {certificate.vehicleDetails.model}
                  </Text>
                </View>
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridColFull}>
                  <Text style={styles.gridLabel}>Vehicle Identification Number (VIN)</Text>
                  <Text style={[styles.gridValue, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 13 }]}>
                    {certificate.vehicleDetails.vin}
                  </Text>
                </View>
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Body Type</Text>
                  <Text style={styles.gridValue}>{certificate.vehicleDetails.bodyType || 'SUV / Passenger'}</Text>
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Engine Number</Text>
                  <Text style={styles.gridValue}>{certificate.vehicleDetails.engineNumber || 'MATCHED'}</Text>
                </View>
              </View>
            </View>

            {/* Register Checks Breakdown */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="shield-outline" size={16} color="#0284c7" />
                <Text style={styles.sectionTitle}>National Register Checks</Text>
              </View>

              <View style={styles.checkItem}>
                <View style={styles.checkIconOk}>
                  <Ionicons name="checkmark" size={14} color="#16a34a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkTitle}>Stolen Vehicle Register</Text>
                  <Text style={styles.checkSub}>Not recorded as stolen on national police registers.</Text>
                </View>
                <Text style={styles.checkBadgeClear}>CLEAR</Text>
              </View>

              <View style={styles.checkItem}>
                <View style={styles.checkIconOk}>
                  <Ionicons name="checkmark" size={14} color="#16a34a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkTitle}>Written-Off Vehicle Register (WOVR)</Text>
                  <Text style={styles.checkSub}>No statutory or economic write-off records found.</Text>
                </View>
                <Text style={styles.checkBadgeClear}>CLEAR</Text>
              </View>

              <View style={[styles.checkItem, { borderBottomWidth: 0 }]}>
                <View style={isClear ? styles.checkIconOk : styles.checkIconWarn}>
                  <Ionicons name={isClear ? 'checkmark' : 'close'} size={14} color={isClear ? '#16a34a' : '#dc2626'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkTitle}>Security Interests (PPSR)</Text>
                  <Text style={styles.checkSub}>
                    {isClear ? '0 security interests registered.' : '1 active security interest recorded.'}
                  </Text>
                </View>
                <Text style={isClear ? styles.checkBadgeClear : styles.checkBadgeEnc}>
                  {isClear ? 'CLEAR' : 'MONEY OWING'}
                </Text>
              </View>
            </View>

            {/* Security Interests List (if encumbered) */}
            {!isClear && certificate.securityInterests && certificate.securityInterests.length > 0 && (
              <View style={[styles.sectionCard, { borderColor: '#fca5a5', backgroundColor: '#fff5f5' }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="cash-outline" size={16} color="#dc2626" />
                  <Text style={[styles.sectionTitle, { color: '#991b1b' }]}>Registered Security Interests</Text>
                </View>
                {certificate.securityInterests.map((si, idx) => (
                  <View key={idx} style={styles.siBox}>
                    <Text style={styles.siParty}>{si.securedParty}</Text>
                    <Text style={styles.siReg}>Reg #: {si.registrationNumber}</Text>
                    <Text style={styles.siType}>Collateral: {si.collateralType}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Legal Notice */}
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>
                Issued under Section 174 of the Personal Property Securities Act 2009. Valid for settlement and Virtual Yard DMS synchronization.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
              <Ionicons name="share-outline" size={16} color="#0f172a" style={{ marginRight: 6 }} />
              <Text style={styles.shareBtnText}>Share / Export</Text>
            </TouchableOpacity>

            {onAttachToDeal && (
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={() => {
                  onAttachToDeal(certificate);
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="document-attach" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.attachBtnText}>Attach to Deal</Text>
              </TouchableOpacity>
            )}
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
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: '80%',
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flex: 1,
  },
  govBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  govBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369a1',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: Spacing.lg,
  },
  statusHero: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  statusHeroClear: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  statusHeroEncumbered: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  statusHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  statusIconClear: {
    backgroundColor: '#dcfce7',
  },
  statusIconEncumbered: {
    backgroundColor: '#fee2e2',
  },
  statusHeroLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusHeroSub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  certMetaRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  certMetaItem: {
    flex: 1,
  },
  certMetaKey: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  certMetaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 1,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 6,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  gridCol: {
    flex: 1,
  },
  gridColFull: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  checkIconOk: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkIconWarn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  checkSub: {
    fontSize: 11,
    color: '#64748b',
  },
  checkBadgeClear: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  checkBadgeEnc: {
    fontSize: 10,
    fontWeight: '800',
    color: '#991b1b',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  siBox: {
    backgroundColor: '#ffffff',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginTop: 4,
  },
  siParty: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991b1b',
  },
  siReg: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  siType: {
    fontSize: 11,
    color: '#64748b',
  },
  noticeBox: {
    backgroundColor: '#f8fafc',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: Spacing.xs,
  },
  noticeText: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 14,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    gap: Spacing.sm,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: '#f1f5f9',
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  attachBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.brand,
  },
  attachBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
