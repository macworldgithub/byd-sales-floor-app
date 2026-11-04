import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { Lead } from '../lib/types';
import { regoApi } from '../lib/api';

interface AddProspectModalProps {
  visible: boolean;
  onClose: () => void;
  onAddLead: (lead: Omit<Lead, 'id' | 'initials'>) => Promise<void>;
  existingLeads?: Lead[];
}

const STAGES = ['Imported', 'Engaged', 'Qualified', 'Committed'];
const SOURCES = ['Walk-in', 'Carsales', 'Web', 'Phone Inbound', 'Autogate', 'Referral'];
const MODELS = ['SEALION 7 Premium', 'SEAL Premium', 'ATTO 3 Extended', 'DOLPHIN Premium', 'SHARK 6'];

export default function AddProspectModal({ visible, onClose, onAddLead, existingLeads = [] }: AddProspectModalProps) {
  // Core Customer Details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [abn, setAbn] = useState('');
  const [showBusinessFields, setShowBusinessFields] = useState(false);
  const [companyContacts, setCompanyContacts] = useState<Array<{ name: string; role: string; phone: string; email: string }>>([]);
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('Fleet Manager');

  // Vehicle Interest
  const [model, setModel] = useState('SEALION 7 Premium');
  const [stage, setStage] = useState('Imported');
  const [source, setSource] = useState('Walk-in');
  const [score, setScore] = useState('75');
  const [notes, setNotes] = useState('');

  // Trade-in & Rego/VIN/PPSR
  const [hasTradeIn, setHasTradeIn] = useState(false);
  const [tradeInRego, setTradeInRego] = useState('');
  const [isLookingUpRego, setIsLookingUpRego] = useState(false);
  const [regoResult, setRegoResult] = useState<{
    rego: string;
    vin: string;
    make: string;
    model: string;
    year: number;
    ppsrStatus: 'Clear' | 'Encumbered' | 'Error';
    ppsrDetails?: any;
  } | null>(null);

  // Duplicate Detection
  const [duplicateMatch, setDuplicateMatch] = useState<Lead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkDuplicate = (enteredPhone: string, enteredEmail: string) => {
    const cleanPhone = enteredPhone.trim().replace(/\s+/g, '');
    const cleanEmail = enteredEmail.trim().toLowerCase();
    if (!cleanPhone && !cleanEmail) {
      setDuplicateMatch(null);
      return;
    }
    const match = existingLeads.find(l => {
      const matchP = cleanPhone && l.phone && l.phone.replace(/\s+/g, '').includes(cleanPhone);
      const matchE = cleanEmail && l.email && l.email.toLowerCase() === cleanEmail;
      return matchP || matchE;
    });
    setDuplicateMatch(match || null);
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    checkDuplicate(val, email);
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    checkDuplicate(phone, val);
  };

  const handleLookupRego = async () => {
    if (!tradeInRego.trim()) {
      Alert.alert('Required', 'Enter a registration plate to lookup (e.g. 1BX7QF or 1TZ4KM).');
      return;
    }
    setIsLookingUpRego(true);
    try {
      const res = await regoApi.lookupRego(tradeInRego);
      if (res.data) {
        setRegoResult({
          rego: res.data.rego,
          vin: res.data.vin,
          make: res.data.make,
          model: res.data.model,
          year: res.data.year,
          ppsrStatus: res.data.ppsrStatus || 'Clear',
          ppsrDetails: res.data.ppsrDetails,
        });
      }
    } catch (err: any) {
      Alert.alert('Lookup Notice', err.message || 'No direct plate match found in NEVDIS.');
    } finally {
      setIsLookingUpRego(false);
    }
  };

  const handleAddCompanyContact = () => {
    if (!contactName.trim()) return;
    setCompanyContacts(prev => [
      ...prev,
      { name: contactName.trim(), role: contactRole, phone: '', email: '' },
    ]);
    setContactName('');
  };

  const handleSubmit = async () => {
    // Phase 2 Rule: Business Name is optional; all other core fields are mandatory
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Validation Error', 'Mobile Phone is mandatory (primary unique identifier).');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Validation Error', 'Valid Work or Personal Email is mandatory.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddLead({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        businessName: businessName.trim() || undefined,
        abn: abn.trim() || undefined,
        companyContacts: companyContacts.length > 0 ? companyContacts : undefined,
        model: model || undefined,
        stage,
        source,
        score: parseInt(score) || 75,
        notes: notes.trim(),
        tradeInRego: regoResult?.rego || (tradeInRego.trim() ? tradeInRego.trim().toUpperCase() : undefined),
        tradeInVin: regoResult?.vin,
        tradeInModel: regoResult ? `${regoResult.year} ${regoResult.make} ${regoResult.model}` : undefined,
        ppsrStatus: regoResult?.ppsrStatus,
        lastTouch: 'Added manually · Just now',
        action: 'Make first touch',
      });

      // Reset
      setName(''); setPhone(''); setEmail(''); setBusinessName(''); setAbn('');
      setCompanyContacts([]); setTradeInRego(''); setRegoResult(null); setDuplicateMatch(null);
      setStage('Imported'); setSource('Walk-in'); setScore('75'); setNotes('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.root}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerEyebrow}>CUSTOMER & LEAD INGESTION</Text>
              <Text style={styles.headerTitle}>Add Prospect</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Duplicate Warning Banner */}
            {duplicateMatch && (
              <View style={styles.duplicateBanner}>
                <Ionicons name="alert-circle" size={20} color="#b45309" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.duplicateTitle}>Duplicate Contact Detected</Text>
                  <Text style={styles.duplicateDesc}>
                    {duplicateMatch.name} already exists in Melbourne CBD ({duplicateMatch.phone || duplicateMatch.email}). Silo duplicate protection will merge notes into existing record.
                  </Text>
                </View>
              </View>
            )}

            {/* Customer Details */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>PRIMARY CUSTOMER DETAILS</Text>
              <Text style={styles.mandatoryHint}>* Mandatory</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Marcus Vance"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.fieldDivider} />
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Mobile Phone (Primary Identifier) *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder="e.g. +61 412 890 234"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.fieldDivider} />
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email Address *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="e.g. m.vance@solardrive.com.au"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Business Entity (Scope Part B §1) */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>BUSINESS ENTITY (OPTIONAL)</Text>
              <TouchableOpacity
                onPress={() => setShowBusinessFields(!showBusinessFields)}
                style={styles.toggleBtn}
                activeOpacity={0.7}
              >
                <Ionicons name={showBusinessFields ? 'chevron-up' : 'business-outline'} size={14} color={Colors.brand} />
                <Text style={styles.toggleBtnText}>{showBusinessFields ? 'Hide' : '+ Add Business / Fleet'}</Text>
              </TouchableOpacity>
            </View>

            {showBusinessFields && (
              <View style={styles.card}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Company / Business Name</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="e.g. Solardrive Fleet Pty Ltd"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={styles.fieldDivider} />
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>ABN / ACN</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={abn}
                    onChangeText={setAbn}
                    placeholder="e.g. 51 824 753 109"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                  />
                </View>

                {/* Linked Contacts under Entity */}
                <View style={styles.linkedContactsHeader}>
                  <Text style={styles.subFieldLabel}>LINKED BUSINESS CONTACTS</Text>
                </View>

                {companyContacts.map((c, i) => (
                  <View key={i} style={styles.linkedContactRow}>
                    <Ionicons name="person-outline" size={14} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={styles.contactRowName}>{c.name}</Text>
                    <Text style={styles.contactRowRole}>({c.role})</Text>
                    <TouchableOpacity
                      onPress={() => setCompanyContacts(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ marginLeft: 'auto' }}
                    >
                      <Ionicons name="trash-outline" size={14} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={styles.addContactInputRow}>
                  <TextInput
                    style={[styles.fieldInput, { flex: 1 }]}
                    value={contactName}
                    onChangeText={setContactName}
                    placeholder="Contact name (e.g. David Liu)"
                    placeholderTextColor={Colors.textMuted}
                  />
                  <TouchableOpacity
                    style={styles.addContactPill}
                    onPress={handleAddCompanyContact}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={styles.addContactPillText}>Link Contact</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Vehicle of Interest */}
            <Text style={styles.sectionLabel}>VEHICLE INTEREST</Text>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Selected Model</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {MODELS.map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.pill, model === m && styles.pillActive]}
                    onPress={() => setModel(m)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillText, model === m && styles.pillTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Trade-in Rego → VIN & PPSR (Scope Part B §7) */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>TRADE-IN APPRAISAL & PPSR (OPTIONAL)</Text>
              <TouchableOpacity
                onPress={() => setHasTradeIn(!hasTradeIn)}
                style={styles.toggleBtn}
                activeOpacity={0.7}
              >
                <Ionicons name={hasTradeIn ? 'chevron-up' : 'car-sport-outline'} size={14} color={Colors.brand} />
                <Text style={styles.toggleBtnText}>{hasTradeIn ? 'Hide' : '+ Has Trade-In'}</Text>
              </TouchableOpacity>
            </View>

            {hasTradeIn && (
              <View style={styles.card}>
                <Text style={styles.fieldLabel}>Victorian / AU Registration Plate</Text>
                <View style={styles.regoLookupRow}>
                  <TextInput
                    style={[styles.fieldInput, styles.regoInput]}
                    value={tradeInRego}
                    onChangeText={setTradeInRego}
                    placeholder="e.g. 1BX7QF"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity
                    style={styles.lookupBtn}
                    onPress={handleLookupRego}
                    activeOpacity={0.85}
                    disabled={isLookingUpRego}
                  >
                    {isLookingUpRego ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="search" size={14} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.lookupBtnText}>Decode VIN</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {regoResult && (
                  <View style={styles.regoResultCard}>
                    <View style={styles.regoTopRow}>
                      <View>
                        <Text style={styles.regoVehicleTitle}>{regoResult.year} {regoResult.make} {regoResult.model}</Text>
                        <Text style={styles.regoVinText}>VIN: {regoResult.vin}</Text>
                      </View>
                      <View style={[
                        styles.ppsrBadge,
                        regoResult.ppsrStatus === 'Clear' ? styles.ppsrClear : styles.ppsrEncumbered,
                      ]}>
                        <Ionicons
                          name={regoResult.ppsrStatus === 'Clear' ? 'checkmark-circle' : 'alert-circle'}
                          size={12}
                          color={regoResult.ppsrStatus === 'Clear' ? '#166534' : '#991b1b'}
                          style={{ marginRight: 3 }}
                        />
                        <Text style={[
                          styles.ppsrBadgeText,
                          { color: regoResult.ppsrStatus === 'Clear' ? '#166534' : '#991b1b' },
                        ]}>
                          PPSR: {regoResult.ppsrStatus}
                        </Text>
                      </View>
                    </View>
                    {regoResult.ppsrDetails && (
                      <Text style={styles.ppsrDetailsText}>
                        Security Interest: {regoResult.ppsrDetails.financier} ({regoResult.ppsrDetails.encumbranceType})
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Pipeline Stage & Source */}
            <Text style={styles.sectionLabel}>INITIAL STATUS & QUALIFICATION</Text>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Pipeline Stage</Text>
              <View style={styles.chipRow}>
                {STAGES.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, stage === s && styles.chipActive]}
                    onPress={() => setStage(s)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, stage === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.fieldDivider} />
              <Text style={styles.fieldLabel}>Enquiry Channel</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {SOURCES.map(src => (
                  <TouchableOpacity
                    key={src}
                    style={[styles.pill, source === src && styles.pillActive]}
                    onPress={() => setSource(src)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillText, source === src && styles.pillTextActive]}>{src}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Notes */}
            <Text style={styles.sectionLabel}>FIRST TOUCH NOTES</Text>
            <View style={styles.card}>
              <TextInput
                style={[styles.fieldInput, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Specific customer requests, novated lease questions, delivery expectations..."
                placeholderTextColor={Colors.textMuted}
                multiline={true}
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Footer Submit */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="person-add" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>Create Prospect</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  headerEyebrow: {
    fontSize: Typography.xxs,
    fontWeight: Typography.bold,
    color: Colors.brand,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, padding: Spacing.base },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionLabel: {
    fontSize: Typography.xxs,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  mandatoryHint: {
    fontSize: Typography.xxs,
    color: Colors.brand,
    fontWeight: '600',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleBtnText: {
    fontSize: Typography.xs,
    color: Colors.brand,
    fontWeight: '600',
  },
  duplicateBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  duplicateTitle: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#b45309',
  },
  duplicateDesc: {
    fontSize: Typography.xs - 1,
    color: '#92400e',
    marginTop: 2,
    lineHeight: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  fieldGroup: { paddingVertical: 4 },
  fieldDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs },
  fieldLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  fieldInput: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  notesInput: { minHeight: 64, textAlignVertical: 'top' },
  pillRow: { gap: Spacing.xs, paddingVertical: 4 },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  pillActive: { backgroundColor: Colors.brand },
  pillText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.semibold },
  pillTextActive: { color: '#fff', fontWeight: Typography.bold },
  chipRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap', marginTop: 4 },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  chipActive: { backgroundColor: Colors.brand },
  chipText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.semibold },
  chipTextActive: { color: '#fff', fontWeight: Typography.bold },
  linkedContactsHeader: {
    marginTop: Spacing.md,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  subFieldLabel: {
    fontSize: Typography.xxs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  linkedContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: BorderRadius.sm,
    marginBottom: 6,
  },
  contactRowName: { fontSize: Typography.xs, fontWeight: '600', color: Colors.textPrimary },
  contactRowRole: { fontSize: Typography.xs, color: Colors.textMuted, marginLeft: 4 },
  addContactInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  addContactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  addContactPillText: { color: '#fff', fontSize: Typography.xs, fontWeight: '600', marginLeft: 4 },
  regoLookupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  regoInput: {
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
  regoResultCard: {
    marginTop: 10,
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  regoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  regoVehicleTitle: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  regoVinText: { fontSize: Typography.xxs, color: Colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 },
  ppsrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  ppsrClear: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  ppsrEncumbered: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5' },
  ppsrBadgeText: { fontSize: Typography.xxs, fontWeight: '700' },
  ppsrDetailsText: { fontSize: Typography.xxs, color: '#991b1b', marginTop: 4 },
  footer: {
    flexDirection: 'row',
    padding: Spacing.base,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: Typography.semibold, fontSize: Typography.sm },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  submitBtnText: { color: '#fff', fontWeight: Typography.bold, fontSize: Typography.sm },
});
