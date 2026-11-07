import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { useFloor } from '../../lib/floorContext';
import { mobileApi, Row } from '../../lib/mobileApi';
import { disablePush } from '../../lib/deviceFeatures';
import LoginScreen from '../LoginScreen';
import IAppraiseScreen from '../IAppraiseScreen';
import { Button, ErrorBox, styles } from '../../components/floor/Controls';
import { BookTestDrive } from '../../components/floor/BookTestDrive';
import { CustomerDetails, ProspectForm } from '../../components/floor/CustomerForms';
import { DealForm } from '../../components/floor/DealForm';
import {
  FloorHeader,
  FloorBottomNav,
  FloorDrawer,
  SiteSwitcherSheet,
} from '../../components/floor/FloorNavigation';
import {
  AlertsView,
  CalendarView,
  Dashboard,
  InboxView,
  LeadsView,
  PulseView,
  ReportsView,
  StaffView,
} from './LiveViews';
import { DealsView, DeliveriesView, FollowupsView, InventoryView } from './StockAndDelivery';
import type { Lead } from '../../lib/types';
import { AllocationView, SiteSettingsView } from './SettingsAndAllocation';

const navigation = [
  ['today', 'Today'],
  ['leads', 'Leads'],
  ['conversations', 'Inbox'],
  ['calendar', 'Calendar'],
  ['inventory', 'Inventory'],
  ['deals', 'Deals'],
  ['deliveries', 'Deliveries'],
  ['alerts', 'Alerts'],
  ['pulse', 'PULSE'],
  ['reports', 'Reports'],
  ['allocation', 'Allocation'],
  ['staff', 'Team'],
  ['followups', 'BYD journey'],
  ['settings', 'Site settings'],
  ['more', 'Account'],
];

const management = ['pulse', 'reports', 'allocation', 'settings'];

export default function FloorScreen() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const floor = useFloor();
  const params = useLocalSearchParams<{ view: string; leadId?: string }>();
  const view = params.view || 'today';

  const [modal, setModal] = useState<'customer' | 'prospect' | 'book' | 'deal' | null>(null);
  const [selected, setSelected] = useState<Row | undefined>();
  const [error, setError] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<Row | undefined>();

  // Drawer & Site Switcher state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [siteModalOpen, setSiteModalOpen] = useState(false);

  const navigate = (value: string) => {
    router.replace({ pathname: '/[view]', params: { view: value } });
  };

  useEffect(() => {
    if (!params.leadId || !isAuthenticated) return;
    let active = true;
    mobileApi
      .lead(params.leadId)
      .then((lead) => {
        if (active) {
          setSelected(lead);
          if (view !== 'appraisal') setModal('customer');
        }
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [params.leadId, isAuthenticated, view]);

  const onLead = (lead: Row) => {
    setSelected(lead);
    setModal('customer');
  };

  const book = (lead?: Row) => {
    setSelected(lead);
    setModal('book');
  };

  const deal = (lead?: Row) => {
    setSelected(lead);
    setSelectedDeal(undefined);
    setModal('deal');
  };

  const openDeal = async (saved: Row) => {
    try {
      setSelected(await mobileApi.lead(saved.leadId));
      setSelectedDeal(saved);
      setModal('deal');
    } catch (cause) {
      setError((cause as Error).message);
    }
  };

  const close = () => {
    setModal(null);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.page, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#e60012" size="large" />
        <Text style={[styles.text, { marginTop: 12 }]}>Loading your Sales Floor account…</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={() => {
          void floor.refresh();
        }}
      />
    );
  }

  const allowed = navigation.filter(
    ([key]) =>
      (!management.includes(key) || floor.isManager) &&
      (user?.role !== 'contractor' || ['deliveries', 'staff', 'alerts', 'more'].includes(key)),
  );

  if (user?.role === 'contractor' && !allowed.some(([key]) => key === view)) {
    return <Redirect href="/deliveries" />;
  }

  let content: React.ReactNode;
  if (management.includes(view) && !floor.isManager) {
    content = <ErrorBox message="Your account does not have management access." />;
  } else {
    switch (view) {
      case 'today':
        content = <Dashboard onLead={onLead} onAdd={() => setModal('prospect')} onBook={() => book()} />;
        break;
      case 'leads':
        content = <LeadsView onLead={onLead} onAdd={() => setModal('prospect')} />;
        break;
      case 'conversations':
        content = <InboxView onLead={onLead} />;
        break;
      case 'inventory':
        content = <InventoryView onDeal={() => deal()} onBook={() => book()} />;
        break;
      case 'deals':
        content = (
          <DealsView
            onOpen={(saved) => {
              void openDeal(saved);
            }}
            onNew={() => deal()}
          />
        );
        break;
      case 'calendar':
        content = <CalendarView onBook={() => book()} />;
        break;
      case 'pulse':
        content = <PulseView onLead={onLead} />;
        break;
      case 'reports':
        content = <ReportsView />;
        break;
      case 'deliveries':
        content = <DeliveriesView />;
        break;
      case 'followups':
        content = <FollowupsView />;
        break;
      case 'alerts':
        content = <AlertsView onLead={onLead} />;
        break;
      case 'staff':
        content = <StaffView />;
        break;
      case 'settings':
        content = <SiteSettingsView key={floor.site} />;
        break;
      case 'allocation':
        content = <AllocationView />;
        break;
      case 'appraisal':
        content =
          params.leadId && (!selected || String(selected._id) !== params.leadId) ? (
            <ActivityIndicator color="#e60012" />
          ) : (
            <IAppraiseScreen
              key={params.leadId || 'standalone'}
              lead={(selected as Lead | undefined) || null}
              onAppraisalCompleted={() => {
                void floor.refresh();
                navigate('today');
              }}
              onNavigateBack={() => navigate('today')}
            />
          );
        break;
      default:
        content = (
          <View style={styles.card}>
            <Text style={styles.title}>Your account</Text>
            <Text style={styles.text}>{user?.name}</Text>
            <Text style={styles.text}>{user?.email}</Text>
            <Text style={styles.muted}>
              {user?.role} · permissions are assigned by your administrator
            </Text>
            {allowed.map(([key, label]) => (
              <Button key={key} title={label} secondary onPress={() => navigate(key)} />
            ))}
            <Button title="I-Appraise" secondary onPress={() => navigate('appraisal')} />
            <Button
              title="Sign out"
              onPress={() => {
                disablePush()
                  .catch(() => undefined)
                  .finally(() => {
                    void logout();
                  });
              }}
            />
          </View>
        );
    }
  }

  const fallbackSites: string[] = ['BYD Melbourne City', 'BYD Caroline Springs', 'BYD Nunawading'];
  const rawSites: string[] = Array.isArray(floor.bootstrap?.sites) && floor.bootstrap.sites.length
    ? floor.bootstrap.sites
    : Array.isArray(user?.allowedSites) && user.allowedSites.length
    ? user.allowedSites
    : fallbackSites;

  const sites = Array.from(new Set(rawSites.filter((s) => s && s !== 'BYD Dealership')));
  if (floor.isManager && user?.allSites && !sites.includes('All Sites')) {
    sites.push('All Sites');
  }

  const activeSiteValue =
    typeof floor.site === 'string' && floor.site && floor.site !== 'BYD Dealership'
      ? floor.site
      : sites[0] || 'BYD Melbourne City';

  const activeError = error || floor.error || '';
  const cleanError =
    activeError.toLowerCase().includes('cancel') || activeError.toLowerCase().includes('abort')
      ? ''
      : activeError;

  const unreadAlertsCount = floor.notifications.filter((row) => !row.read).length;
  const unreadInboxCount = floor.notifications.filter((row) => row.type === 'sms' && !row.read).length;

  return (
    <SafeAreaView style={styles.page} edges={['top', 'left', 'right']}>
      {/* ── Production App Header ── */}
      <FloorHeader
        currentView={view}
        activeSite={activeSiteValue}
        unreadAlertsCount={unreadAlertsCount}
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenSitePicker={() => setSiteModalOpen(true)}
        onNavigateAlerts={() => navigate('alerts')}
      />

      {/* ── Main Scrollable Content ── */}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={floor.loading}
            onRefresh={() => {
              void floor.refresh();
            }}
            tintColor="#e60012"
          />
        }
      >
        <ErrorBox message={cleanError} />
        {content}
      </ScrollView>

      {/* ── Production Bottom Navigation Bar ── */}
      <FloorBottomNav
        activeView={view}
        onNavigate={navigate}
        onToggleDrawer={() => setDrawerOpen((prev) => !prev)}
        unreadInboxCount={unreadInboxCount}
      />

      {/* ── Sidebar / Drawer Navigation ── */}
      <FloorDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentView={view}
        userName={user?.name}
        userEmail={user?.email}
        userRole={user?.role}
        isManager={Boolean(floor.isManager)}
        sites={sites}
        activeSite={activeSiteValue}
        unreadAlertsCount={unreadAlertsCount}
        onSelectSite={(newSite) => floor.setSite(newSite)}
        onNavigate={navigate}
        onSignOut={() => {
          disablePush()
            .catch(() => undefined)
            .finally(() => {
              void logout();
            });
        }}
      />

      {/* ── Site Switcher Bottom Sheet ── */}
      <SiteSwitcherSheet
        visible={siteModalOpen}
        onClose={() => setSiteModalOpen(false)}
        sites={sites}
        activeSite={activeSiteValue}
        onSelectSite={(newSite) => floor.setSite(newSite)}
      />

      {/* ── Modals & Sheets ── */}
      {modal === 'prospect' && <ProspectForm onClose={close} />}
      {modal === 'book' && <BookTestDrive key={floor.site} lead={selected} onClose={close} />}
      {modal === 'deal' && (
        <DealForm
          key={String(selectedDeal?._id || selected?._id || 'new')}
          initialLead={selected}
          initialDeal={selectedDeal}
          onClose={close}
        />
      )}
      {modal === 'customer' && selected && (
        <CustomerDetails
          key={String(selected._id)}
          lead={selected}
          onClose={close}
          onBook={book}
          onDeal={deal}
          onAppraise={(lead) => {
            close();
            setSelected(lead);
            router.push({
              pathname: '/[view]',
              params: { view: 'appraisal', leadId: String(lead._id) },
            });
          }}
        />
      )}
    </SafeAreaView>
  );
}
