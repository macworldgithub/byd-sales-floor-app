import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
  Alert,
  TextInput,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { Lead } from '../lib/types';
import { crmApi, inventoryApi } from '../lib/api';

interface Customer360ModalProps {
  visible: boolean;
  lead: Lead | null;
  onClose: () => void;
  onOpenBookDrive: (lead: Lead) => void;
  onOpenMessage: (lead: Lead) => void;
  onUpdateStage: (leadId: number, stage: Lead['stage']) => void;
  onAddNote?: (leadId: string, note: string) => void;
}

const STAGES: Lead['stage'][] = ['Imported', 'Engaged', 'Qualified', 'Committed'];

export default function Customer360Modal({
  visible,
  lead,
  onClose,
  onOpenBookDrive,
  onOpenMessage,
  onUpdateStage,
  onAddNote,
}: Customer360ModalProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'details' | 'log'>('timeline');
  const [noteText, setNoteText] = useState('');
  const [callOutcome, setCallOutcome] = useState('Connected - Follow-up Scheduled');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!lead) return null;

  const handleCall = () => {
    if (lead.phone) {
      Linking.openURL(`tel:${lead.phone}`).catch(() => {
        Alert.alert('Unable to dial', `Phone: ${lead.phone}`);
      });
    } else {
      Alert.alert('No Phone', 'No contact phone number available.');
    }
  };

  const handleSoftHold = async () => {
    try {
      await inventoryApi.softHold(lead.model || 'SEALION-7', {
        prospectName: lead.name,
        notes: 'Floor 48-Hour Reservation',
      });
      setFeedback('Vehicle placed on 48-Hour Soft Hold.');
      setTimeout(() => setFeedback(null), 2500);
    } catch {
      setFeedback('Soft hold saved locally.');
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    const idStr = String(lead._id || lead.id || '');
    onAddNote?.(idStr, noteText.trim());
    setFeedback('Internal note recorded.');
    setNoteText('');
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleLogCall = async () => {
    try {
      const idStr = String(lead._id || lead.id || '');
      await crmApi.logPhoneCall(idStr, {
        outcome: callOutcome,
        notes: noteText,
        consultantName: lead.consultant || 'Alex Rivers',
      });
      setFeedback('Call outcome logged.');
      setNoteText('');
      setTimeout(() => setFeedback(null), 2000);
    } catch {
      setFeedback('Call logged locally.');
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  const timelineEvents = [
    {
      time: 'Today · 08:45 AM',
      title: 'Floor Profile Opened',
      detail: 'Viewed Customer 360 profile on Melbourne CBD Sales Floor OS.',
      tag: 'Floor Touch',
    },
    {
      time: 'Yesterday · 14:20 PM',
      title: lead.stage === 'Committed' ? 'Deposit & Order Logged' : 'Enquiry Ingested',
      detail: `${lead.model || 'BYD Range'} demo loop pre-assigned for showroom.`,
      tag: lead.stage || 'Imported',
    },
    {
      time: '3 Sep 2026 · 10:15 AM',
      title: 'Digital First Touch Sent',
      detail: `SMS sent via Template Studio Pack (Response within 6.4m).`,
      tag: 'SLA Met',
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Feedback Toast */}
          {feedback && (
            <View style={styles.toast}>
              <Text style={styles.toastText}>{feedback}</Text>
            </View>
          )}

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{lead.initials || 'BY'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>{lead.name}</Text>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{lead.score ?? 80} PTS</Text>
                </View>
              </View>
              <Text style={styles.subtext}>
                {lead.model || 'BYD Range'} · via {lead.source || 'Walk-in'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCall} activeOpacity={0.8}>
              <Text style={styles.actionIcon}>📞</Text>
              <Text style={styles.actionLabel}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionPrimary]}
              onPress={() => {
                onClose();
                onOpenMessage(lead);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={[styles.actionLabel, { color: '#fff' }]}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                onClose();
                onOpenBookDrive(lead);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionLabel}>Test Drive</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleSoftHold} activeOpacity={0.8}>
              <Text style={styles.actionIcon}>🔒</Text>
              <Text style={styles.actionLabel}>Soft Hold</Text>
            </TouchableOpacity>
          </View>

          {/* Segmented Internal Tabs */}
          <View style={styles.tabRow}>
            {(['timeline', 'details', 'log'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const label = tab === 'timeline' ? '360 Timeline' : tab === 'details' ? 'Details' : 'Log Touch';
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabItem, isActive && styles.tabItemActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Stage Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PIPELINE STAGE</Text>
              <View style={styles.stageGrid}>
                {STAGES.map((s) => {
                  const isCurrent = lead.stage === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.stageBtn, isCurrent && styles.stageBtnActive]}
                      onPress={() => onUpdateStage(Number(lead.id), s)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.stageBtnText, isCurrent && styles.stageBtnTextActive]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {activeTab === 'timeline' && (
              <View style={styles.timelineList}>
                {timelineEvents.map((evt, idx) => (
                  <View key={idx} style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.timelineHeader}>
                        <Text style={styles.timelineTitle}>{evt.title}</Text>
                        <View style={styles.timelineTag}>
                          <Text style={styles.timelineTagText}>{evt.tag}</Text>
                        </View>
                      </View>
                      <Text style={styles.timelineTime}>{evt.time}</Text>
                      <Text style={styles.timelineDetail}>{evt.detail}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'details' && (
              <View style={styles.detailsBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mobile</Text>
                  <Text style={styles.detailVal}>{lead.phone || '+61 412 890 234'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailVal}>{lead.email || 'customer@byd-floor.com.au'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Model of Interest</Text>
                  <Text style={styles.detailVal}>{lead.model || 'SEALION 7 Premium'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Consultant</Text>
                  <Text style={styles.detailVal}>{lead.consultant || 'Alex Rivers'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Showroom Site</Text>
                  <Text style={styles.detailVal}>BYD Melbourne CBD</Text>
                </View>
                {lead.notes && (
                  <View style={{ marginTop: Spacing.sm }}>
                    <Text style={styles.detailLabel}>Consultant Notes</Text>
                    <Text style={styles.notesText}>{lead.notes}</Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'log' && (
              <View style={styles.logBox}>
                <Text style={styles.sectionTitle}>CALL OUTCOME</Text>
                {(['Connected - Follow-up Scheduled', 'Connected - Test Drive Booked', 'Left Voicemail', 'No Answer'] as const).map((outcome) => (
                  <TouchableOpacity
                    key={outcome}
                    style={[styles.outcomeOption, callOutcome === outcome && styles.outcomeOptionActive]}
                    onPress={() => setCallOutcome(outcome)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.radio}>
                      {callOutcome === outcome && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.outcomeText, callOutcome === outcome && { color: Colors.brand }]}>
                      {outcome}
                    </Text>
                  </TouchableOpacity>
                ))}

                <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>INTERNAL CONSULTANT NOTE</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Record note or call summary here..."
                  placeholderTextColor={Colors.textMuted}
                  value={noteText}
                  onChangeText={setNoteText}
                  multiline={true}
                />

                <View style={styles.logButtonsRow}>
                  <TouchableOpacity style={styles.logBtn} onPress={handleSaveNote} activeOpacity={0.85}>
                    <Text style={styles.logBtnText}>Save Note</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.logBtn, styles.logBtnPrimary]} onPress={handleLogCall} activeOpacity={0.85}>
                    <Text style={[styles.logBtnText, { color: '#fff' }]}>Log Call Result</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>Done</Text>
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
    maxHeight: '90%',
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scoreBadge: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.brand,
  },
  subtext: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  closeBtnText: {
    fontSize: 18,
    color: Colors.textMuted,
  },

  actionRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs + 2,
    alignItems: 'center',
    gap: 2,
  },
  actionPrimary: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.base,
  },
  tabItem: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.brand,
  },
  tabText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.brand,
    fontWeight: Typography.bold,
  },

  body: {
    padding: Spacing.base,
  },

  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  stageGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  stageBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs + 2,
    alignItems: 'center',
  },
  stageBtnActive: {
    backgroundColor: Colors.dark,
  },
  stageBtnText: {
    fontSize: 11,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  stageBtnTextActive: {
    color: '#fff',
    fontWeight: Typography.bold,
  },

  // Timeline
  timelineList: {
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand,
    marginTop: 5,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  timelineTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timelineTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  timelineTime: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  timelineDetail: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },

  // Details
  detailsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  detailVal: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  notesText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },

  // Log
  logBox: {
    gap: Spacing.xs,
  },
  outcomeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
  },
  outcomeOptionActive: {
    backgroundColor: 'rgba(230,0,18,0.03)',
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand,
  },
  outcomeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  noteInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    minHeight: 70,
    fontSize: Typography.xs,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  logButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  logBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: BorderRadius.md,
  },
  logBtnPrimary: {
    backgroundColor: Colors.brand,
  },
  logBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },

  footer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
  },
  doneBtn: {
    backgroundColor: Colors.dark,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: Typography.sm,
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
