import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/lib/auth';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from './src/lib/theme';
import {
  INITIAL_LEADS,
  INITIAL_DELIVERIES,
  TODAY_TIMELINE_EVENTS,
  CONVERSATION_THREADS,
} from './src/lib/data';
import { Lead, Delivery, TimelineEvent, ConversationThread, UserRole } from './src/lib/types';
import { messageApi, leadApi, appointmentApi } from './src/lib/api';

// Header
import AppHeader from './src/components/AppHeader';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import TodayScreen from './src/screens/TodayScreen';
import LeadsScreen from './src/screens/LeadsScreen';
import ConversationsScreen from './src/screens/ConversationsScreen';
import DeliveriesScreen from './src/screens/DeliveriesScreen';
import MoreScreen from './src/screens/MoreScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import AllocationScreen from './src/screens/AllocationScreen';
import PerformanceScreen from './src/screens/PerformanceScreen';
import StaffScreen from './src/screens/StaffScreen';
import TemplateStudioScreen from './src/screens/TemplateStudioScreen';
import SequencesScreen from './src/screens/SequencesScreen';

// Modals
import MessageModal from './src/components/MessageModal';
import AddProspectModal from './src/components/AddProspectModal';
import BookDriveModal from './src/components/BookDriveModal';
import Customer360Modal from './src/components/Customer360Modal';
import NotificationCenterModal from './src/components/NotificationCenterModal';
import BulkMessageModal from './src/components/BulkMessageModal';
import AddEventModal from './src/components/AddEventModal';

type MainTabId = 'today' | 'leads' | 'conversations' | 'deliveries' | 'more';
type ActiveView =
  | MainTabId
  | 'calendar'
  | 'allocation'
  | 'reports'
  | 'templates'
  | 'staff'
  | 'sequences';

interface TabItemDef {
  id: MainTabId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItemDef[] = [
  { id: 'today', label: 'Today', icon: 'flash-outline', activeIcon: 'flash' },
  { id: 'leads', label: 'Leads', icon: 'people-outline', activeIcon: 'people' },
  { id: 'conversations', label: 'Inbox', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
  { id: 'deliveries', label: 'Deliveries', icon: 'car-sport-outline', activeIcon: 'car-sport' },
  { id: 'more', label: 'More', icon: 'grid-outline', activeIcon: 'grid' },
];

function TabBar({
  activeView,
  onPress,
  unreadCount,
}: {
  activeView: ActiveView;
  onPress: (id: MainTabId) => void;
  unreadCount: number;
}) {
  const getIsActive = (tabId: MainTabId) => {
    if (tabId === activeView) return true;
    if (tabId === 'more' && ['allocation', 'reports', 'templates', 'staff', 'sequences'].includes(activeView)) {
      return true;
    }
    if (tabId === 'today' && activeView === 'calendar') {
      return true;
    }
    return false;
  };

  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const isActive = getIsActive(tab.id);
        const showBadge = tab.id === 'conversations' && unreadCount > 0;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            onPress={() => onPress(tab.id)}
            activeOpacity={0.75}
          >
            {isActive && <View style={styles.tabActiveIndicator} />}
            <View style={styles.tabIconWrap}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={21}
                color={isActive ? Colors.brand : '#64748b'}
              />
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AppShell() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('today');
  const [role, setRole] = useState<UserRole>('consultant');
  const [isOnline] = useState(true);

  // Preload Icon Fonts
  useEffect(() => {
    Font.loadAsync({
      ...Ionicons.font,
    })
      .then(() => setFontsLoaded(true))
      .catch(() => setFontsLoaded(true));
  }, []);

  // Data state
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [deliveries, setDeliveries] = useState<Delivery[]>(INITIAL_DELIVERIES);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(TODAY_TIMELINE_EVENTS);
  const [threads, setThreads] = useState<ConversationThread[]>(CONVERSATION_THREADS);

  // Modal states
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messageModalLead, setMessageModalLead] = useState<Lead | null>(null);
  const [addProspectVisible, setAddProspectVisible] = useState(false);
  const [bookDriveVisible, setBookDriveVisible] = useState(false);
  const [bookDriveLead, setBookDriveLead] = useState<Lead | null>(null);
  const [customer360Visible, setCustomer360Visible] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notificationCenterVisible, setNotificationCenterVisible] = useState(false);
  const [bulkMessageVisible, setBulkMessageVisible] = useState(false);
  const [bulkMessageLeads, setBulkMessageLeads] = useState<Lead[]>([]);
  const [addEventVisible, setAddEventVisible] = useState(false);

  const unreadCount = threads.filter((t) => (t.unreadCount ?? 0) > 0).length;

  const handleOpenMessage = useCallback((lead: Lead) => {
    setMessageModalLead(lead);
    setMessageModalVisible(true);
  }, []);

  const handleOpenBookDrive = useCallback((lead?: Lead | null) => {
    setBookDriveLead(lead ?? null);
    setBookDriveVisible(true);
  }, []);

  const handleOpenAddProspect = useCallback(() => {
    setAddProspectVisible(true);
  }, []);

  const handleSelectLead = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setCustomer360Visible(true);
  }, []);

  const handleOpenBulkMessage = useCallback((selected: Lead[]) => {
    setBulkMessageLeads(selected);
    setBulkMessageVisible(true);
  }, []);

  const handleSendMessage = useCallback(
    async (message: string, recipientName: string): Promise<boolean> => {
      try {
        const res = await messageApi.sendMessage({
          to: messageModalLead?.phone ?? '',
          body: message,
          lead_id: String(messageModalLead?.id ?? ''),
        });
        return res.success;
      } catch {
        return true; // optimistic offline
      }
    },
    [messageModalLead],
  );

  const handleAddLead = useCallback(async (leadData: Omit<Lead, 'id' | 'initials'>) => {
    const parts = leadData.name.trim().split(' ');
    const initials = parts.map((p) => p[0]).join('').toUpperCase().slice(0, 2);
    const newLead: Lead = {
      ...leadData,
      id: Date.now(),
      initials,
    };
    try {
      await leadApi.createLead(newLead);
    } catch {
      // offline fallback
    }
    setLeads((prev) => [newLead, ...prev]);
  }, []);

  const handleUpdateStage = useCallback((leadId: number, stage: Lead['stage']) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage } : l)));
  }, []);

  const handleAddNote = useCallback((leadId: string, note: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        String(l._id || l.id) === leadId
          ? { ...l, notes: l.notes ? `${l.notes}\n${note}` : note }
          : l
      )
    );
  }, []);

  const handleAssignLead = useCallback((leadId: number | string, consultantName: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l._id === leadId || l.id === leadId
          ? {
              ...l,
              consultant: consultantName,
              assignedTo: consultantName,
              stage: 'Engaged',
            }
          : l
      )
    );
  }, []);

  const handleAddCalendarEvent = useCallback((evt: TimelineEvent) => {
    setTimelineEvents((prev) => [evt, ...prev]);
  }, []);

  const handleBookingConfirmed = useCallback(
    async (data: { customerName: string; model: string; loop: string; time: string; date: string }) => {
      const newEvt: TimelineEvent = {
        time: data.time.split(' ')[0] || '10:00',
        end: '11:00',
        title: `Test drive · ${data.customerName}`,
        detail: `${data.model} · ${data.loop}`,
        type: 'drive',
      };
      setTimelineEvents((prev) => [newEvt, ...prev]);
      try {
        await appointmentApi.createAppointment({
          prospectName: data.customerName,
          vehicle: data.model,
          type: 'Test Drive',
          when: `${new Date().toISOString().split('T')[0]}T${data.time.padStart(5, '0')}:00`,
          notes: `Demo Loop: ${data.loop}`,
        });
      } catch {
        // saved locally
      }
    },
    [],
  );

  const handleNavigateTab = useCallback((tab: string) => {
    setActiveView(tab as ActiveView);
  }, []);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <Ionicons name="car-sport" size={54} color={Colors.brand} />
        <Text style={styles.loadingLabel}>BYD SALES FLOOR</Text>
        <Text style={styles.loadingSub}>Melbourne CBD</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1 }}>
        <ExpoStatusBar style="light" />
        <LoginScreen onLoginSuccess={() => {}} />
      </View>
    );
  }

  const isSecondaryView = [
    'calendar',
    'allocation',
    'reports',
    'templates',
    'staff',
    'sequences',
  ].includes(activeView);

  const renderScreen = () => {
    switch (activeView) {
      case 'today':
        return (
          <TodayScreen
            leads={leads}
            timelineEvents={timelineEvents}
            deliveries={deliveries}
            onSelectLead={handleSelectLead}
            onOpenBookDrive={handleOpenBookDrive}
            onOpenAddProspect={handleOpenAddProspect}
            onOpenMessage={handleOpenMessage}
            onNavigateTab={handleNavigateTab}
          />
        );
      case 'leads':
        return (
          <LeadsScreen
            leads={leads}
            onSelectLead={handleSelectLead}
            onOpenAddProspect={handleOpenAddProspect}
            onOpenBookDrive={handleOpenBookDrive}
            onOpenMessage={handleOpenMessage}
            onOpenBulkMessage={handleOpenBulkMessage}
          />
        );
      case 'conversations':
        return (
          <ConversationsScreen
            threads={threads}
            onSelectThread={(thread) => {
              const matchedLead = leads.find(
                (l) => l.name === (thread.name || thread.prospectName),
              );
              if (matchedLead) handleOpenMessage(matchedLead);
            }}
            onOpenNewMessage={handleOpenAddProspect}
          />
        );
      case 'deliveries':
        return (
          <DeliveriesScreen
            deliveries={deliveries}
            onCompleteHandover={(delivery) => {
              setDeliveries((prev) =>
                prev.filter((d) => (d._id || d.id) !== (delivery._id || delivery.id))
              );
            }}
          />
        );
      case 'more':
        return (
          <MoreScreen
            role={role}
            onSetRole={setRole}
            onNavigateTab={handleNavigateTab}
            onOpenBookDrive={handleOpenBookDrive}
            onOpenAddProspect={handleOpenAddProspect}
            isOnline={isOnline}
          />
        );
      case 'calendar':
        return (
          <CalendarScreen
            timelineEvents={timelineEvents}
            onOpenAddEvent={() => setAddEventVisible(true)}
            onOpenBookDrive={() => handleOpenBookDrive()}
          />
        );
      case 'allocation':
        return (
          <AllocationScreen
            unassignedLeads={leads.filter((l) => !l.consultant || l.stage === 'Imported')}
            onAssignLead={handleAssignLead}
          />
        );
      case 'reports':
        return <PerformanceScreen />;
      case 'templates':
        return <TemplateStudioScreen />;
      case 'staff':
        return <StaffScreen />;
      case 'sequences':
        return <SequencesScreen onNavigateTab={handleNavigateTab} />;
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ExpoStatusBar style="dark" />

      {/* App Header — Today screen only */}
      {activeView === 'today' && (
        <AppHeader
          userName={user?.name || 'Alex Rivers'}
          role={role}
          isOnline={isOnline}
          unreadNotificationsCount={3}
          onOpenNotifications={() => setNotificationCenterVisible(true)}
          onSelectLead={handleSelectLead}
          leads={leads}
        />
      )}

      {/* Sub-view Navigation Header */}
      {isSecondaryView && (
        <View style={styles.subViewHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setActiveView('more')}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={16} color={Colors.brand} />
            <Text style={styles.backBtnText}>Menu</Text>
          </TouchableOpacity>
          <Text style={styles.subViewTitle}>{activeView.toUpperCase()}</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      {/* Main Content View */}
      <View style={styles.content}>{renderScreen()}</View>

      {/* Polish Tab Bar */}
      <TabBar
        activeView={activeView}
        onPress={(tabId) => setActiveView(tabId)}
        unreadCount={unreadCount}
      />

      {/* ── All Modals ── */}
      <MessageModal
        visible={messageModalVisible}
        onClose={() => setMessageModalVisible(false)}
        lead={messageModalLead}
        onSendMessage={handleSendMessage}
      />

      <AddProspectModal
        visible={addProspectVisible}
        onClose={() => setAddProspectVisible(false)}
        onAddLead={handleAddLead}
      />

      <BookDriveModal
        visible={bookDriveVisible}
        onClose={() => setBookDriveVisible(false)}
        lead={bookDriveLead}
        onConfirmBooking={handleBookingConfirmed}
      />

      <Customer360Modal
        visible={customer360Visible}
        lead={selectedLead}
        onClose={() => setCustomer360Visible(false)}
        onOpenBookDrive={(lead) => {
          setCustomer360Visible(false);
          handleOpenBookDrive(lead);
        }}
        onOpenMessage={(lead) => {
          setCustomer360Visible(false);
          handleOpenMessage(lead);
        }}
        onUpdateStage={handleUpdateStage}
        onAddNote={handleAddNote}
      />

      <NotificationCenterModal
        visible={notificationCenterVisible}
        onClose={() => setNotificationCenterVisible(false)}
        onSelectAction={(item) => {
          setNotificationCenterVisible(false);
          if (item.type === 'allocation') setActiveView('allocation');
          else if (item.type === 'sms') setActiveView('conversations');
          else if (item.type === 'appointment') setActiveView('calendar');
          else if (item.type === 'delivery') setActiveView('deliveries');
        }}
      />

      <BulkMessageModal
        visible={bulkMessageVisible}
        onClose={() => setBulkMessageVisible(false)}
        leads={bulkMessageLeads.length > 0 ? bulkMessageLeads : leads}
      />

      <AddEventModal
        visible={addEventVisible}
        onClose={() => setAddEventVisible(false)}
        onAddEvent={handleAddCalendarEvent}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    backgroundColor: Colors.light,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#090d16',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingLabel: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 2,
    marginTop: 8,
  },
  loadingSub: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  subViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  backBtnText: {
    fontSize: Typography.xs + 1,
    fontWeight: '700',
    color: Colors.brand,
  },
  subViewTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },

  // ── Tab Bar ──
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#090d16',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: Platform.OS === 'ios' ? 26 : 10,
    paddingTop: 8,
    paddingHorizontal: Spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    paddingTop: 4,
  },
  tabActiveIndicator: {
    position: 'absolute',
    top: -8,
    width: 24,
    height: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.brand,
  },
  tabIconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -8,
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#090d16',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
});
