import { useState, useCallback } from "react";
import {
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { Ionicons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { GlassCard } from "@/components/glass-card";
import { IconSymbol } from "@/components/ui/icon-symbol";

type LocalTemplate = { id: string; label: string; icon: string };
const LOCAL_TEMPLATES: LocalTemplate[] = [
  { id: "restaurant", label: "飲食店",   icon: "restaurant-outline" },
  { id: "shopping",   label: "商品比較", icon: "cart-outline" },
  { id: "travel",     label: "旅行先",   icon: "airplane-outline" },
  { id: "lesson",     label: "習い事",   icon: "school-outline" },
  { id: "housing",    label: "住居",     icon: "home-outline" },
  { id: "job",        label: "就職先",   icon: "briefcase-outline" },
];

export default function NewProjectScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<LocalTemplate | null>(null);

  const handleTemplateSelect = useCallback(
    (template: LocalTemplate) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate(null);
      } else {
        setSelectedTemplate(template);
        setTitle(template.label);
      }
    },
    [selectedTemplate]
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
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
      <View style={styles.flex}>
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
            <Text style={{ fontSize: 13, color: '#8E8E93', marginBottom: 8 }}>比較したいテーマを入力してください</Text>
            <GlassCard style={styles.inputCard}>
              <TextInput
                style={styles.input}
                placeholder="例：ランチのお店、新しい服"
                placeholderTextColor="#C4B5FD"
                value={title}
                onChangeText={setTitle}
                returnKeyType="done"
              />
            </GlassCard>
          </Animated.View>

          {/* テンプレート選択 */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <Text style={styles.sectionTitle}>テンプレートから選ぶ</Text>
            <Text style={styles.sectionHint}>選択すると評価項目が自動入力されます</Text>
            <View style={styles.templateGrid}>
              {LOCAL_TEMPLATES.map((template, idx) => {
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
                      <View style={[styles.templateCard, isSelected && styles.templateCardSelected]}>
                        {isSelected && (
                          <View style={styles.checkBadge}>
                            <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
                          </View>
                        )}
                        <View style={[styles.templateIconWrap, isSelected && styles.templateIconWrapSelected]}>
                          <Ionicons name={template.icon as any} size={24} color={isSelected ? "#FFFFFF" : "#7C3AED"} />
                        </View>
                        <Text style={[styles.templateName, isSelected && styles.templateNameSelected]}>
                          {template.label}
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
      </View>
    </ScreenContainer>
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
    color: "#6D28D9",
    fontWeight: "400",
  },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
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
    marginTop: 16,
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
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: 13,
    color: "#8E8E93",
    marginBottom: 12,
    marginTop: -8,
  },
  inputCard: {
    marginBottom: 28,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#C9A0FF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1C1C1E",
    backgroundColor: "#FFFFFF",
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
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5EA",
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
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#6D28D9",
    gap: 8,
    minHeight: 54,
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
