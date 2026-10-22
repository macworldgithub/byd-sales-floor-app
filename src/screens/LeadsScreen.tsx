import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { Lead } from '../lib/types';
import { leadApi } from '../lib/api';
import { INITIAL_LEADS } from '../lib/data';

interface LeadsScreenProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenAddProspect: () => void;
  onOpenBookDrive: (lead?: Lead) => void;
  onOpenMessage: (lead: Lead) => void;
  onOpenBulkMessage?: (leads: Lead[]) => void;
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

const STAGES = ['All', 'Imported', 'Engaged', 'Qualified', 'Committed'];

export default function LeadsScreen({
  leads,
  onSelectLead,
  onOpenAddProspect,
  onOpenBookDrive,
  onOpenMessage,
  onOpenBulkMessage,
}: LeadsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('All');
  const [leadsList, setLeadsList] = useState<Lead[]>(leads);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLeads = useCallback(async (stage: string, query: string) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (stage !== 'All') params.stage = stage;
      if (query.trim()) params.q = query.trim();
      const res = await leadApi.getLeads(params);
      if (res.success && res.data && res.data.length > 0) {
        setLeadsList(res.data);
      } else {
        // Fallback to local data
        let filtered = leads;
        if (stage !== 'All') filtered = filtered.filter(l => l.stage === stage);
        if (query.trim()) {
          const q = query.toLowerCase();
          filtered = filtered.filter(l =>
            l.name.toLowerCase().includes(q) ||
            (l.model || '').toLowerCase().includes(q) ||
            (l.phone || '').includes(q)
          );
        }
        setLeadsList(filtered);
      }
    } catch {
      let filtered = leads;
      if (stage !== 'All') filtered = filtered.filter(l => l.stage === stage);
      if (query.trim()) {
        const q = query.toLowerCase();
        filtered = filtered.filter(l => l.name.toLowerCase().includes(q));
      }
      setLeadsList(filtered);
    } finally {
      setIsLoading(false);
    }
  }, [leads]);

  useEffect(() => {
    const t = setTimeout(() => fetchLeads(selectedStage, searchQuery), 300);
    return () => clearTimeout(t);
  }, [selectedStage, searchQuery, fetchLeads]);

  const renderLead = ({ item: lead }: { item: Lead }) => {
    const stageColor = getStageColor(lead.stage);
    return (
      <TouchableOpacity
        style={styles.leadCard}
        onPress={() => onSelectLead(lead)}
        activeOpacity={0.85}
      >
        <View style={styles.leadCardTop}>
          {lead.priority && <View style={styles.priorityIndicator} />}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{lead.initials}</Text>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.leadTopRow}>
              <Text style={styles.leadName} numberOfLines={1}>{lead.name}</Text>
              <Text style={styles.leadScore}>{lead.score} pts</Text>
            </View>
            <View style={styles.leadMiddleRow}>
              <View style={[styles.stagePill, { backgroundColor: stageColor.bg }]}>
                <Text style={[styles.stagePillText, { color: stageColor.text }]}>{lead.stage}</Text>
              </View>
              <Text style={styles.leadSource}>{lead.source}</Text>
            </View>
            <Text style={styles.leadModel} numberOfLines={1}>{lead.model}</Text>
            <Text style={styles.leadTouch} numberOfLines={1}>{lead.lastTouch}</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.leadActions}>
          <TouchableOpacity
            style={styles.leadActionBtn}
            onPress={() => onOpenMessage(lead)}
          >
            <Text style={styles.leadActionText}>💬 Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.leadActionBtn}
            onPress={() => onOpenBookDrive(lead)}
          >
            <Text style={styles.leadActionText}>📅 Book Drive</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.leadActionBtn, styles.leadActionPrimary]}
            onPress={() => onSelectLead(lead)}
          >
            <Text style={[styles.leadActionText, { color: '#fff' }]}>View →</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Lead Centre</Text>
          <Text style={styles.headerTitle}>MY LEADS</Text>
        </View>
        <View style={styles.headerRightBtns}>
          {onOpenBulkMessage && (
            <TouchableOpacity
              style={styles.bulkBtn}
              onPress={() => onOpenBulkMessage(leadsList)}
              activeOpacity={0.85}
            >
              <Text style={styles.bulkBtnText}>💬 Bulk SMS</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addBtn} onPress={onOpenAddProspect} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>＋ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={(v) => { setSearchQuery(v); }}
            placeholder="Search by name, model, phone…"
            placeholderTextColor={Colors.textMuted}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Stage Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {STAGES.map(stage => (
          <TouchableOpacity
            key={stage}
            style={[styles.filterTab, selectedStage === stage && styles.filterTabActive]}
            onPress={() => setSelectedStage(stage)}
          >
            <Text style={[styles.filterTabText, selectedStage === stage && styles.filterTabTextActive]}>
              {stage}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{leadsList.length} leads</Text>
        {isLoading && <ActivityIndicator size="small" color={Colors.brand} />}
      </View>

      {/* Lead List */}
      <FlatList
        data={leadsList}
        keyExtractor={(item) => String(item._id || item.id || item.name)}
        renderItem={renderLead}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No leads found</Text>
            <Text style={styles.emptySubtitle}>Adjust your filters or add a new prospect.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.light },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBorder,
  },
  headerEyebrow: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: Typography.extrabold,
    letterSpacing: -0.5,
  },
  headerRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  bulkBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bulkBtnText: { color: Colors.textPrimary, fontSize: Typography.xs, fontWeight: Typography.bold },
  addBtn: {
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.brand,
  },
  addBtnText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.bold },

  searchRow: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBorder,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: Typography.base },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    padding: 0,
  },

  filterRow: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.lightBorder },
  filterContent: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.xs },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: '#f1f5f9',
  },
  filterTabActive: { backgroundColor: Colors.brand },
  filterTabText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textSecondary },
  filterTabTextActive: { color: '#fff' },

  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    backgroundColor: '#f8fafc',
  },
  countText: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.medium },

  listContent: { padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing.xl },

  leadCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  leadCardTop: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  priorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.brand,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.bold },
  leadTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leadName: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.bold, flex: 1 },
  leadScore: { color: Colors.brand, fontSize: Typography.xs, fontWeight: Typography.bold, fontFamily: 'monospace' },
  leadMiddleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 3 },
  stagePill: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  stagePillText: { fontSize: Typography.xs - 1, fontWeight: Typography.semibold },
  leadSource: { color: Colors.textMuted, fontSize: Typography.xs },
  leadModel: { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 2 },
  leadTouch: { color: Colors.textMuted, fontSize: Typography.xs - 1, marginTop: 1 },
  leadActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  leadActionBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  leadActionPrimary: { backgroundColor: '#1e293b', borderColor: '#1e293b' },
  leadActionText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textSecondary },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.md },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.bold },
  emptySubtitle: { color: Colors.textMuted, fontSize: Typography.sm, marginTop: Spacing.xs, textAlign: 'center' },
});
