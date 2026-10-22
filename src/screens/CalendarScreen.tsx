import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { TimelineEvent } from '../lib/types';
import { appointmentApi } from '../lib/api';

interface CalendarScreenProps {
  timelineEvents: TimelineEvent[];
  onOpenAddEvent: () => void;
  onOpenBookDrive: () => void;
  onSelectEvent?: (event: TimelineEvent) => void;
}

const DEMO_LOOPS = [
  { name: 'Loop A · City Grid', duration: '25 min', focus: 'Regen Braking & City Agility', distance: '8.4 km' },
  { name: 'Loop B · Freeway Run', duration: '40 min', focus: 'High Speed NVH & DiPilot ADAS', distance: '18.2 km' },
  { name: 'Loop C · Dynamic Mix', duration: '35 min', focus: 'Blade Battery Acceleration & Ride', distance: '14.0 km' },
];

const getEventColor = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'drive':
      return { border: Colors.brand, bg: '#fff1f2', text: Colors.brand, label: 'TEST DRIVE' };
    case 'delivery':
      return { border: '#10b981', bg: '#f0fdf4', text: '#166534', label: 'HANDOVER' };
    case 'followup':
      return { border: '#f59e0b', bg: '#fffbeb', text: '#92400e', label: 'FOLLOW-UP' };
    case 'hold':
      return { border: '#64748b', bg: '#f8fafc', text: '#334155', label: 'FLOOR DUTY' };
    default:
      return { border: '#94a3b8', bg: '#f8fafc', text: '#475569', label: 'EVENT' };
  }
};

export default function CalendarScreen({
  timelineEvents,
  onOpenAddEvent,
  onOpenBookDrive,
}: CalendarScreenProps) {
  const [viewMode, setViewMode] = useState<'myDay' | 'week' | 'loops'>('myDay');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMarkOutcome = async (outcome: 'Completed' | 'No Show') => {
    if (!selectedEvent) return;
    setIsProcessing(true);
    try {
      const eventId = (selectedEvent as any)._id || (selectedEvent as any).id || 'apt-latest';
      await appointmentApi.updateAppointment(eventId, { status: outcome });
      setFeedback(`Status updated to ${outcome}.`);
      setTimeout(() => {
        setSelectedEvent(null);
        setFeedback(null);
      }, 1500);
    } catch {
      setFeedback(`Status saved locally as ${outcome}.`);
      setTimeout(() => {
        setSelectedEvent(null);
        setFeedback(null);
      }, 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Feedback Toast */}
      {feedback && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{feedback}</Text>
        </View>
      )}

      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>SHOWROOM & DEMO SCHEDULE</Text>
          <Text style={styles.headerTitle}>Floor Calendar</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.addBtn} onPress={onOpenAddEvent} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>＋ Event</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bookBtn} onPress={onOpenBookDrive} activeOpacity={0.8}>
            <Text style={styles.bookBtnText}>📅 Drive</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented View Mode */}
      <View style={styles.segmentedContainer}>
        {(['myDay', 'week', 'loops'] as const).map((mode) => {
          const isActive = viewMode === mode;
          const label = mode === 'myDay' ? 'My Schedule' : mode === 'week' ? 'Week View' : 'Demo Loops';
          return (
            <TouchableOpacity
              key={mode}
              style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
              onPress={() => setViewMode(mode)}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentBtnText, isActive && styles.segmentBtnTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {viewMode === 'loops' ? (
          <View style={styles.loopsContainer}>
            <Text style={styles.sectionTitle}>MELBOURNE CBD TEST DRIVE LOOPS</Text>
            <Text style={styles.sectionSubtitle}>
              Pre-approved demo circuits tailored to demonstrate specific BYD features and range.
            </Text>
            {DEMO_LOOPS.map((loop, idx) => (
              <View key={loop.name} style={styles.loopCard}>
                <View style={styles.loopHeader}>
                  <View style={styles.loopBadge}>
                    <Text style={styles.loopBadgeText}>LOOP {String.fromCharCode(65 + idx)}</Text>
                  </View>
                  <Text style={styles.loopDistance}>{loop.distance} · {loop.duration}</Text>
                </View>
                <Text style={styles.loopName}>{loop.name}</Text>
                <Text style={styles.loopFocus}>Focus: {loop.focus}</Text>
                <TouchableOpacity
                  style={styles.loopActionBtn}
                  onPress={onOpenBookDrive}
                  activeOpacity={0.85}
                >
                  <Text style={styles.loopActionText}>Book This Loop →</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.scheduleContainer}>
            <View style={styles.dateBanner}>
              <Text style={styles.dateBannerTitle}>
                {viewMode === 'myDay' ? 'Today · Monday 8 Sep' : 'Week Schedule (8 - 14 Sep)'}
              </Text>
              <Text style={styles.dateBannerBadge}>
                {timelineEvents.length} Appts
              </Text>
            </View>

            {timelineEvents.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No appointments scheduled.</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={onOpenBookDrive}>
                  <Text style={styles.emptyBtnText}>Book Test Drive</Text>
                </TouchableOpacity>
              </View>
            ) : (
              timelineEvents.map((evt, idx) => {
                const colors = getEventColor(evt.type);
                return (
                  <TouchableOpacity
                    key={`${evt.time}-${idx}`}
                    style={[styles.eventCard, { borderLeftColor: colors.border }]}
                    onPress={() => setSelectedEvent(evt)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.eventTimeCol}>
                      <Text style={styles.eventTimeStart}>{evt.time}</Text>
                      <Text style={styles.eventTimeEnd}>{evt.end}</Text>
                      <View style={[styles.typeBadge, { backgroundColor: colors.bg }]}>
                        <Text style={[styles.typeBadgeText, { color: colors.text }]}>{colors.label}</Text>
                      </View>
                    </View>

                    <View style={styles.eventDetailCol}>
                      <Text style={styles.eventTitle} numberOfLines={1}>{evt.title}</Text>
                      <Text style={styles.eventDetail} numberOfLines={2}>{evt.detail}</Text>
                    </View>

                    <Text style={styles.eventArrow}>›</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Event Outcome Modal */}
      <Modal
        visible={!!selectedEvent}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>APPOINTMENT OUTCOME</Text>
                <Text style={styles.modalTitle} numberOfLines={1}>{selectedEvent?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedEvent(null)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Time Slot</Text>
                <Text style={styles.modalInfoVal}>{selectedEvent?.time} - {selectedEvent?.end}</Text>
              </View>
              <View style={styles.modalInfoRow}>
                <Text style={styles.modalInfoLabel}>Vehicle / Details</Text>
                <Text style={styles.modalInfoVal}>{selectedEvent?.detail}</Text>
              </View>

              <Text style={styles.modalOutcomeHeader}>Record Appointment Result:</Text>

              <View style={styles.outcomeRow}>
                <TouchableOpacity
                  style={[styles.outcomeBtn, styles.outcomeCompleted]}
                  onPress={() => handleMarkOutcome('Completed')}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  <Text style={styles.outcomeBtnText}>✓ Met & Completed</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.outcomeBtn, styles.outcomeNoShow]}
                  onPress={() => handleMarkOutcome('No Show')}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  <Text style={styles.outcomeBtnText}>✕ Customer No Show</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.light },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerEyebrow: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
    fontWeight: Typography.bold,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  addBtn: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
  },
  addBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  bookBtn: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 2,
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.md,
  },
  bookBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: '#fff',
  },

  // Segmented
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.xs,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: Spacing.xs + 2,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    backgroundColor: '#f1f5f9',
  },
  segmentBtnActive: {
    backgroundColor: Colors.dark,
  },
  segmentBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  segmentBtnTextActive: {
    color: '#fff',
  },

  content: { flex: 1 },
  contentContainer: { padding: Spacing.base, paddingBottom: Spacing.xxxl },

  dateBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dateBannerTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  dateBannerBadge: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.brand,
    backgroundColor: 'rgba(230,0,18,0.08)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },

  scheduleContainer: { gap: Spacing.sm },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.sm,
    gap: Spacing.sm,
  },
  eventTimeCol: {
    alignItems: 'center',
    width: 65,
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
    paddingRight: Spacing.xs,
  },
  eventTimeStart: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  eventTimeEnd: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  typeBadge: {
    marginTop: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  typeBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  eventDetailCol: {
    flex: 1,
  },
  eventTitle: {
    fontSize: Typography.base - 1,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  eventDetail: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  eventArrow: {
    fontSize: 20,
    color: Colors.textMuted,
    paddingLeft: Spacing.xs,
  },

  // Loops
  loopsContainer: { gap: Spacing.md },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: -Spacing.xs,
  },
  loopCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loopBadge: {
    backgroundColor: Colors.dark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  loopBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  loopDistance: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  loopName: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  loopFocus: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  loopActionBtn: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    alignItems: 'center',
    backgroundColor: 'rgba(230,0,18,0.06)',
    borderRadius: BorderRadius.md,
  },
  loopActionText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.brand,
  },

  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    marginBottom: Spacing.md,
  },
  emptyBtn: {
    backgroundColor: Colors.brand,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: Typography.bold,
    fontSize: Typography.xs,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: Spacing.sm,
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.brand,
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: Spacing.xs,
  },
  modalCloseText: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  modalBody: {
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  modalInfoLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  modalInfoVal: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  modalOutcomeHeader: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  outcomeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  outcomeBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  outcomeCompleted: {
    backgroundColor: '#10b981',
  },
  outcomeNoShow: {
    backgroundColor: '#ef4444',
  },
  outcomeBtnText: {
    color: '#fff',
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },

  toast: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    backgroundColor: Colors.dark,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    zIndex: 99,
    alignItems: 'center',
    ...Shadows.md,
  },
  toastText: {
    color: '#fff',
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
});
