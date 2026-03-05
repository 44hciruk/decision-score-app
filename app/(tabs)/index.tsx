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
import { COLORS, FONTS, RADIUS, SHADOW_BUTTON } from "@/constants/theme";

// ─── メインボタン（後でSVGイラストに差し替え可能） ─────────
function MainButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.mainCircle}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.mainCircleContent}>
        <Text style={styles.mainCirclePlus}>＋</Text>
        <Text style={styles.mainCircleLabel}>決断を始める</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── ホーム画面 ──────────────────────────────────────────
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
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
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

        {/* ─── メイン丸ボタン（大） ─── */}
        <View style={styles.mainButtonContainer}>
          <MainButton onPress={handleNewProject} />
        </View>

        {/* ─── 保存した決断 ─── */}
        <View style={styles.savedSection}>
          <Text style={styles.sectionTitle}>保存した決断</Text>
          <View style={styles.savedCard}>
            {/* 最大2件の完了済み + プレースホルダーで3行にする */}
            {[0, 1, 2].map((i) => {
              const item = completed[i];
              if (item) {
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.savedRow, i < 2 && styles.savedRowBorder]}
                    onPress={() => handleOpenProject(item)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.savedRowIconDone}>
                      <IconSymbol name="checkmark.circle.fill" size={16} color={COLORS.success} />
                    </View>
                    <View style={styles.savedRowBody}>
                      <Text style={styles.savedRowTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.savedRowMeta}>{formatDate(item.createdAt)}　完了</Text>
                    </View>
                    <IconSymbol name="chevron.right" size={14} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                );
              }
              return (
                <View
                  key={`placeholder-${i}`}
                  style={[styles.savedRow, i < 2 && styles.savedRowBorder]}
                >
                  <View style={styles.savedRowIconPlaceholder}>
                    <Ionicons name="time-outline" size={18} color="#CCCCCC" />
                  </View>
                  <View style={styles.savedRowBody}>
                    <Text style={styles.savedRowPlaceholder}>決断を追加しよう</Text>
                  </View>
                </View>
              );
            })}

            {/* すべてを見る */}
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => router.push("/(tabs)/history")}
              activeOpacity={0.75}
            >
              <Text style={styles.seeAllText}>すべてを見る</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── 下部3カード ─── */}
        <View style={styles.infoSection}>
          <TouchableOpacity style={styles.infoCard} activeOpacity={0.7}>
            <View style={styles.infoCardInner}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.primary} style={styles.infoIcon} />
              <Text style={styles.infoTitle}>お知らせ</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoCard} activeOpacity={0.7}>
            <View style={styles.infoCardInner}>
              <Ionicons name="information-circle-outline" size={22} color={COLORS.primary} style={styles.infoIcon} />
              <Text style={styles.infoTitle}>使い方ガイド</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoCard}
            activeOpacity={0.7}
            onPress={() => router.push("/(tabs)/settings")}
          >
            <View style={styles.infoCardInner}>
              <Ionicons name="star-outline" size={22} color={COLORS.primary} style={styles.infoIcon} />
              <Text style={styles.infoTitle}>プレミアムプラン</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── スタイル ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* ── ヘッダー ── */
  header: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 4,
  },
  logoText: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },

  /* ── 吹き出し ── */
  bubbleContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  bubble: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: "center",
  },
  bubbleText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: "#FFFFFF",
    textAlign: "center",
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: COLORS.primary,
    alignSelf: "center",
    marginTop: -1,
  },

  /* ── メイン丸ボタン ── */
  mainButtonContainer: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 28,
  },
  mainCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 4,
    borderBottomColor: '#1A4FA0',
    ...SHADOW_BUTTON,
  },
  mainCircleContent: {
    alignItems: "center",
  },
  mainCirclePlus: {
    fontSize: 48,
    color: "#FFFFFF",
    lineHeight: 56,
  },
  mainCircleLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: "#FFFFFF",
    marginTop: -2,
  },

  /* ── 保存した決断 ── */
  savedSection: {
    paddingHorizontal: 20,
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
  savedRowIconDone: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: "rgba(76,175,130,0.12)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  savedRowIconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    borderStyle: 'dashed',
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: 'transparent',
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
  savedRowPlaceholder: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: "#CCCCCC",
    letterSpacing: -0.2,
  },
  seeAllBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },

  /* ── 下部インフォカード ── */
  infoSection: {
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: 8,
  },
  infoCardInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    flex: 1,
  },
});
