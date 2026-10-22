// Design tokens matching BYD Sales Floor web design
export const Colors = {
  // Brand
  brand: '#e60012',
  brandDark: '#b3000e',
  brandLight: '#ff1a2a',
  brandGlow: 'rgba(230, 0, 18, 0.15)',

  // Dark backgrounds
  dark: '#090c12',
  darkCard: '#171b22',
  darkBorder: 'rgba(255, 255, 255, 0.1)',
  darkCardBorder: 'rgba(255, 255, 255, 0.08)',

  // Light backgrounds
  light: '#f4f5f7',
  lightCard: '#ffffff',
  lightBorder: '#e2e8f0',
  lightBorderHover: '#cbd5e1',

  // Border (alias for light)
  border: '#e2e8f0',
  surface: '#f8fafc',

  // Text
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  textWhite: '#ffffff',
  textDarkPrimary: '#f1f5f9',
  textDarkSecondary: '#94a3b8',
  textDarkMuted: '#64748b',

  // Stage colors
  stageImported: { bg: '#f1f5f9', text: '#475569' },
  stageEngaged: { bg: '#ecfeff', text: '#0e7490' },
  stageQualified: { bg: '#fffbeb', text: '#92400e' },
  stageCommitted: { bg: '#f0fdf4', text: '#166534' },

  // Event type colors
  eventDrive: '#e60012',
  eventDelivery: '#10b981',
  eventFollowup: '#f59e0b',
  eventHold: '#6b7280',

  // Semantic
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Tab bar
  tabBarBg: '#171b22',
  tabActive: '#e60012',
  tabInactive: '#64748b',
};

export const Typography = {
  // Raw sizes (numeric)
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 28,

  // Semantic text scale objects (fontSize, lineHeight)
  displayLarge: { fontSize: 32, lineHeight: 40 },
  displayMedium: { fontSize: 28, lineHeight: 36 },
  titleLarge: { fontSize: 22, lineHeight: 28 },
  titleMedium: { fontSize: 18, lineHeight: 24 },
  titleSmall: { fontSize: 16, lineHeight: 22 },
  bodyLarge: { fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontSize: 14, lineHeight: 20 },
  bodySmall: { fontSize: 12, lineHeight: 18 },
  labelLarge: { fontSize: 14, lineHeight: 20 },
  labelMedium: { fontSize: 12, lineHeight: 16 },
  labelSmall: { fontSize: 11, lineHeight: 14 },

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  brand: {
    shadowColor: '#e60012',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};
