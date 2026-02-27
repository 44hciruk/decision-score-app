/** @type {const} */
const themeColors = {
  // melmo風: 薄グレー背景に白カード、紫アクセント
  primary:    { light: '#6D28D9', dark: '#7C3AED' },
  background: { light: '#F2F2F7', dark: '#1C1C1E' }, // iOS SystemGroupedBackground
  surface:    { light: '#FFFFFF', dark: '#2C2C2E' }, // 白カード
  foreground: { light: '#1C1C1E', dark: '#F2F2F7' }, // iOS label
  muted:      { light: '#8E8E93', dark: '#8E8E93' }, // iOS secondaryLabel
  border:     { light: '#E5E5EA', dark: '#38383A' }, // iOS separator
  success:    { light: '#34C759', dark: '#30D158' }, // iOS systemGreen
  warning:    { light: '#FF9500', dark: '#FF9F0A' }, // iOS systemOrange
  error:      { light: '#FF3B30', dark: '#FF453A' }, // iOS systemRed
};

module.exports = { themeColors };
