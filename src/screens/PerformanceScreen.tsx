import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';

interface LeaderboardMember {
  rank: number;
  name: string;
  role: string;
  unitsSold: number;
  monthlyTarget: number;
  slaCompliance: number;
  testDrivesDone: number;
  csiRating: number;
  status: string;
}

const LEADERBOARD: LeaderboardMember[] = [
  {
    rank: 1,
    name: 'Alex Rivers',
    role: 'Senior EV Specialist',
    unitsSold: 14,
    monthlyTarget: 16,
    slaCompliance: 96,
    testDrivesDone: 28,
    csiRating: 4.95,
    status: 'Top Performer',
  },
  {
    rank: 2,
    name: 'Jordan Lee',
    role: 'EV Consultant',
    unitsSold: 11,
    monthlyTarget: 14,
    slaCompliance: 91,
    testDrivesDone: 22,
    csiRating: 4.88,
    status: 'On Target',
  },
  {
    rank: 3,
    name: 'Samira Patel',
    role: 'Fleet & Novated Specialist',
    unitsSold: 9,
    monthlyTarget: 12,
    slaCompliance: 88,
    testDrivesDone: 19,
    csiRating: 4.92,
    status: 'On Target',
  },
  {
    rank: 4,
    name: 'Liam Chen',
    role: 'EV Specialist',
    unitsSold: 7,
    monthlyTarget: 12,
    slaCompliance: 78,
    testDrivesDone: 15,
    csiRating: 4.75,
    status: 'Coaching Focus',
  },
];

export default function PerformanceScreen() {
  const [filterPeriod, setFilterPeriod] = useState<'mtd' | 'qtd' | 'ytd'>('mtd');

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>EXECUTIVE OVERVIEW · HARMONY AUTO</Text>
          <Text style={styles.headerTitle}>Floor Velocity & KPI</Text>
        </View>
        <View style={styles.periodRow}>
          {(['mtd', 'qtd', 'ytd'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodBtn, filterPeriod === period && styles.periodBtnActive]}
              onPress={() => setFilterPeriod(period)}
              activeOpacity={0.8}
            >
              <Text style={[styles.periodText, filterPeriod === period && styles.periodTextActive]}>
                {period.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Deals Sold</Text>
            <Text style={styles.kpiValue}>41</Text>
            <Text style={styles.kpiSub}>82% of 50 target</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Speed to Lead</Text>
            <Text style={[styles.kpiValue, { color: '#10b981' }]}>6.8m</Text>
            <Text style={styles.kpiSub}>94% within 15m SLA</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Test Drive Rate</Text>
            <Text style={styles.kpiValue}>38.5%</Text>
            <Text style={styles.kpiSub}>Drive-to-order</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Floor CSI</Text>
            <Text style={[styles.kpiValue, { color: Colors.brand }]}>4.91</Text>
            <Text style={styles.kpiSub}>5.00 Star Rating</Text>
          </View>
        </View>

        {/* Consultant Leaderboard */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CONSULTANT SCOREBOARD</Text>
          <Text style={styles.sectionSubtitle}>Rankings based on units sold, SLA compliance, and CSI satisfaction.</Text>
        </View>

        {LEADERBOARD.map((member) => {
          const targetPct = Math.round((member.unitsSold / member.monthlyTarget) * 100);
          const isTop = member.rank === 1;

          return (
            <View key={member.name} style={[styles.memberCard, isTop && styles.topMemberCard]}>
              <View style={styles.memberTopRow}>
                <View style={[styles.rankBadge, isTop && styles.rankBadgeGold]}>
                  <Text style={[styles.rankText, isTop && styles.rankTextGold]}>#{member.rank}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
                <View style={[styles.statusTag, isTop ? styles.statusTop : styles.statusNormal]}>
                  <Text style={[styles.statusTagText, isTop ? styles.statusTopText : styles.statusNormalText]}>
                    {member.status}
                  </Text>
                </View>
              </View>

              {/* Target Progress Bar */}
              <View style={styles.metricProgressWrap}>
                <View style={styles.metricLabels}>
                  <Text style={styles.metricLabel}>Monthly Target Progress</Text>
                  <Text style={styles.metricVal}>{member.unitsSold} / {member.monthlyTarget} units ({targetPct}%)</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(targetPct, 100)}%` }]} />
                </View>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>{member.slaCompliance}%</Text>
                  <Text style={styles.statLabel}>SLA Compliance</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>{member.testDrivesDone}</Text>
                  <Text style={styles.statLabel}>Test Drives</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>★ {member.csiRating.toFixed(2)}</Text>
                  <Text style={styles.statLabel}>CSI Score</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
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
  periodRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: BorderRadius.md,
    padding: 2,
  },
  periodBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  periodBtnActive: {
    backgroundColor: Colors.dark,
  },
  periodText: {
    fontSize: Typography.xs - 1,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
  },
  periodTextActive: {
    color: '#fff',
  },

  content: { flex: 1 },
  contentContainer: { padding: Spacing.base, paddingBottom: Spacing.xxxl },

  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  kpiLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.semibold,
  },
  kpiValue: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  kpiSub: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  sectionHeader: { marginBottom: Spacing.sm },
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
  },

  memberCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topMemberCard: {
    borderColor: '#fed7aa',
    backgroundColor: '#fffdfa',
  },
  memberTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeGold: {
    backgroundColor: '#fef3c7',
  },
  rankText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  rankTextGold: {
    color: '#b45309',
  },
  memberName: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  memberRole: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  statusTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusTop: {
    backgroundColor: 'rgba(230,0,18,0.08)',
  },
  statusNormal: {
    backgroundColor: '#f0fdf4',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTopText: {
    color: Colors.brand,
  },
  statusNormalText: {
    color: '#166534',
  },

  metricProgressWrap: {
    marginTop: Spacing.md,
  },
  metricLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
  },
  metricVal: {
    fontSize: Typography.xs - 1,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.brand,
    borderRadius: 3,
  },

  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
