// Powered by OnSpace.AI
export const Colors = {
  // Base
  background: '#080d1a',
  surface: '#0f1629',
  surfaceElevated: '#141d35',
  surfaceCard: '#1a2340',
  border: '#1e2d4a',
  borderLight: '#263354',

  // Brand
  primary: '#3b7fff',
  primaryLight: '#5a9bff',
  primaryDark: '#2460d9',
  primaryGlow: 'rgba(59, 127, 255, 0.2)',

  // Accent
  gold: '#f0c040',
  goldLight: '#f5d060',
  goldGlow: 'rgba(240, 192, 64, 0.2)',
  emerald: '#22c98a',
  emeraldGlow: 'rgba(34, 201, 138, 0.15)',
  rose: '#ff5c7c',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#8fa3c0',
  textMuted: '#4a6080',
  textInverse: '#080d1a',

  // Semantic
  success: '#22c98a',
  warning: '#f0c040',
  error: '#ff5c7c',
  info: '#3b7fff',

  // Gradient stops
  gradientBlue: ['#3b7fff', '#1a3fa0'],
  gradientGold: ['#f0c040', '#d4941a'],
  gradientDark: ['#0f1629', '#080d1a'],
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  hero: 38,
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};
