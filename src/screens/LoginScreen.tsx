import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { Ionicons } from '@expo/vector-icons';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password) return;
    setError('');
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      await login('alex.rivers@byd.com', 'demo1234');
      onLoginSuccess();
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Background orbs (decorative) */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Card */}
          <View style={styles.card}>
            {/* Brand */}
            <View style={styles.brand}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>SF</Text>
              </View>
              <View style={styles.brandText}>
                <Text style={styles.brandTitle}>Sales Floor OS</Text>
                <Text style={styles.brandSub}>MELBOURNE CBD · HARMONY AUTO GROUP</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Form */}
            <Text style={styles.formHeading}>Sign in to your account</Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="warning-outline" size={14} color="#b91c1c" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
              <View style={styles.fieldWrap}>
                <Ionicons name="mail-outline" size={16} color={Colors.textDarkMuted} style={styles.fieldIcon} />
                <TextInput
                  style={styles.fieldInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@byd.com"
                  placeholderTextColor={Colors.textDarkMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View style={styles.fieldWrap}>
                <Ionicons name="lock-closed-outline" size={16} color={Colors.textDarkMuted} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.fieldInput, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textDarkMuted}
                  secureTextEntry={!showPw}
                  autoComplete="password"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPw(!showPw)}
                  style={styles.toggleBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPw ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.textDarkMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, (!email || !password || isLoading) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!email || !password || isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.submitText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Demo Login */}
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={handleDemoLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <Ionicons name="flash-outline" size={14} color={Colors.textDarkSecondary} style={{ marginRight: 5 }} />
              <Text style={styles.demoBtnText}>Quick Demo Login</Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>BYD Harmony Sales Floor · Secure Portal</Text>
              <View style={styles.footerDot} />
              <Text style={styles.footerText}>v2.0</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#090c12',
    position: 'relative',
    overflow: 'hidden',
  },
  // Decorative background orbs
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 400,
    height: 400,
    backgroundColor: 'rgba(230, 0, 18, 0.22)',
    top: -180,
    right: -100,
  },
  orb2: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(10, 10, 20, 0.5)',
    bottom: -80,
    left: -80,
  },
  orb3: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255, 26, 42, 0.1)',
    top: '40%',
    left: '20%',
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.base,
    paddingVertical: Spacing.xxxl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(23, 27, 34, 0.95)',
    borderRadius: 20,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.lg,
    shadowColor: '#e60012',
    shadowOpacity: 0.08,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  logoBox: {
    width: 52,
    height: 52,
    backgroundColor: '#e60012',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.brand,
  },
  logoText: {
    color: '#fff',
    fontSize: Typography.lg,
    fontWeight: Typography.extrabold,
    letterSpacing: 1,
  },
  brandText: {
    flex: 1,
  },
  brandTitle: {
    color: '#fff',
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  brandSub: {
    color: Colors.textDarkSecondary,
    fontSize: Typography.xs - 1,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(230, 0, 18, 0.25)',
    marginBottom: Spacing.lg,
  },
  formHeading: {
    color: Colors.textDarkSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    marginBottom: Spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    flex: 1,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    color: Colors.textDarkSecondary,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  fieldIcon: {
    marginRight: Spacing.sm,
  },
  fieldInput: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: Typography.base,
    padding: 0,
  },
  toggleBtn: {
    padding: Spacing.xs,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#e60012',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    ...Shadows.brand,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: '#fff',
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    letterSpacing: 0.2,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  demoBtnText: {
    color: Colors.textDarkSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
  },
  footerText: {
    color: Colors.textDarkMuted,
    fontSize: Typography.xs,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textDarkMuted,
  },
});
