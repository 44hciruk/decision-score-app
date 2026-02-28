import { View, type ViewProps, StyleSheet } from "react-native";

export interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: string;
  className?: string;
  style?: ViewProps["style"];
  variant?: "default" | "accent" | "elevated";
}

/**
 * melmo風カードコンポーネント
 * - 白背景（#FFFFFF）
 * - 影なし（iOS SystemGroupedBackground #F2F2F7との差分で奥行きを表現）
 * - 薄いボーダー（#E5E5EA）
 * - 角丸 12px（melmoと同等）
 */
export function GlassCard({
  children,
  variant = "default",
  className,
  style,
  ...props
}: GlassCardProps) {
  const cardStyle =
    variant === "accent"
      ? styles.accentCard
      : styles.card;

  return (
    <View style={[cardStyle, style]} {...props}>
      {children}
    </View>
  );
}

/**
 * 後方互換性のためのエイリアス
 */
export function DarkGlassCard({
  children,
  style,
  ...props
}: GlassCardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // 標準カード：白地・影なし・薄ボーダー
  card: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5EA",
  },
  // アクセントカード：薄紫背景
  accentCard: {
    borderRadius: 12,
    backgroundColor: "#EDEDFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5EA",
  },
});
