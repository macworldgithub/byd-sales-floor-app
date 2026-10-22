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
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { ConversationThread, Lead } from '../lib/types';
import { conversationApi } from '../lib/api';

interface ConversationsScreenProps {
  threads: ConversationThread[];
  onSelectThread: (thread: ConversationThread) => void;
  onOpenNewMessage: () => void;
}

export default function ConversationsScreen({
  threads,
  onSelectThread,
  onOpenNewMessage,
}: ConversationsScreenProps) {
  const [query, setQuery] = useState('');
  const [threadsList, setThreadsList] = useState<ConversationThread[]>(threads);
  const [isLoading, setIsLoading] = useState(false);

  const fetchThreads = useCallback(async (q: string) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (q.trim()) params.q = q.trim();
      const res = await conversationApi.getConversations(params);
      if (res.success && res.data && res.data.length > 0) {
        setThreadsList(res.data);
      } else {
        const filtered = threads.filter(t =>
          (t.name || t.prospectName || '').toLowerCase().includes(q.toLowerCase()) ||
          (t.model || '').toLowerCase().includes(q.toLowerCase()) ||
          (t.lastMessage || '').toLowerCase().includes(q.toLowerCase())
        );
        setThreadsList(filtered);
      }
    } catch {
      const filtered = threads.filter(t =>
        (t.name || t.prospectName || '').toLowerCase().includes(q.toLowerCase())
      );
      setThreadsList(filtered);
    } finally {
      setIsLoading(false);
    }
  }, [threads]);

  useEffect(() => {
    const t = setTimeout(() => fetchThreads(query), 300);
    return () => clearTimeout(t);
  }, [query, fetchThreads]);

  useEffect(() => {
    if (threads.length > 0 && !query) {
      setThreadsList(threads);
    }
  }, [threads, query]);

  const renderThread = ({ item: thread }: { item: ConversationThread }) => {
    const displayName = thread.prospectName || thread.name || 'Prospect';
    const initials = thread.initials || displayName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'TH';
    const timeDisplay = thread.lastMessageAt
      ? new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : (thread.time || 'Recent');

    return (
      <TouchableOpacity
        style={styles.threadRow}
        onPress={() => onSelectThread(thread)}
        activeOpacity={0.8}
      >
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {!!thread.unreadCount && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.threadContent}>
          <View style={styles.threadTopRow}>
            <View style={styles.threadNameRow}>
              <Text style={[styles.threadName, !!thread.unreadCount && styles.threadNameBold]} numberOfLines={1}>
                {displayName}
              </Text>
              <View style={styles.modelTag}>
                <Text style={styles.modelTagText}>{thread.model || 'BYD Range'}</Text>
              </View>
            </View>
            <Text style={styles.threadTime}>{timeDisplay}</Text>
          </View>
          <Text style={styles.threadPreview} numberOfLines={2}>
            {thread.lastMessage || 'Tap to view conversation'}
          </Text>
        </View>

        {!!thread.unreadCount && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{thread.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const totalUnread = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Compliant Communication</Text>
          <Text style={styles.headerTitle}>CONVERSATION HUB</Text>
        </View>
        <TouchableOpacity style={styles.composeBtn} onPress={onOpenNewMessage} activeOpacity={0.85}>
          <Text style={styles.composeBtnText}>✉ Compose</Text>
        </TouchableOpacity>
      </View>

      {/* Search + ACMA badge */}
      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Filter by customer, mobile, or model…"
            placeholderTextColor={Colors.textMuted}
            clearButtonMode="while-editing"
          />
        </View>
        <View style={styles.acmaBadge}>
          <Text style={styles.acmaText}>🛡 Opt-Out Active</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>{threadsList.length} conversations</Text>
        {totalUnread > 0 && (
          <View style={styles.unreadStat}>
            <Text style={styles.unreadStatText}>{totalUnread} unread</Text>
          </View>
        )}
        {isLoading && <ActivityIndicator size="small" color={Colors.brand} />}
      </View>

      {/* Threads list */}
      <FlatList
        data={threadsList}
        keyExtractor={(item) => String(item._id || item.id)}
        renderItem={renderThread}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No conversations</Text>
            <Text style={styles.emptySubtitle}>Start a new message to get connected.</Text>
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
  composeBtn: {
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.brand,
  },
  composeBtnText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.bold },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBorder,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: Typography.base },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sm, padding: 0 },
  acmaBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
  },
  acmaText: { color: '#166534', fontSize: Typography.xs - 1, fontWeight: Typography.semibold },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    backgroundColor: '#f8fafc',
  },
  statsText: { color: Colors.textMuted, fontSize: Typography.xs, flex: 1 },
  unreadStat: {
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  unreadStatText: { color: '#fff', fontSize: Typography.xs - 1, fontWeight: Typography.bold },

  listContent: { paddingBottom: Spacing.xl, backgroundColor: '#fff' },
  separator: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 76 },

  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    backgroundColor: '#fff',
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#1e293b',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.bold },
  unreadDot: {
    position: 'absolute',
    top: -2, right: -2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.brand,
    borderWidth: 2, borderColor: '#fff',
  },
  threadContent: { flex: 1, minWidth: 0 },
  threadTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  threadNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flex: 1, minWidth: 0 },
  threadName: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.medium, flexShrink: 1 },
  threadNameBold: { fontWeight: Typography.bold },
  modelTag: {
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 1,
  },
  modelTagText: { color: Colors.textMuted, fontSize: Typography.xs - 1, fontWeight: Typography.semibold },
  threadTime: { color: Colors.textMuted, fontSize: Typography.xs, fontFamily: 'monospace', flexShrink: 0 },
  threadPreview: { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 3, lineHeight: 17 },
  unreadBadge: {
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.full,
    minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: { color: '#fff', fontSize: Typography.xs - 1, fontWeight: Typography.bold },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.md },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.bold },
  emptySubtitle: { color: Colors.textMuted, fontSize: Typography.sm, marginTop: Spacing.xs },
});
