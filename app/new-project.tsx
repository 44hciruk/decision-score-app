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
import { IconSymbol } from "@/components/ui/icon-symbol";
import { COLORS, FONTS, RADIUS } from "@/constants/theme";

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
            <IconSymbol name="chevron.left" size={20} color={COLORS.primary} />
            <Text style={styles.navBackText}>戻る</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>テーマを決める</Text>
          <View style={styles.navSpacer} />
        </Animated.View>

        {/* ステップインジケーター */}
        <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
          <Text style={{ fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary }}>ステップ 1 / 3</Text>
        </View>
        <View style={{ marginTop: 4, marginBottom: 20, marginHorizontal: 32 }}>
          <View style={{ height: 4, backgroundColor: COLORS.border, borderRadius: 2 }}>
            <View style={{ width: '33%', height: 4, backgroundColor: COLORS.primary, borderRadius: 2 }} />
          </View>
        </View>

        <View style={styles.scrollContent}>
          {/* タイトル入力 */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <Text style={styles.sectionTitle}>何を比較しますか？</Text>
            <Text style={{ fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginBottom: 8 }}>比較したいテーマを入力してください</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.input}
                placeholder="例：ランチのお店、新しい服"
                placeholderTextColor="#C7C7CC"
                value={title}
                onChangeText={setTitle}
                returnKeyType="done"
              />
            </View>
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
                          <Ionicons name={template.icon as any} size={24} color={isSelected ? "#FFFFFF" : COLORS.primary} />
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
    fontFamily: FONTS.regular,
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
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: 12,
    marginTop: -8,
  },
  inputCard: {
    marginBottom: 28,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
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
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: "relative",
  },
  templateCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.surface,
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  templateIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  templateIconWrapSelected: {
    backgroundColor: COLORS.primary,
  },
  templateName: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  templateNameSelected: {
    color: COLORS.textPrimary,
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
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    gap: 8,
    minHeight: 54,
  },
  nextBtnDisabled: {
    backgroundColor: COLORS.primaryLight,
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: "#FFFFFF",
  },
  nextBtnTextDisabled: {
    color: COLORS.primary,
  },
});
