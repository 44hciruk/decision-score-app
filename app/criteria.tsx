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
import { PremiumModal } from "@/components/premium-modal";

const TEMPLATE_CRITERIA: Record<string, string[]> = {
  restaurant:    ["価格", "味", "雰囲気", "アクセス", "接客"],
  shopping:      ["価格", "デザイン", "機能性", "耐久性", "口コミ"],
  travel:        ["費用", "観光スポット", "食事", "移動しやすさ", "安全性"],
  lesson:        ["料金", "実績・評判", "通いやすさ", "カリキュラム", "口コミ"],
  entertainment: ["ストーリー", "映像", "音楽", "世界観", "評価"],
  career:        ["給与", "福利厚生", "勤務地", "休日・休暇", "仕事内容"],
};

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
  const initialCriteria = TEMPLATE_CRITERIA[params.templateId || ""] ?? ["", "", "", "", ""];

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
  const isValid = criteria.some((c) => c.trim().length > 0);

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

          <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 4 }}>
            <Text style={{ fontSize: 13, color: '#8E8E93' }}>ステップ 3 / 3</Text>
          </View>
          <View style={{ marginTop: 4, marginBottom: 16, marginHorizontal: 32 }}>
            <View style={{ height: 4, backgroundColor: '#E5E5EA', borderRadius: 2 }}>
              <View style={{ width: '100%', height: 4, backgroundColor: '#5B4EFF', borderRadius: 2 }} />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeInDown.delay(100).duration(300)}>
              <Text style={styles.sectionTitle}>何を基準に比較しますか？</Text>
              <Text style={{ fontSize: 13, color: '#8E8E93', marginBottom: 12 }}>
                大事にしたいポイントを入力してください（例：価格、立地）
              </Text>
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
                    <View style={[styles.indexBadge, { backgroundColor: '#5B4EFF' }]}>
                      <Text style={styles.indexText}>{index + 1}</Text>
                    </View>
                    <TextInput
                      ref={(ref) => { inputRefs.current[index] = ref; }}
                      style={styles.input}
                      placeholder={`評価基準 ${index + 1}`}
                      placeholderTextColor="#C7C7CC"
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
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
              >
                <IconSymbol name="plus" size={18} color="#5B4EFF" />
                <Text style={styles.addBtnText}>項目を追加</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>

          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.bottomBar}>
            <TouchableOpacity
              onPress={handleStart}
              disabled={!canProceed}
              activeOpacity={0.85}
              style={{
                backgroundColor: isValid ? '#5B4EFF' : '#B8B0FF',
                borderRadius: 20,
                paddingVertical: 16,
                alignItems: 'center',
                alignSelf: 'stretch',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600' }}>
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
    backgroundColor: "#5B4EFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#5B4EFF",
  },
  stepDotActive: {
    backgroundColor: "#5B4EFF",
    borderColor: "#5B4EFF",
  },
  stepNumActive: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: "rgba(109, 40, 217, 0.1)",
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: "#5B4EFF",
  },
  stepLabel: {
    textAlign: "center",
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
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
    borderColor: "#EDEDFF",
    borderStyle: "dashed",
    backgroundColor: "#FAFAFE",
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 32,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: "#5B4EFF",
    gap: 8,
    minHeight: 56,
  },
  nextBtnDisabled: {
    backgroundColor: "#EDEDFF",
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  nextBtnTextDisabled: {
    color: "#B8B0FF",
  },
});
