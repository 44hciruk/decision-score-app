/**
 * Thin re-exports so consumers don't need to know about internal theme plumbing.
 * Full implementation lives in lib/_core/theme.ts.
 */
export {
  Colors,
  Fonts,
  SchemeColors,
  ThemeColors,
  type ColorScheme,
  type ThemeColorPalette,
} from "@/lib/_core/theme";

// ─── フラットデザイン トークン ────────────────────────────
export const COLORS = {
  primary: '#5B5BD6',
  primaryLight: '#EDEDFA',
  background: '#F7F7FB',
  surface: '#FFFFFF',
  border: '#E8E8F0',
  textPrimary: '#1A1A2E',
  textSecondary: '#888899',
  success: '#4CAF82',
  danger: '#FF5252',
  warning: '#FFB74D',
};

export const FLAT_FONTS = {
  regular: 'ZenMaruGothic_400Regular',
  medium: 'ZenMaruGothic_500Medium',
  bold: 'ZenMaruGothic_700Bold',
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};
