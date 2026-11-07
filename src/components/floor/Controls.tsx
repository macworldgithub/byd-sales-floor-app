import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Row } from '../../lib/mobileApi';

export const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 48,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
    color: '#334155',
    fontWeight: '500',
  },
  muted: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
    fontWeight: '500',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0f172a',
    fontSize: 15,
    minHeight: 48,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#e60012',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    shadowColor: '#e60012',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 2,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  secondary: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  secondaryText: {
    color: '#1e293b',
    fontWeight: '600',
  },
  error: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  success: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    padding: 13,
  },
  metric: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    borderRadius: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  pill: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
});

export function ErrorBox({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View accessibilityRole="alert" style={styles.error}>
      <Ionicons name="alert-circle" size={18} color="#dc2626" />
      <Text style={[styles.text, { color: '#991b1b', flex: 1 }]}>{message}</Text>
    </View>
  );
}

export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
  busy = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  busy?: boolean;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || busy}
      onPress={onPress}
      activeOpacity={0.78}
      style={[
        styles.button,
        secondary && styles.secondary,
        (disabled || busy) && { opacity: 0.45 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={secondary ? '#0f172a' : '#ffffff'} size="small" />
      ) : (
        <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

export function Field({
  label,
  value,
  onChange,
  multiline = false,
  keyboard = 'default',
  placeholder,
  secure = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  keyboard?: 'default' | 'email-address' | 'phone-pad' | 'decimal-pad';
  placeholder?: string;
  secure?: boolean;
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        secureTextEntry={secure}
        keyboardType={keyboard}
        autoCapitalize={secure || keyboard === 'email-address' ? 'none' : 'sentences'}
        autoCorrect={!secure}
        style={[
          styles.input,
          multiline && { minHeight: 90, textAlignVertical: 'top' },
        ]}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
      />
    </View>
  );
}

export function Pick({
  label,
  value,
  rows,
  onChange,
  onSearch,
  loading,
  error,
  more,
}: {
  label: string;
  value: string;
  rows: Row[];
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  loading?: boolean;
  error?: string;
  more?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = rows.find((row) => String(row.id ?? row._id ?? '') === value);
  const filtered = onSearch
    ? rows
    : rows.filter((row) => String(row.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        style={[styles.input, styles.row, { justifyContent: 'space-between' }]}
      >
        <Text style={[styles.text, !selected && { color: '#94a3b8' }]}>
          {selected?.name || 'Select option…'}
        </Text>
        <Ionicons name="chevron-down" size={17} color="#64748b" />
      </TouchableOpacity>

      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
        presentationStyle="pageSheet"
      >
        <View style={[styles.page, { padding: 18, paddingTop: 20, gap: 14 }]}>
          {/* Top modal handle indicator */}
          <View style={{ alignItems: 'center', marginBottom: 4 }}>
            <View
              style={{
                width: 36,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: '#cbd5e1',
              }}
            />
          </View>

          <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={styles.title}>{label}</Text>
            <TouchableOpacity
              onPress={() => setOpen(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#f1f5f9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          <Field
            label="Search"
            value={search}
            placeholder="Type to filter options..."
            onChange={(text) => {
              setSearch(text);
              onSearch?.(text);
            }}
          />

          <ErrorBox message={error} />
          {loading && <ActivityIndicator color="#e60012" style={{ marginVertical: 8 }} />}

          <FlatList
            data={filtered}
            keyExtractor={(row) => String(row.id ?? row._id ?? Math.random())}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = String(item.id ?? item._id ?? '') === value;
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  style={[
                    styles.card,
                    {
                      marginBottom: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    },
                    isSelected && { borderColor: '#e60012', backgroundColor: '#fff5f5' },
                  ]}
                  onPress={() => {
                    onChange(String(item.id ?? item._id ?? ''));
                    setOpen(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.text, isSelected && { color: '#e60012', fontWeight: '700' }]}>
                      {item.name}
                    </Text>
                    {item.phone && <Text style={styles.muted}>{item.phone}</Text>}
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color="#e60012" />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={styles.muted}>No matches found. Try another search.</Text>
              </View>
            }
            ListFooterComponent={
              more ? (
                <View style={{ marginTop: 8 }}>
                  <Button title="Load more matches" secondary onPress={more} />
                </View>
              ) : undefined
            }
          />
          <Button title="Done" secondary onPress={() => setOpen(false)} />
        </View>
      </Modal>
    </View>
  );
}

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top modal header with handle */}
        <View
          style={{
            backgroundColor: '#ffffff',
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: '#e2e8f0',
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <View
              style={{
                width: 36,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: '#cbd5e1',
              }}
            />
          </View>
          <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#f1f5f9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={18} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Metrics({ values }: { values: { label: string; value: unknown }[] }) {
  return (
    <View style={styles.row}>
      {values.map((row) => (
        <View key={row.label} style={styles.metric}>
          <Text style={[styles.muted, { marginBottom: 6 }]}>{row.label}</Text>
          <Text style={[styles.title, { fontSize: 20 }]}>
            {row.value === undefined || row.value === null ? '—' : String(row.value)}
          </Text>
        </View>
      ))}
    </View>
  );
}
