/** @type {const} */
const themeColors = {
  // melmo風: 薄グレー背景に白カード、青紫アクセント
  primary:    { light: '#5B4EFF', dark: '#5B4EFF' },
  background: { light: '#F2F2F7', dark: '#1C1C1E' }, // iOS SystemGroupedBackground
  surface:    { light: '#FFFFFF', dark: '#2C2C2E' }, // 白カード
  foreground: { light: '#1C1C1E', dark: '#F2F2F7' }, // iOS label
  muted:      { light: '#8E8E93', dark: '#8E8E93' }, // iOS secondaryLabel
  border:     { light: '#E5E5EA', dark: '#38383A' }, // iOS separator
  accent:     { light: '#EDEDFF', dark: '#1C1A3A' }, // アクセント薄
  success:    { light: '#34C759', dark: '#30D158' }, // iOS systemGreen
  warning:    { light: '#FF9500', dark: '#FF9F0A' }, // iOS systemOrange
  error:      { light: '#FF3B30', dark: '#FF453A' }, // iOS systemRed
};

const tokens = {
  radius:  { card: 12, pill: 28, badge: 8, icon: 10 },
  spacing: { screen: 16, section: 24, card: 16, row: 12 },
};

module.exports = { themeColors, tokens };
