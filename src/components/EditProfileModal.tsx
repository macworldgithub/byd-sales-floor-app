import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { AuthUser } from '../lib/auth';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: AuthUser | null;
  onSave: (updated: Partial<AuthUser>) => void;
}

export default function EditProfileModal({
  visible,
  onClose,
  user,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState(user?.name || 'Alex Rivers');
  const [email, setEmail] = useState(user?.email || 'admin@byd.com');
  const [location, setLocation] = useState(user?.location || 'Melbourne CBD');
  const [phone, setPhone] = useState(user?.phone || '+61 412 345 678');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setName(user.name || 'Alex Rivers');
      setEmail(user.email || 'admin@byd.com');
      setLocation(user.location || 'Melbourne CBD');
      setPhone(user.phone || '+61 412 345 678');
    }
  }, [visible, user]);

  const initials = (name || 'AR')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Email cannot be empty.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      onSave({
        name: name.trim(),
        email: email.trim(),
        location: location.trim() || 'Melbourne CBD',
        phone: phone.trim() || '+61 412 345 678',
      });
      setIsSaving(false);
      onClose();
    }, 200);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerEyebrow}>ACCOUNT & PROFILE</Text>
              <Text style={styles.headerTitle}>Edit Profile</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar Preview */}
            <View style={styles.avatarPreviewRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{initials || 'AR'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.avatarPreviewName}>{name || 'Your Name'}</Text>
                <Text style={styles.avatarPreviewSub}>
                  {user?.role ? user.role.replace('_', ' ').toUpperCase() : 'SALES CONSULTANT'}
                </Text>
                <View style={styles.badgeLive}>
                  <Ionicons name="checkmark-circle" size={12} color="#10b981" style={{ marginRight: 4 }} />
                  <Text style={styles.badgeLiveText}>Active Profile</Text>
                </View>
              </View>
            </View>

            {/* Field: Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Alex Rivers"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Field: Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>WORK EMAIL</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. alex.rivers@byd.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Field: Dealership Location */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>DEALERSHIP / LOCATION</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="location-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g. Melbourne CBD"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            {/* Field: Phone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="call-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. +61 412 345 678"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={isSaving}
            >
              <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>{isSaving ? 'Saving…' : 'Save Profile'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    maxHeight: '90%',
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerEyebrow: {
    fontSize: Typography.xxs,
    fontWeight: '700',
    color: Colors.brand,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    maxHeight: 460,
  },
  bodyContent: {
    padding: Spacing.base,
  },
  avatarPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.base,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e60012',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: '#ffffff',
  },
  avatarPreviewName: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: '#ffffff',
  },
  avatarPreviewSub: {
    fontSize: Typography.xxs,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  badgeLive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  badgeLiveText: {
    fontSize: Typography.xxs,
    fontWeight: '600',
    color: '#10b981',
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: Typography.xxs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.bodyMedium.fontSize,
    color: Colors.textPrimary,
    padding: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  cancelBtnText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand,
    ...Shadows.sm,
  },
  saveBtnText: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: '#ffffff',
  },
});
