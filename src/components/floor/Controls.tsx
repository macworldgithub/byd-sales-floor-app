import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Row } from '../../lib/mobileApi';

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f3f5f8' }, content: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', gap: 10 },
  title: { fontSize: 23, fontWeight: '800', color: '#0f172a' }, subtitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  text: { fontSize: 14, lineHeight: 21, color: '#334155' }, muted: { fontSize: 12, lineHeight: 18, color: '#64748b' },
  label: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, color: '#0f172a', fontSize: 15, minHeight: 46 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  button: { backgroundColor: '#e60012', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 14 }, secondary: { backgroundColor: '#e2e8f0' }, secondaryText: { color: '#0f172a' },
  error: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, padding: 12 },
  success: { backgroundColor: '#ecfdf5', borderRadius: 10, padding: 12 }, metric: { flexBasis: '46%', flexGrow: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12 },
  pill: { color: '#475569', fontSize: 12, padding: 6, borderRadius: 6, backgroundColor: '#f1f5f9', overflow: 'hidden' },
});
export function ErrorBox({ message }: { message?: string }) { return message ? <View accessibilityRole="alert" style={styles.error}><Text style={[styles.text, { color: '#991b1b' }]}>{message}</Text></View> : null; }
export function Button({ title, onPress, disabled = false, secondary = false, busy = false }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean; busy?: boolean }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={title} disabled={disabled || busy} onPress={onPress} style={[styles.button, secondary && styles.secondary, (disabled || busy) && { opacity: 0.5 }]}>
    {busy ? <ActivityIndicator color={secondary ? '#0f172a' : '#fff'} /> : <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{title}</Text>}
  </TouchableOpacity>;
}
export function Field({ label, value, onChange, multiline = false, keyboard = 'default', placeholder, secure = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; keyboard?: 'default' | 'email-address' | 'phone-pad' | 'decimal-pad'; placeholder?: string; secure?: boolean }) {
  return <View><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} multiline={multiline} secureTextEntry={secure} keyboardType={keyboard} autoCapitalize={secure || keyboard === 'email-address' ? 'none' : 'sentences'} autoCorrect={!secure} style={[styles.input, multiline && { minHeight: 90, textAlignVertical: 'top' }]} placeholder={placeholder} placeholderTextColor="#94a3b8" /></View>;
}
export function Pick({ label, value, rows, onChange, onSearch, loading, error, more }: { label: string; value: string; rows: Row[]; onChange: (value: string) => void;
  onSearch?: (query: string) => void; loading?: boolean; error?: string; more?: () => void }) {
  const [open, setOpen] = useState(false), [search, setSearch] = useState('');
  const selected = rows.find(row => String(row.id ?? row._id ?? '') === value);
  const filtered = onSearch ? rows : rows.filter(row => String(row.name).toLowerCase().includes(search.toLowerCase()));
  return <View><Text style={styles.label}>{label}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={() => setOpen(true)} style={[styles.input, styles.row, { justifyContent: 'space-between' }]}>
    <Text style={styles.text}>{selected?.name || 'Select…'}</Text><Ionicons name="chevron-down" size={16} color="#475569" /></TouchableOpacity>
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)} presentationStyle="pageSheet"><View style={[styles.page, { padding: 18, paddingTop: 48, gap: 12 }]}>
      <Text style={styles.subtitle}>{label}</Text><Field label="Search" value={search} onChange={text => { setSearch(text); onSearch?.(text); }} />
      <ErrorBox message={error} />{loading && <ActivityIndicator />}
      <FlatList data={filtered} keyExtractor={row => String(row.id ?? row._id ?? '')} keyboardShouldPersistTaps="handled" renderItem={({ item }) => <TouchableOpacity accessibilityRole="button" style={[styles.card, { marginBottom: 8 }]} onPress={() => { onChange(String(item.id ?? item._id ?? '')); setOpen(false); }}><Text style={styles.text}>{item.name}</Text>{item.phone && <Text style={styles.muted}>{item.phone}</Text>}</TouchableOpacity>}
        ListEmptyComponent={<Text style={styles.muted}>No matches. Try another search.</Text>} ListFooterComponent={more ? <Button title="Load more matches" secondary onPress={more} /> : undefined} />
      <Button title="Close" secondary onPress={() => setOpen(false)} /></View></Modal>
  </View>;
}
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={[styles.row, { justifyContent: 'space-between', padding: 16, paddingTop: 36, backgroundColor: '#fff' }]}><Text style={styles.subtitle}>{title}</Text><Button title="Close" secondary onPress={onClose} /></View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>{children}</ScrollView>
  </KeyboardAvoidingView></Modal>;
}
export function Metrics({ values }: { values: { label: string; value: unknown }[] }) {
  return <View style={styles.row}>{values.map(row => <View key={row.label} style={styles.metric}><Text style={styles.muted}>{row.label}</Text><Text style={styles.subtitle}>{row.value === undefined || row.value === null ? '—' : String(row.value)}</Text></View>)}</View>;
}
