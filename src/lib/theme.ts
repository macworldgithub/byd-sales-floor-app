// Design tokens matching BYD Sales Floor luxury automotive design system
export const Colors = {
  // Brand
  brand: '#e60012',
  brandDark: '#b8000e',
  brandLight: '#ff2a3b',
  brandGlow: 'rgba(230, 0, 18, 0.15)',
  brandSoft: '#fff1f2',
  brandBorder: '#fecdd3',

  // Dark backgrounds
  dark: '#090d16',
  darkCard: '#131926',
  darkCardHover: '#1c2436',
  darkBorder: 'rgba(255, 255, 255, 0.08)',
  darkCardBorder: 'rgba(255, 255, 255, 0.06)',

  // Light backgrounds
  light: '#f8fafc',
  lightCard: '#ffffff',
  lightBorder: '#e2e8f0',
  lightBorderHover: '#cbd5e1',

  // Surface & Borders
  border: '#e2e8f0',
  borderSubtle: '#f1f5f9',
  surface: '#f8fafc',
  surfaceCard: '#ffffff',

  // Text
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textWhite: '#ffffff',
  textDarkPrimary: '#f8fafc',
  textDarkSecondary: '#94a3b8',
  textDarkMuted: '#64748b',

  // Stage colors
  stageImported: { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
  stageEngaged: { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' },
  stageQualified: { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
  stageCommitted: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },

  // Event type colors
  eventDrive: '#e60012',
  eventDelivery: '#10b981',
  eventFollowup: '#f59e0b',
  eventHold: '#64748b',

  // Semantic & Accents
  success: '#10b981',
  successSoft: '#ecfdf5',
  successText: '#065f46',
  warning: '#f59e0b',
  warningSoft: '#fffbeb',
  warningText: '#92400e',
  error: '#ef4444',
  errorSoft: '#fef2f2',
  errorText: '#991b1b',
  info: '#0284c7',
  infoSoft: '#f0f9ff',
  infoText: '#075985',
  purple: '#8b5cf6',
  purpleSoft: '#f5f3ff',
  purpleText: '#5b21b6',

  // Tab bar
  tabBarBg: '#090d16',
  tabActive: '#e60012',
  tabInactive: '#64748b',
};

export const Typography = {
  // Raw sizes (numeric)
  xxs: 10,
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 28,

  // Semantic scale objects (fontSize, lineHeight)
  displayLarge: { fontSize: 30, lineHeight: 36, fontWeight: '800' as const },
  displayMedium: { fontSize: 26, lineHeight: 32, fontWeight: '800' as const },
  titleLarge: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  titleMedium: { fontSize: 17, lineHeight: 22, fontWeight: '700' as const },
  titleSmall: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const },
  bodyLarge: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyMedium: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  bodySmall: { fontSize: 11, lineHeight: 15, fontWeight: '400' as const },
  labelLarge: { fontSize: 13, lineHeight: 17, fontWeight: '600' as const },
  labelMedium: { fontSize: 11, lineHeight: 15, fontWeight: '600' as const },
  labelSmall: { fontSize: 10, lineHeight: 13, fontWeight: '700' as const },

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 44,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 26,
  full: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  brand: {
    shadowColor: '#e60012',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
};
