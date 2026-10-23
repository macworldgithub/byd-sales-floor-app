import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    case 'Imported':
      return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
    case 'Engaged':
      return { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' };
    case 'Qualified':
      return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' };
    case 'Committed':
      return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' };
    default:
      return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
  }
};

const getEventDotColor = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'drive':
      return Colors.brand;
    case 'delivery':
      return Colors.success;
    case 'followup':
      return Colors.warning;
    case 'hold':
      return '#64748b';
    default:
      return '#94a3b8';
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
  const needsMeCount =
    leads.filter((l) => l.priority || (l.score ?? 0) >= 80 || l.stage === 'Imported').length || 4;
  const todayCount = timelineEvents.length || 6;
  const conversationCount = leads.length + 8;
  const deliveriesCount = deliveries.length || 5;

  const nextEvent = timelineEvents[0];
  const nextLead = leads.find((l) => nextEvent && nextEvent.title.includes(l.name)) || leads[0];

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
        <View style={styles.heroBgGlow} />
        <View style={styles.heroContent}>
          <View style={styles.heroEyebrowRow}>
            <View style={styles.livePulseDot} />
            <Text style={styles.heroEyebrow}>MELBOURNE CBD · MON 8 SEP</Text>
          </View>
          <Text style={styles.heroTitle}>
            YOUR FLOOR,{'\n'}
            <Text style={styles.heroTitleAccent}>IN MOTION.</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            {needsMeCount} high-intent prospects approaching SLA. Delivery bay 2 staged for 10:30.
          </Text>

          {/* Quick Action Buttons */}
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => onOpenBookDrive()}
              activeOpacity={0.85}
            >
              <Ionicons name="calendar" size={16} color="#ffffff" style={styles.actionIcon} />
              <Text style={styles.primaryActionText}>Book Test Drive</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={onOpenAddProspect}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add" size={15} color="#f8fafc" style={styles.actionIcon} />
              <Text style={styles.secondaryActionText}>Add Prospect</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Next Up Card */}
        {nextEvent && (
          <TouchableOpacity
            style={styles.nextUpCard}
            onPress={() => nextLead && onSelectLead(nextLead)}
            activeOpacity={0.88}
          >
            <View style={styles.nextUpHeader}>
              <View style={styles.nextUpStatusRow}>
                <View style={styles.nextUpPulse} />
                <Text style={styles.nextUpLabel}>Next Up · In 38 min</Text>
              </View>
              <View style={styles.nextUpTimeChip}>
                <Ionicons name="time-outline" size={13} color="#38bdf8" />
                <Text style={styles.nextUpTime}>{nextEvent.time}</Text>
              </View>
            </View>
            <View style={styles.nextUpBody}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nextUpName} numberOfLines={1}>
                  {nextLead?.name || 'Sarah Mitchell'}
                </Text>
                <Text style={styles.nextUpDetail} numberOfLines={1}>
                  {nextEvent.detail}
                </Text>
              </View>
              <View style={styles.nextUpArrowWrap}>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Metric Cards Row */}
      <View style={styles.metricsSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.metricsScroll}
          contentContainerStyle={styles.metricsContent}
        >
          <MetricCard
            label="Needs Me"
            value={String(needsMeCount)}
            change="Approaching 15m SLA"
            iconName="alert-circle"
            tone="red"
          />
          <MetricCard
            label="Appointments"
            value={String(todayCount)}
            change="Drives & handovers"
            iconName="calendar"
            tone="cyan"
          />
          <MetricCard
            label="Conversations"
            value={String(conversationCount)}
            change="Active threads"
            iconName="chatbubbles"
            tone="neutral"
          />
          <MetricCard
            label="Deliveries"
            value={String(deliveriesCount)}
            change="Staged this week"
            iconName="car-sport"
            tone="green"
          />
        </ScrollView>
      </View>

      {/* Priority Queue */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardEyebrow}>PRIORITY QUEUE</Text>
            <Text style={styles.cardTitle}>Needs your attention</Text>
          </View>
          <TouchableOpacity
            style={styles.textLink}
            onPress={() => onNavigateTab('leads')}
            activeOpacity={0.7}
          >
            <Text style={styles.textLinkText}>View all ({leads.length})</Text>
            <Ionicons name="arrow-forward" size={13} color={Colors.brand} />
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
                  <Text style={styles.leadName} numberOfLines={1}>
                    {lead.name}
                  </Text>
                  <View
                    style={[
                      styles.stagePill,
                      { backgroundColor: stageColor.bg, borderColor: stageColor.border },
                    ]}
                  >
                    <Text style={[styles.stagePillText, { color: stageColor.text }]}>
                      {lead.stage}
                    </Text>
                  </View>
                  <Text style={styles.leadScore}>{lead.score}pts</Text>
                </View>
                <Text style={styles.leadDetail} numberOfLines={1}>
                  {lead.model} · {lead.lastTouch}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.actionChip}
                onPress={() => {
                  if (
                    lead.action === 'Reply now' ||
                    lead.action === 'Send follow-up' ||
                    lead.action === 'Make first touch'
                  ) {
                    onOpenMessage(lead);
                  } else if (lead.action === 'Book drive') {
                    onOpenBookDrive(lead);
                  } else if (lead.action === 'View delivery') {
                    onNavigateTab('deliveries');
                  } else {
                    onSelectLead(lead);
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.actionChipText} numberOfLines={1}>
                  {lead.action}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day Rail */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardEyebrow}>DAY RAIL</Text>
            <Text style={styles.cardTitle}>Today's rhythm</Text>
          </View>
          <TouchableOpacity
            style={styles.textLink}
            onPress={() => onNavigateTab('calendar')}
            activeOpacity={0.7}
          >
            <Text style={styles.textLinkText}>Open calendar</Text>
            <Ionicons name="arrow-forward" size={13} color={Colors.brand} />
          </TouchableOpacity>
        </View>

        {timelineEvents.map((evt, idx) => (
          <View key={idx} style={styles.timelineRow}>
            <Text style={styles.timelineTime}>{evt.time}</Text>
            <View
              style={[
                styles.timelineDot,
                { backgroundColor: getEventDotColor(evt.type) },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.timelineTitle} numberOfLines={1}>
                {evt.title}
              </Text>
              <Text style={styles.timelineDetail} numberOfLines={1}>
                {evt.detail}
              </Text>
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
        <View style={styles.deliveryOverlay}>
          <View style={styles.deliveryTopRow}>
            <View style={styles.deliveryReadyPill}>
              <Ionicons name="key" size={13} color="#065f46" style={{ marginRight: 4 }} />
              <Text style={styles.deliveryReadyText}>Ready for Handover</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ffffff" />
          </View>
          <Text style={styles.deliveryName}>Priya Nair · ATTO 3 Extended</Text>
          <Text style={styles.deliveryDetail}>Delivery bay 2 · Today at 10:30 AM · Sophie Tran</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MetricCard({
  label,
  value,
  change,
  iconName,
  tone,
}: {
  label: string;
  value: string;
  change: string;
  iconName: keyof typeof Ionicons.glyphMap;
  tone: 'red' | 'cyan' | 'neutral' | 'green';
}) {
  const toneConfigs = {
    red: { color: Colors.brand, bg: '#fff1f2', border: '#fecdd3' },
    cyan: { color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
    neutral: { color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
    green: { color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
  };
  const config = toneConfigs[tone] || toneConfigs.neutral;

  return (
    <View style={[metricStyles.card, { borderTopColor: config.color }]}>
      <View style={[metricStyles.iconWrap, { backgroundColor: config.bg }]}>
        <Ionicons name={iconName} size={18} color={config.color} />
      </View>
      <Text style={[metricStyles.value, { color: config.color }]}>{value}</Text>
      <Text style={metricStyles.label}>{label}</Text>
      <Text style={metricStyles.change} numberOfLines={1}>
        {change}
      </Text>
    </View>
  );
}

const metricStyles = StyleSheet.create({
  card: {
    width: 145,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    borderTopWidth: 3,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: Typography.xxl,
    fontWeight: '800',
    lineHeight: 28,
  },
  label: {
    fontSize: Typography.xs + 1,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 3,
  },
  change: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textMuted,
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.light },
  content: { paddingBottom: Spacing.xxxl },

  // Hero
  heroBanner: {
    backgroundColor: '#0c121e',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBgGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(230, 0, 18, 0.16)',
  },
  heroContent: { position: 'relative', zIndex: 1 },
  heroEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  heroEyebrow: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: Typography.displayMedium.fontSize,
    fontWeight: '800',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heroTitleAccent: {
    color: Colors.brand,
  },
  heroSubtitle: {
    color: '#94a3b8',
    fontSize: Typography.xs + 1,
    lineHeight: 18,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },

  // Hero Actions
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionIcon: {
    marginRight: 6,
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    ...Shadows.brand,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: Typography.xs + 1,
    fontWeight: '700',
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
  },
  secondaryActionText: {
    color: '#f8fafc',
    fontSize: Typography.xs + 1,
    fontWeight: '600',
  },

  // Next Up Card
  nextUpCard: {
    backgroundColor: 'rgba(19, 25, 38, 0.95)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  nextUpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  nextUpStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextUpPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
  },
  nextUpLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nextUpTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  nextUpTime: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  nextUpBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  nextUpName: {
    color: '#ffffff',
    fontSize: Typography.base,
    fontWeight: '700',
  },
  nextUpDetail: {
    color: '#94a3b8',
    fontSize: Typography.xs,
    marginTop: 2,
  },
  nextUpArrowWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Metrics
  metricsSection: {
    marginTop: Spacing.md,
  },
  metricsScroll: {},
  metricsContent: {
    paddingHorizontal: Spacing.base,
  },

  // Standard Card Section
  card: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: Typography.titleSmall.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 1,
  },
  textLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  textLinkText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.brand,
  },

  // Leads in Priority Queue
  leadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    position: 'relative',
  },
  priorityDot: {
    position: 'absolute',
    left: -4,
    top: '50%',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.brand,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  leadInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  leadTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leadName: {
    fontSize: Typography.base - 1,
    fontWeight: '700',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  stagePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  stagePillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  leadScore: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.brand,
    fontFamily: 'monospace',
    marginLeft: 'auto',
  },
  leadDetail: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionChipText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Timeline
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  timelineTime: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
    width: 48,
    fontFamily: 'monospace',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: Spacing.sm,
    marginTop: 4,
  },
  timelineTitle: {
    fontSize: Typography.xs + 1,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  timelineDetail: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Delivery Spotlight
  deliveryCard: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    backgroundColor: '#0c121e',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  deliveryOverlay: {
    padding: Spacing.base,
  },
  deliveryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  deliveryReadyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  deliveryReadyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065f46',
  },
  deliveryName: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#ffffff',
  },
  deliveryDetail: {
    fontSize: Typography.xs,
    color: '#94a3b8',
    marginTop: 2,
  },
});
