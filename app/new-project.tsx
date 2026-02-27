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
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { GradientScreen } from "@/components/gradient-screen";
import { GlassCard } from "@/components/glass-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { TEMPLATES, type Template } from "@/lib/storage";

// テンプレートアイコンマッピング（iconフィールドはSF Symbolsアイコン名）
type TemplateIconName = "scale.3d" | "doc.text.fill" | "star.fill" | "lightbulb.fill" | "person.2.fill" | "chart.bar.fill" | "bookmark.fill";
const VALID_ICONS: TemplateIconName[] = ["scale.3d", "doc.text.fill", "star.fill", "lightbulb.fill", "person.2.fill", "chart.bar.fill", "bookmark.fill"];
function getTemplateIcon(icon: string): TemplateIconName {
  return (VALID_ICONS.includes(icon as TemplateIconName) ? icon : "scale.3d") as TemplateIconName;
}

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
        {/* ナビゲーションヘッダー */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.navHeader}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.navBackBtn}
            activeOpacity={0.7}
          >
            <IconSymbol name="chevron.left" size={20} color="#7C3AED" />
            <Text style={styles.navBackText}>戻る</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>新しい決断</Text>
          <View style={styles.navSpacer} />
        </Animated.View>

        {/* ステップインジケーター */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.stepRow}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={styles.stepItem}>
              <View style={[styles.stepDot, step === 1 && styles.stepDotActive]}>
                {step === 1 ? (
                  <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
                ) : (
                  <Text style={styles.stepNum}>{step}</Text>
                )}
              </View>
              {step < 3 && <View style={[styles.stepLine, step === 1 && styles.stepLineActive]} />}
            </View>
          ))}
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(50).duration(300)} style={styles.stepLabel}>
          ステップ 1 / 3 — テーマを決める
        </Animated.Text>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* タイトル入力 */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <Text style={styles.sectionTitle}>何を比較しますか？</Text>
            <GlassCard style={styles.inputCard}>
              <TextInput
                style={styles.input}
                placeholder="例：今日のランチ、転職先候補..."
                placeholderTextColor="#C4B5FD"
                value={title}
                onChangeText={setTitle}
                returnKeyType="done"
                autoFocus
              />
            </GlassCard>
          </Animated.View>

          {/* テンプレート選択 */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <Text style={styles.sectionTitle}>テンプレートから選ぶ</Text>
            <Text style={styles.sectionHint}>選択すると評価項目が自動入力されます</Text>
            <View style={styles.templateGrid}>
              {TEMPLATES.map((template, idx) => {
                const isSelected = selectedTemplate?.id === template.id;
                const iconName = getTemplateIcon(template.icon);
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
                      <View style={[styles.templateCard, isSelected && styles.templateCardSelected]}>
                        {isSelected && (
                          <View style={styles.checkBadge}>
                            <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
                          </View>
                        )}
                        <View style={[styles.templateIconWrap, isSelected && styles.templateIconWrapSelected]}>
                          <IconSymbol name={iconName} size={24} color={isSelected ? "#FFFFFF" : "#7C3AED"} />
                        </View>
                        <Text style={[styles.templateName, isSelected && styles.templateNameSelected]}>
                          {template.name}
                        </Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>

        {/* ボトムボタン */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.bottomBar}>
          <TouchableOpacity
            onPress={handleNext}
            disabled={!isValid}
            activeOpacity={0.85}
            style={[styles.nextBtn, !isValid && styles.nextBtnDisabled]}
          >
            <Text style={[styles.nextBtnText, !isValid && styles.nextBtnTextDisabled]}>
              次へ — 候補を入力
            </Text>
            <IconSymbol name="arrow.right" size={20} color={isValid ? "#FFFFFF" : "#C4B5FD"} />
          </TouchableOpacity>
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
    color: "#6D28D9",
    fontWeight: "600",
  },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    letterSpacing: -0.3,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#DDD6FE",
  },
  stepDotActive: {
    backgroundColor: "#6D28D9",
    borderColor: "#6D28D9",
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
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
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  sectionHint: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 12,
    marginTop: -8,
  },
  inputCard: {
    marginBottom: 28,
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontSize: 17,
    color: "#111827",
    fontWeight: "500",
    minHeight: 56,
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
    gap: 10,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "rgba(109, 40, 217, 0.1)",
    shadowColor: "#1E1B4B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
  },
  templateCardSelected: {
    borderColor: "#6D28D9",
    borderWidth: 2,
    backgroundColor: "#F5F3FF",
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
  },
  templateIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EDE9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  templateIconWrapSelected: {
    backgroundColor: "#7C3AED",
  },
  templateName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1535",
    textAlign: "center",
  },
  templateNameSelected: {
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
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: "#6D28D9",
    gap: 8,
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
    minHeight: 58,
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
