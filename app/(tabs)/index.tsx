import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { loadProjects, type Project } from "@/lib/storage";
import * as Haptics from "expo-haptics";
import { COLORS, FONTS, RADIUS } from "@/constants/theme";

export default function HomeScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const insets = useSafeAreaInsets();

  const loadData = useCallback(async () => {
    const data = await loadProjects();
    setProjects(data);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const interval = setInterval(loadData, 500);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleNewProject = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/new-project");
  }, []);

  const handleOpenProject = useCallback((project: Project) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (project.winner) {
      router.push({ pathname: "/history-detail", params: { projectId: project.id } });
    } else {
      router.push({ pathname: "/candidates", params: { projectId: project.id } });
    }
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  };

  const completed = projects.filter((p) => !!p.winner);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── ヘッダー（中央寄せ） ─── */}
        <View style={styles.header}>
          <Text style={styles.logoText}>✦ 決断スコア</Text>
        </View>

        {/* ─── 吹き出し ─── */}
        <View style={styles.bubbleContainer}>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>
              迷ったら、スコアで決めよう！
            </Text>
          </View>
          {/* 三角しっぽ */}
          <View style={styles.bubbleTail} />
        </View>

        {/* ─── メイン丸ボタン ─── */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.ctaCircle}
            onPress={handleNewProject}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={40} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.ctaLabel}>決断を始める</Text>
        </View>

        {/* ─── 保存済みカード ─── */}
        {completed.length > 0 && (
          <View style={styles.savedSection}>
            <Text style={styles.sectionTitle}>保存した決断</Text>
            <View style={styles.savedCard}>
              {completed.slice(0, 3).map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.savedRow,
                    index < Math.min(completed.length, 3) - 1 && styles.savedRowBorder,
                  ]}
                  onPress={() => handleOpenProject(item)}
                  activeOpacity={0.75}
                >
                  <View style={styles.savedRowIcon}>
                    <IconSymbol name="checkmark.circle.fill" size={16} color={COLORS.success} />
                  </View>
                  <View style={styles.savedRowBody}>
                    <Text style={styles.savedRowTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.savedRowMeta}>{formatDate(item.createdAt)}　完了</Text>
                  </View>
                  <IconSymbol name="chevron.right" size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ))}
              {completed.length > 3 && (
                <TouchableOpacity
                  style={styles.seeAllBtn}
                  onPress={() => router.push("/(tabs)/history")}
                  activeOpacity={0.75}
                >
                  <Text style={styles.seeAllText}>すべて見る（{completed.length}件）</Text>
                  <IconSymbol name="chevron.right" size={13} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ─── インフォカード ─── */}
        <View style={styles.infoSection}>
          <TouchableOpacity style={styles.infoCard} activeOpacity={0.7}>
            <View style={styles.infoCardInner}>
              <View style={styles.infoTitleRow}>
                <Ionicons name="information-circle-outline" size={22} color={COLORS.primary} style={styles.infoIcon} />
                <Text style={styles.infoTitle}>使い方ガイド</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.infoSubtitle}>決断スコアの使い方を確認する</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoCard}
            activeOpacity={0.7}
            onPress={() => router.push("/(tabs)/settings")}
          >
            <View style={styles.infoCardInner}>
              <View style={styles.infoTitleRow}>
                <Ionicons name="star-outline" size={22} color={COLORS.primary} style={styles.infoIcon} />
                <Text style={styles.infoTitle}>プレミアムプラン</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.infoSubtitle}>無制限で決断を作成できます</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* ─── ヘッダー ─── */
  header: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  logoText: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },

  /* ─── 吹き出し ─── */
  bubbleContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  bubble: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  bubbleText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: "#FFFFFF",
    textAlign: "center",
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: COLORS.primary,
  },

  /* ─── メイン丸ボタン ─── */
  ctaContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 28,
  },
  ctaCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    marginTop: 10,
  },

  /* ─── 保存済みカード ─── */
  savedSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  savedCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  savedRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  savedRowIcon: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: "rgba(76,175,130,0.12)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  savedRowBody: {
    flex: 1,
    gap: 2,
  },
  savedRowTitle: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  savedRowMeta: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },

  /* ─── インフォカード ─── */
  infoSection: {
    paddingHorizontal: 24,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoCardInner: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    flex: 1,
  },
  infoSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginLeft: 32,
  },
});
