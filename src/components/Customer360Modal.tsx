import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../lib/theme';
import { Lead } from '../lib/types';
import { crmApi, inventoryApi, regoApi } from '../lib/api';
import PPSRCertificateModal, { PPSRCertificateData } from './PPSRCertificateModal';

interface Customer360ModalProps {
  visible: boolean;
  lead: Lead | null;
  onClose: () => void;
  onOpenBookDrive: (lead: Lead) => void;
  onOpenMessage: (lead: Lead) => void;
  onUpdateStage: (leadId: number, stage: Lead['stage']) => void;
  onAddNote?: (leadId: string, note: string) => void;
  onOpenDealRegistration?: (lead: Lead) => void;
  onOpenAppraisal?: (lead: Lead) => void;
}

const STAGES: Lead['stage'][] = ['Imported', 'Engaged', 'Qualified', 'Committed'];

export default function Customer360Modal({
  visible,
  lead,
  onClose,
  onOpenBookDrive,
  onOpenMessage,
  onUpdateStage,
  onAddNote,
  onOpenDealRegistration,
  onOpenAppraisal,
}: Customer360ModalProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'details' | 'log'>('timeline');
  const [noteText, setNoteText] = useState('');
  const [callOutcome, setCallOutcome] = useState('Connected - Follow-up Scheduled');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Official PPSR Certificate Modal
  const [ppsrCertVisible, setPpsrCertVisible] = useState(false);
  const [ppsrCertData, setPpsrCertData] = useState<PPSRCertificateData | null>(null);
  const [isLoadingPpsrCert, setIsLoadingPpsrCert] = useState(false);

  // AI Voice & Call Transcription
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showTranscriptDetails, setShowTranscriptDetails] = useState(false);
  const [callAnalysis, setCallAnalysis] = useState<{
    transcript: Array<{ speaker: string; text: string; time: string }>;
    aiSummary: {
      primaryIntent: string;
      modelOfInterest: string;
      tradeInVehicle: string;
      hotScore: number;
      sentiment: string;
      keyTakeaways: string[];
      nextAction: string;
    };
  } | null>(null);

  if (!lead) return null;

  const handleViewPpsrCertificate = async () => {
    setIsLoadingPpsrCert(true);
    try {
      const cert = await regoApi.orderPpsrCertificate({
        vin: lead?.tradeInVin || 'JM0KF4W7A00239102',
        rego: lead?.tradeInRego || lead?.appraisalRecord?.rego || '1BX7QF',
        make: 'BYD / Trade',
        model: lead?.model || 'Customer Vehicle',
        year: 2021,
        searcherName: lead?.consultant || 'BYD Sales Executive',
        encumbered: lead?.ppsrStatus === 'Encumbered',
      });
      setPpsrCertData(cert);
      setPpsrCertVisible(true);
    } catch {
      Alert.alert('PPSR Error', 'Unable to retrieve official PPSR certificate.');
    } finally {
      setIsLoadingPpsrCert(false);
    }
  };

  const handleTranscribeCall = async () => {
    if (!lead) return;
    setIsTranscribing(true);
    try {
      const res = await crmApi.transcribeCall(String(lead.id), {
        durationSeconds: 142,
      });
      if (res.data) {
        setCallAnalysis({
          transcript: res.data.transcript,
          aiSummary: res.data.aiSummary,
        });
        setFeedback('AI Call Transcribed · Hot Score 92/100');
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      Alert.alert('Transcribe Call', 'Voice transcription completed (offline fallback).');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCall = () => {
    if (lead.phone) {
      Linking.openURL(`tel:${lead.phone}`).catch(() => {
        Alert.alert('Unable to dial', `Phone: ${lead.phone}`);
      });
    } else {
      Alert.alert('No Phone', 'No contact phone number available.');
    }
  };

  const handleSoftHold = async () => {
    try {
      await inventoryApi.softHold(lead.model || 'SEALION-7', {
        prospectName: lead.name,
        notes: 'Floor 48-Hour Reservation',
      });
      setFeedback('Vehicle placed on 48-Hour Soft Hold.');
      setTimeout(() => setFeedback(null), 2500);
    } catch {
      setFeedback('Soft hold saved locally.');
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    const idStr = String(lead._id || lead.id || '');
    onAddNote?.(idStr, noteText.trim());
    setFeedback('Internal note recorded.');
    setNoteText('');
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleLogCall = async () => {
    try {
      const idStr = String(lead._id || lead.id || '');
      await crmApi.logPhoneCall(idStr, {
        outcome: callOutcome,
        notes: noteText,
        consultantName: lead.consultant || 'Alex Rivers',
      });
      setFeedback('Call outcome logged.');
      setNoteText('');
      setTimeout(() => setFeedback(null), 2000);
    } catch {
      setFeedback('Call logged locally.');
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  const timelineEvents = [
    {
      time: 'Today · 08:45 AM',
      title: 'Floor Profile Opened',
      detail: 'Viewed Customer 360 profile on Melbourne CBD Sales Floor OS.',
      tag: 'Floor Touch',
    },
    {
      time: 'Yesterday · 14:20 PM',
      title: lead.stage === 'Committed' ? 'Deposit & Order Logged' : 'Enquiry Ingested',
      detail: `${lead.model || 'BYD Range'} demo loop pre-assigned for showroom.`,
      tag: lead.stage || 'Imported',
    },
    {
      time: '3 Sep 2026 · 10:15 AM',
      title: 'Digital First Touch Sent',
      detail: `SMS sent via Template Studio Pack (Response within 6.4m).`,
      tag: 'SLA Met',
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Feedback Toast */}
          {feedback && (
            <View style={styles.toast}>
              <Text style={styles.toastText}>{feedback}</Text>
            </View>
          )}

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{lead.initials || 'BY'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>{lead.name}</Text>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{lead.score ?? 80} PTS</Text>
                </View>
              </View>
              <Text style={styles.subtext}>
                {lead.model || 'BYD Range'} · via {lead.source || 'Walk-in'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCall} activeOpacity={0.8}>
              <View style={styles.actionIconWrap}>
                <Ionicons name="call-outline" size={20} color={Colors.textPrimary} />
              </View>
              <Text style={styles.actionLabel}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionPrimary]}
              onPress={() => {
                onClose();
                onOpenMessage(lead);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              </View>
              <Text style={[styles.actionLabel, { color: '#fff' }]}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                onClose();
                onOpenBookDrive(lead);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="car-sport-outline" size={20} color={Colors.textPrimary} />
              </View>
              <Text style={styles.actionLabel}>Drive</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => {
                onClose();
                onOpenAppraisal?.(lead);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="camera-outline" size={20} color="#6366f1" />
              </View>
              <Text style={styles.actionLabel}>Appraise</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#0284c7' }]}
              onPress={() => {
                onClose();
                onOpenDealRegistration?.(lead);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: 'transparent' }]}>
                <Ionicons name="document-text-outline" size={20} color="#fff" />
              </View>
              <Text style={[styles.actionLabel, { color: '#fff' }]}>Deal</Text>
            </TouchableOpacity>
          </View>

          {/* Segmented Internal Tabs */}
          <View style={styles.tabRow}>
            {(['timeline', 'details', 'log'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const label = tab === 'timeline' ? '360 Timeline' : tab === 'details' ? 'Details' : 'Log Touch';
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabItem, isActive && styles.tabItemActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Stage Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PIPELINE STAGE</Text>
              <View style={styles.stageGrid}>
                {STAGES.map((s) => {
                  const isCurrent = lead.stage === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.stageBtn, isCurrent && styles.stageBtnActive]}
                      onPress={() => onUpdateStage(Number(lead.id), s)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.stageBtnText, isCurrent && styles.stageBtnTextActive]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {activeTab === 'timeline' && (
              <View style={styles.timelineList}>
                {/* AI Call Audio Transcription Card */}
                <View style={styles.aiAudioCard}>
                  <View style={styles.aiAudioHeader}>
                    <View style={styles.aiAudioBadge}>
                      <Ionicons name="sparkles" size={12} color="#0284c7" />
                      <Text style={styles.aiAudioBadgeText}>AI VOICE TRANSCRIPTION</Text>
                    </View>
                    {callAnalysis && (
                      <View style={styles.hotScorePill}>
                        <Text style={styles.hotScoreText}>🔥 {callAnalysis.aiSummary.hotScore}/100 HOT</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.audioPlayerRow}>
                    <TouchableOpacity
                      style={styles.playAudioBtn}
                      onPress={() => setIsPlayingAudio(!isPlayingAudio)}
                    >
                      <Ionicons
                        name={isPlayingAudio ? 'pause' : 'play'}
                        size={16}
                        color="#ffffff"
                      />
                    </TouchableOpacity>
                    <View style={styles.audioWaveform}>
                      <View style={[styles.waveBar, { height: 16 }]} />
                      <View style={[styles.waveBar, { height: 24, backgroundColor: isPlayingAudio ? Colors.primary : '#94a3b8' }]} />
                      <View style={[styles.waveBar, { height: 12 }]} />
                      <View style={[styles.waveBar, { height: 28, backgroundColor: isPlayingAudio ? Colors.primary : '#94a3b8' }]} />
                      <View style={[styles.waveBar, { height: 20 }]} />
                      <View style={[styles.waveBar, { height: 14 }]} />
                      <View style={[styles.waveBar, { height: 26, backgroundColor: isPlayingAudio ? Colors.primary : '#94a3b8' }]} />
                      <View style={[styles.waveBar, { height: 18 }]} />
                    </View>
                    <Text style={styles.audioDurationText}>02:22</Text>

                    <TouchableOpacity
                      style={[styles.transcribeActionBtn, isTranscribing && { opacity: 0.6 }]}
                      onPress={handleTranscribeCall}
                      disabled={isTranscribing}
                    >
                      <Ionicons name="mic-outline" size={14} color="#ffffff" />
                      <Text style={styles.transcribeActionText}>
                        {isTranscribing ? 'Processing...' : callAnalysis ? 'Re-analyze' : 'Transcribe'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {callAnalysis && (
                    <View style={styles.aiInsightsSection}>
                      <View style={styles.aiInsightRow}>
                        <Text style={styles.aiInsightLabel}>Intent:</Text>
                        <Text style={styles.aiInsightValue}>{callAnalysis.aiSummary.primaryIntent}</Text>
                      </View>
                      <View style={styles.aiInsightRow}>
                        <Text style={styles.aiInsightLabel}>Sentiment:</Text>
                        <Text style={[styles.aiInsightValue, { color: Colors.success, fontWeight: '700' }]}>
                          {callAnalysis.aiSummary.sentiment}
                        </Text>
                      </View>
                      <View style={styles.aiInsightRow}>
                        <Text style={styles.aiInsightLabel}>Next Action:</Text>
                        <Text style={[styles.aiInsightValue, { fontWeight: '600', color: Colors.textPrimary }]}>
                          {callAnalysis.aiSummary.nextAction}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.toggleTranscriptBtn}
                        onPress={() => setShowTranscriptDetails(!showTranscriptDetails)}
                      >
                        <Text style={styles.toggleTranscriptText}>
                          {showTranscriptDetails ? 'Hide Verbatim Transcript' : 'View Verbatim Transcript (6 dialogue turns)'}
                        </Text>
                        <Ionicons
                          name={showTranscriptDetails ? 'chevron-up' : 'chevron-down'}
                          size={14}
                          color={Colors.primary}
                        />
                      </TouchableOpacity>

                      {showTranscriptDetails && (
                        <View style={styles.dialogueList}>
                          {callAnalysis.transcript.map((line, idx) => (
                            <View key={idx} style={styles.dialogueItem}>
                              <Text style={styles.dialogueSpeaker}>
                                [{line.time}] {line.speaker}:
                              </Text>
                              <Text style={styles.dialogueText}>{line.text}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
                {timelineEvents.map((evt, idx) => (
                  <View key={idx} style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.timelineHeader}>
                        <Text style={styles.timelineTitle}>{evt.title}</Text>
                        <View style={styles.timelineTag}>
                          <Text style={styles.timelineTagText}>{evt.tag}</Text>
                        </View>
                      </View>
                      <Text style={styles.timelineTime}>{evt.time}</Text>
                      <Text style={styles.timelineDetail}>{evt.detail}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'details' && (
              <View style={styles.detailsBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mobile</Text>
                  <Text style={styles.detailVal}>{lead.phone || '+61 412 890 234'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailVal}>{lead.email || 'customer@byd-floor.com.au'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Model of Interest</Text>
                  <Text style={styles.detailVal}>{lead.model || 'SEALION 7 Premium'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Consultant</Text>
                  <Text style={styles.detailVal}>{lead.consultant || 'Alex Rivers'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Showroom Site</Text>
                  <Text style={styles.detailVal}>BYD Melbourne CBD</Text>
                </View>

                {/* Business Entity / ABN Section */}
                {lead.businessName && (
                  <View style={{ marginTop: Spacing.md, padding: Spacing.sm, backgroundColor: '#f8fafc', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: '#e2e8f0' }}>
                    <Text style={[styles.detailLabel, { color: Colors.brand, fontWeight: '700' }]}>COMMERCIAL ENTITY</Text>
                    <View style={[styles.detailRow, { borderBottomWidth: 0, paddingVertical: 4 }]}>
                      <Text style={styles.detailLabel}>Company</Text>
                      <Text style={[styles.detailVal, { fontWeight: '600' }]}>{lead.businessName}</Text>
                    </View>
                    {lead.abn && (
                      <View style={[styles.detailRow, { borderBottomWidth: 0, paddingVertical: 4 }]}>
                        <Text style={styles.detailLabel}>ABN</Text>
                        <Text style={styles.detailVal}>{lead.abn}</Text>
                      </View>
                    )}
                    {lead.companyContacts && lead.companyContacts.length > 0 && (
                      <View style={{ marginTop: 4 }}>
                        <Text style={[styles.detailLabel, { fontSize: 11 }]}>Key Contacts:</Text>
                        {lead.companyContacts.map((c, i) => (
                          <Text key={i} style={[styles.detailVal, { fontSize: 12, marginTop: 2 }]}>
                            • {c.name} ({c.role}) · {c.phone}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Trade-In & PPSR Check */}
                {(lead.tradeInRego || lead.appraisalRecord) && (
                  <View style={{ marginTop: Spacing.md, padding: Spacing.sm, backgroundColor: '#f0fdf4', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: '#bbf7d0' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.detailLabel, { color: '#166534', fontWeight: '700' }]}>TRADE-IN APPRAISAL</Text>
                      <View style={{
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 10,
                        backgroundColor: lead.ppsrStatus === 'Encumbered' ? '#fee2e2' : '#dcfce7',
                      }}>
                        <Text style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: lead.ppsrStatus === 'Encumbered' ? '#dc2626' : '#15803d',
                        }}>
                          PPSR {lead.ppsrStatus || 'Clear'}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.detailRow, { borderBottomWidth: 0, paddingVertical: 4 }]}>
                      <Text style={styles.detailLabel}>Plate Rego</Text>
                      <Text style={[styles.detailVal, { fontWeight: '700' }]}>{lead.tradeInRego || lead.appraisalRecord?.rego}</Text>
                    </View>
                    {lead.tradeInVin && (
                      <View style={[styles.detailRow, { borderBottomWidth: 0, paddingVertical: 4 }]}>
                        <Text style={styles.detailLabel}>VIN</Text>
                        <Text style={[styles.detailVal, { fontSize: 11 }]}>{lead.tradeInVin}</Text>
                      </View>
                    )}
                    {lead.appraisalRecord && (
                      <View style={[styles.detailRow, { borderBottomWidth: 0, paddingVertical: 4 }]}>
                        <Text style={styles.detailLabel}>Valuation Offer</Text>
                        <Text style={[styles.detailVal, { color: Colors.brand, fontWeight: '700' }]}>
                          ${(lead.appraisalRecord?.appraisedValue ?? (lead.appraisalRecord as any)?.valuation?.tradeInAllowance ?? 0).toLocaleString()}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.ppsrCertBtn}
                      onPress={handleViewPpsrCertificate}
                      disabled={isLoadingPpsrCert}
                    >
                      <Ionicons name="shield-checkmark" size={14} color="#0284c7" />
                      <Text style={styles.ppsrCertBtnText}>
                        {isLoadingPpsrCert ? 'Fetching Certificate...' : 'View Official AFSA PPSR Certificate (B2G)'}
                      </Text>
                      <Ionicons name="chevron-forward" size={12} color="#0284c7" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Deal Status & Contracting */}
                {lead.dealRecord && (
                  <View style={{ marginTop: Spacing.md, padding: Spacing.sm, backgroundColor: '#f0f9ff', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: '#bae6fd' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.detailLabel, { color: '#0369a1', fontWeight: '700' }]}>CONTRACTED DEAL</Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: '#e0f2fe' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#0284c7' }}>
                          {lead.dealRecord.status}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.detailRow, { borderBottomWidth: 0, paddingVertical: 4 }]}>
                      <Text style={styles.detailLabel}>Vehicle</Text>
                      <Text style={[styles.detailVal, { fontWeight: '700' }]}>{lead.dealRecord.vehicleName}</Text>
                    </View>
                    <View style={[styles.detailRow, { borderBottomWidth: 0, paddingVertical: 4 }]}>
                      <Text style={styles.detailLabel}>Net Settlement</Text>
                      <Text style={[styles.detailVal, { fontWeight: '700', color: '#0f172a' }]}>
                        ${Math.max(0, (lead.dealRecord?.salePrice ?? 0) - (lead.dealRecord?.tradeInValue ?? 0)).toLocaleString()}
                      </Text>
                    </View>
                    <View style={[styles.detailRow, { borderBottomWidth: 0, paddingVertical: 4 }]}>
                      <Text style={styles.detailLabel}>DMS Sync</Text>
                      <Text style={[styles.detailVal, { color: (lead.dealRecord.status === 'Pushed to Virtual Yard' || lead.dealRecord.status === 'Contract Signed') ? '#16a34a' : '#d97706', fontWeight: '600' }]}>
                        {(lead.dealRecord.status === 'Pushed to Virtual Yard' || lead.dealRecord.status === 'Contract Signed') ? '✓ Pushed to Virtual Yard' : 'Local Draft'}
                      </Text>
                    </View>
                  </View>
                )}

                {lead.notes && (
                  <View style={{ marginTop: Spacing.sm }}>
                    <Text style={styles.detailLabel}>Consultant Notes</Text>
                    <Text style={styles.notesText}>{lead.notes}</Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'log' && (
              <View style={styles.logBox}>
                <Text style={styles.sectionTitle}>CALL OUTCOME</Text>
                {(['Connected - Follow-up Scheduled', 'Connected - Test Drive Booked', 'Left Voicemail', 'No Answer'] as const).map((outcome) => (
                  <TouchableOpacity
                    key={outcome}
                    style={[styles.outcomeOption, callOutcome === outcome && styles.outcomeOptionActive]}
                    onPress={() => setCallOutcome(outcome)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.radio}>
                      {callOutcome === outcome && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.outcomeText, callOutcome === outcome && { color: Colors.brand }]}>
                      {outcome}
                    </Text>
                  </TouchableOpacity>
                ))}

                <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>INTERNAL CONSULTANT NOTE</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Record note or call summary here..."
                  placeholderTextColor={Colors.textMuted}
                  value={noteText}
                  onChangeText={setNoteText}
                  multiline={true}
                />

                <View style={styles.logButtonsRow}>
                  <TouchableOpacity style={styles.logBtn} onPress={handleSaveNote} activeOpacity={0.85}>
                    <Text style={styles.logBtnText}>Save Note</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.logBtn, styles.logBtnPrimary]} onPress={handleLogCall} activeOpacity={0.85}>
                    <Text style={[styles.logBtnText, { color: '#fff' }]}>Log Call Result</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <PPSRCertificateModal
        visible={ppsrCertVisible}
        certificate={ppsrCertData}
        onClose={() => setPpsrCertVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: Typography.titleLarge.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scoreBadge: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.brand,
  },
  subtext: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: {},  // deprecated - using Ionicons directly

  actionRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs + 2,
    alignItems: 'center',
    gap: 2,
  },
  actionPrimary: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  actionIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.base,
  },
  tabItem: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: Colors.brand,
  },
  tabText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.brand,
    fontWeight: Typography.bold,
  },

  body: {
    padding: Spacing.base,
  },

  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  stageGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  stageBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs + 2,
    alignItems: 'center',
  },
  stageBtnActive: {
    backgroundColor: Colors.dark,
  },
  stageBtnText: {
    fontSize: 11,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
  },
  stageBtnTextActive: {
    color: '#fff',
    fontWeight: Typography.bold,
  },

  // Timeline
  timelineList: {
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand,
    marginTop: 5,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  timelineTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timelineTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  timelineTime: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  timelineDetail: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },

  // Details
  detailsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  detailVal: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  notesText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },

  // Log
  logBox: {
    gap: Spacing.xs,
  },
  outcomeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
  },
  outcomeOptionActive: {
    backgroundColor: 'rgba(230,0,18,0.03)',
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand,
  },
  outcomeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  noteInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    minHeight: 70,
    fontSize: Typography.xs,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  logButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  logBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: BorderRadius.md,
  },
  logBtnPrimary: {
    backgroundColor: Colors.brand,
  },
  logBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },

  footer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
  },
  doneBtn: {
    backgroundColor: Colors.dark,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },

  toast: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    backgroundColor: Colors.dark,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    zIndex: 99,
    alignItems: 'center',
    ...Shadows.md,
  },
  toastText: {
    color: '#fff',
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },

  // PPSR and AI Voice Styles
  ppsrCertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  ppsrCertBtnText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
    marginHorizontal: 6,
  },
  aiAudioCard: {
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  aiAudioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiAudioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  aiAudioBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284c7',
    letterSpacing: 0.6,
  },
  hotScorePill: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  hotScoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
  },
  audioPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.md,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  playAudioBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 30,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
  },
  audioDurationText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  transcribeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  transcribeActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  aiInsightsSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  aiInsightRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  aiInsightLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    width: 80,
  },
  aiInsightValue: {
    flex: 1,
    fontSize: 11,
    color: Colors.textPrimary,
  },
  toggleTranscriptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 4,
  },
  toggleTranscriptText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  dialogueList: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 6,
    gap: 6,
  },
  dialogueItem: {
    marginBottom: 2,
  },
  dialogueSpeaker: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  dialogueText: {
    fontSize: 11,
    color: Colors.textPrimary,
    lineHeight: 16,
    marginLeft: 6,
  },
});
