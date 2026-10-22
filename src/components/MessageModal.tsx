import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { Lead, ConversationThread } from '../lib/types';
import { messageApi } from '../lib/api';
import { QUICK_TEMPLATES } from '../lib/data';

interface MessageModalProps {
  visible: boolean;
  onClose: () => void;
  lead: Lead | null;
  conversationMessages?: ConversationThread['messages'];
  onSendMessage: (message: string, recipientName: string) => Promise<boolean>;
}

export default function MessageModal({
  visible,
  onClose,
  lead,
  conversationMessages = [],
  onSendMessage,
}: MessageModalProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || !lead) return;
    setIsSending(true);
    try {
      const success = await onSendMessage(message.trim(), lead.name);
      if (success) {
        setSendSuccess(true);
        setMessage('');
        setTimeout(() => {
          setSendSuccess(false);
          onClose();
        }, 1500);
      }
    } finally {
      setIsSending(false);
    }
  };

  const applyTemplate = (text: string) => {
    if (!lead) return;
    const filled = text
      .replace(/\[Name\]/g, lead.name.split(' ')[0])
      .replace(/\[Model\]/g, lead.model || lead.vehicle || 'BYD Vehicle')
      .replace(/\[Time\]/g, 'the scheduled time');
    setMessage(filled);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.root}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerEyebrow}>Direct Message</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {lead ? `Message ${lead.name}` : 'Compose Message'}
              </Text>
              {lead?.phone && <Text style={styles.headerPhone}>{lead.phone}</Text>}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Conversation History */}
            {conversationMessages.length > 0 && (
              <View style={styles.conversationSection}>
                <Text style={styles.sectionLabel}>CONVERSATION HISTORY</Text>
                {conversationMessages.slice(-5).map((msg) => (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageBubble,
                      msg.sender === 'agent' || msg.sender === 'user'
                        ? styles.messageBubbleOutgoing
                        : styles.messageBubbleIncoming,
                    ]}
                  >
                    <Text style={[
                      styles.messageText,
                      (msg.sender === 'agent' || msg.sender === 'user') ? styles.messageTextOutgoing : styles.messageTextIncoming,
                    ]}>
                      {msg.text}
                    </Text>
                    <Text style={styles.messageTime}>{msg.time}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* ACMA Badge */}
            <View style={styles.acmaBadge}>
              <Text style={styles.acmaText}>🛡 ACMA Opt-Out Suppression Active · Australian Spam Act Compliant</Text>
            </View>

            {/* Quick Templates */}
            <Text style={styles.sectionLabel}>QUICK TEMPLATES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templatesScroll}>
              {QUICK_TEMPLATES.map((t) => (
                <TouchableOpacity
                  key={t.label}
                  style={styles.templateChip}
                  onPress={() => applyTemplate(t.text)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.templateChipText}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Message Composer */}
            <Text style={styles.sectionLabel}>COMPOSE MESSAGE</Text>
            <View style={styles.composerWrap}>
              <TextInput
                style={styles.composerInput}
                value={message}
                onChangeText={setMessage}
                placeholder={lead ? `Type a message to ${lead.name.split(' ')[0]}…` : 'Type your message…'}
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              <View style={styles.composerFooter}>
                <Text style={styles.charCount}>{message.length} chars</Text>
                <View style={styles.acmaChip}>
                  <Text style={styles.acmaChipText}>🛡 Compliant</Text>
                </View>
              </View>
            </View>

            {sendSuccess && (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>✅ Message sent successfully!</Text>
              </View>
            )}
          </ScrollView>

          {/* Send Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendBtn, (!message.trim() || isSending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!message.trim() || isSending}
              activeOpacity={0.85}
            >
              {isSending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.sendBtnText}>Send SMS ✈</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.light },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightBorder,
  },
  headerEyebrow: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 0.8, textTransform: 'uppercase' },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.bold, marginTop: 2 },
  headerPhone: { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 1 },
  closeBtn: { padding: Spacing.xs },
  closeBtnText: { color: Colors.textSecondary, fontSize: Typography.lg },

  body: { flex: 1, padding: Spacing.base },

  conversationSection: { marginBottom: Spacing.md },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs - 1,
    fontWeight: Typography.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  messageBubbleOutgoing: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.brand,
    borderBottomRightRadius: BorderRadius.sm,
  },
  messageBubbleIncoming: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: BorderRadius.sm,
    ...Shadows.sm,
  },
  messageText: { fontSize: Typography.sm, lineHeight: 18 },
  messageTextOutgoing: { color: '#fff' },
  messageTextIncoming: { color: Colors.textPrimary },
  messageTime: { color: 'rgba(255,255,255,0.6)', fontSize: Typography.xs - 1, marginTop: 3, textAlign: 'right' },

  acmaBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  acmaText: { color: '#166534', fontSize: Typography.xs, fontWeight: Typography.medium, textAlign: 'center' },

  templatesScroll: { gap: Spacing.sm, paddingBottom: Spacing.xs },
  templateChip: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: Colors.lightBorder,
    ...Shadows.sm,
  },
  templateChipText: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: Typography.semibold },

  composerWrap: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.lightBorder,
    overflow: 'hidden',
    marginTop: Spacing.xs,
    ...Shadows.sm,
  },
  composerInput: {
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    minHeight: 120,
    lineHeight: 20,
  },
  composerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  charCount: { color: Colors.textMuted, fontSize: Typography.xs },
  acmaChip: {
    backgroundColor: '#f0fdf4',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  acmaChipText: { color: '#166534', fontSize: Typography.xs - 1, fontWeight: Typography.semibold },

  successBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  successText: { color: '#166534', fontSize: Typography.sm, fontWeight: Typography.semibold },

  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.base,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.lightBorder,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.lightBorder,
  },
  cancelBtnText: { color: Colors.textSecondary, fontSize: Typography.base, fontWeight: Typography.semibold },
  sendBtn: {
    flex: 2,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.brand,
    ...Shadows.brand,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: Typography.base, fontWeight: Typography.bold },
});
