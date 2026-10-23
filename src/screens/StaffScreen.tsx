import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { staffApi, StaffMember } from '../lib/api';

const DEFAULT_STAFF: StaffMember[] = [
  {
    _id: '1',
    name: 'Alex Rivers',
    email: 'alex.rivers@byd.com',
    role: 'Senior EV Specialist',
    site: 'BYD Melbourne CBD',
    position: 'Sales Consultant',
    phone: '+61 412 890 234',
    active: true,
  },
  {
    _id: '2',
    name: 'Jordan Lee',
    email: 'jordan.lee@byd.com',
    role: 'EV Specialist',
    site: 'BYD Melbourne CBD',
    position: 'Sales Consultant',
    phone: '+61 423 456 789',
    active: true,
  },
  {
    _id: '3',
    name: 'Samira Patel',
    email: 'samira.patel@byd.com',
    role: 'Fleet & Novated Specialist',
    site: 'BYD Melbourne CBD',
    position: 'Fleet Consultant',
    phone: '+61 434 567 890',
    active: true,
  },
  {
    _id: '4',
    name: 'Liam Chen',
    email: 'liam.chen@byd.com',
    role: 'EV Specialist',
    site: 'BYD Melbourne CBD',
    position: 'Sales Consultant',
    phone: '+61 445 678 901',
    active: true,
  },
  {
    _id: '5',
    name: 'Chloe Zhang',
    email: 'chloe.zhang@byd.com',
    role: 'Floor Manager',
    site: 'BYD Melbourne CBD',
    position: 'Manager',
    phone: '+61 456 789 012',
    active: true,
  },
  {
    _id: '6',
    name: 'Marcus Bell',
    email: 'marcus.bell@byd.com',
    role: 'Delivery Specialist',
    site: 'BYD Melbourne CBD',
    position: 'Handover Lead',
    phone: '+61 467 890 123',
    active: true,
  },
];

const AVATAR_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', Colors.brand, '#8b5cf6'];

export default function StaffScreen() {
  const [staff, setStaff] = useState<StaffMember[]>(DEFAULT_STAFF);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'All' | 'Consultants' | 'Managers'>('All');

  useEffect(() => {
    staffApi.getStaff('BYD Melbourne CBD')
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          setStaff(res.data);
        }
      })
      .catch(() => {
        // Fallback to default staff
      });
  }, []);

  const filteredStaff = staff.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQ = !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || (m.phone || '').includes(q);
    const matchRole =
      selectedRole === 'All' ||
      (selectedRole === 'Managers' && (m.role.toLowerCase().includes('manager') || (m.position || '').toLowerCase().includes('manager'))) ||
      (selectedRole === 'Consultants' && (m.role.toLowerCase().includes('consultant') || m.role.toLowerCase().includes('specialist')));
    return matchQ && matchRole;
  });

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('No phone', 'No phone number available.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call Failed', `Could not dial ${phone}`);
    });
  };

  const handleEmail = (email?: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`).catch(() => {});
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>SHOWROOM DIRECTORY · BYD MELBOURNE CBD</Text>
          <Text style={styles.headerTitle}>Floor Staff</Text>
        </View>
        <View style={styles.siteBadge}>
          <Ionicons name="location-outline" size={11} color={Colors.textSecondary} style={{ marginRight: 3 }} />
          <Text style={styles.siteBadgeText}>360 Elizabeth St</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchInner}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff by name, role, phone..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 2 }}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Role Filters */}
      <View style={styles.filterRow}>
        {(['All', 'Consultants', 'Managers'] as const).map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.filterChip, selectedRole === role && styles.filterChipActive]}
            onPress={() => setSelectedRole(role)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, selectedRole === role && styles.filterChipTextActive]}>
              {role}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={{ flex: 1 }} />
        <Text style={styles.countLabel}>{filteredStaff.length} staff</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {filteredStaff.map((member, idx) => {
          const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
          const initials = member.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
          const isManager = member.role.toLowerCase().includes('manager');

          return (
            <View key={member._id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{member.name}</Text>
                    <View style={styles.activeDot} />
                    {isManager && (
                      <View style={styles.managerBadge}>
                        <Text style={styles.managerBadgeText}>MGR</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.role}>{member.role}</Text>
                  <View style={styles.siteRow}>
                    <Ionicons name="business-outline" size={11} color={Colors.textMuted} />
                    <Text style={styles.site}>{member.site || 'Melbourne CBD'}</Text>
                  </View>
                </View>
              </View>

              {/* Quick Contact Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleCall(member.phone)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call-outline" size={14} color={Colors.brand} style={{ marginRight: 6 }} />
                  <Text style={styles.actionBtnText}>{member.phone || 'Call'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.emailBtn]}
                  onPress={() => handleEmail(member.email)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="mail-outline" size={14} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.actionBtnText, { color: Colors.textSecondary }]}>Email</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
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
  siteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  siteBadgeText: {
    fontSize: Typography.xs - 1,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
  },

  searchBarWrap: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    padding: 0,
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: '#f1f5f9',
  },
  filterChipActive: { backgroundColor: Colors.brand },
  filterChipText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  filterChipTextActive: { color: '#fff' },
  countLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },

  content: { flex: 1 },
  contentContainer: { padding: Spacing.base, paddingBottom: Spacing.xxxl, gap: Spacing.sm },

  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: '#fff',
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  activeDot: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#10b981',
  },
  managerBadge: {
    backgroundColor: 'rgba(230,0,18,0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  managerBadgeText: {
    color: Colors.brand,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  role: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  site: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
  },

  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs + 2,
    backgroundColor: 'rgba(230,0,18,0.06)',
    borderRadius: BorderRadius.md,
  },
  emailBtn: { backgroundColor: '#f1f5f9' },
  actionBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.brand,
  },
});
