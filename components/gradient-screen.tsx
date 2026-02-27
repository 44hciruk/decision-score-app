import { View, StyleSheet } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

interface GradientScreenProps {
  children: React.ReactNode;
  edges?: Edge[];
}

/**
 * melmo風スクリーンコンテナ
 * - 背景: iOS SystemGroupedBackground (#F2F2F7)
 * - ドットパターン・グラデーションなし
 * - 白カードが背景色との差分で自然に浮き上がる
 */
export function GradientScreen({
  children,
  edges = ["top", "left", "right"],
}: GradientScreenProps) {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={edges} style={styles.safeArea}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  safeArea: {
    flex: 1,
  },
});
