import { View, type ViewProps, StyleSheet } from "react-native";

export interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: string;
  className?: string;
  style?: ViewProps["style"];
  variant?: "default" | "accent" | "elevated";
}

/**
 * プロフェッショナルなカードコンポーネント
 * 純白背景＋強めの影で企業アプリらしい立体感を演出
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
      : variant === "elevated"
      ? styles.elevatedCard
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
  // 標準カード：白地＋しっかりした影
  card: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(109, 40, 217, 0.08)",
    shadowColor: "#1E1B4B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
  // アクセントカード：薄紫背景
  accentCard: {
    borderRadius: 20,
    backgroundColor: "#EDE9FE",
    borderWidth: 1,
    borderColor: "rgba(109, 40, 217, 0.15)",
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  // 強調カード：より深い影
  elevatedCard: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 0,
    shadowColor: "#1E1B4B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
  },
});
