import { useState, useCallback, useRef } from "react";
import {
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { GradientScreen } from "@/components/gradient-screen";
import { DarkGlassCard } from "@/components/glass-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useProjectContext } from "@/lib/project-context";
import { TEMPLATES } from "@/lib/storage";
import { PremiumModal } from "@/components/premium-modal";

export default function CriteriaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    title: string;
    templateId: string;
    candidates: string;
  }>();
  const { getLimits } = useProjectContext();
  const limits = getLimits();

  const candidates: string[] = params.candidates ? JSON.parse(params.candidates) : [];
  const template = TEMPLATES.find((t) => t.id === params.templateId);
  const initialCriteria = template ? template.criteria.slice(0, limits.criteria) : ["", ""];

  const [criteria, setCriteria] = useState<string[]>(initialCriteria);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleAdd = useCallback(() => {
    if (criteria.length >= limits.criteria) {
      setShowPremiumModal(true);
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCriteria((prev) => [...prev, ""]);
    setTimeout(() => {
      inputRefs.current[criteria.length]?.focus();
    }, 100);
  }, [criteria.length, limits.criteria]);

  const handleRemove = useCallback(
    (index: number) => {
      if (criteria.length <= 2) return;
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setCriteria((prev) => prev.filter((_, i) => i !== index));
    },
    [criteria.length]
  );

  const handleChange = useCallback((index: number, value: string) => {
    setCriteria((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const filledCriteria = criteria.filter((c) => c.trim());
  const canProceed = filledCriteria.length >= 2;

  const handleStart = useCallback(() => {
    if (!canProceed) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push({
      pathname: "/ranking",
      params: {
        title: params.title || "",
        candidates: JSON.stringify(candidates),
        criteria: JSON.stringify(filledCriteria),
      },
    });
  }, [canProceed, candidates, filledCriteria, params.title, router]);

  const BADGE_COLORS = ["#F472B6", "#60A5FA", "#34D399", "#FBBF24", "#A78BFA", "#FB923C"];

  return (
    <>
      <GradientScreen edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          {/* Nav Header */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.navHeader}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.5 }]}
            >
              <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.navTitle}>評価項目</Text>
            <View style={styles.navBtn} />
          </Animated.View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Step indicator */}
            <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContainer}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={styles.stepItem}>
                  <View style={[styles.stepDot, styles.stepDotActive]}>
                    <Text style={[styles.stepNum, { color: "#6366F1" }]}>{i + 1}</Text>
                  </View>
                  {i < 2 && <View style={[styles.stepLine, styles.stepLineActive]} />}
                </View>
              ))}
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(50).duration(300)} style={styles.stepLabel}>
              ステップ 3/3 — 評価項目を設定
            </Animated.Text>

            <Animated.View entering={FadeInDown.delay(100).duration(300)}>
              <Text style={styles.sectionTitle}>何を基準に比較しますか？</Text>
              {limits.criteria < Infinity && (
                <View style={styles.limitRow}>
                  <Text style={styles.limitText}>
                    {criteria.length}/{limits.criteria} 項目（無料版上限）
                  </Text>
                  <View style={styles.limitBarBg}>
                    <View
                      style={[
                        styles.limitBarFill,
                        { width: `${Math.min((criteria.length / limits.criteria) * 100, 100)}%` },
                      ]}
                    />
                  </View>
                </View>
              )}
            </Animated.View>

            {/* Criteria inputs */}
            {criteria.map((criterion, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(150 + index * 60).duration(300)}
              >
                <DarkGlassCard style={styles.inputCard}>
                  <View style={styles.inputRow}>
                    <View style={[styles.indexBadge, { backgroundColor: BADGE_COLORS[index % BADGE_COLORS.length] }]}>
                      <Text style={styles.indexText}>{index + 1}</Text>
                    </View>
                    <TextInput
                      ref={(ref) => { inputRefs.current[index] = ref; }}
                      style={styles.input}
                      placeholder={`評価項目${index + 1}`}
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      value={criterion}
                      onChangeText={(v) => handleChange(index, v)}
                      returnKeyType="done"
                    />
                    {criteria.length > 2 && (
                      <Pressable
                        onPress={() => handleRemove(index)}
                        style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.5 }]}
                      >
                        <IconSymbol name="xmark" size={18} color="rgba(255,100,100,0.8)" />
                      </Pressable>
                    )}
                  </View>
                </DarkGlassCard>
              </Animated.View>
            ))}

            {/* Add button */}
            <Animated.View entering={FadeInDown.delay(400).duration(300)}>
              <Pressable
                onPress={handleAdd}
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
              >
                <DarkGlassCard style={styles.addBtn}>
                  <IconSymbol name="plus" size={20} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.addBtnText}>項目を追加</Text>
                </DarkGlassCard>
              </Pressable>
            </Animated.View>
          </ScrollView>

          {/* Bottom button */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.bottomBar}>
            <Pressable
              onPress={handleStart}
              disabled={!canProceed}
              style={({ pressed }) => [
                styles.nextBtn,
                !canProceed && styles.nextBtnDisabled,
                pressed && canProceed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
              ]}
            >
              <Text style={[styles.nextBtnText, !canProceed && styles.nextBtnTextDisabled]}>
                スコアリング開始
              </Text>
              <IconSymbol name="arrow.right" size={20} color={canProceed ? "#6366F1" : "rgba(255,255,255,0.4)"} />
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </GradientScreen>

      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="プレミアムプランで制限を解除"
        message="より多くの候補や評価項目を追加して、複雑な意思決定をサポートします。"
        onUpgrade={() => {
          setShowPremiumModal(false);
          router.push("/(tabs)/settings");
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotActive: {
    backgroundColor: "#FFFFFF",
  },
  stepNum: {
    fontSize: 13,
    fontWeight: "700",
  },
  stepLine: {
    width: 36,
    height: 2,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  stepLabel: {
    textAlign: "center",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  limitRow: {
    marginBottom: 16,
  },
  limitText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 6,
  },
  limitBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  limitBarFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#A78BFA",
  },
  inputCard: {
    marginBottom: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  indexBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  indexText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  input: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 8,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  removeBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
    marginTop: 4,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  nextBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.2)",
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6366F1",
  },
  nextBtnTextDisabled: {
    color: "rgba(255,255,255,0.4)",
  },
});
