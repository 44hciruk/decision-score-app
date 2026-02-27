/** @type {const} */
const themeColors = {
  // アクセントカラー：深みのある紫
  primary:    { light: '#7C3AED', dark: '#9F67FF' },
  // 背景：オフホワイト（薄い紫みがかった白）
  background: { light: '#F8F7FF', dark: '#0F0E17' },
  // カード・サーフェス：純白
  surface:    { light: '#FFFFFF', dark: '#1A1825' },
  // テキスト
  foreground: { light: '#1A1535', dark: '#F0EEFF' },
  muted:      { light: '#6B7280', dark: '#9CA3AF' },
  // ボーダー
  border:     { light: '#E5E1FF', dark: '#2D2845' },
  // セマンティックカラー
  success:    { light: '#16A34A', dark: '#4ADE80' },
  warning:    { light: '#D97706', dark: '#FBBF24' },
  error:      { light: '#DC2626', dark: '#F87171' },
  // グラデーション用
  gradientStart: { light: '#F8F7FF', dark: '#0F0E17' },
  gradientEnd:   { light: '#EDE9FF', dark: '#1A1535' },
  // 薄い紫（カードアクセント）
  primaryLight:  { light: '#EDE9FF', dark: '#2D2060' },
  primaryMuted:  { light: '#DDD6FE', dark: '#3D2D7A' },
};

module.exports = { themeColors };
