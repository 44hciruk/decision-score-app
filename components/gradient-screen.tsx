import { View, StyleSheet } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

interface GradientScreenProps {
  children: React.ReactNode;
  edges?: Edge[];
}

/**
 * 純白背景＋薄紫ドットパターン背景スクリーン
 * 企業iPhoneアプリらしい清潔感のあるデザイン
 */
export function GradientScreen({
  children,
  edges = ["top", "left", "right"],
}: GradientScreenProps) {
  // ドットパターンの座標（規則的なグリッド）
  const dots: { cx: number; cy: number; r: number; opacity: number }[] = [];
  const cols = 10;
  const rows = 22;
  const spacingX = 40;
  const spacingY = 40;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offsetX = row % 2 === 1 ? spacingX / 2 : 0;
      dots.push({
        cx: col * spacingX + offsetX + 10,
        cy: row * spacingY + 10,
        r: 2,
        opacity: 0.18,
      });
    }
  }

  return (
    <View style={styles.container}>
      {/* ドットパターン背景 */}
      <Svg
        style={StyleSheet.absoluteFillObject}
        width="100%"
        height="100%"
      >
        {dots.map((d, i) => (
          <Circle
            key={i}
            cx={d.cx}
            cy={d.cy}
            r={d.r}
            fill="#7C3AED"
            opacity={d.opacity}
          />
        ))}
      </Svg>

      <SafeAreaView edges={edges} style={styles.safeArea}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
  },
});
