import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { Lead } from '../lib/types';

interface LeadDetailModalProps {
  visible: boolean;
  lead: Lead | null;
  onClose: () => void;
  onOpenBookDrive: (lead: Lead) => void;
  onOpenMessage: (lead: Lead) => void;
  onUpdateStage: (leadId: number, stage: Lead['stage']) => void;
}

const STAGES: Lead['stage'][] = ['Imported', 'Engaged', 'Qualified', 'Committed'];

export default function LeadDetailModal({
  visible,
  lead,
  onClose,
  onOpenBookDrive,
  onOpenMessage,
  onUpdateStage,
}: LeadDetailModalProps) {
  if (!lead) return null;

  const handleCall = () => {
    if (lead.phone) {
      Linking.openURL(`tel:${lead.phone}`).catch(() => {
        Alert.alert('Unable to make call', `Phone: ${lead.phone}`);
      });
    } else {
      Alert.alert('No phone number', 'No contact phone available for this lead.');
    }
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{lead.initials || 'BY'}</Text>
              </View>
              <View>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{lead.name}</Text>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{lead.score ?? 50} PTS</Text>
                  </View>
                </View>
                <Text style={styles.subtext}>
                  Via {lead.source || 'Walk-in'} · {lead.lastTouch || 'Just now'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Vehicle of interest */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardLabel}>VEHICLE OF INTEREST</Text>
              <Text style={styles.vehicleTitle}>{lead.model}</Text>
              {lead.priority && (
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityText}>🔥 High Priority Buyer</Text>
                </View>
              )}
            </View>

            {/* Quick Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
                <Text style={styles.actionIcon}>📞</Text>
                <Text style={styles.actionBtnLabel}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnHighlight]}
                onPress={() => {
                  onClose();
                  onOpenMessage(lead);
                }}
              >
                <Text style={styles.actionIcon}>💬</Text>
                <Text style={[styles.actionBtnLabel, styles.actionBtnLabelHighlight]}>
                  Message
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  onClose();
                  onOpenBookDrive(lead);
                }}
              >
                <Text style={styles.actionIcon}>🚗</Text>
                <Text style={styles.actionBtnLabel}>Test Drive</Text>
              </TouchableOpacity>
            </View>

            {/* Stage Selector */}
            <Text style={styles.sectionTitle}>PIPELINE STAGE</Text>
            <View style={styles.stageGrid}>
              {STAGES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.stageBtn,
                    lead.stage === s && styles.stageBtnActive,
                  ]}
                  onPress={() => onUpdateStage(Number(lead.id), s)}
                >
                  <Text
                    style={[
                      styles.stageBtnText,
                      lead.stage === s && styles.stageBtnTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Contact Details */}
            <Text style={styles.sectionTitle}>CONTACT INFO</Text>
            <View style={styles.detailsBox}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailVal}>{lead.phone || '+61 400 123 456'}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailVal}>{lead.email || 'customer@byd-floor.com.au'}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Assigned Consultant</Text>
                <Text style={styles.detailVal}>{lead.consultant || 'Unassigned'}</Text>
              </View>
            </View>

            {/* Notes / Intelligence */}
            {lead.notes && (
              <>
                <Text style={styles.sectionTitle}>CONSULTANT NOTES</Text>
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>{lead.notes}</Text>
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.fullCloseBtn} onPress={onClose}>
              <Text style={styles.fullCloseText}>Done</Text>
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
  card: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '88%',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
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
    fontSize: 20,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  body: {
    padding: Spacing.lg,
  },
  infoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  infoCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  vehicleTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  priorityBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#c2410c',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnHighlight: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  actionIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  actionBtnLabel: {
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  actionBtnLabelHighlight: {
    color: Colors.brand,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: Typography.labelSmall.fontSize,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  stageGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  stageBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  stageBtnActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  stageBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  stageBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  detailsBox: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  detailItem: {
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailVal: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },
  notesBox: {
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  notesText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
  },
  fullCloseBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  fullCloseText: {
    color: '#ffffff',
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '700',
  },
});
