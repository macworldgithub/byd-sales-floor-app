import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { ConversationThread } from '../lib/types';
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
    const initials =
      thread.initials ||
      displayName
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() ||
      'TH';
    const timeDisplay = thread.lastMessageAt
      ? new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : (thread.time || 'Recent');

    const hasUnread = (thread.unreadCount || 0) > 0;

    return (
      <TouchableOpacity
        style={[styles.threadRow, hasUnread && styles.threadRowUnread]}
        onPress={() => onSelectThread(thread)}
        activeOpacity={0.8}
      >
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {hasUnread && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.threadContent}>
          <View style={styles.threadTopRow}>
            <View style={styles.threadNameRow}>
              <Text
                style={[styles.threadName, hasUnread && styles.threadNameBold]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <View style={styles.modelTag}>
                <Ionicons name="car-outline" size={10} color={Colors.textSecondary} style={{ marginRight: 2 }} />
                <Text style={styles.modelTagText}>{thread.model || 'BYD Range'}</Text>
              </View>
            </View>
            <Text style={[styles.threadTime, hasUnread && styles.threadTimeBold]}>{timeDisplay}</Text>
          </View>
          <Text style={[styles.threadPreview, hasUnread && styles.threadPreviewUnread]} numberOfLines={2}>
            {thread.lastMessage || 'Tap to start customer conversation'}
          </Text>
        </View>

        {hasUnread ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{thread.unreadCount}</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
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
          <Text style={styles.headerEyebrow}>CUSTOMER INBOX · ACMA AUDITED</Text>
          <Text style={styles.headerTitle}>Showroom Inbox</Text>
        </View>
        <TouchableOpacity style={styles.composeBtn} onPress={onOpenNewMessage} activeOpacity={0.85}>
          <Ionicons name="create-outline" size={16} color="#ffffff" />
          <Text style={styles.composeBtnText}>New SMS</Text>
        </TouchableOpacity>
      </View>

      {/* Search Field */}
      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Ionicons name="search" size={17} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search threads by customer, mobile or text…"
            placeholderTextColor={Colors.textMuted}
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Info Pill Bar */}
      <View style={styles.infoBar}>
        <View style={styles.complianceRow}>
          <Ionicons name="shield-checkmark" size={14} color="#10b981" />
          <Text style={styles.complianceText}>Opt-out compliant (STOP auto-suppressed)</Text>
        </View>
        <Text style={styles.countText}>{threadsList.length} threads</Text>
      </View>

      {/* Threads List */}
      <FlatList
        data={threadsList}
        keyExtractor={(item) => String(item._id || item.id || item.name)}
        renderItem={renderThread}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={44} color={Colors.textMuted} style={{ marginBottom: Spacing.sm }} />
            <Text style={styles.emptyTitle}>No messages found</Text>
            <Text style={styles.emptySubtitle}>All incoming customer inquiries will appear here in real-time.</Text>
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
  composeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    ...Shadows.brand,
  },
  composeBtnText: {
    color: '#ffffff',
    fontSize: Typography.xs,
    fontWeight: '700',
  },

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

  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#ffffff',
  },
  complianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  complianceText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },

  listContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.xs + 2,
  },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  threadRowUnread: {
    borderColor: '#fca5a5',
    backgroundColor: '#fffdfa',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: Spacing.sm + 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.brand,
    borderWidth: 2,
    borderColor: '#ffffff',
  },

  threadContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  threadTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: Spacing.xs,
  },
  threadName: {
    fontSize: Typography.base - 1,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  threadNameBold: {
    fontWeight: '800',
  },
  modelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: BorderRadius.xs,
  },
  modelTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  threadTime: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  threadTimeBold: {
    color: Colors.brand,
    fontWeight: '700',
  },
  threadPreview: {
    fontSize: Typography.xs + 1,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 3,
  },
  threadPreviewUnread: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },

  unreadBadge: {
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
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
