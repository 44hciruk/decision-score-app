import { useState, useCallback, useRef, useEffect } from "react";
import {
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useProjectContext } from "@/lib/project-context";
import { TEMPLATES } from "@/lib/storage";

export default function CriteriaScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{
    title: string;
    templateId: string;
    candidates: string;
  }>();
  const { getLimits } = useProjectContext();
  const limits = getLimits();

  const candidates: string[] = params.candidates
    ? JSON.parse(params.candidates)
    : [];

  // Initialize with template criteria if selected
  const template = TEMPLATES.find((t) => t.id === params.templateId);
  const initialCriteria = template
    ? template.criteria.slice(0, limits.criteria)
    : ["", ""];

  const [criteria, setCriteria] = useState<string[]>(initialCriteria);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleAdd = useCallback(() => {
    if (criteria.length >= limits.criteria) {
      Alert.alert(
        "評価項目の上限",
        `無料版では${limits.criteria}個までです。プレミアム版にアップグレードすると無制限に追加できます。`,
        [{ text: "OK" }]
      );
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

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.navHeader}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.navBtn,
              pressed && { opacity: 0.5 },
            ]}
          >
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.navTitle, { color: colors.foreground }]}>
            評価項目
          </Text>
          <View style={styles.navBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step indicator */}
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
              <View style={[styles.stepLine, { backgroundColor: colors.primary }]} />
              <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
              <View style={[styles.stepLine, { backgroundColor: colors.primary }]} />
              <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
            </View>
            <Text style={[styles.stepLabel, { color: colors.muted }]}>
              ステップ 3/3 — 評価項目を設定
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              何を基準に比較しますか？
            </Text>

            {/* Limit indicator */}
            {limits.criteria < Infinity && (
              <View style={styles.limitRow}>
                <Text style={[styles.limitText, { color: colors.muted }]}>
                  {criteria.length}/{limits.criteria} 項目（無料版上限）
                </Text>
                <View
                  style={[styles.limitBarBg, { backgroundColor: colors.border }]}
                >
                  <View
                    style={[
                      styles.limitBarFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${Math.min((criteria.length / limits.criteria) * 100, 100)}%`,
                      },
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
              <View style={styles.inputRow}>
                <View
                  style={[
                    styles.indexBadge,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <Text style={[styles.indexText, { color: colors.primary }]}>
                    {index + 1}
                  </Text>
                </View>
                <TextInput
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  placeholder={`評価項目${index + 1}`}
                  placeholderTextColor={colors.muted}
                  value={criterion}
                  onChangeText={(v) => handleChange(index, v)}
                  returnKeyType="done"
                />
                {criteria.length > 2 && (
                  <Pressable
                    onPress={() => handleRemove(index)}
                    style={({ pressed }) => [
                      styles.removeBtn,
                      pressed && { opacity: 0.5 },
                    ]}
                  >
                    <IconSymbol name="xmark" size={18} color={colors.error} />
                  </Pressable>
                )}
              </View>
            </Animated.View>
          ))}

          {/* Add button */}
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [
              styles.addBtn,
              {
                borderColor: colors.primary,
                backgroundColor: colors.primary + "08",
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <IconSymbol name="plus" size={20} color={colors.primary} />
            <Text style={[styles.addBtnText, { color: colors.primary }]}>
              項目を追加
            </Text>
          </Pressable>
        </ScrollView>

        {/* Bottom button */}
        <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={handleStart}
            disabled={!canProceed}
            style={({ pressed }) => [
              styles.nextBtn,
              {
                backgroundColor: canProceed ? colors.primary : colors.border,
              },
              pressed && canProceed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <Text
              style={[
                styles.nextBtnText,
                { color: canProceed ? "#FFFFFF" : colors.muted },
              ]}
            >
              スコアリング開始
            </Text>
            <IconSymbol
              name="arrow.right"
              size={20}
              color={canProceed ? "#FFFFFF" : colors.muted}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
  stepLabel: {
    textAlign: "center",
    fontSize: 13,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  limitRow: {
    marginBottom: 20,
  },
  limitText: {
    fontSize: 13,
    marginBottom: 6,
  },
  limitBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  limitBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
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
    fontWeight: "700",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
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
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    gap: 8,
    marginTop: 8,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 0.5,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
