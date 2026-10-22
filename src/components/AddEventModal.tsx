import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { TimelineEvent } from '../lib/types';

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  onAddEvent: (evt: TimelineEvent) => void;
}

const CATEGORIES: { label: string; value: TimelineEvent['type'] }[] = [
  { label: 'Test Drive', value: 'drive' },
  { label: 'Handover / Delivery', value: 'delivery' },
  { label: 'Customer Follow-up', value: 'followup' },
  { label: 'Personal Hold / Duty', value: 'hold' },
];

export default function AddEventModal({
  visible,
  onClose,
  onAddEvent,
}: AddEventModalProps) {
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [type, setType] = useState<TimelineEvent['type']>('drive');
  const [time, setTime] = useState('11:00');
  const [end, setEnd] = useState('11:45');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAddEvent({
      title: title.trim(),
      detail: detail.trim() || 'Melbourne CBD Showroom Floor',
      type,
      time: time.trim() || '11:00',
      end: end.trim() || '11:45',
    });
    setTitle('');
    setDetail('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerEyebrow}>SHOWROOM TIMETABLE</Text>
              <Text style={styles.headerTitle}>Add Floor Event</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Event Title */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>EVENT TITLE</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. VIP Walk-in · Robert Kelly"
                placeholderTextColor={Colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Event Category */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>EVENT CATEGORY</Text>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = type === cat.value;
                  return (
                    <TouchableOpacity
                      key={cat.value}
                      style={[styles.categoryBtn, isSelected && styles.categoryBtnActive]}
                      onPress={() => setType(cat.value)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.categoryBtnText, isSelected && styles.categoryBtnTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Time Slot */}
            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>START TIME</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="11:00"
                  placeholderTextColor={Colors.textMuted}
                  value={time}
                  onChangeText={setTime}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>END TIME</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="11:45"
                  placeholderTextColor={Colors.textMuted}
                  value={end}
                  onChangeText={setEnd}
                />
              </View>
            </View>

            {/* Details */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>VEHICLE & LOCATION DETAILS</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. SEALION 7 · Demo Loop A · Staged Bay 1"
                placeholderTextColor={Colors.textMuted}
                value={detail}
                onChangeText={setDetail}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitBtn, !title.trim() && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={!title.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>Schedule Event →</Text>
            </TouchableOpacity>
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
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.brand,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  closeBtnText: {
    fontSize: 18,
    color: Colors.textMuted,
  },

  body: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  fieldWrap: {
    gap: Spacing.xs,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },

  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  categoryBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.md,
  },
  categoryBtnActive: {
    backgroundColor: Colors.dark,
  },
  categoryBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  categoryBtnTextActive: {
    color: '#fff',
  },

  timeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timeInput: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },

  footer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
  },
  submitBtn: {
    backgroundColor: Colors.brand,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
});
