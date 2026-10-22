import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { UserRole } from '../lib/types';
import { useAuth } from '../lib/auth';

interface MoreScreenProps {
  role: UserRole;
  onSetRole: (role: UserRole) => void;
  onNavigateTab: (tab: string) => void;
  onOpenBookDrive: () => void;
  onOpenAddProspect: () => void;
  isOnline: boolean;
}

const ROLE_OPTIONS: { value: UserRole; label: string; desc: string }[] = [
  { value: 'consultant', label: 'Sales Consultant', desc: 'Personal floor view' },
  { value: 'manager', label: 'Floor Manager', desc: 'Team allocation + analytics' },
  { value: 'principal', label: 'Principal', desc: 'Full business overview' },
  { value: 'super_admin', label: 'Super Admin', desc: 'All access + config' },
];

export default function MoreScreen({
  role,
  onSetRole,
  onNavigateTab,
  onOpenBookDrive,
  onOpenAddProspect,
  isOnline,
}: MoreScreenProps) {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const quickActions = [
    { label: 'Floor Calendar', icon: '🗓️', action: () => onNavigateTab('calendar') },
    { label: 'Book Test Drive', icon: '📅', action: onOpenBookDrive },
    { label: 'Add Prospect', icon: '➕', action: onOpenAddProspect },
    { label: 'Allocation Board', icon: '🗂', action: () => onNavigateTab('allocation') },
    { label: 'Performance Reports', icon: '📊', action: () => onNavigateTab('reports') },
    { label: 'Template Studio', icon: '✍️', action: () => onNavigateTab('templates') },
    { label: 'Staff Board', icon: '👥', action: () => onNavigateTab('staff') },
    { label: 'Sequences', icon: '⚡', action: () => onNavigateTab('sequences') },
  ];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* User Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>
            {(user?.name || 'AR').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{user?.name || 'Alex Rivers'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'alex.rivers@byd.com'}</Text>
          <View style={styles.profileMeta}>
            <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#10b981' : '#f59e0b' }]} />
            <Text style={styles.profileMetaText}>{isOnline ? 'Online' : 'Offline Mode'}</Text>
            <Text style={styles.profileMetaSep}>·</Text>
            <Text style={styles.profileMetaText}>Melbourne CBD</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.actionGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionGridItem}
              onPress={action.action}
              activeOpacity={0.8}
            >
              <Text style={styles.actionGridIcon}>{action.icon}</Text>
              <Text style={styles.actionGridLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Role Switcher */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ROLE SWITCHER</Text>
        <View style={styles.card}>
          <Text style={styles.cardDescription}>
            Switch your active role to change the floor view and available features.
          </Text>
          {ROLE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.roleOption, role === option.value && styles.roleOptionActive]}
              onPress={() => onSetRole(option.value)}
              activeOpacity={0.8}
            >
              <View style={styles.roleRadio}>
                {role === option.value && <View style={styles.roleRadioInner} />}
              </View>
              <View>
                <Text style={[styles.roleOptionLabel, role === option.value && { color: Colors.brand }]}>
                  {option.label}
                </Text>
                <Text style={styles.roleOptionDesc}>{option.desc}</Text>
              </View>
              {role === option.value && (
                <View style={styles.roleActiveBadge}>
                  <Text style={styles.roleActiveBadgeText}>Active</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SETTINGS</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Lead alerts & SLA reminders</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#e2e8f0', true: 'rgba(230,0,18,0.3)' }}
              thumbColor={notificationsEnabled ? Colors.brand : '#94a3b8'}
            />
          </View>
          <View style={styles.settingDivider} />
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Network Status</Text>
              <Text style={styles.settingDesc}>{isOnline ? 'Connected – real-time sync active' : 'Offline – actions queued locally'}</Text>
            </View>
            <View style={[styles.networkBadge, { backgroundColor: isOnline ? '#f0fdf4' : '#fffbeb' }]}>
              <View style={[styles.networkDot, { backgroundColor: isOnline ? '#10b981' : '#f59e0b' }]} />
              <Text style={[styles.networkBadgeText, { color: isOnline ? '#166534' : '#92400e' }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>2.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dealership</Text>
            <Text style={styles.infoValue}>BYD Melbourne CBD</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Organisation</Text>
            <Text style={styles.infoValue}>Harmony Auto Group</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>360 Elizabeth St, Melbourne</Text>
          </View>
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={logout}
        activeOpacity={0.85}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>Sales Floor OS · BYD Harmony Auto Group · Secure Session</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.light },
  content: { paddingBottom: Spacing.xxxl },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.darkCard,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
  },
  profileAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.brand,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.brand,
  },
  profileAvatarText: { color: '#fff', fontSize: Typography.lg, fontWeight: Typography.bold },
  profileName: { color: '#fff', fontSize: Typography.base, fontWeight: Typography.bold },
  profileEmail: { color: Colors.textDarkSecondary, fontSize: Typography.xs, marginTop: 1 },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  profileMetaText: { color: Colors.textDarkMuted, fontSize: Typography.xs },
  profileMetaSep: { color: Colors.textDarkMuted, fontSize: Typography.xs },

  section: { marginTop: Spacing.lg, paddingHorizontal: Spacing.base },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs - 1,
    fontWeight: Typography.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  cardDescription: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionGridItem: {
    width: '30%',
    aspectRatio: 1.1,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  actionGridIcon: { fontSize: 24 },
  actionGridLabel: { color: Colors.textSecondary, fontSize: Typography.xs - 1, fontWeight: Typography.semibold, textAlign: 'center' },

  // Role switcher
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  roleOptionActive: { backgroundColor: 'rgba(230,0,18,0.03)', marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md },
  roleRadio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  roleRadioInner: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.brand,
  },
  roleOptionLabel: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.semibold },
  roleOptionDesc: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  roleActiveBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(230,0,18,0.1)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  roleActiveBadgeText: { color: Colors.brand, fontSize: Typography.xs - 1, fontWeight: Typography.bold },

  // Settings
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  settingLabel: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.semibold },
  settingDesc: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  settingDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 4 },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  networkDot: { width: 6, height: 6, borderRadius: 3 },
  networkBadgeText: { fontSize: Typography.xs, fontWeight: Typography.bold },

  // Info
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  infoLabel: { color: Colors.textMuted, fontSize: Typography.sm },
  infoValue: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.medium },

  // Sign out
  signOutBtn: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.lg,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  signOutText: { color: '#ef4444', fontSize: Typography.base, fontWeight: Typography.semibold },

  footerText: {
    color: Colors.textMuted,
    fontSize: Typography.xs - 1,
    textAlign: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.base,
  },
});
