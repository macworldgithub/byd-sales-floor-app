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
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { Lead, Delivery, Appointment, UserRole } from '../lib/types';
import { searchApi } from '../lib/api';

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

  return (
    <>
      <View style={styles.topbar}>
        {/* Left Greeting & Location */}
        <View style={styles.leftCol}>
          <Text style={styles.kicker}>BYD MELBOURNE CBD · FLOOR OS</Text>
          <Text style={styles.greeting}>Good morning, {firstName}</Text>
        </View>

        {/* Right Tools */}
        <View style={styles.rightTools}>
          {/* Online Dot */}
          <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#10b981' : '#f59e0b' }]} />

          {/* Search Trigger */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIsSearchOpen(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.toolIcon}>🔍</Text>
          </TouchableOpacity>

          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.75}
          >
            <Text style={styles.toolIcon}>🔔</Text>
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
            <Text style={styles.rolePillText}>
              {role === 'consultant' ? 'Specialist' : role === 'manager' ? 'Manager' : 'Principal'}
            </Text>
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
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search name, phone, model..."
                placeholderTextColor={Colors.textMuted}
                autoFocus={true}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
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
                  <Text style={styles.noResultsText}>No matching showroom prospects found.</Text>
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
                    activeOpacity={0.8}
                  >
                    <View style={styles.resultAvatar}>
                      <Text style={styles.resultAvatarText}>{lead.initials || 'BY'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName}>{lead.name}</Text>
                      <Text style={styles.resultDetail}>
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
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1,
  },
  kicker: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  greeting: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 1,
  },
  rightTools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  iconBtn: {
    position: 'relative',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIcon: {
    fontSize: 14,
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.brand,
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
  rolePill: {
    backgroundColor: Colors.dark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  rolePillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Search Modal
  searchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingTop: 50,
  },
  searchContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#f1f5f9',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  closeSearch: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  closeSearchText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.brand,
  },
  resultsList: {
    marginTop: Spacing.md,
  },
  noResults: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: Typography.xs + 1,
    color: Colors.textMuted,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: Spacing.sm,
  },
  resultAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultAvatarText: {
    color: '#fff',
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  resultName: {
    fontSize: Typography.base - 1,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  resultDetail: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  scoreChip: {
    backgroundColor: 'rgba(230,0,18,0.08)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  scoreChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.brand,
  },
});
