import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { Lead } from '../lib/types';

interface AllocationScreenProps {
  unassignedLeads: Lead[];
  onAssignLead: (leadId: number | string, consultantName: string) => void;
}

interface Consultant {
  name: string;
  role: string;
  leadsCount: number;
  maxCapacity: number;
  status: 'Available' | 'High Load' | 'Full';
}

const CONSULTANTS: Consultant[] = [
  { name: 'Alex Rivers', role: 'Senior EV Specialist', leadsCount: 11, maxCapacity: 15, status: 'Available' },
  { name: 'Jordan Lee', role: 'EV Consultant', leadsCount: 13, maxCapacity: 15, status: 'High Load' },
  { name: 'Samira Patel', role: 'Fleet Specialist', leadsCount: 8, maxCapacity: 12, status: 'Available' },
  { name: 'Liam Chen', role: 'EV Specialist', leadsCount: 14, maxCapacity: 15, status: 'High Load' },
];

export default function AllocationScreen({
  unassignedLeads,
  onAssignLead,
}: AllocationScreenProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAssign = (consultantName: string) => {
    if (!selectedLead) return;
    const leadId = selectedLead._id || selectedLead.id || '';
    onAssignLead(leadId, consultantName);
    setToastMessage(`Assigned to ${consultantName}`);
    setSelectedLead(null);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <View style={styles.root}>
      {/* Toast */}
      {toastMessage && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Screen Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>MANAGER CONSOLE</Text>
          <Text style={styles.headerTitle}>Lead Allocation</Text>
        </View>
        <View style={styles.routingBadge}>
          <View style={styles.routingDot} />
          <Text style={styles.routingText}>Auto-Routing</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Unassigned Inbound Queue */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="people-outline" size={14} color={Colors.textMuted} style={{ marginRight: 5 }} />
            <Text style={styles.sectionTitle}>UNASSIGNED QUEUE ({unassignedLeads.length})</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Tap a lead to route to an available showroom consultant.</Text>
        </View>

        {unassignedLeads.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="checkmark-circle" size={32} color="#10b981" />
            </View>
            <Text style={styles.emptyCardTitle}>All Leads Allocated</Text>
            <Text style={styles.emptyCardText}>No incoming prospects are currently awaiting floor assignment.</Text>
          </View>
        ) : (
          unassignedLeads.map((lead) => (
            <TouchableOpacity
              key={String(lead._id || lead.id)}
              style={styles.leadCard}
              onPress={() => setSelectedLead(lead)}
              activeOpacity={0.85}
            >
              <View style={styles.leadHeader}>
                <View style={styles.leadAvatar}>
                  <Text style={styles.leadAvatarText}>{lead.initials || 'BY'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.leadName}>{lead.name}</Text>
                  <Text style={styles.leadMeta}>
                    {lead.model || 'BYD Range'} · via {lead.source || 'Walk-in'}
                  </Text>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{lead.score ?? 80} PTS</Text>
                </View>
              </View>

              <View style={styles.slaAlert}>
                <Ionicons name="warning-outline" size={12} color="#92400e" style={{ marginRight: 4 }} />
                <Text style={styles.slaAlertText}>Unallocated · 15m Speed-to-lead SLA ticking</Text>
              </View>

              <View style={styles.assignRow}>
                <Text style={styles.assignHint}>Tap to allocate</Text>
                <View style={styles.assignActionChip}>
                  <Ionicons name="person-add-outline" size={12} color={Colors.brand} style={{ marginRight: 4 }} />
                  <Text style={styles.assignAction}>Assign Now</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Consultant Capacity Board */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="bar-chart-outline" size={14} color={Colors.textMuted} style={{ marginRight: 5 }} />
            <Text style={styles.sectionTitle}>SHOWROOM CONSULTANT LOAD</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Active prospect allocations per floor specialist.</Text>
        </View>

        {CONSULTANTS.map((c) => {
          const pct = Math.round((c.leadsCount / c.maxCapacity) * 100);
          const isHigh = pct >= 85;
          const initials = c.name.split(' ').map(n => n[0]).join('').substring(0, 2);
          return (
            <View key={c.name} style={styles.consultantCard}>
              <View style={styles.consultantHeader}>
                <View style={styles.consultantAvatar}>
                  <Text style={styles.consultantAvatarText}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.consultantName}>{c.name}</Text>
                  <Text style={styles.consultantRole}>{c.role}</Text>
                </View>
                <View style={[styles.statusBadge, isHigh ? styles.statusHigh : styles.statusAvail]}>
                  <Ionicons
                    name={isHigh ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                    size={11}
                    color={isHigh ? '#92400e' : '#166534'}
                    style={{ marginRight: 3 }}
                  />
                  <Text style={[styles.statusBadgeText, isHigh ? styles.statusHighText : styles.statusAvailText]}>
                    {c.status}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.loadRow}>
                <View style={styles.loadBarTrack}>
                  <View
                    style={[
                      styles.loadBarFill,
                      { width: `${pct}%` as any, backgroundColor: isHigh ? '#f59e0b' : '#10b981' },
                    ]}
                  />
                </View>
                <Text style={styles.loadText}>{c.leadsCount}/{c.maxCapacity} leads ({pct}%)</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Assign Modal */}
      <Modal
        visible={!!selectedLead}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedLead(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>ALLOCATE PROSPECT</Text>
                <Text style={styles.modalTitle}>{selectedLead?.name}</Text>
                <Text style={styles.modalSubtitle}>
                  Interested in {selectedLead?.model} ({selectedLead?.score} intent pts)
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedLead(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSelectTitle}>SELECT SHOWROOM CONSULTANT</Text>

            <ScrollView style={{ maxHeight: 300 }}>
              {CONSULTANTS.map((c) => (
                <TouchableOpacity
                  key={c.name}
                  style={styles.consultantSelectRow}
                  onPress={() => handleAssign(c.name)}
                  activeOpacity={0.8}
                >
                  <View style={styles.consultantSelectAvatar}>
                    <Text style={styles.consultantAvatarText}>
                      {c.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectName}>{c.name}</Text>
                    <Text style={styles.selectDetail}>{c.role} · {c.leadsCount} active leads</Text>
                  </View>
                  <TouchableOpacity style={styles.assignChip} onPress={() => handleAssign(c.name)}>
                    <Ionicons name="person-add-outline" size={12} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.assignChipText}>Assign</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  routingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  routingDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#10b981',
  },
  routingText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: '#166534',
  },

  content: { flex: 1 },
  contentContainer: { padding: Spacing.base, paddingBottom: Spacing.xxxl },

  sectionHeader: { marginBottom: Spacing.sm },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    marginLeft: 19,
  },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.sm,
  },
  emptyIconCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#f0fdf4',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyCardTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  emptyCardText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  leadCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  leadAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.dark,
    alignItems: 'center', justifyContent: 'center',
  },
  leadAvatarText: {
    color: '#fff',
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  leadName: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  leadMeta: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  scoreBadge: {
    backgroundColor: 'rgba(230,0,18,0.08)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  scoreText: {
    color: Colors.brand,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  slaAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginTop: Spacing.sm,
  },
  slaAlertText: {
    fontSize: Typography.xs - 1,
    color: '#92400e',
    fontWeight: Typography.medium,
  },
  assignRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  assignHint: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
  },
  assignActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230,0,18,0.06)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  assignAction: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.brand,
  },

  // Consultant Card
  consultantCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  consultantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  consultantAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  consultantAvatarText: {
    color: Colors.textPrimary,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  consultantName: {
    fontSize: Typography.base - 1,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  consultantRole: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusAvail: { backgroundColor: '#f0fdf4' },
  statusHigh: { backgroundColor: '#fffbeb' },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusAvailText: { color: '#166534' },
  statusHighText: { color: '#92400e' },
  loadRow: {
    marginTop: Spacing.sm,
  },
  loadBarTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  loadBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  loadText: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'right',
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
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  modalSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center', justifyContent: 'center',
  },
  modalSelectTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  consultantSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  consultantSelectAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  selectName: {
    fontSize: Typography.base - 1,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  selectDetail: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  assignChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  assignChipText: {
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
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.md,
  },
  toastText: {
    color: '#fff',
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
});
