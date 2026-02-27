import { View, type ViewProps, Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: "light" | "dark" | "default" | "extraLight" | "prominent" | "regular" | "systemUltraThinMaterial" | "systemThinMaterial" | "systemMaterial" | "systemThickMaterial" | "systemChromeMaterial";
  className?: string;
  style?: ViewProps["style"];
}

/**
 * Apple-style glass morphism card component.
 * Uses BlurView on iOS/Android, falls back to semi-transparent View on web.
 */
export function GlassCard({
  children,
  intensity = 60,
  tint = "light",
  className,
  style,
  ...props
}: GlassCardProps) {
  if (Platform.OS === "web") {
    return (
      <View
        style={[styles.webCard, style]}
        {...props}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[styles.card, style]}
      {...(props as any)}
    >
      {children}
    </BlurView>
  );
}

/**
 * Dark glass card for use on gradient backgrounds.
 */
export function DarkGlassCard({
  children,
  intensity = 40,
  style,
  ...props
}: GlassCardProps) {
  if (Platform.OS === "web") {
    return (
      <View
        style={[styles.darkWebCard, style]}
        {...props}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint="dark"
      style={[styles.card, style]}
      {...(props as any)}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  webCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(20px)",
  } as any,
  darkWebCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.12)",
    backdropFilter: "blur(20px)",
  } as any,
});
