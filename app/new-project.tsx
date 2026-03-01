import { useState, useCallback } from "react";
import {
  Text,
  View,
  TextInput,
  Pressable,
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
  { id: "restaurant",   label: "飲食店",     icon: "restaurant-outline" },
  { id: "shopping",     label: "ショッピング", icon: "bag-outline" },
  { id: "travel",       label: "旅先",       icon: "airplane-outline" },
  { id: "lesson",       label: "習い事",     icon: "school-outline" },
  { id: "entertainment", label: "映画・アニメ", icon: "film-outline" },
  { id: "career",       label: "就職先",     icon: "briefcase-outline" },
];

export default function NewProjectScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleTemplateSelect = useCallback(
    (template: LocalTemplate) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (selectedTemplate === template.id) {
        setSelectedTemplate(null);
        setTitle("");
      } else {
        setSelectedTemplate(template.id);
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
        templateId: selectedTemplate || "",
      },
    });
  }, [title, selectedTemplate, router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const isValid = title.trim().length > 0;
  const isActive = title.length > 0 || selectedTemplate !== null;

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
          <Text style={styles.navTitle}>テーマを決める</Text>
          <View style={styles.navSpacer} />
        </Animated.View>

        {/* ステップインジケーター */}
        <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
          <Text style={{ fontSize: 13, color: '#8E8E93' }}>ステップ 1 / 3</Text>
        </View>
        <View style={{ marginTop: 4, marginBottom: 20, marginHorizontal: 32 }}>
          <View style={{ height: 4, backgroundColor: '#E5E5EA', borderRadius: 2 }}>
            <View style={{ width: '33%', height: 4, backgroundColor: '#5B4EFF', borderRadius: 2 }} />
          </View>
        </View>

        <View style={styles.scrollContent}>
          {/* タイトル入力 */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <Text style={styles.sectionTitle}>何を比較しますか？</Text>
            <Text style={{ fontSize: 13, color: '#8E8E93', marginBottom: 8 }}>比較したいテーマを入力してください</Text>
            <GlassCard style={styles.inputCard}>
              <TextInput
                style={styles.input}
                placeholder="例：ランチのお店、新しい服"
                placeholderTextColor="#C7C7CC"
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
                const isSelected = selectedTemplate === template.id;
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
                          <Ionicons name={template.icon as any} size={24} color={isSelected ? "#FFFFFF" : "#5B4EFF"} />
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
        </View>

        {/* ボトムボタン */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.bottomBar}>
          <TouchableOpacity
            onPress={handleNext}
            disabled={!isValid}
            activeOpacity={0.85}
            style={[styles.nextBtn, !isActive && styles.nextBtnDisabled]}
          >
            <Text style={[styles.nextBtnText, !isActive && styles.nextBtnTextDisabled]}>
              次へ
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScreenContainer>
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
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#D1D1D6",
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
    backgroundColor: "#D1D1D6",
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
    backgroundColor: "#F2F2F7",
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
    borderColor: "#D1D1D6",
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
    gap: 8,
  },
  templateWrapper: {
    width: "48%",
  },
  templateCard: {
    padding: 12,
    marginBottom: 8,
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  templateCardSelected: {
    borderColor: "#5B4EFF",
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#5B4EFF",
    justifyContent: "center",
    alignItems: "center",
  },
  templateIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EDEDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  templateIconWrapSelected: {
    backgroundColor: "#5B4EFF",
  },
  templateName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1C1C1E",
    textAlign: "center",
  },
  templateNameSelected: {
    color: "#1C1C1E",
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
    borderRadius: 20,
    backgroundColor: "#5B4EFF",
    gap: 8,
    minHeight: 54,
  },
  nextBtnDisabled: {
    backgroundColor: "#C9B8FF",
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  nextBtnTextDisabled: {
    color: "#FFFFFF",
  },
});
