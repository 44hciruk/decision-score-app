import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

interface GradientScreenProps {
  children: React.ReactNode;
  colors?: [string, string, ...string[]];
  edges?: Edge[];
}

/**
 * Full-screen gradient background container.
 * Provides a beautiful Apple-style gradient background for all screens.
 */
export function GradientScreen({
  children,
  colors = ["#6366F1", "#8B5CF6", "#A78BFA"],
  edges = ["top", "left", "right"],
}: GradientScreenProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Decorative blobs */}
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
    backgroundColor: "#6366F1",
  },
  safeArea: {
    flex: 1,
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.15,
  },
  blob1: {
    width: 300,
    height: 300,
    backgroundColor: "#A78BFA",
    top: -80,
    right: -80,
  },
  blob2: {
    width: 250,
    height: 250,
    backgroundColor: "#60A5FA",
    bottom: 100,
    left: -60,
  },
});
