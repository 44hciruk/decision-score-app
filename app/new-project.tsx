import { useState, useCallback } from "react";
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
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { GradientScreen } from "@/components/gradient-screen";
import { DarkGlassCard } from "@/components/glass-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { TEMPLATES, type Template } from "@/lib/storage";

export default function NewProjectScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const handleTemplateSelect = useCallback(
    (template: Template) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate(null);
      } else {
        setSelectedTemplate(template);
        if (!title) {
          setTitle(template.name + "の比較");
        }
      }
    },
    [selectedTemplate, title]
  );

  const handleNext = useCallback(() => {
    if (!title.trim()) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push({
      pathname: "/candidates",
      params: {
        title: title.trim(),
        templateId: selectedTemplate?.id || "",
      },
    });
  }, [title, selectedTemplate, router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const isValid = title.trim().length > 0;

  return (
    <GradientScreen edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        {/* Nav Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.navHeader}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.navBtn,
              pressed && { opacity: 0.5 },
            ]}
          >
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.navTitle}>新規プロジェクト</Text>
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
                <View
                  style={[
                    styles.stepDot,
                    i === 0
                      ? styles.stepDotActive
                      : styles.stepDotInactive,
                  ]}
                >
                  <Text style={[styles.stepNum, i === 0 ? { color: "#6366F1" } : { color: "rgba(255,255,255,0.4)" }]}>
                    {i + 1}
                  </Text>
                </View>
                {i < 2 && (
                  <View
                    style={[
                      styles.stepLine,
                      i === 0 ? styles.stepLineActive : styles.stepLineInactive,
                    ]}
                  />
                )}
              </View>
            ))}
          </Animated.View>
          <Animated.Text
            entering={FadeInDown.delay(50).duration(300)}
            style={styles.stepLabel}
          >
            ステップ 1/3 — テーマを決める
          </Animated.Text>

          {/* Title input */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <Text style={styles.sectionTitle}>何を比較しますか？</Text>
            <DarkGlassCard style={styles.inputCard}>
              <TextInput
                style={styles.input}
                placeholder="例：今日のランチ、転職先候補..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={title}
                onChangeText={setTitle}
                returnKeyType="done"
                autoFocus
              />
            </DarkGlassCard>
          </Animated.View>

          {/* Templates */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <Text style={styles.sectionTitle}>テンプレートから選ぶ</Text>
            <Text style={styles.sectionHint}>
              選択すると評価項目が自動入力されます
            </Text>
            <View style={styles.templateGrid}>
              {TEMPLATES.map((template, idx) => {
                const isSelected = selectedTemplate?.id === template.id;
                return (
                  <Animated.View
                    key={template.id}
                    entering={FadeInDown.delay(250 + idx * 50).duration(300)}
                    style={styles.templateWrapper}
                  >
                    <Pressable
                      onPress={() => handleTemplateSelect(template)}
                      style={({ pressed }) => [
                        pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
                      ]}
                    >
                      <DarkGlassCard
                        style={[
                          styles.templateCard,
                          isSelected && styles.templateCardSelected,
                        ]}
                      >
                        {isSelected && (
                          <View style={styles.checkBadge}>
                            <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
                          </View>
                        )}
                        <Text style={styles.templateIcon}>{template.icon}</Text>
                        <Text style={styles.templateName}>{template.name}</Text>
                      </DarkGlassCard>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom button */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.bottomBar}>
          <Pressable
            onPress={handleNext}
            disabled={!isValid}
            style={({ pressed }) => [
              styles.nextBtn,
              !isValid && styles.nextBtnDisabled,
              pressed && isValid && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <Text style={[styles.nextBtnText, !isValid && styles.nextBtnTextDisabled]}>
              次へ — 候補を入力
            </Text>
            <IconSymbol
              name="arrow.right"
              size={20}
              color={isValid ? "#6366F1" : "rgba(255,255,255,0.4)"}
            />
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </GradientScreen>
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
  stepDotInactive: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
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
  stepLineInactive: {
    backgroundColor: "rgba(255,255,255,0.2)",
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
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 12,
    marginTop: -4,
  },
  inputCard: {
    marginBottom: 28,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  templateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  templateWrapper: {
    width: "48%",
  },
  templateCard: {
    padding: 16,
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  templateCardSelected: {
    borderColor: "rgba(255,255,255,0.6)",
    borderWidth: 2,
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#6366F1",
    justifyContent: "center",
    alignItems: "center",
  },
  templateIcon: {
    fontSize: 32,
  },
  templateName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
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
