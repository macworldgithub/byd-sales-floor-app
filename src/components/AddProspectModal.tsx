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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { Lead } from '../lib/types';

interface AddProspectModalProps {
  visible: boolean;
  onClose: () => void;
  onAddLead: (lead: Omit<Lead, 'id' | 'initials'>) => Promise<void>;
}

const STAGES = ['Imported', 'Engaged', 'Qualified', 'Committed'];
const SOURCES = ['Walk-in', 'Carsales', 'Web', 'Phone Inbound', 'Autogate', 'Referral'];
const MODELS = ['SEALION 7 Premium', 'SEAL Premium', 'ATTO 3 Extended', 'DOLPHIN Premium', 'SHARK 6'];

export default function AddProspectModal({ visible, onClose, onAddLead }: AddProspectModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [model, setModel] = useState('');
  const [stage, setStage] = useState('Imported');
  const [source, setSource] = useState('Walk-in');
  const [score, setScore] = useState('50');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a customer name.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onAddLead({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        model: model || undefined,
        stage,
        source,
        score: parseInt(score) || 50,
        notes: notes.trim(),
        lastTouch: 'Added manually · Just now',
        action: 'Make first touch',
      });
      // Reset
      setName(''); setPhone(''); setEmail(''); setModel('');
      setStage('Imported'); setSource('Walk-in'); setScore('50'); setNotes('');
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
              <Text style={styles.headerEyebrow}>Lead Centre</Text>
              <Text style={styles.headerTitle}>Add Prospect</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Customer Info */}
            <Text style={styles.sectionLabel}>CUSTOMER DETAILS</Text>
            <View style={styles.card}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Sarah Mitchell"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={styles.fieldDivider} />
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+61 412 000 000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.fieldDivider} />
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="customer@example.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Vehicle */}
            <Text style={styles.sectionLabel}>VEHICLE INTEREST</Text>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Model</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
                {MODELS.map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.pill, model === m && styles.pillActive]}
                    onPress={() => setModel(m)}
                  >
                    <Text style={[styles.pillText, model === m && styles.pillTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.fieldDivider} />
              <Text style={styles.fieldLabel}>Intent Score: {score}/100</Text>
              <View style={styles.scoreRow}>
                {['20', '40', '50', '60', '75', '85', '95'].map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.scoreChip, score === s && styles.scoreChipActive]}
                    onPress={() => setScore(s)}
                  >
                    <Text style={[styles.scoreChipText, score === s && styles.scoreChipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Lead Info */}
            <Text style={styles.sectionLabel}>LEAD CLASSIFICATION</Text>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Pipeline Stage</Text>
              <View style={styles.pillRow}>
                {STAGES.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.pill, stage === s && styles.pillActive]}
                    onPress={() => setStage(s)}
                  >
                    <Text style={[styles.pillText, stage === s && styles.pillTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.fieldDivider} />
              <Text style={styles.fieldLabel}>Lead Source</Text>
              <View style={styles.pillRow}>
                {SOURCES.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.pill, source === s && styles.pillActive]}
                    onPress={() => setSource(s)}
                  >
                    <Text style={[styles.pillText, source === s && styles.pillTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <Text style={styles.sectionLabel}>INTERNAL NOTES</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add context, trade-in details, special requirements…"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {!isSubmitting && <Ionicons name="person-add-outline" size={15} color="#fff" style={{ marginRight: 6 }} />}<Text style={styles.submitBtnText}>{isSubmitting ? 'Adding…' : 'Add to Pipeline'}</Text>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBorder,
  },
  headerEyebrow: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 0.8, textTransform: 'uppercase' },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: Typography.extrabold },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: {},  // deprecated - using Ionicons directly

  body: { flex: 1, padding: Spacing.base },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs - 1,
    fontWeight: Typography.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  fieldGroup: { paddingVertical: Spacing.xs },
  fieldDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: Spacing.xs },
  fieldLabel: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: Typography.semibold, marginBottom: Spacing.xs },
  fieldInput: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    padding: 0,
    paddingVertical: Spacing.xs,
  },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  pillText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textSecondary },
  pillTextActive: { color: '#fff' },

  scoreRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.xs, flexWrap: 'wrap' },
  scoreChip: {
    width: 40, height: 36, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
  },
  scoreChipActive: { backgroundColor: Colors.brand, borderColor: Colors.brand },
  scoreChipText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textSecondary },
  scoreChipTextActive: { color: '#fff' },

  notesInput: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    minHeight: 100,
    textAlignVertical: 'top',
  },

  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.base,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.lightBorder,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.lightBorder,
  },
  cancelBtnText: { color: Colors.textSecondary, fontSize: Typography.base, fontWeight: Typography.semibold },
  submitBtn: {
    flex: 2,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.brand,
    ...Shadows.brand,
  },
  submitBtnText: { color: '#fff', fontSize: Typography.base, fontWeight: Typography.bold },
});
