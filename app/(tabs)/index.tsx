import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GlassCard } from "@/components/glass-card";
import { loadProjects, deleteProject, type Project } from "@/lib/storage";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function HomeScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const insets = useSafeAreaInsets();

  const loadData = useCallback(async () => {
    const data = await loadProjects();
    setProjects(data);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(loadData, 500);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleDelete = useCallback(async (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await deleteProject(id);
    loadData();
  }, [loadData]);

  const handleNewProject = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/new-project");
  }, []);

  const handleOpenProject = useCallback((project: Project) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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

  const inProgress = projects.filter((p) => !p.winner);
  const completed = projects.filter((p) => !!p.winner);

  return (
    <View style={styles.root}>
      {/* ── ヒーローセクション（紫グラデーション） ── */}
      <LinearGradient
        colors={["#EDE9FE", "#DDD6FE", "#C4B5FD"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 16 }]}
      >
        {/* ヘッダー行 */}
        <View style={styles.heroHeader}>
          <View>
            {/* ロゴプレースホルダー（後でロゴ画像に差し替え） */}
            <Text style={styles.heroTitle}>決断スコア</Text>
            <Text style={styles.heroSubtitle}>迷ったら、スコアで決めよう</Text>
          </View>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.heroIconBtn}
              onPress={handleNewProject}
              activeOpacity={0.8}
            >
              <IconSymbol name="clock.fill" size={18} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroIconBtn}
              onPress={handleNewProject}
              activeOpacity={0.8}
            >
              <IconSymbol name="person.fill" size={18} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 統計カード（melmoのかかりつけカード相当） */}
        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>{inProgress.length}</Text>
            <Text style={styles.statsLabel}>進行中</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>{completed.length}</Text>
            <Text style={styles.statsLabel}>完了済み</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>{projects.length}</Text>
            <Text style={styles.statsLabel}>合計</Text>
          </View>
        </View>

        {/* 新規作成ボタン */}
        <TouchableOpacity
          style={styles.heroCta}
          onPress={handleNewProject}
          activeOpacity={0.88}
        >
          <IconSymbol name="plus" size={18} color="#6D28D9" />
          <Text style={styles.heroCtaText}>新しい決断を始める</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* ── ボディセクション（薄グレー背景） ── */}
      <View style={styles.body}>
        {projects.length === 0 ? (
          /* 空状態 */
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
              <IconSymbol name="checkmark.circle.fill" size={40} color="#C4B5FD" />
            </View>
            <Text style={styles.emptyTitle}>現在の決断はありません</Text>
            <Text style={styles.emptyText}>
              上のボタンから最初の決断を{"\n"}作成してみましょう
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          >
            {/* 進行中セクション */}
            {inProgress.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>進行中の決断</Text>
                {inProgress.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleOpenProject(item)}
                    style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                  >
                    <GlassCard style={styles.projectCard}>
                      <View style={styles.cardInner}>
                        <View style={styles.cardIconWrap}>
                          <IconSymbol name="doc.text.fill" size={20} color="#6D28D9" />
                        </View>
                        <View style={styles.cardBody}>
                          <Text style={styles.cardTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.cardMeta}>
                            {item.candidates?.length ?? 0}つの選択肢　{item.criteria?.length ?? 0}つの評価軸
                          </Text>
                        </View>
                        <View style={styles.cardRight}>
                          <View style={styles.inProgressBadge}>
                            <Text style={styles.inProgressBadgeText}>進行中</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleDelete(item.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <IconSymbol name="trash.fill" size={14} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </GlassCard>
                  </Pressable>
                ))}
              </View>
            )}

            {/* 完了済みセクション */}
            {completed.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>完了した決断</Text>
                {completed.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => handleOpenProject(item)}
                    style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                  >
                    <GlassCard style={styles.projectCard}>
                      <View style={styles.cardInner}>
                        <View style={[styles.cardIconWrap, styles.cardIconWrapDone]}>
                          <IconSymbol name="checkmark.circle.fill" size={20} color="#34C759" />
                        </View>
                        <View style={styles.cardBody}>
                          <Text style={styles.cardTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.cardMeta}>
                            {formatDate(item.createdAt)}　決断完了
                          </Text>
                        </View>
                        <View style={styles.cardRight}>
                          <View style={styles.completedBadge}>
                            <Text style={styles.completedBadgeText}>完了</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleDelete(item.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <IconSymbol name="trash.fill" size={14} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </GlassCard>
                  </Pressable>
                ))}
              </View>
            )}

            {/* お知らせ・ヒントセクション（melmoのお知らせ行相当） */}
            <View style={styles.section}>
              <GlassCard style={styles.noticeCard}>
                <View style={styles.noticeRow}>
                  <IconSymbol name="info.circle" size={18} color="#6D28D9" />
                  <Text style={styles.noticeText}>無料プランでは3つまで作成できます</Text>
                  <IconSymbol name="chevron.right" size={14} color="#8E8E93" />
                </View>
              </GlassCard>
            </View>
          </ScrollView>
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={handleNewProject}
        activeOpacity={0.88}
      >
        <IconSymbol name="plus" size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },

  // ── ヒーローセクション ──
  hero: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#3B0764",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "#7C3AED",
    marginTop: 2,
  },
  heroActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  // 統計カード
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  statsCard: {
    flex: 1,
    alignItems: "center",
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3B0764",
    letterSpacing: -0.5,
  },
  statsLabel: {
    fontSize: 11,
    color: "#7C3AED",
    marginTop: 2,
  },
  statsDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(109,40,217,0.2)",
  },

  // CTAボタン
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6D28D9",
    borderRadius: 12,
    paddingVertical: 14,
  },
  heroCtaText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // ── ボディセクション ──
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
    gap: 0,
  },

  // セクション
  section: {
    marginBottom: 24,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    paddingHorizontal: 4,
  },

  // プロジェクトカード
  projectCard: {
    marginBottom: 0,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardIconWrapDone: {
    backgroundColor: "#F0FDF4",
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
    letterSpacing: -0.2,
  },
  cardMeta: {
    fontSize: 12,
    color: "#8E8E93",
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 6,
    flexShrink: 0,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#FFF1F0",
    alignItems: "center",
    justifyContent: "center",
  },

  // バッジ
  inProgressBadge: {
    backgroundColor: "#F5F3FF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  inProgressBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6D28D9",
  },
  completedBadge: {
    backgroundColor: "#F0FDF4",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#34C759",
  },

  // お知らせカード
  noticeCard: {
    marginBottom: 0,
  },
  noticeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: "#3C3C43",
  },

  // 空状態
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5EA",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 22,
  },

  // FAB
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6D28D9",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
