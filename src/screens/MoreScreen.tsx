import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { UserRole } from '../lib/types';
import { useAuth } from '../lib/auth';
import EditProfileModal from '../components/EditProfileModal';

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

interface QuickAction {
  label: string;
  icon: string;
  color: string;
  action: () => void;
}

export default function MoreScreen({
  role,
  onSetRole,
  onNavigateTab,
  onOpenBookDrive,
  onOpenAddProspect,
  isOnline,
}: MoreScreenProps) {
  const { user, logout, updateUser } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const quickActions: QuickAction[] = [
    { label: 'Calendar', icon: 'calendar-outline', color: '#6366f1', action: () => onNavigateTab('calendar') },
    { label: 'Book Drive', icon: 'car-sport-outline', color: Colors.brand, action: onOpenBookDrive },
    { label: 'Add Prospect', icon: 'person-add-outline', color: '#10b981', action: onOpenAddProspect },
    { label: 'Allocation', icon: 'git-branch-outline', color: '#f59e0b', action: () => onNavigateTab('allocation') },
    { label: 'Performance', icon: 'bar-chart-outline', color: '#8b5cf6', action: () => onNavigateTab('reports') },
    { label: 'Templates', icon: 'document-text-outline', color: '#0ea5e9', action: () => onNavigateTab('templates') },
    { label: 'Staff', icon: 'people-outline', color: '#14b8a6', action: () => onNavigateTab('staff') },
    { label: 'Sequences', icon: 'flash-outline', color: '#f97316', action: () => onNavigateTab('sequences') },
  ];

  return (
    <>
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* User Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>
            {(user?.name || 'AR').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{user?.name || 'Alex Rivers'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'admin@byd.com'}</Text>
          <View style={styles.profileMeta}>
            <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#10b981' : '#f59e0b' }]} />
            <Text style={styles.profileMetaText}>{isOnline ? 'Online' : 'Offline Mode'}</Text>
            <Text style={styles.profileMetaSep}>·</Text>
            <Text style={styles.profileMetaText}>{user?.location || 'Melbourne CBD'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.editProfileBtn}
          activeOpacity={0.7}
          onPress={() => setIsEditProfileOpen(true)}
          accessibilityLabel="Edit Profile"
        >
          <Ionicons name="pencil-outline" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
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
              activeOpacity={0.75}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: action.color + '18' }]}>
                <Ionicons name={action.icon as any} size={22} color={action.color} />
              </View>
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
              <View style={{ flex: 1 }}>
                <Text style={[styles.roleOptionLabel, role === option.value && { color: Colors.brand }]}>
                  {option.label}
                </Text>
                <Text style={styles.roleOptionDesc}>{option.desc}</Text>
              </View>
              {role === option.value && (
                <View style={styles.roleActiveBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.brand} style={{ marginRight: 3 }} />
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
            <View style={styles.settingIconWrap}>
              <Ionicons name="notifications-outline" size={18} color="#6366f1" />
            </View>
            <View style={{ flex: 1 }}>
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
            <View style={[styles.settingIconWrap, { backgroundColor: isOnline ? '#f0fdf4' : '#fffbeb' }]}>
              <Ionicons
                name={isOnline ? 'wifi-outline' : 'cloud-offline-outline'}
                size={18}
                color={isOnline ? '#10b981' : '#f59e0b'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Network Status</Text>
              <Text style={styles.settingDesc}>
                {isOnline ? 'Connected – real-time sync active' : 'Offline – actions queued locally'}
              </Text>
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
          {[
            { label: 'Version', value: '2.0.0', icon: 'information-circle-outline' },
            { label: 'Dealership', value: 'BYD Melbourne CBD', icon: 'business-outline' },
            { label: 'Organisation', value: 'Harmony Auto Group', icon: 'briefcase-outline' },
            { label: 'Address', value: '360 Elizabeth St, Melbourne', icon: 'location-outline' },
          ].map((row, idx, arr) => (
            <View key={row.label} style={[styles.infoRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.infoIconWrap}>
                <Ionicons name={row.icon as any} size={15} color={Colors.textMuted} />
              </View>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={logout}
        activeOpacity={0.85}
      >
        <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 8 }} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>Sales Floor OS · BYD Harmony Auto Group · Secure Session</Text>
    </ScrollView>

    <EditProfileModal
      visible={isEditProfileOpen}
      onClose={() => setIsEditProfileOpen(false)}
      user={user}
      onSave={(updated) => {
        updateUser(updated);
      }}
    />
    </>
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
    width: 54, height: 54, borderRadius: 27,
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
  editProfileBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

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
    width: '22%',
    flex: 1,
    minWidth: 72,
    maxWidth: '25%',
    aspectRatio: 0.9,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: Spacing.sm,
  },
  actionIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  actionGridLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.xs - 1,
    fontWeight: Typography.semibold,
    textAlign: 'center',
    lineHeight: 14,
  },

  // Role switcher
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  roleOptionActive: {
    backgroundColor: 'rgba(230,0,18,0.03)',
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
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
  roleOptionLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  roleOptionDesc: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  roleActiveBadge: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
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
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  settingIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  settingLabel: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.semibold },
  settingDesc: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 1 },
  settingDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 2 },
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
    gap: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  infoIconWrap: {
    width: 22, alignItems: 'center',
  },
  infoLabel: { color: Colors.textMuted, fontSize: Typography.sm, flex: 1 },
  infoValue: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.medium },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.base,
    marginTop: Spacing.lg,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
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
