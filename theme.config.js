/** @type {const} */
const themeColors = {
  // アクセントカラー：鮮やかな紫（iOS的な鮮明さ）
  primary:       { light: '#6D28D9', dark: '#8B5CF6' },
  // 背景：純白（水玉パターンはコンポーネント側で実装）
  background:    { light: '#FFFFFF', dark: '#0D0B14' },
  // カード・サーフェス：純白（影で浮き上がらせる）
  surface:       { light: '#FFFFFF', dark: '#1C1928' },
  // テキスト
  foreground:    { light: '#111827', dark: '#F9FAFB' },
  muted:         { light: '#6B7280', dark: '#9CA3AF' },
  subtle:        { light: '#9CA3AF', dark: '#6B7280' },
  // ボーダー（非常に薄く）
  border:        { light: '#F3F0FF', dark: '#2D2845' },
  // セマンティックカラー
  success:       { light: '#059669', dark: '#34D399' },
  warning:       { light: '#D97706', dark: '#FBBF24' },
  error:         { light: '#DC2626', dark: '#F87171' },
  // 紫系グラデーション用
  gradientStart: { light: '#FFFFFF', dark: '#0D0B14' },
  gradientEnd:   { light: '#F5F3FF', dark: '#1C1928' },
  // 薄い紫（バッジ・タグ・アイコン背景）
  primaryLight:  { light: '#EDE9FE', dark: '#2D1F6E' },
  primaryMuted:  { light: '#DDD6FE', dark: '#3D2D8A' },
  // タブバー用
  tint:          { light: '#6D28D9', dark: '#8B5CF6' },
};

module.exports = { themeColors };
