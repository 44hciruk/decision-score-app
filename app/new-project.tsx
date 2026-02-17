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
import Animated, { FadeInDown } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { TEMPLATES, type Template } from "@/lib/storage";

export default function NewProjectScreen() {
  const router = useRouter();
  const colors = useColors();
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

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.navHeader}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.navBtn,
              pressed && { opacity: 0.5 },
            ]}
          >
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.navTitle, { color: colors.foreground }]}>
            新規プロジェクト
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
              <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
              <View style={[styles.stepDot, { backgroundColor: colors.border }]} />
              <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
              <View style={[styles.stepDot, { backgroundColor: colors.border }]} />
            </View>
            <Text style={[styles.stepLabel, { color: colors.muted }]}>
              ステップ 1/3 — テーマを決める
            </Text>
          </Animated.View>

          {/* Title input */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              何を比較しますか？
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="例：今日のランチ、転職先候補..."
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={setTitle}
              returnKeyType="done"
              autoFocus
            />
          </Animated.View>

          {/* Templates */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              テンプレートから選ぶ
            </Text>
            <Text style={[styles.sectionHint, { color: colors.muted }]}>
              選択すると評価項目が自動入力されます
            </Text>
            <View style={styles.templateGrid}>
              {TEMPLATES.map((template) => (
                <Pressable
                  key={template.id}
                  onPress={() => handleTemplateSelect(template)}
                  style={({ pressed }) => [
                    styles.templateCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor:
                        selectedTemplate?.id === template.id
                          ? colors.primary
                          : colors.border,
                      borderWidth: selectedTemplate?.id === template.id ? 2 : 1,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.templateIcon}>{template.icon}</Text>
                  <Text
                    style={[styles.templateName, { color: colors.foreground }]}
                  >
                    {template.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom button */}
        <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={handleNext}
            disabled={!title.trim()}
            style={({ pressed }) => [
              styles.nextBtn,
              {
                backgroundColor: title.trim()
                  ? colors.primary
                  : colors.border,
              },
              pressed && title.trim() && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <Text
              style={[
                styles.nextBtnText,
                { color: title.trim() ? "#FFFFFF" : colors.muted },
              ]}
            >
              次へ — 候補を入力
            </Text>
            <IconSymbol
              name="arrow.right"
              size={20}
              color={title.trim() ? "#FFFFFF" : colors.muted}
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
    marginBottom: 12,
  },
  sectionHint: {
    fontSize: 13,
    marginBottom: 12,
    marginTop: -4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 28,
  },
  templateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  templateCard: {
    width: "48%",
    flexBasis: "48%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  templateIcon: {
    fontSize: 32,
  },
  templateName: {
    fontSize: 14,
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
