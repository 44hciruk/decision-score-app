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
  primary: '#FF8C42',
  primaryLight: '#FFF0E4',
  secondary: '#FFD166',
  accent: '#FF6B9D',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceWhite: '#FFFFFF',
  border: '#E8E8E8',
  textPrimary: '#1A1A1A',
  textSecondary: '#888888',
  success: '#4CAF82',
  danger: '#FF5252',
  warning: '#FFD166',
};

export const FONTS = {
  regular: 'ZenMaruGothic_400Regular',
  medium: 'ZenMaruGothic_500Medium',
  bold: 'ZenMaruGothic_700Bold',
};

/** @deprecated Use FONTS instead */
export const FLAT_FONTS = FONTS;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const SHADOW_NONE = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
};
