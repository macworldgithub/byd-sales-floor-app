import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { Lead, TimelineEvent, Delivery } from '../lib/types';

interface TodayScreenProps {
  leads: Lead[];
  timelineEvents: TimelineEvent[];
  deliveries: Delivery[];
  onSelectLead: (lead: Lead) => void;
  onOpenBookDrive: (lead?: Lead) => void;
  onOpenAddProspect: () => void;
  onOpenMessage: (lead: Lead) => void;
  onNavigateTab: (tab: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const getStageColor = (stage?: string) => {
  switch (stage) {
    case 'Imported': return { bg: '#f1f5f9', text: '#475569' };
    case 'Engaged': return { bg: '#ecfeff', text: '#0e7490' };
    case 'Qualified': return { bg: '#fffbeb', text: '#92400e' };
    case 'Committed': return { bg: '#f0fdf4', text: '#166534' };
    default: return { bg: '#f1f5f9', text: '#475569' };
  }
};

const getEventDotColor = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'drive': return Colors.brand;
    case 'delivery': return Colors.success;
    case 'followup': return Colors.warning;
    case 'hold': return '#6b7280';
    default: return '#94a3b8';
  }
};

export default function TodayScreen({
  leads,
  timelineEvents,
  deliveries,
  onSelectLead,
  onOpenBookDrive,
  onOpenAddProspect,
  onOpenMessage,
  onNavigateTab,
  isLoading,
  onRefresh,
}: TodayScreenProps) {
  const needsMeCount = leads.filter(l => l.priority || (l.score ?? 0) >= 80 || l.stage === 'Imported').length || 4;
  const todayCount = timelineEvents.length || 6;
  const conversationCount = leads.length + 8;
  const deliveriesCount = deliveries.length || 5;

  const nextEvent = timelineEvents[0];
  const nextLead = leads.find(l => nextEvent && nextEvent.title.includes(l.name)) || leads[0];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={!!isLoading}
          onRefresh={onRefresh}
          tintColor={Colors.brand}
          colors={[Colors.brand]}
        />
      }
    >
      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroBg} />
        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>MELBOURNE CBD · MON 8 SEP</Text>
          <Text style={styles.heroTitle}>YOUR FLOOR,{'\n'}
            <Text style={styles.heroTitleAccent}>IN MOTION.</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            {needsMeCount} high-intent prospects approaching SLA. Delivery bay 2 staged for 10:30.
          </Text>

          {/* Quick Action Buttons */}
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.primaryAction} onPress={() => onOpenBookDrive()} activeOpacity={0.85}>
              <Text style={styles.primaryActionText}>📅 Book Test Drive</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction} onPress={onOpenAddProspect} activeOpacity={0.85}>
              <Text style={styles.secondaryActionText}>＋ Add Prospect</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Next Up Card */}
        {nextEvent && (
          <View style={styles.nextUpCard}>
            <View style={styles.nextUpHeader}>
              <View style={styles.nextUpPulse} />
              <Text style={styles.nextUpLabel}>Next Up · In 38 min</Text>
              <Text style={styles.nextUpTime}>{nextEvent.time}</Text>
            </View>
            <View style={styles.nextUpBody}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextUpName} numberOfLines={1}>{nextLead?.name || 'Sarah Mitchell'}</Text>
                <Text style={styles.nextUpDetail} numberOfLines={1}>{nextEvent.detail}</Text>
              </View>
              <TouchableOpacity
                style={styles.nextUpArrow}
                onPress={() => nextLead && onSelectLead(nextLead)}
              >
                <Text style={styles.nextUpArrowText}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Metric Cards Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricsScroll} contentContainerStyle={styles.metricsContent}>
        <MetricCard label="Needs Me" value={String(needsMeCount)} change="Approaching 15m SLA" icon="⚠️" tone="red" />
        <MetricCard label="Appointments" value={String(todayCount)} change="Drives & handovers" icon="📅" tone="cyan" />
        <MetricCard label="Conversations" value={String(conversationCount)} change="Active threads" icon="💬" tone="neutral" />
        <MetricCard label="Deliveries" value={String(deliveriesCount)} change="Staged this week" icon="🚗" tone="green" />
      </ScrollView>

      {/* Priority Queue */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardEyebrow}>Priority Queue</Text>
            <Text style={styles.cardTitle}>Needs your attention</Text>
          </View>
          <TouchableOpacity style={styles.textLink} onPress={() => onNavigateTab('leads')}>
            <Text style={styles.textLinkText}>View all ({leads.length}) →</Text>
          </TouchableOpacity>
        </View>

        {leads.slice(0, 5).map((lead) => {
          const stageColor = getStageColor(lead.stage);
          return (
            <TouchableOpacity
              key={String(lead.id || lead._id)}
              style={styles.leadRow}
              onPress={() => onSelectLead(lead)}
              activeOpacity={0.8}
            >
              {lead.priority && <View style={styles.priorityDot} />}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{lead.initials}</Text>
              </View>
              <View style={styles.leadInfo}>
                <View style={styles.leadTopRow}>
                  <Text style={styles.leadName} numberOfLines={1}>{lead.name}</Text>
                  <View style={[styles.stagePill, { backgroundColor: stageColor.bg }]}>
                    <Text style={[styles.stagePillText, { color: stageColor.text }]}>{lead.stage}</Text>
                  </View>
                  <Text style={styles.leadScore}>{lead.score}pts</Text>
                </View>
                <Text style={styles.leadDetail} numberOfLines={1}>{lead.model} · {lead.lastTouch}</Text>
              </View>
              <TouchableOpacity
                style={styles.actionChip}
                onPress={() => {
                  if (lead.action === 'Reply now' || lead.action === 'Send follow-up' || lead.action === 'Make first touch') {
                    onOpenMessage(lead);
                  } else if (lead.action === 'Book drive') {
                    onOpenBookDrive(lead);
                  } else if (lead.action === 'View delivery') {
                    onNavigateTab('deliveries');
                  } else {
                    onSelectLead(lead);
                  }
                }}
              >
                <Text style={styles.actionChipText} numberOfLines={1}>{lead.action}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day Rail */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardEyebrow}>Day Rail</Text>
            <Text style={styles.cardTitle}>Today's rhythm</Text>
          </View>
          <TouchableOpacity style={styles.textLink} onPress={() => onNavigateTab('calendar')}>
            <Text style={styles.textLinkText}>Open calendar →</Text>
          </TouchableOpacity>
        </View>

        {timelineEvents.map((evt, idx) => (
          <View key={idx} style={styles.timelineRow}>
            <Text style={styles.timelineTime}>{evt.time}</Text>
            <View style={[styles.timelineDot, { backgroundColor: getEventDotColor(evt.type) }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.timelineTitle} numberOfLines={1}>{evt.title}</Text>
              <Text style={styles.timelineDetail} numberOfLines={1}>{evt.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Delivery Spotlight */}
      <TouchableOpacity
        style={styles.deliveryCard}
        onPress={() => onNavigateTab('deliveries')}
        activeOpacity={0.9}
      >
        <View style={styles.deliveryBg} />
        <View style={styles.deliveryOverlay}>
          <View style={styles.deliveryReadyPill}>
            <Text style={styles.deliveryReadyText}>Ready for Handover</Text>
          </View>
          <Text style={styles.deliveryName}>Priya Nair · ATTO 3 Extended</Text>
          <Text style={styles.deliveryDetail}>Delivery bay 2 · Today at 10:30 AM · Sophie Tran</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MetricCard({ label, value, change, icon, tone }: {
  label: string; value: string; change: string; icon: string; tone: string;
}) {
  const toneColors: Record<string, string> = {
    red: '#e60012',
    cyan: '#06b6d4',
    neutral: '#64748b',
    green: '#10b981',
  };
  const color = toneColors[tone] || '#64748b';
  return (
    <View style={[metricStyles.card, { borderTopColor: color }]}>
      <Text style={metricStyles.icon}>{icon}</Text>
      <Text style={[metricStyles.value, { color }]}>{value}</Text>
      <Text style={metricStyles.label}>{label}</Text>
      <Text style={metricStyles.change}>{change}</Text>
    </View>
  );
}

const metricStyles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    borderTopWidth: 3,
    ...Shadows.sm,
  },
  icon: { fontSize: 20, marginBottom: Spacing.xs },
  value: { fontSize: Typography.xxl, fontWeight: Typography.extrabold, lineHeight: 30 },
  label: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textSecondary, marginTop: 2 },
  change: { fontSize: Typography.xs - 1, color: Colors.textMuted, marginTop: 2 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.light },
  content: { paddingBottom: Spacing.xl },

  // Hero
  heroBanner: {
    backgroundColor: '#171b22',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(230,0,18,0.15)',
  },
  heroContent: { position: 'relative', zIndex: 1 },
  heroEyebrow: {
    color: '#94a3b8',
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
  },
  heroTitle: {
    color: '#fff',
    fontSize: Typography.xxxl - 4,
    fontWeight: Typography.extrabold,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  heroTitleAccent: { color: '#ff6c5e' },
  heroSubtitle: {
    color: '#94a3b8',
    fontSize: Typography.sm,
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    flexWrap: 'wrap',
  },
  primaryAction: {
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Shadows.brand,
  },
  primaryActionText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.bold },
  secondaryAction: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  secondaryActionText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.semibold },

  // Next Up Card
  nextUpCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  nextUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  nextUpPulse: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#10b981',
  },
  nextUpLabel: { color: '#94a3b8', fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 0.8, flex: 1 },
  nextUpTime: { color: '#67e8f9', fontSize: Typography.xs, fontWeight: Typography.bold, fontFamily: 'monospace' },
  nextUpBody: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  nextUpName: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.semibold },
  nextUpDetail: { color: '#94a3b8', fontSize: Typography.xs, marginTop: 1 },
  nextUpArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  nextUpArrowText: { color: '#fff', fontSize: Typography.sm },

  // Metrics
  metricsScroll: { marginTop: Spacing.md },
  metricsContent: { paddingHorizontal: Spacing.base, paddingBottom: 4 },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cardEyebrow: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cardTitle: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.bold },
  textLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  textLinkText: { color: Colors.brand, fontSize: Typography.xs, fontWeight: Typography.semibold },

  // Lead rows
  leadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: Spacing.sm,
    position: 'relative',
  },
  priorityDot: {
    position: 'absolute',
    left: -8,
    top: '50%',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.brand,
    marginTop: -2,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: '#fff', fontSize: Typography.xs, fontWeight: Typography.bold },
  leadInfo: { flex: 1, minWidth: 0 },
  leadTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  leadName: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.semibold, flexShrink: 1 },
  stagePill: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  stagePillText: { fontSize: Typography.xs - 1, fontWeight: Typography.semibold },
  leadScore: { color: Colors.textMuted, fontSize: Typography.xs, fontFamily: 'monospace' },
  leadDetail: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  actionChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexShrink: 0,
    maxWidth: 100,
  },
  actionChipText: { color: Colors.textSecondary, fontSize: Typography.xs - 1, fontWeight: Typography.medium },

  // Timeline
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  timelineTime: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontFamily: 'monospace',
    fontWeight: Typography.bold,
    width: 40,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 3,
    flexShrink: 0,
  },
  timelineTitle: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.semibold },
  timelineDetail: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },

  // Delivery Card
  deliveryCard: {
    height: 140,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.md,
  },
  deliveryBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#171b22',
  },
  deliveryOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    padding: Spacing.base,
  },
  deliveryReadyPill: {
    backgroundColor: '#10b981',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  deliveryReadyText: { color: '#fff', fontSize: Typography.xs - 1, fontWeight: Typography.bold },
  deliveryName: { color: '#fff', fontSize: Typography.lg, fontWeight: Typography.bold },
  deliveryDetail: { color: '#94a3b8', fontSize: Typography.xs, marginTop: 2 },
});
