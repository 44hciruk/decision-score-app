import { View, type ViewProps, StyleSheet } from "react-native";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: string;
  className?: string;
  style?: ViewProps["style"];
  variant?: "default" | "accent";
}

/**
 * クリーンなカードコンポーネント（白ベース＋紫アクセント）
 */
export function GlassCard({
  children,
  variant = "default",
  className,
  style,
  ...props
}: GlassCardProps) {
  return (
    <View
      style={[variant === "accent" ? styles.accentCard : styles.card, style]}
      {...props}
    >
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
  card: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E1FF",
    backgroundColor: "#FFFFFF",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  accentCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: "#EDE9FF",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});
