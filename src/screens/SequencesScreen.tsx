import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';

interface SequencesScreenProps {
  onNavigateTab: (tab: string) => void;
}

const SEQUENCES = [
  {
    code: 'SEQ-15M',
    title: 'First Touch SLA (15 Min)',
    timing: 'T + 0 to 15 min',
    description: 'Triggered when lead is allocated. SMS first touch introducing consultant and offering test drive.',
    status: 'Active · Floor Default',
  },
  {
    code: 'SEQ-DAY2',
    title: 'Needs Analysis Follow-up',
    timing: 'Day + 2 post first touch',
    description: 'Checks in regarding EV battery range, novated leasing questions, and trade-in appraisals.',
    status: 'Active',
  },
  {
    code: 'SEQ-DRIVE',
    title: 'Post-Drive Commitment Ask',
    timing: 'T + 2h post completed test drive',
    description: 'Requests drive impressions and shares BYD build & price configuration link.',
    status: 'Active',
  },
  {
    code: 'SEQ-NOSHOW',
    title: 'No-Show Re-engagement',
    timing: 'Immediate on No-Show logged',
    description: 'Polite apology and 1-tap rebooking link for showroom test drive loop.',
    status: 'Active',
  },
];

export default function SequencesScreen({ onNavigateTab }: SequencesScreenProps) {
  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>OUTREACH CADENCE · ACMA COMPLIANT</Text>
          <Text style={styles.headerTitle}>Follow-up Sequences</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Intro Card */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Human-Managed Conversations</Text>
          <Text style={styles.introText}>
            Our team writes, reviews, and sends each customer touchpoint. Automated sequence suggestions pop up in the Priority Queue when SLAs or intervals elapse.
          </Text>
          <TouchableOpacity
            style={styles.introBtn}
            onPress={() => onNavigateTab('conversations')}
            activeOpacity={0.85}
          >
            <Text style={styles.introBtnText}>Open Conversations Inbox →</Text>
          </TouchableOpacity>
        </View>

        {/* Sequences list */}
        <Text style={styles.sectionTitle}>SHOWROOM OUTREACH WORKFLOWS</Text>

        {SEQUENCES.map((seq) => (
          <View key={seq.code} style={styles.seqCard}>
            <View style={styles.seqTop}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>{seq.code}</Text>
              </View>
              <Text style={styles.timingText}>{seq.timing}</Text>
            </View>

            <Text style={styles.seqTitle}>{seq.title}</Text>
            <Text style={styles.seqDesc}>{seq.description}</Text>

            <View style={styles.seqFooter}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{seq.status}</Text>
            </View>
          </View>
        ))}
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

  content: { flex: 1 },
  contentContainer: { padding: Spacing.base, paddingBottom: Spacing.xxxl, gap: Spacing.md },

  introCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  introTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  introText: {
    fontSize: Typography.xs + 1,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  introBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    alignItems: 'center',
    backgroundColor: 'rgba(230,0,18,0.06)',
    borderRadius: BorderRadius.md,
  },
  introBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.brand,
  },

  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: Spacing.xs,
  },

  seqCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.sm,
  },
  seqTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeBadge: {
    backgroundColor: Colors.dark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  codeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  timingText: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  seqTitle: {
    fontSize: Typography.base - 1,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs + 2,
  },
  seqDesc: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  seqFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
});
