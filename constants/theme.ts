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
  primary: '#1E6FD9',
  primaryLight: '#E8F0FB',
  secondary: '#4A90D9',
  accent: '#FF8C42',
  background: '#FFFFFF',
  surface: '#F0F0F0',
  surfaceWhite: '#FFFFFF',
  border: '#E0E0E0',
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

export const SHADOW_BUTTON = {
  shadowColor: '#1A4FA0',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.35,
  shadowRadius: 8,
  elevation: 8,
};
