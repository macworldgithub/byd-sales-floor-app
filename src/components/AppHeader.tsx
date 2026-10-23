import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { Lead, UserRole } from '../lib/types';

interface AppHeaderProps {
  userName?: string;
  role: UserRole;
  isOnline: boolean;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onSelectLead: (lead: Lead) => void;
  leads: Lead[];
}

export default function AppHeader({
  userName = 'Alex',
  role,
  isOnline,
  unreadNotificationsCount,
  onOpenNotifications,
  onSelectLead,
  leads,
}: AppHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Lead[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const matches = leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.model || '').toLowerCase().includes(q) ||
        (l.phone || '').includes(q)
    );
    setSearchResults(matches);
  }, [searchQuery, leads]);

  const firstName = userName.split(' ')[0];

  const roleLabel =
    role === 'consultant' ? 'Specialist' : role === 'manager' ? 'Floor Manager' : 'Principal';

  return (
    <>
      <View style={styles.topbar}>
        {/* Left Greeting & Location */}
        <View style={styles.leftCol}>
          <View style={styles.kickerRow}>
            <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#10b981' : '#f59e0b' }]} />
            <Text style={styles.kicker}>BYD MELBOURNE CBD · FLOOR OS</Text>
          </View>
          <Text style={styles.greeting} numberOfLines={1}>
            Good morning, <Text style={styles.greetingBold}>{firstName}</Text>
          </Text>
        </View>

        {/* Right Tools */}
        <View style={styles.rightTools}>
          {/* Search Trigger */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIsSearchOpen(true)}
            activeOpacity={0.75}
            accessibilityLabel="Search floor"
          >
            <Ionicons name="search" size={17} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.75}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={18} color={Colors.textSecondary} />
            {unreadNotificationsCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Role Pill */}
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{roleLabel}</Text>
          </View>
        </View>
      </View>

      {/* Global Search Modal */}
      <Modal
        visible={isSearchOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsSearchOpen(false)}
      >
        <View style={styles.searchOverlay}>
          <View style={styles.searchContainer}>
            <View style={styles.searchHeader}>
              <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchHeaderIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search name, mobile, model, VIN…"
                placeholderTextColor={Colors.textMuted}
                autoFocus={true}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={17} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                style={styles.closeSearch}
              >
                <Text style={styles.closeSearchText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
              {searchQuery.trim().length > 0 && searchResults.length === 0 ? (
                <View style={styles.noResults}>
                  <Ionicons name="search-outline" size={32} color={Colors.textMuted} style={{ marginBottom: Spacing.sm }} />
                  <Text style={styles.noResultsText}>No matching showroom prospects found.</Text>
                  <Text style={styles.noResultsSub}>Try searching for Sarah, SEAL, or mobile digits</Text>
                </View>
              ) : (
                searchResults.map((lead) => (
                  <TouchableOpacity
                    key={String(lead._id || lead.id)}
                    style={styles.resultItem}
                    onPress={() => {
                      setIsSearchOpen(false);
                      onSelectLead(lead);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.resultAvatar}>
                      <Text style={styles.resultAvatarText}>{lead.initials || 'BY'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName}>{lead.name}</Text>
                      <Text style={styles.resultDetail} numberOfLines={1}>
                        {lead.model || 'BYD Range'} · {lead.stage || 'Imported'} · {lead.phone}
                      </Text>
                    </View>
                    <View style={styles.scoreChip}>
                      <Text style={styles.scoreChipText}>{lead.score || 75} pts</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  topbar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm + 2,
    paddingBottom: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  greeting: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  greetingBold: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  rightTools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  iconBtn: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  notifBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  rolePill: {
    backgroundColor: Colors.dark,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  rolePillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Search Modal
  searchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.65)',
    paddingTop: 50,
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 2,
  },
  searchHeaderIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  clearBtn: {
    padding: Spacing.xs,
    marginRight: Spacing.xs,
  },
  closeSearch: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  closeSearchText: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.brand,
  },
  resultsList: {
    marginTop: Spacing.md,
  },
  noResults: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  noResultsSub: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: Spacing.md,
  },
  resultAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultAvatarText: {
    color: '#ffffff',
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  resultName: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  resultDetail: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scoreChip: {
    backgroundColor: Colors.brandSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: Colors.brandBorder,
  },
  scoreChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.brand,
    fontFamily: 'monospace',
  },
});
