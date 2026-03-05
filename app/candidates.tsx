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
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useProjectContext } from "@/lib/project-context";
import { PremiumModal } from "@/components/premium-modal";
import { COLORS, FONTS, RADIUS } from "@/constants/theme";

export default function CandidatesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ title: string; templateId: string }>();
  const { getLimits } = useProjectContext();
  const limits = getLimits();

  const [candidates, setCandidates] = useState<string[]>(["", "", ""]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleAdd = useCallback(() => {
    if (candidates.length >= limits.candidates) {
      setShowPremiumModal(true);
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
    const nameCount: Record<string, number> = {};
    const nameIndex: Record<string, number> = {};
    for (const c of filledCandidates) {
      nameCount[c] = (nameCount[c] || 0) + 1;
    }
    const renamedCandidates = filledCandidates.map((c) => {
      if (nameCount[c] > 1) {
        nameIndex[c] = (nameIndex[c] || 0) + 1;
        return `${c} ${nameIndex[c]}`;
      }
      return c;
    });

    router.push({
      pathname: "/criteria",
      params: {
        title: params.title || "",
        templateId: params.templateId || "",
        candidates: JSON.stringify(renamedCandidates),
      },
    });
  }, [canProceed, filledCandidates, params, router]);

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
              <IconSymbol name="chevron.left" size={20} color={COLORS.primary} />
              <Text style={styles.navBackText}>戻る</Text>
            </TouchableOpacity>
            <Text style={styles.navTitle}>候補を入力</Text>
            <View style={styles.navSpacer} />
          </Animated.View>

          <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
            <Text style={{ fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary }}>ステップ 2 / 3</Text>
          </View>
          <View style={{ marginTop: 4, marginBottom: 20, marginHorizontal: 32 }}>
            <View style={{ height: 4, backgroundColor: COLORS.border, borderRadius: 2 }}>
              <View style={{ width: '66%', height: 4, backgroundColor: COLORS.primary, borderRadius: 2 }} />
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
                <Text style={{ fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary }}>
                  最大{limits.candidates === Infinity ? '無制限' : `${limits.candidates}候補`}まで追加できます
                </Text>
              </View>
            </Animated.View>

            {candidates.map((candidate, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(150 + index * 60).duration(300)}
              >
                <View style={styles.inputCard}>
                  <View style={styles.inputRow}>
                    <View style={styles.indexBadge}>
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
                        <IconSymbol name="xmark" size={16} color={COLORS.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Animated.View>
            ))}

            <Animated.View entering={FadeInDown.delay(400).duration(300)}>
              <TouchableOpacity
                onPress={handleAdd}
                activeOpacity={0.75}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
              >
                <IconSymbol name="plus" size={18} color={COLORS.primary} />
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
                backgroundColor: isValid ? COLORS.primary : COLORS.primaryLight,
                borderRadius: RADIUS.full,
                paddingVertical: 16,
                alignItems: 'center',
                alignSelf: 'stretch',
              }}
            >
              <Text style={{ color: isValid ? '#FFFFFF' : COLORS.primary, fontSize: 17, fontFamily: FONTS.medium }}>
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
  flex: { flex: 1, backgroundColor: COLORS.background },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
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
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  navSpacer: {
    minWidth: 80,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  limitRow: {
    marginBottom: 16,
  },
  inputCard: {
    marginBottom: 10,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.primary,
  },
  indexText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: "#FFFFFF",
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    paddingVertical: 4,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: "rgba(255,82,82,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 32,
  },
});
