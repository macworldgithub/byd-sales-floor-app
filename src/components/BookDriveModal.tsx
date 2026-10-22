import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { Lead } from '../lib/types';
import { appointmentApi } from '../lib/api';

interface BookDriveModalProps {
  visible: boolean;
  onClose: () => void;
  lead?: Lead | null;
  onConfirmBooking: (data: {
    customerName: string;
    model: string;
    loop: string;
    time: string;
    date: string;
  }) => void;
}

const VEHICLE_OPTIONS = [
  'SEALION 7 Premium · Car 03',
  'SEALION 7 AWD · Car 01',
  'SEAL Premium · Car 02',
  'SEAL Performance · Car 05',
  'ATTO 3 Extended · Car 04',
  'DOLPHIN Premium · Car 06',
  'SHARK 6 PHEV · Car 07',
];

const TIME_SLOTS = ['09:00', '10:00', '11:30', '13:15', '14:30', '15:45', '17:00'];
const DURATION_OPTIONS = ['30 min', '45 min', '60 min'];
const LOCATION_OPTIONS = [
  'Demo loop A (Highway & CBD)',
  'Demo loop B (Urban Dynamic)',
  'Demo loop C (Suburban Scenic)',
];

export default function BookDriveModal({
  visible,
  onClose,
  lead,
  onConfirmBooking,
}: BookDriveModalProps) {
  const [customerName, setCustomerName] = useState(lead?.name ?? '');
  const [vehicle, setVehicle] = useState('SEALION 7 Premium · Car 03');
  const [selectedSlot, setSelectedSlot] = useState('13:15');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState('45 min');
  const [location, setLocation] = useState('Demo loop B (Urban Dynamic)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (lead?.name) setCustomerName(lead.name);
    if (lead?.model) {
      const match = VEHICLE_OPTIONS.find(v => v.toLowerCase().includes((lead.model ?? '').toLowerCase()));
      if (match) setVehicle(match);
    }
  }, [lead]);

  const handleConfirm = async () => {
    if (!customerName.trim()) {
      Alert.alert('Required', 'Please enter customer name');
      return;
    }
    setIsSubmitting(true);
    try {
      await appointmentApi.createAppointment({
        prospect_name: customerName,
        model: vehicle,
        date: selectedDate,
        time: selectedSlot,
        duration,
        location,
        type: 'test_drive',
      });
    } catch {
      // offline fallback
    }

    onConfirmBooking({
      customerName,
      model: vehicle,
      loop: location,
      time: selectedSlot,
      date: selectedDate,
    });
    setIsSubmitting(false);
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
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Book Test Drive</Text>
              <Text style={styles.subtitle}>Dispatch allocation & fleet check</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Customer name */}
            <Text style={styles.label}>Customer Name</Text>
            <TextInput
              style={styles.input}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="e.g. John Doe"
              placeholderTextColor="#94a3b8"
            />

            {/* Vehicle Selection */}
            <Text style={styles.label}>Demonstrator Fleet</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {VEHICLE_OPTIONS.map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.chip, vehicle === v && styles.chipActive]}
                  onPress={() => setVehicle(v)}
                >
                  <Text style={[styles.chipText, vehicle === v && styles.chipTextActive]}>
                    {v}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Time Slot */}
            <Text style={styles.label}>Start Time</Text>
            <View style={styles.gridRow}>
              {TIME_SLOTS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeChip, selectedSlot === t && styles.timeChipActive]}
                  onPress={() => setSelectedSlot(t)}
                >
                  <Text style={[styles.timeText, selectedSlot === t && styles.timeTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Duration */}
            <Text style={styles.label}>Duration</Text>
            <View style={styles.row}>
              {DURATION_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.pill, duration === d && styles.pillActive]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={[styles.pillText, duration === d && styles.pillTextActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Demo Route Loop */}
            <Text style={styles.label}>Drive Route / Loop</Text>
            {LOCATION_OPTIONS.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[styles.locOption, location === loc && styles.locOptionActive]}
                onPress={() => setLocation(loc)}
              >
                <View style={[styles.radioCircle, location === loc && styles.radioCircleActive]}>
                  {location === loc && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.locText, location === loc && styles.locTextActive]}>
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.complianceBox}>
              <Text style={styles.complianceBadge}>ACMA & BYD Verified</Text>
              <Text style={styles.complianceText}>
                Automated driver licence validation, insurance terms, and SMS confirmation will be sent upon dispatch.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleConfirm}
              disabled={isSubmitting}
            >
              <Text style={styles.submitText}>
                {isSubmitting ? 'Confirming...' : 'Confirm Test Drive'}
              </Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
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
  title: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  closeBtnText: {
    fontSize: 20,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  body: {
    padding: Spacing.lg,
  },
  label: {
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: '#f8fafc',
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  chip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: '#fee2e2',
    borderColor: Colors.brand,
  },
  chipText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.brand,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeChipActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  timeText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  timeTextActive: {
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: '#fee2e2',
    borderColor: Colors.brand,
  },
  pillText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pillTextActive: {
    color: Colors.brand,
    fontWeight: '700',
  },
  locOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#f8fafc',
    marginBottom: 6,
  },
  locOptionActive: {
    borderColor: Colors.brand,
    backgroundColor: '#fff5f5',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioCircleActive: {
    borderColor: Colors.brand,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand,
  },
  locText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textPrimary,
  },
  locTextActive: {
    fontWeight: '600',
    color: Colors.brand,
  },
  complianceBox: {
    marginTop: Spacing.md,
    backgroundColor: '#f0fdf4',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  complianceBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  complianceText: {
    fontSize: Typography.bodySmall.fontSize,
    color: '#166534',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.brand,
    alignItems: 'center',
  },
  submitText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '700',
    color: '#ffffff',
  },
});
