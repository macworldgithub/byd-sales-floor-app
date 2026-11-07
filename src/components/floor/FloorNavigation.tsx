import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface NavigationItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  badge?: number;
  category: 'core' | 'showroom' | 'management' | 'system';
}

export const ALL_NAV_ITEMS: NavigationItem[] = [
  // Core Workflow
  { id: 'today', label: 'Today', icon: 'flash-outline', activeIcon: 'flash', category: 'core' },
  { id: 'leads', label: 'Leads', icon: 'people-outline', activeIcon: 'people', category: 'core' },
  { id: 'conversations', label: 'Inbox', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles', category: 'core' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar-outline', activeIcon: 'calendar', category: 'core' },

  // Showroom & Sales
  { id: 'inventory', label: 'Inventory', icon: 'car-sport-outline', activeIcon: 'car-sport', category: 'showroom' },
  { id: 'deals', label: 'Deals', icon: 'receipt-outline', activeIcon: 'receipt', category: 'showroom' },
  { id: 'deliveries', label: 'Deliveries', icon: 'checkmark-circle-outline', activeIcon: 'checkmark-circle', category: 'showroom' },
  { id: 'appraisal', label: 'I-Appraise', icon: 'speedometer-outline', activeIcon: 'speedometer', category: 'showroom' },
  { id: 'followups', label: 'BYD Journey', icon: 'compass-outline', activeIcon: 'compass', category: 'showroom' },

  // Management
  { id: 'pulse', label: 'PULSE Analytics', icon: 'pulse-outline', activeIcon: 'pulse', category: 'management' },
  { id: 'reports', label: 'Reports', icon: 'bar-chart-outline', activeIcon: 'bar-chart', category: 'management' },
  { id: 'allocation', label: 'Lead Allocation', icon: 'git-network-outline', activeIcon: 'git-network', category: 'management' },
  { id: 'staff', label: 'Team & Staff', icon: 'id-card-outline', activeIcon: 'id-card', category: 'management' },
  { id: 'settings', label: 'Site Settings', icon: 'settings-outline', activeIcon: 'settings', category: 'management' },

  // System
  { id: 'alerts', label: 'Alerts', icon: 'notifications-outline', activeIcon: 'notifications', category: 'system' },
  { id: 'more', label: 'Account', icon: 'person-circle-outline', activeIcon: 'person-circle', category: 'system' },
];

export interface BottomTabItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

export const BOTTOM_TABS: BottomTabItem[] = [
  { id: 'today', label: 'Today', icon: 'flash-outline', activeIcon: 'flash' },
  { id: 'leads', label: 'Leads', icon: 'people-outline', activeIcon: 'people' },
  { id: 'conversations', label: 'Inbox', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar-outline', activeIcon: 'calendar' },
  { id: 'menu', label: 'Menu', icon: 'grid-outline', activeIcon: 'grid' },
];

interface HeaderProps {
  currentView: string;
  activeSite: string;
  unreadAlertsCount: number;
  onOpenDrawer: () => void;
  onOpenSitePicker: () => void;
  onNavigateAlerts: () => void;
}

export function FloorHeader({
  currentView,
  activeSite,
  unreadAlertsCount,
  onOpenDrawer,
  onOpenSitePicker,
  onNavigateAlerts,
}: HeaderProps) {
  const currentItem = ALL_NAV_ITEMS.find((item) => item.id === currentView);
  const viewTitle = currentItem ? currentItem.label : 'Sales Floor';

  return (
    <View style={navStyles.headerContainer}>
      <View style={navStyles.headerLeft}>
        <TouchableOpacity
          onPress={onOpenDrawer}
          style={navStyles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Ionicons name="menu" size={24} color="#0f172a" />
        </TouchableOpacity>

        <View style={navStyles.headerTitleBlock}>
          <View style={navStyles.brandRow}>
            <View style={navStyles.brandBadge}>
              <Text style={navStyles.brandBadgeText}>BYD</Text>
            </View>
            <Text style={navStyles.headerTitle} numberOfLines={1}>
              {viewTitle}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onOpenSitePicker}
            style={navStyles.siteSelectorPill}
            activeOpacity={0.7}
          >
            <Ionicons name="location-sharp" size={11} color="#e60012" />
            <Text style={navStyles.sitePillText} numberOfLines={1}>
              {activeSite}
            </Text>
            <Ionicons name="chevron-down" size={11} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={navStyles.headerRight}>
        <TouchableOpacity
          onPress={onNavigateAlerts}
          style={navStyles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Alerts"
        >
          <Ionicons name="notifications-outline" size={21} color="#0f172a" />
          {unreadAlertsCount > 0 && (
            <View style={navStyles.badgeCircle}>
              <Text style={navStyles.badgeText}>
                {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface BottomNavProps {
  activeView: string;
  onNavigate: (viewId: string) => void;
  onToggleDrawer: () => void;
  unreadInboxCount?: number;
}

export function FloorBottomNav({
  activeView,
  onNavigate,
  onToggleDrawer,
  unreadInboxCount = 0,
}: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <View style={[navStyles.bottomNavContainer, { paddingBottom: bottomPadding }]}>
      {BOTTOM_TABS.map((tab) => {
        const isMenu = tab.id === 'menu';
        const isCurrent = activeView === tab.id;
        const showInboxBadge = tab.id === 'conversations' && unreadInboxCount > 0;

        return (
          <TouchableOpacity
            key={tab.id}
            style={navStyles.tabItem}
            activeOpacity={0.75}
            onPress={() => {
              if (isMenu) {
                onToggleDrawer();
              } else {
                onNavigate(tab.id);
              }
            }}
          >
            <View style={navStyles.tabIconWrap}>
              <Ionicons
                name={isCurrent ? tab.activeIcon : tab.icon}
                size={22}
                color={isCurrent ? '#e60012' : '#64748b'}
              />
              {showInboxBadge && (
                <View style={navStyles.tabBadge}>
                  <Text style={navStyles.tabBadgeText}>
                    {unreadInboxCount > 9 ? '9+' : unreadInboxCount}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                navStyles.tabLabel,
                isCurrent && navStyles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
            {isCurrent && <View style={navStyles.tabActiveDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
  currentView: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  isManager: boolean;
  sites: string[];
  activeSite: string;
  unreadAlertsCount: number;
  onSelectSite: (site: string) => void;
  onNavigate: (viewId: string) => void;
  onSignOut: () => void;
}

export function FloorDrawer({
  visible,
  onClose,
  currentView,
  userName = 'BYD Consultant',
  userEmail = '',
  userRole = 'consultant',
  isManager,
  sites,
  activeSite,
  unreadAlertsCount,
  onSelectSite,
  onNavigate,
  onSignOut,
}: DrawerProps) {
  const [showSitesList, setShowSitesList] = useState(false);
  const initials = (userName || 'BYD')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSelectNav = (viewId: string) => {
    onClose();
    onNavigate(viewId);
  };

  const allowedItems = ALL_NAV_ITEMS.filter((item) => {
    if (item.category === 'management' && !isManager) return false;
    return true;
  });

  const coreItems = allowedItems.filter((i) => i.category === 'core');
  const showroomItems = allowedItems.filter((i) => i.category === 'showroom');
  const managementItems = allowedItems.filter((i) => i.category === 'management');
  const systemItems = allowedItems.filter((i) => i.category === 'system');

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={navStyles.drawerOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={navStyles.drawerBackdrop} />
        </TouchableWithoutFeedback>

        <View style={navStyles.drawerContent}>
          {/* Drawer Header with User Profile */}
          <View style={navStyles.drawerHeader}>
            <View style={navStyles.drawerBrandRow}>
              <View style={navStyles.brandBadge}>
                <Text style={navStyles.brandBadgeText}>BYD</Text>
              </View>
              <Text style={navStyles.drawerBrandTitle}>SALES FLOOR OS</Text>
              <TouchableOpacity onPress={onClose} style={navStyles.drawerCloseBtn}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* User Profile Card */}
            <View style={navStyles.userCard}>
              <View style={navStyles.userAvatar}>
                <Text style={navStyles.userAvatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={navStyles.userName} numberOfLines={1}>
                  {userName}
                </Text>
                {userEmail ? (
                  <Text style={navStyles.userEmail} numberOfLines={1}>
                    {userEmail}
                  </Text>
                ) : null}
                <View style={navStyles.roleBadge}>
                  <Text style={navStyles.roleBadgeText}>
                    {isManager ? 'Dealership Manager' : userRole.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Site selector dropdown button */}
            <TouchableOpacity
              style={navStyles.drawerSitePickerBtn}
              onPress={() => setShowSitesList((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Ionicons name="business-outline" size={16} color="#e60012" />
              <View style={{ flex: 1 }}>
                <Text style={navStyles.drawerSiteLabel}>ACTIVE DEALERSHIP</Text>
                <Text style={navStyles.drawerSiteValue} numberOfLines={1}>
                  {activeSite}
                </Text>
              </View>
              <Ionicons
                name={showSitesList ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#64748b"
              />
            </TouchableOpacity>

            {/* Collapsible Sites List */}
            {showSitesList && (
              <View style={navStyles.drawerSitesDropdown}>
                {sites.map((s) => {
                  const isCurrent = s === activeSite;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[
                        navStyles.drawerSiteOption,
                        isCurrent && navStyles.drawerSiteOptionActive,
                      ]}
                      onPress={() => {
                        onSelectSite(s);
                        setShowSitesList(false);
                      }}
                    >
                      <Ionicons
                        name={isCurrent ? 'radio-button-on' : 'radio-button-off'}
                        size={15}
                        color={isCurrent ? '#e60012' : '#94a3b8'}
                      />
                      <Text
                        style={[
                          navStyles.drawerSiteOptionText,
                          isCurrent && navStyles.drawerSiteOptionTextActive,
                        ]}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Navigation Items List */}
          <ScrollView
            style={navStyles.drawerScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 36 }}
          >
            {/* Section 1: Core Workflow */}
            <Text style={navStyles.sectionHeader}>CORE WORKFLOW</Text>
            {coreItems.map((item) => (
              <DrawerLink
                key={item.id}
                item={item}
                isActive={currentView === item.id}
                onPress={() => handleSelectNav(item.id)}
              />
            ))}

            {/* Section 2: Showroom & Sales */}
            <Text style={navStyles.sectionHeader}>SHOWROOM & SALES</Text>
            {showroomItems.map((item) => (
              <DrawerLink
                key={item.id}
                item={item}
                isActive={currentView === item.id}
                onPress={() => handleSelectNav(item.id)}
              />
            ))}

            {/* Section 3: Management */}
            {managementItems.length > 0 && (
              <>
                <Text style={navStyles.sectionHeader}>DEALERSHIP MANAGEMENT</Text>
                {managementItems.map((item) => (
                  <DrawerLink
                    key={item.id}
                    item={item}
                    isActive={currentView === item.id}
                    onPress={() => handleSelectNav(item.id)}
                  />
                ))}
              </>
            )}

            {/* Section 4: System & Alerts */}
            <Text style={navStyles.sectionHeader}>ACCOUNT & SYSTEM</Text>
            {systemItems.map((item) => (
              <DrawerLink
                key={item.id}
                item={{
                  ...item,
                  badge: item.id === 'alerts' ? unreadAlertsCount : undefined,
                }}
                isActive={currentView === item.id}
                onPress={() => handleSelectNav(item.id)}
              />
            ))}

            {/* Sign Out Action */}
            <TouchableOpacity
              style={navStyles.drawerSignOutBtn}
              onPress={() => {
                onClose();
                onSignOut();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              <Text style={navStyles.drawerSignOutText}>Sign Out</Text>
            </TouchableOpacity>

            <View style={navStyles.drawerFooter}>
              <Text style={navStyles.drawerFooterText}>
                BYD Harmony Sales Floor · v2.4
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DrawerLink({
  item,
  isActive,
  onPress,
}: {
  item: NavigationItem;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[navStyles.drawerLink, isActive && navStyles.drawerLinkActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={isActive ? item.activeIcon : item.icon}
        size={20}
        color={isActive ? '#e60012' : '#475569'}
      />
      <Text style={[navStyles.drawerLinkText, isActive && navStyles.drawerLinkTextActive]}>
        {item.label}
      </Text>
      {item.badge !== undefined && item.badge > 0 && (
        <View style={navStyles.drawerBadge}>
          <Text style={navStyles.drawerBadgeText}>{item.badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function SiteSwitcherSheet({
  visible,
  onClose,
  sites,
  activeSite,
  onSelectSite,
}: {
  visible: boolean;
  onClose: () => void;
  sites: string[];
  activeSite: string;
  onSelectSite: (site: string) => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={navStyles.siteModalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={navStyles.siteModalBackdrop} />
        </TouchableWithoutFeedback>

        <View style={navStyles.siteModalSheet}>
          <View style={navStyles.handleBarWrap}>
            <View style={navStyles.handleBar} />
          </View>

          <View style={navStyles.siteModalHeader}>
            <View>
              <Text style={navStyles.siteModalTitle}>Switch Dealership Site</Text>
              <Text style={navStyles.siteModalSub}>
                Select the dealership location to view active leads and stock
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={navStyles.siteModalCloseBtn}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 380 }}>
            {sites.map((site) => {
              const isSelected = site === activeSite;
              return (
                <TouchableOpacity
                  key={site}
                  style={[
                    navStyles.siteCard,
                    isSelected && navStyles.siteCardActive,
                  ]}
                  onPress={() => {
                    onSelectSite(site);
                    onClose();
                  }}
                  activeOpacity={0.75}
                >
                  <View style={navStyles.siteIconWrap}>
                    <Ionicons
                      name="business"
                      size={18}
                      color={isSelected ? '#e60012' : '#64748b'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        navStyles.siteCardName,
                        isSelected && navStyles.siteCardNameActive,
                      ]}
                    >
                      {site}
                    </Text>
                    <Text style={navStyles.siteCardSub}>
                      {site === 'All Sites'
                        ? 'Consolidated management overview'
                        : 'Showroom & service centre'}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color="#e60012" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const navStyles = StyleSheet.create({
  // Header
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitleBlock: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandBadge: {
    backgroundColor: '#e60012',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  brandBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  siteSelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sitePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    maxWidth: 180,
  },
  badgeCircle: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#e60012',
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },

  // Bottom Nav
  bottomNavContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    paddingHorizontal: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    position: 'relative',
  },
  tabIconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#e60012',
    fontWeight: '700',
  },
  tabActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e60012',
    marginTop: 2,
  },
  tabBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: '#e60012',
    borderRadius: 999,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  tabBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },

  // Drawer
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  drawerContent: {
    width: '82%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    height: '100%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  drawerHeader: {
    backgroundColor: '#090d16',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 48 : 28,
    paddingBottom: 16,
  },
  drawerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  drawerBrandTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    flex: 1,
    marginLeft: 8,
  },
  drawerCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e60012',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  userName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  userEmail: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(230, 0, 18, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  roleBadgeText: {
    color: '#fca5a5',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  drawerSitePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  drawerSiteLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  drawerSiteValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  drawerSitesDropdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    marginTop: 6,
    padding: 6,
    gap: 4,
  },
  drawerSiteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  drawerSiteOptionActive: {
    backgroundColor: 'rgba(230, 0, 18, 0.15)',
  },
  drawerSiteOptionText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
  },
  drawerSiteOptionTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  drawerScroll: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  drawerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  drawerLinkActive: {
    backgroundColor: '#fff1f2',
  },
  drawerLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  drawerLinkTextActive: {
    color: '#e60012',
    fontWeight: '700',
  },
  drawerBadge: {
    backgroundColor: '#e60012',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  drawerBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  drawerSignOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  drawerSignOutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
  },
  drawerFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  drawerFooterText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },

  // Site Switcher Modal Sheet
  siteModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  siteModalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  siteModalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handleBarWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  handleBar: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#cbd5e1',
  },
  siteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  siteModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  siteModalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  siteModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginBottom: 10,
  },
  siteCardActive: {
    borderColor: '#e60012',
    backgroundColor: '#fff5f5',
  },
  siteIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  siteCardNameActive: {
    color: '#e60012',
  },
  siteCardSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
});
