import { useState, useCallback, useRef } from "react";
import {
  Text,
  View,
  TextInput,
  ScrollView,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { GradientScreen } from "@/components/gradient-screen";
import { GlassCard } from "@/components/glass-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useProjectContext } from "@/lib/project-context";
import { PremiumModal } from "@/components/premium-modal";

const BADGE_COLORS = ["#7C3AED", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

export default function CandidatesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ title: string; templateId: string }>();
  const { getLimits } = useProjectContext();
  const limits = getLimits();

  const [candidates, setCandidates] = useState<string[]>(["", ""]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleAdd = useCallback(() => {
    if (candidates.length >= limits.candidates) {
      setShowPremiumModal(true);
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCandidates((prev) => [...prev, ""]);
    setTimeout(() => {
      inputRefs.current[candidates.length]?.focus();
    }, 100);
  }, [candidates.length, limits.candidates]);

  const handleRemove = useCallback(
    (index: number) => {
      if (candidates.length <= 2) return;
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setCandidates((prev) => prev.filter((_, i) => i !== index));
    },
    [candidates.length]
  );

  const handleChange = useCallback((index: number, value: string) => {
    setCandidates((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const filledCandidates = candidates.filter((c) => c.trim());
  const canProceed = filledCandidates.length >= 2;

  const handleNext = useCallback(() => {
    if (!canProceed) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push({
      pathname: "/criteria",
      params: {
        title: params.title || "",
        templateId: params.templateId || "",
        candidates: JSON.stringify(filledCandidates),
      },
    });
  }, [canProceed, filledCandidates, params, router]);

  const fillPercent = Math.min((candidates.length / limits.candidates) * 100, 100);

  return (
    <>
      <GradientScreen edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <Animated.View entering={FadeIn.duration(300)} style={styles.navHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.navBackBtn}
              activeOpacity={0.7}
            >
              <IconSymbol name="chevron.left" size={20} color="#7C3AED" />
              <Text style={styles.navBackText}>戻る</Text>
            </TouchableOpacity>
            <Text style={styles.navTitle}>候補を入力</Text>
            <View style={styles.navSpacer} />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300)} style={styles.stepRow}>
            {[1, 2, 3].map((step) => (
              <View key={step} style={styles.stepItem}>
                <View style={[styles.stepDot, step <= 2 && styles.stepDotActive]}>
                  {step <= 1 ? (
                    <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
                  ) : step === 2 ? (
                    <Text style={styles.stepNumActive}>{step}</Text>
                  ) : (
                    <Text style={styles.stepNum}>{step}</Text>
                  )}
                </View>
                {step < 3 && <View style={[styles.stepLine, step <= 1 && styles.stepLineActive]} />}
              </View>
            ))}
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(50).duration(300)} style={styles.stepLabel}>
            ステップ 2 / 3 — 候補を入力
          </Animated.Text>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeInDown.delay(100).duration(300)}>
              <Text style={styles.sectionTitle}>比較する候補を入力</Text>
              <View style={styles.limitRow}>
                <Text style={styles.limitText}>
                  {candidates.length} / {limits.candidates} 候補
                  {limits.candidates <= 3 ? "（無料版）" : ""}
                </Text>
                <View style={styles.limitBarBg}>
                  <View style={[styles.limitBarFill, { width: (fillPercent + "%") as any }]} />
                </View>
              </View>
            </Animated.View>

            {candidates.map((candidate, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(150 + index * 60).duration(300)}
              >
                <GlassCard style={styles.inputCard}>
                  <View style={styles.inputRow}>
                    <View style={[styles.indexBadge, { backgroundColor: BADGE_COLORS[index % BADGE_COLORS.length] }]}>
                      <Text style={styles.indexText}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <TextInput
                      ref={(ref) => { inputRefs.current[index] = ref; }}
                      style={styles.input}
                      placeholder={`候補${String.fromCharCode(65 + index)}の名前`}
                      placeholderTextColor="#C4B5FD"
                      value={candidate}
                      onChangeText={(v) => handleChange(index, v)}
                      returnKeyType="done"
                    />
                    {candidates.length > 2 && (
                      <TouchableOpacity
                        onPress={() => handleRemove(index)}
                        style={styles.removeBtn}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <IconSymbol name="xmark" size={16} color="#DC2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                </GlassCard>
              </Animated.View>
            ))}

            <Animated.View entering={FadeInDown.delay(400).duration(300)}>
              <TouchableOpacity
                onPress={handleAdd}
                activeOpacity={0.75}
                style={styles.addBtn}
              >
                <View style={styles.addBtnIcon}>
                  <IconSymbol name="plus" size={18} color="#7C3AED" />
                </View>
                <Text style={styles.addBtnText}>候補を追加</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>

          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.bottomBar}>
            <TouchableOpacity
              onPress={handleNext}
              disabled={!canProceed}
              activeOpacity={0.85}
              style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
            >
              <Text style={[styles.nextBtnText, !canProceed && styles.nextBtnTextDisabled]}>
                次へ — 評価項目を設定
              </Text>
              <IconSymbol name="arrow.right" size={20} color={canProceed ? "#FFFFFF" : "#C4B5FD"} />
            </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingRight: 12,
    minWidth: 80,
  },
  navBackText: {
    fontSize: 16,
    color: "#7C3AED",
    fontWeight: "500",
  },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1535",
    textAlign: "center",
  },
  navSpacer: {
    minWidth: 80,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
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
    backgroundColor: "#E5E1FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  stepDotActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  stepNum: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  stepNumActive: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: "#E5E1FF",
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: "#7C3AED",
  },
  stepLabel: {
    textAlign: "center",
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1535",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  limitRow: {
    marginBottom: 16,
  },
  limitText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 6,
  },
  limitBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "#EDE9FF",
  },
  limitBarFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#7C3AED",
  },
  inputCard: {
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  indexBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
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
    fontSize: 16,
    color: "#1A1535",
    fontWeight: "500",
    paddingVertical: 4,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#DDD6FE",
    borderStyle: "dashed",
    backgroundColor: "#FAFAFE",
    minHeight: 56,
  },
  addBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#EDE9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#7C3AED",
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 32,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#7C3AED",
    gap: 8,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 56,
  },
  nextBtnDisabled: {
    backgroundColor: "#EDE9FF",
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  nextBtnTextDisabled: {
    color: "#C4B5FD",
  },
});
