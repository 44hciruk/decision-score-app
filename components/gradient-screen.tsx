import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

interface GradientScreenProps {
  children: React.ReactNode;
  colors?: [string, string, ...string[]];
  edges?: Edge[];
}

/**
 * 白ベース＋薄い紫グラデーション背景スクリーン
 * 清潔感があり、紫アクセントが映えるデザイン
 */
export function GradientScreen({
  children,
  colors = ["#F8F7FF", "#EDE9FF", "#F3F0FF"],
  edges = ["top", "left", "right"],
}: GradientScreenProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* 装飾的な薄い紫の円 */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <SafeAreaView edges={edges} style={styles.safeArea}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7FF",
  },
  safeArea: {
    flex: 1,
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.35,
  },
  blob1: {
    width: 280,
    height: 280,
    backgroundColor: "#DDD6FE",
    top: -100,
    right: -80,
  },
  blob2: {
    width: 220,
    height: 220,
    backgroundColor: "#C4B5FD",
    bottom: 120,
    left: -70,
    opacity: 0.2,
  },
});
