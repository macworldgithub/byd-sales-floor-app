import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { Lead } from '../lib/types';

interface PulseDashboardScreenProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onNavigateTab: (tab: string) => void;
}

interface ConsultantPulse {
  name: string;
  initials: string;
  role: string;
  activeLeads: number;
  speedToLead: string;
  overdueSla: number;
  conversionRate: number;
  trafficLight: 'green' | 'amber' | 'red';
  flaggedLeads: { id: number; name: string; age: string; reason: string }[];
}

const CONSULTANT_PULSE: ConsultantPulse[] = [
  {
    name: 'Alex Morgan',
    initials: 'AM',
    role: 'Senior EV Specialist',
    activeLeads: 12,
    speedToLead: '6.4m',
    overdueSla: 0,
    conversionRate: 28.5,
    trafficLight: 'green',
    flaggedLeads: [],
  },
  {
    name: 'Jordan Lee',
    initials: 'JL',
    role: 'EV Consultant',
    activeLeads: 14,
    speedToLead: '11.8m',
    overdueSla: 1,
    conversionRate: 22.0,
    trafficLight: 'amber',
    flaggedLeads: [
      { id: 101, name: 'David Cho', age: '1h 45m', reason: 'Enquiry quote unresponded' },
    ],
  },
  {
    name: 'Samira Patel',
    initials: 'SP',
    role: 'Fleet & Novated Specialist',
    activeLeads: 9,
    speedToLead: '8.2m',
    overdueSla: 0,
    conversionRate: 31.2,
    trafficLight: 'green',
    flaggedLeads: [],
  },
  {
    name: 'Liam Chen',
    initials: 'LC',
    role: 'EV Specialist',
    activeLeads: 16,
    speedToLead: '24.5m',
    overdueSla: 3,
    conversionRate: 14.8,
    trafficLight: 'red',
    flaggedLeads: [
      { id: 102, name: 'Robert Zhang', age: '3h 10m', reason: 'High buyer alert unaddressed' },
      { id: 103, name: 'Claire Kelly', age: '2h 15m', reason: 'Carsales first touch breached 15m SLA' },
    ],
  },
];

export default function PulseDashboardScreen({
  leads,
  onSelectLead,
  onNavigateTab,
}: PulseDashboardScreenProps) {
  const [selectedConsultant, setSelectedConsultant] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'team' | 'exceptions'>('team');

  const filteredTeam = selectedConsultant === 'All'
    ? CONSULTANT_PULSE
    : CONSULTANT_PULSE.filter(c => c.name === selectedConsultant);

  const totalOverdue = CONSULTANT_PULSE.reduce((acc, c) => acc + c.overdueSla, 0);
  const avgConversion = (CONSULTANT_PULSE.reduce((acc, c) => acc + c.conversionRate, 0) / CONSULTANT_PULSE.length).toFixed(1);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>PULSE MANAGEMENT & MORNING BRIEFING</Text>
          <Text style={styles.headerTitle}>Floor Pulse Console</Text>
        </View>
        <View style={styles.liveClockBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveClockText}>LIVE SYNC</Text>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {/* Morning Briefing Banner */}
        <View style={styles.briefingCard}>
          <Text style={styles.briefingEyebrow}>GOOD MORNING, FLOOR MANAGER</Text>
          <Text style={styles.briefingHeadline}>
            Floor Health: <Text style={{ color: totalOverdue > 2 ? '#ef4444' : '#10b981' }}>{totalOverdue > 2 ? 'ATTENTION REQUIRED' : 'OPTIMAL VELOCITY'}</Text>
          </Text>
          <Text style={styles.briefingSub}>
            {totalOverdue} overdue lead SLA follow-ups need management action. Average speed-to-lead is 12.7m across Melbourne CBD.
          </Text>

          {/* KPI High-Signal Chips */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiNum}>{totalOverdue}</Text>
              <Text style={styles.kpiLabel}>SLA Breaches</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={[styles.kpiNum, { color: '#10b981' }]}>{avgConversion}%</Text>
              <Text style={styles.kpiLabel}>Team Close Ratio</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiNum}>51</Text>
              <Text style={styles.kpiLabel}>Floor Pipeline</Text>
            </View>
          </View>
        </View>

        {/* View Segmented Toggle */}
        <View style={styles.segmentWrap}>
          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'team' && styles.segmentBtnActive]}
            onPress={() => setViewMode('team')}
            activeOpacity={0.8}
          >
            <Ionicons name="people" size={14} color={viewMode === 'team' ? '#fff' : Colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.segmentText, viewMode === 'team' && styles.segmentTextActive]}>Consultant Roster</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'exceptions' && styles.segmentBtnActive]}
            onPress={() => setViewMode('exceptions')}
            activeOpacity={0.8}
          >
            <Ionicons name="warning" size={14} color={viewMode === 'exceptions' ? '#fff' : Colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.segmentText, viewMode === 'exceptions' && styles.segmentTextActive]}>Urgent Exceptions ({totalOverdue})</Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'team' ? (
          <View>
            <Text style={styles.sectionTitle}>TRAFFIC-LIGHT PERFORMANCE BY CONSULTANT</Text>
            {filteredTeam.map((c) => {
              const toneBg = c.trafficLight === 'green' ? '#f0fdf4' : c.trafficLight === 'amber' ? '#fffbeb' : '#fef2f2';
              const toneText = c.trafficLight === 'green' ? '#166534' : c.trafficLight === 'amber' ? '#92400e' : '#991b1b';
              const dotColor = c.trafficLight === 'green' ? '#10b981' : c.trafficLight === 'amber' ? '#f59e0b' : '#ef4444';

              return (
                <View key={c.name} style={styles.consultantCard}>
                  <View style={styles.consultantTopRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{c.initials}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.consultantName}>{c.name}</Text>
                      <Text style={styles.consultantRole}>{c.role}</Text>
                    </View>
                    <View style={[styles.trafficBadge, { backgroundColor: toneBg }]}>
                      <View style={[styles.trafficDot, { backgroundColor: dotColor }]} />
                      <Text style={[styles.trafficText, { color: toneText }]}>
                        {c.trafficLight === 'green' ? 'ON TARGET' : c.trafficLight === 'amber' ? 'ATTENTION' : 'ESCALATION'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.consultantMetricsRow}>
                    <View style={styles.cMetric}>
                      <Text style={styles.cMetricVal}>{c.speedToLead}</Text>
                      <Text style={styles.cMetricLabel}>Avg Response</Text>
                    </View>
                    <View style={styles.cMetric}>
                      <Text style={[styles.cMetricVal, c.overdueSla > 0 && { color: '#ef4444' }]}>{c.overdueSla}</Text>
                      <Text style={styles.cMetricLabel}>Overdue SLA</Text>
                    </View>
                    <View style={styles.cMetric}>
                      <Text style={styles.cMetricVal}>{c.conversionRate}%</Text>
                      <Text style={styles.cMetricLabel}>Close Ratio</Text>
                    </View>
                    <View style={styles.cMetric}>
                      <Text style={styles.cMetricVal}>{c.activeLeads}</Text>
                      <Text style={styles.cMetricLabel}>Open Leads</Text>
                    </View>
                  </View>

                  {c.flaggedLeads.length > 0 && (
                    <View style={styles.flaggedBox}>
                      <Text style={styles.flaggedHeader}>Aged / Escalated Enquiries:</Text>
                      {c.flaggedLeads.map(fl => (
                        <View key={fl.id} style={styles.flaggedItem}>
                          <Ionicons name="time-outline" size={12} color="#dc2626" style={{ marginRight: 4 }} />
                          <Text style={styles.flaggedName}>{fl.name} ({fl.age}):</Text>
                          <Text style={styles.flaggedReason}> {fl.reason}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>PULSE EXCEPTIONS REQUIRING INTERVENTION</Text>
            {CONSULTANT_PULSE.flatMap(c => c.flaggedLeads.map(f => ({ ...f, consultant: c.name }))).map((item, idx) => (
              <View key={idx} style={styles.exceptionCard}>
                <View style={styles.exceptionTop}>
                  <Text style={styles.exceptionCustomer}>{item.name}</Text>
                  <View style={styles.breachPill}>
                    <Text style={styles.breachPillText}>{item.age} Overdue</Text>
                  </View>
                </View>
                <Text style={styles.exceptionReason}>{item.reason}</Text>
                <Text style={styles.exceptionConsultant}>Assigned to: {item.consultant}</Text>

                <View style={styles.exceptionActions}>
                  <TouchableOpacity
                    style={styles.reassignBtn}
                    onPress={() => onNavigateTab('allocation')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="swap-horizontal" size={14} color={Colors.textPrimary} style={{ marginRight: 4 }} />
                    <Text style={styles.reassignBtnText}>Reallocate Lead</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pingBtn}
                    onPress={() => {
                      // ping action
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="flash" size={14} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.pingBtnText}>Ping Consultant</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
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
  headerEyebrow: { fontSize: Typography.xxs, fontWeight: '700', color: Colors.brand, letterSpacing: 0.8 },
  headerTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  liveClockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 5 },
  liveClockText: { fontSize: 10, fontWeight: '700', color: '#166534' },
  body: { flex: 1 },
  bodyContent: { padding: Spacing.base, paddingBottom: 40 },
  briefingCard: {
    backgroundColor: '#090d16',
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  briefingEyebrow: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  briefingHeadline: { fontSize: Typography.md, fontWeight: '800', color: '#fff', marginTop: 4 },
  briefingSub: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.7)', marginTop: 4, lineHeight: 16 },
  kpiRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  kpiBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: BorderRadius.md,
    padding: 10,
    alignItems: 'center',
  },
  kpiNum: { fontSize: Typography.lg, fontWeight: '800', color: '#fff' },
  kpiLabel: { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 2 },
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  segmentBtnActive: { backgroundColor: Colors.brand },
  segmentText: { fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary },
  segmentTextActive: { color: '#fff', fontWeight: '700' },
  sectionTitle: {
    fontSize: Typography.xxs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  consultantCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.sm,
  },
  consultantTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#0f172a',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  consultantName: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  consultantRole: { fontSize: Typography.xxs, color: Colors.textMuted },
  trafficBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trafficDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  trafficText: { fontSize: 10, fontWeight: '700' },
  consultantMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cMetric: { alignItems: 'center' },
  cMetricVal: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  cMetricLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  flaggedBox: {
    marginTop: 10,
    backgroundColor: '#fef2f2',
    borderRadius: BorderRadius.sm,
    padding: 8,
  },
  flaggedHeader: { fontSize: 10, fontWeight: '700', color: '#991b1b', marginBottom: 4 },
  flaggedItem: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  flaggedName: { fontSize: 11, fontWeight: '600', color: '#991b1b' },
  flaggedReason: { fontSize: 11, color: '#b91c1c' },
  exceptionCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    ...Shadows.sm,
  },
  exceptionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exceptionCustomer: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  breachPill: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  breachPillText: { fontSize: 10, fontWeight: '700', color: '#991b1b' },
  exceptionReason: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 4 },
  exceptionConsultant: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  exceptionActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  reassignBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#f1f5f9',
  },
  reassignBtnText: { fontSize: 11, fontWeight: '600', color: Colors.textPrimary },
  pingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.brand,
  },
  pingBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },
});
