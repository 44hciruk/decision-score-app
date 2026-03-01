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
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { GlassCard } from "@/components/glass-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useProjectContext } from "@/lib/project-context";
import { PremiumModal } from "@/components/premium-modal";

const BADGE_COLORS = ["#5B4EFF", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

export default function CandidatesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ title: string; templateId: string }>();
  const { getLimits } = useProjectContext();
  const limits = getLimits();

  const [candidates, setCandidates] = useState<string[]>(["", "", ""]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleAdd = useCallback(() => {
    if (candidates.length >= 3) {
      Alert.alert("プレミアムプラン", "プレミアムプランで4つ以上の候補を追加できます");
    } else {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setCandidates((prev) => [...prev, ""]);
    }
  }, [candidates.length]);

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
  const isValid = candidates.some((c) => c.trim().length > 0);

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
            <Text style={styles.navTitle}>候補を入力</Text>
            <View style={styles.navSpacer} />
          </Animated.View>

          <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: '#8E8E93' }}>ステップ 2 / 3</Text>
          </View>
          <View style={{ marginTop: 4, marginBottom: 20, marginHorizontal: 32 }}>
            <View style={{ height: 4, backgroundColor: '#E5E5EA', borderRadius: 2 }}>
              <View style={{ width: '66%', height: 4, backgroundColor: '#5B4EFF', borderRadius: 2 }} />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeInDown.delay(100).duration(300)}>
              <Text style={styles.sectionTitle}>比較する候補を入力</Text>
              <View style={styles.limitRow}>
                <Text style={{ fontSize: 13, color: '#8E8E93' }}>最大3候補まで追加できます</Text>
              </View>
            </Animated.View>

            {candidates.map((candidate, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(150 + index * 60).duration(300)}
              >
                <GlassCard style={styles.inputCard}>
                  <View style={styles.inputRow}>
                    <View style={[styles.indexBadge, { backgroundColor: '#5B4EFF' }]}>
                      <Text style={styles.indexText}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <TextInput
                      ref={(ref) => { inputRefs.current[index] = ref; }}
                      style={styles.input}
                      placeholder="候補名を入力"
                      placeholderTextColor="#C7C7CC"
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
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
              >
                <IconSymbol name="plus" size={18} color="#5B4EFF" />
                <Text style={styles.addBtnText}>候補を追加</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>

          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.bottomBar}>
            <TouchableOpacity
              onPress={handleNext}
              disabled={!canProceed}
              activeOpacity={0.85}
              style={{
                backgroundColor: isValid ? '#5B4EFF' : '#C9B8FF',
                borderRadius: 20,
                paddingVertical: 16,
                alignItems: 'center',
                alignSelf: 'stretch',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600' }}>
                次へ
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
  flex: { flex: 1, backgroundColor: "#F2F2F7" },
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
    backgroundColor: "rgba(109, 40, 217, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDEDFF",
  },
  stepDotActive: {
    backgroundColor: "#5B4EFF",
    borderColor: "#5B4EFF",
  },
  stepNum: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8E8E93",
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
    backgroundColor: "#F2F2F7",
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
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    padding: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
    borderRadius: 20,
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
    color: "#C9B8FF",
  },
});
