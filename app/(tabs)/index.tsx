import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { loadProjects, type Project } from "@/lib/storage";
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
      router.push({
        pathname: "/history-detail",
        params: { projectId: project.id },
      });
    } else {
      router.push({
        pathname: "/candidates",
        params: { projectId: project.id },
      });
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
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* ── 上部セクション（温かみカラー） ── */}
        <View style={[styles.topSection, { paddingTop: insets.top + 16 }]}>
          {/* ヘッダー行 */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <View style={styles.logoIcon}>
                <IconSymbol name="sparkles" size={16} color="#5B4EFF" />
              </View>
              <Text style={styles.logoText}>決断スコア</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.75}>
                <IconSymbol name="clock.fill" size={17} color="#3C3C43" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.75}>
                <IconSymbol name="person.fill" size={17} color="#3C3C43" />
              </TouchableOpacity>
            </View>
          </View>

          {/* メインカード（プロジェクト一覧 or 空状態） */}
          <View style={styles.mainCard}>
            {/* 空状態 */}
            {projects.length === 0 && (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconCircle}>
                  <IconSymbol
                    name="checkmark.circle.fill"
                    size={36}
                    color="#5B4EFF"
                  />
                </View>
                <Text style={styles.emptyTitle}>現在の決断はありません</Text>
                <Text style={styles.emptyText}>
                  下のボタンから最初の決断を{"\n"}作成してみましょう
                </Text>
              </View>
            )}

            {/* 進行中リスト */}
            {inProgress.length > 0 && (
              <View style={styles.cardSection}>
                <Text style={styles.cardSectionLabel}>進行中の決断</Text>
                {inProgress.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.cardRow,
                      index < inProgress.length - 1 && styles.cardRowBorder,
                    ]}
                    onPress={() => handleOpenProject(item)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.cardRowIcon}>
                      <IconSymbol name="doc.text.fill" size={16} color="#5B4EFF" />
                    </View>
                    <View style={styles.cardRowBody}>
                      <Text style={styles.cardRowTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.cardRowMeta}>
                        {item.candidates?.length ?? 0}つの選択肢
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={14} color="#C7C7CC" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 完了済みリスト */}
            {completed.length > 0 && (
              <View
                style={[
                  styles.cardSection,
                  inProgress.length > 0 && styles.cardSectionBorderTop,
                ]}
              >
                <Text style={styles.cardSectionLabel}>完了した決断</Text>
                {completed.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.cardRow,
                      index < completed.length - 1 && styles.cardRowBorder,
                    ]}
                    onPress={() => handleOpenProject(item)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.cardRowIcon, styles.cardRowIconDone]}>
                      <IconSymbol
                        name="checkmark.circle.fill"
                        size={16}
                        color="#34C759"
                      />
                    </View>
                    <View style={styles.cardRowBody}>
                      <Text style={styles.cardRowTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.cardRowMeta}>
                        {formatDate(item.createdAt)}　完了
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={14} color="#C7C7CC" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* CTAボタン */}
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleNewProject}
            activeOpacity={0.88}
          >
            <IconSymbol name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.ctaBtnText}>＋ 決断を始める</Text>
          </TouchableOpacity>
        </View>

        {/* ── 下部セクション（情報カード群） ── */}
        <View style={styles.bottomSection}>
          {/* お知らせ */}
          <View style={styles.infoCard}>
            <TouchableOpacity style={styles.infoRow} activeOpacity={0.75}>
              <View style={[styles.infoIcon, { backgroundColor: "#FFF3CD" }]}>
                <IconSymbol name="bell.fill" size={16} color="#FF9500" />
              </View>
              <Text style={styles.infoTitle}>お知らせ</Text>
              <IconSymbol name="chevron.right" size={14} color="#C7C7CC" />
            </TouchableOpacity>
          </View>

          {/* 使い方ガイド */}
          <View style={styles.infoCard}>
            <TouchableOpacity style={styles.infoRow} activeOpacity={0.75}>
              <View style={[styles.infoIcon, { backgroundColor: "#EDEDFF" }]}>
                <IconSymbol name="info.circle" size={16} color="#5B4EFF" />
              </View>
              <View style={styles.infoBody}>
                <Text style={styles.infoTitle}>使い方ガイド</Text>
                <Text style={styles.infoMeta}>決断スコアの使い方を確認する</Text>
              </View>
              <IconSymbol name="chevron.right" size={14} color="#C7C7CC" />
            </TouchableOpacity>
          </View>

          {/* プレミアムプラン */}
          <View style={styles.infoCard}>
            <TouchableOpacity style={styles.infoRow} activeOpacity={0.75}>
              <View style={[styles.infoIcon, { backgroundColor: "#FFF8E7" }]}>
                <IconSymbol name="star.fill" size={16} color="#FF9500" />
              </View>
              <View style={styles.infoBody}>
                <Text style={styles.infoTitle}>プレミアムプラン</Text>
                <Text style={styles.infoMeta}>無制限で決断を作成できます</Text>
              </View>
              <IconSymbol name="chevron.right" size={14} color="#C7C7CC" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  scroll: {
    flex: 1,
  },

  // ── 上部セクション ──
  topSection: {
    backgroundColor: "#FFF8F0",
    paddingBottom: 24,
  },

  // ── ヘッダー ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EDEDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1C1C1E",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5EA",
  },

  // ── メインカード ──
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5EA",
  },
  cardSection: {},
  cardSectionBorderTop: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5EA",
  },
  cardSectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  cardRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  cardRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#EDEDFF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardRowIconDone: {
    backgroundColor: "#F0FDF4",
  },
  cardRowBody: {
    flex: 1,
    gap: 2,
  },
  cardRowTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1C1C1E",
    letterSpacing: -0.2,
  },
  cardRowMeta: {
    fontSize: 12,
    color: "#8E8E93",
  },

  // ── 空状態 ──
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
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

  // ── CTAボタン ──
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#5B4EFF",
    borderRadius: 28,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },

  // ── 下部セクション ──
  bottomSection: {
    backgroundColor: "#F2F2F7",
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5EA",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    minHeight: 56,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoBody: {
    flex: 1,
    gap: 2,
  },
  infoTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#1C1C1E",
  },
  infoMeta: {
    fontSize: 12,
    color: "#8E8E93",
  },
});
