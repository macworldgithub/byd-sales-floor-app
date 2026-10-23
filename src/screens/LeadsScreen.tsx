import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { Lead } from '../lib/types';
import { leadApi } from '../lib/api';

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
            <Text style={styles.avatarText}>{lead.initials || 'BY'}</Text>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.leadTopRow}>
              <Text style={styles.leadName} numberOfLines={1}>{lead.name}</Text>
              <View style={styles.scorePill}>
                <Ionicons name="flame" size={11} color={Colors.brand} />
                <Text style={styles.leadScore}>{lead.score || 75} pts</Text>
              </View>
            </View>
            <View style={styles.leadMiddleRow}>
              <View style={[styles.stagePill, { backgroundColor: stageColor.bg, borderColor: stageColor.border }]}>
                <Text style={[styles.stagePillText, { color: stageColor.text }]}>{lead.stage}</Text>
              </View>
              <Text style={styles.leadSource}>via {lead.source || 'Walk-in'}</Text>
            </View>
            <Text style={styles.leadModel} numberOfLines={1}>{lead.model || 'BYD Range'}</Text>
            <Text style={styles.leadTouch} numberOfLines={1}>{lead.lastTouch || 'Active recently'}</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.leadActions}>
          <TouchableOpacity
            style={styles.leadActionBtn}
            onPress={() => onOpenMessage(lead)}
            activeOpacity={0.75}
          >
            <Ionicons name="chatbubble-outline" size={13} color={Colors.brand} />
            <Text style={styles.leadActionText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.leadActionBtn}
            onPress={() => onOpenBookDrive(lead)}
            activeOpacity={0.75}
          >
            <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.leadActionText}>Book Drive</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.leadActionBtn, styles.leadActionPrimary]}
            onPress={() => onSelectLead(lead)}
            activeOpacity={0.75}
          >
            <Text style={[styles.leadActionText, { color: '#ffffff' }]}>View</Text>
            <Ionicons name="chevron-forward" size={13} color="#ffffff" />
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
          <Text style={styles.headerEyebrow}>LEAD CENTRE · PIPELINE</Text>
          <Text style={styles.headerTitle}>Showroom Leads</Text>
        </View>
        <View style={styles.headerRightBtns}>
          {onOpenBulkMessage && (
            <TouchableOpacity
              style={styles.bulkBtn}
              onPress={() => onOpenBulkMessage(leadsList)}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbox-ellipses-outline" size={14} color={Colors.textPrimary} />
              <Text style={styles.bulkBtnText}>Bulk SMS</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addBtn} onPress={onOpenAddProspect} activeOpacity={0.85}>
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text style={styles.addBtnText}>Add Prospect</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Ionicons name="search" size={17} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={(v) => { setSearchQuery(v); }}
            placeholder="Search by name, vehicle model, phone…"
            placeholderTextColor={Colors.textMuted}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stage Filter Tabs */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {STAGES.map(stage => {
            const isActive = selectedStage === stage;
            return (
              <TouchableOpacity
                key={stage}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setSelectedStage(stage)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {stage}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Count summary bar */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{leadsList.length} prospects in pipeline</Text>
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
            <Ionicons name="people-outline" size={44} color={Colors.textMuted} style={{ marginBottom: Spacing.sm }} />
            <Text style={styles.emptyTitle}>No leads found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search query or pipeline filter.</Text>
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
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerEyebrow: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: '800',
    marginTop: 1,
  },
  headerRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  bulkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bulkBtnText: {
    color: Colors.textPrimary,
    fontSize: Typography.xs,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 7,
    ...Shadows.brand,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: Typography.xs,
    fontWeight: '700',
  },

  // Search
  searchRow: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: '#ffffff',
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 40,
    gap: Spacing.xs + 2,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },

  // Filter Tabs
  filterWrap: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.xs + 2,
  },
  filterContent: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: '#f1f5f9',
  },
  filterTabActive: {
    backgroundColor: Colors.dark,
  },
  filterTabText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs + 2,
  },
  countText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textMuted,
  },

  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.sm,
  },
  leadCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  leadCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  priorityIndicator: {
    width: 3,
    height: 38,
    borderRadius: 2,
    backgroundColor: Colors.brand,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  leadTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leadName: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: '700',
    flex: 1,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.brandSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: Colors.brandBorder,
  },
  leadScore: {
    color: Colors.brand,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  leadMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 4,
  },
  stagePill: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
  },
  stagePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  leadSource: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  leadModel: {
    color: Colors.textSecondary,
    fontSize: Typography.xs + 1,
    fontWeight: '600',
    marginTop: 3,
  },
  leadTouch: {
    color: Colors.textMuted,
    fontSize: Typography.xs - 1,
    marginTop: 1,
  },
  leadActions: {
    flexDirection: 'row',
    gap: Spacing.xs + 2,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  leadActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  leadActionPrimary: {
    backgroundColor: Colors.dark,
    borderColor: Colors.dark,
  },
  leadActionText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
