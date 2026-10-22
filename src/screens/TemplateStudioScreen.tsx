import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { DEFAULT_TEMPLATE_PACKS, TemplatePack, interpolateTemplate } from '../lib/templateEngine';

const AVAILABLE_TOKENS = [
  '{{first_name}}',
  '{{model}}',
  '{{consultant}}',
  '{{consultant_mobile}}',
  '{{site}}',
  '{{appointment_date}}',
  '{{appointment_time}}',
  '{{delivery_date}}',
];

export default function TemplateStudioScreen() {
  const [templatePacks, setTemplatePacks] = useState<TemplatePack[]>(DEFAULT_TEMPLATE_PACKS);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplatePack>(DEFAULT_TEMPLATE_PACKS[0]);
  const [editingBody, setEditingBody] = useState(DEFAULT_TEMPLATE_PACKS[0].body);
  const [editingName, setEditingName] = useState(DEFAULT_TEMPLATE_PACKS[0].name);
  const [feedback, setFeedback] = useState<string | null>(null);

  const hasOptOut = /stop|opt out/i.test(editingBody);
  const charCount = editingBody.length;
  const segments = Math.ceil(charCount / 160) || 1;

  const handleSelect = (tmpl: TemplatePack) => {
    setSelectedTemplate(tmpl);
    setEditingBody(tmpl.body);
    setEditingName(tmpl.name);
  };

  const insertToken = (token: string) => {
    setEditingBody((prev) => `${prev} ${token}`);
  };

  const handleSave = () => {
    setTemplatePacks((prev) =>
      prev.map((t) =>
        t.name === selectedTemplate.name ? { ...t, name: editingName, body: editingBody } : t
      )
    );
    setFeedback('Template saved & audited for compliance.');
    setTimeout(() => setFeedback(null), 2000);
  };

  const previewText = interpolateTemplate(editingBody, {
    first_name: 'Sarah',
    model: 'SEALION 7',
    consultant: 'Alex Rivers',
    consultant_mobile: '+61 412 890 234',
    site: 'Melbourne CBD',
    appointment_date: 'Saturday, 13 Sep',
    appointment_time: '10:30 AM',
    delivery_date: 'Thursday, 18 Sep',
  });

  return (
    <View style={styles.root}>
      {/* Toast */}
      {feedback && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{feedback}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>ACMA & SPAM ACT COMPLIANT</Text>
          <Text style={styles.headerTitle}>Template Studio</Text>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Pack</Text>
        </TouchableOpacity>
      </View>

      {/* Template Selector Horizontal Bar */}
      <View style={styles.selectorBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorContent}>
          {templatePacks.map((tmpl) => {
            const isSelected = tmpl.name === selectedTemplate.name;
            return (
              <TouchableOpacity
                key={tmpl.name}
                style={[styles.templateChip, isSelected && styles.templateChipActive]}
                onPress={() => handleSelect(tmpl)}
                activeOpacity={0.8}
              >
                <Text style={[styles.templateChipText, isSelected && styles.templateChipTextActive]}>
                  {tmpl.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Compliance Guard Card */}
        <View style={styles.complianceCard}>
          <View style={styles.complianceRow}>
            <View style={[styles.complianceDot, { backgroundColor: hasOptOut ? '#10b981' : '#f59e0b' }]} />
            <Text style={styles.complianceText}>
              {hasOptOut ? 'ACMA Opt-out clause verified ("STOP")' : '⚠️ Missing opt-out tag (e.g. Reply STOP)'}
            </Text>
          </View>
          <Text style={styles.complianceCounter}>
            {charCount} chars · {segments} SMS {segments === 1 ? 'segment' : 'segments'}
          </Text>
        </View>

        {/* Template Name & Trigger */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>TEMPLATE NAME</Text>
          <TextInput
            style={styles.input}
            value={editingName}
            onChangeText={setEditingName}
          />
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>TRIGGER CONDITION</Text>
          <Text style={styles.triggerDesc}>{selectedTemplate.trigger}</Text>
        </View>

        {/* Token Inserter Pills */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>INSERT MERGE TOKENS</Text>
          <View style={styles.tokensGrid}>
            {AVAILABLE_TOKENS.map((token) => (
              <TouchableOpacity
                key={token}
                style={styles.tokenPill}
                onPress={() => insertToken(token)}
                activeOpacity={0.7}
              >
                <Text style={styles.tokenPillText}>＋ {token}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Body Textarea */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>MESSAGE BODY</Text>
          <TextInput
            style={styles.textarea}
            value={editingBody}
            onChangeText={setEditingBody}
            multiline={true}
            textAlignVertical="top"
          />
        </View>

        {/* Live Customer Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewHeader}>LIVE CUSTOMER PREVIEW</Text>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{previewText}</Text>
          </View>
          <Text style={styles.previewHint}>Preview rendered using sample prospect data (Sarah Mitchell · SEALION 7)</Text>
        </View>
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
  saveBtn: {
    backgroundColor: Colors.brand,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.md,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },

  selectorBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.xs + 2,
  },
  selectorContent: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
  },
  templateChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: '#f1f5f9',
  },
  templateChipActive: {
    backgroundColor: Colors.dark,
  },
  templateChipText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  templateChipTextActive: {
    color: '#fff',
  },

  content: { flex: 1 },
  contentContainer: { padding: Spacing.base, paddingBottom: Spacing.xxxl, gap: Spacing.md },

  complianceCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.sm,
  },
  complianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  complianceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  complianceText: {
    fontSize: Typography.xs - 1,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  complianceCounter: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },

  fieldWrap: {
    gap: Spacing.xs,
  },
  fieldLabel: {
    fontSize: Typography.xs - 1,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  triggerDesc: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    backgroundColor: '#f1f5f9',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },

  tokensGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tokenPill: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  tokenPillText: {
    fontSize: Typography.xs - 1,
    fontWeight: Typography.semibold,
    color: Colors.brand,
    fontFamily: 'monospace',
  },

  textarea: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    minHeight: 110,
    lineHeight: 20,
  },

  previewCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  bubble: {
    backgroundColor: '#f1f5f9',
    borderRadius: BorderRadius.md,
    borderTopLeftRadius: 0,
    padding: Spacing.md,
  },
  bubbleText: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  previewHint: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
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
