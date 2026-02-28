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

import { ScreenContainer } from "@/components/screen-container";
import { GlassCard } from "@/components/glass-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useProjectContext } from "@/lib/project-context";
import { TEMPLATES } from "@/lib/storage";
import { PremiumModal } from "@/components/premium-modal";

const BADGE_COLORS = ["#5B4EFF", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

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

  const fillPercent = limits.criteria < Infinity
    ? Math.min((criteria.length / limits.criteria) * 100, 100)
    : 0;

  return (
    <>
      <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
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
              <IconSymbol name="chevron.left" size={20} color="#5B4EFF" />
              <Text style={styles.navBackText}>戻る</Text>
            </TouchableOpacity>
            <Text style={styles.navTitle}>評価項目</Text>
            <View style={styles.navSpacer} />
          </Animated.View>

          <Text style={styles.stepLabel}>ステップ 3 / 3</Text>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeInDown.delay(100).duration(300)}>
              <Text style={styles.sectionTitle}>何を基準に比較しますか？</Text>
              {limits.criteria < Infinity && (
                <View style={styles.limitRow}>
                  <Text style={styles.limitText}>
                    {criteria.length} / {limits.criteria} 項目（無料版）
                  </Text>
                  <View style={styles.limitBarBg}>
                    <View style={[styles.limitBarFill, { width: (fillPercent + "%") as any }]} />
                  </View>
                </View>
              )}
            </Animated.View>

            {criteria.map((criterion, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(150 + index * 60).duration(300)}
              >
                <GlassCard style={styles.inputCard}>
                  <View style={styles.inputRow}>
                    <View style={[styles.indexBadge, { backgroundColor: BADGE_COLORS[index % BADGE_COLORS.length] }]}>
                      <Text style={styles.indexText}>{index + 1}</Text>
                    </View>
                    <TextInput
                      ref={(ref) => { inputRefs.current[index] = ref; }}
                      style={styles.input}
                      placeholder={`評価項目 ${index + 1}`}
                      placeholderTextColor="#8E8E93"
                      value={criterion}
                      onChangeText={(v) => handleChange(index, v)}
                      returnKeyType="done"
                    />
                    {criteria.length > 2 && (
                      <TouchableOpacity
                        onPress={() => handleRemove(index)}
                        style={styles.removeBtn}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <IconSymbol name="xmark" size={16} color="#FF3B30" />
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
                  <IconSymbol name="plus" size={18} color="#5B4EFF" />
                </View>
                <Text style={styles.addBtnText}>項目を追加</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>

          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.bottomBar}>
            <TouchableOpacity
              onPress={handleStart}
              disabled={!canProceed}
              activeOpacity={0.85}
              style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
            >
              <IconSymbol name="star.fill" size={20} color={canProceed ? "#FFFFFF" : "#8E8E93"} />
              <Text style={[styles.nextBtnText, !canProceed && styles.nextBtnTextDisabled]}>
                スコアリング開始
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </ScreenContainer>

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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
    backgroundColor: "#FFFFFF",
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
    color: "#5B4EFF",
    fontWeight: "500",
  },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#1C1C1E",
    textAlign: "center",
  },
  navSpacer: {
    minWidth: 80,
  },
  stepLabel: {
    textAlign: "center",
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 16,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  limitRow: {
    marginBottom: 16,
  },
  limitText: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 6,
  },
  limitBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "#EDEDFF",
  },
  limitBarFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#5B4EFF",
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
    fontWeight: "700",
    color: "#FFFFFF",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1C1C1E",
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
    paddingVertical: 18,
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E5EA",
    borderStyle: "dashed",
    backgroundColor: "#FFFFFF",
    minHeight: 56,
  },
  addBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#EDEDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5B4EFF",
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 32,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 28,
    backgroundColor: "#5B4EFF",
    gap: 8,
    minHeight: 56,
  },
  nextBtnDisabled: {
    backgroundColor: "#EDEDFF",
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  nextBtnTextDisabled: {
    color: "#8E8E93",
  },
});
