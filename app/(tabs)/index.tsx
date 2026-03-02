import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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

  const inProgress = projects.filter((p) => !p.winner);
  const completed = projects.filter((p) => !!p.winner);

  return (
    <View style={styles.root}>
      {/* 全画面グラデーション背景 */}
      <LinearGradient
        colors={["#FFD4A8", "#EDD5FF", "#C9A0FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ヘッダー（固定） */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <IconSymbol name="sparkles" size={18} color="#5B4EFF" />
          </View>
          <Text style={styles.logoText}>決断スコア</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.75}
            onPress={() => router.push("/(tabs)/history")}
          >
            <IconSymbol name="clock.fill" size={17} color="#3C3C43" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.75}>
            <IconSymbol name="person.fill" size={17} color="#3C3C43" />
          </TouchableOpacity>
        </View>
      </View>

      {/* メインカード（高さ固定・内部スクロール） */}
      <View style={styles.mainCardOuter}>
        <View style={styles.mainCard}>
          {/* 空状態 */}
          {projects.length === 0 && (
            <View style={styles.emptyWrap}>
              <View style={styles.mainCardIcon}>
                <IconSymbol name="checkmark.circle.fill" size={28} color="#5B4EFF" />
              </View>
              <Text style={styles.mainCardTitle}>現在の決断はありません</Text>
              <Text style={styles.mainCardSubtitle}>
                下のボタンから最初の決断を{"\n"}作成してみましょう
              </Text>
            </View>
          )}

          {/* リスト（カード内部のみスクロール） */}
          {projects.length > 0 && (
            <View style={styles.cardScroll}>
              {/* 進行中 */}
              {inProgress.length > 0 && (
                <View>
                  <Text style={styles.cardSectionLabel}>進行中の決断</Text>
                  {inProgress.map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.cardRow, index < inProgress.length - 1 && styles.cardRowBorder]}
                      onPress={() => handleOpenProject(item)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.cardRowIcon}>
                        <IconSymbol name="doc.text.fill" size={16} color="#5B4EFF" />
                      </View>
                      <View style={styles.cardRowBody}>
                        <Text style={styles.cardRowTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.cardRowMeta}>{item.candidates?.length ?? 0}つの選択肢</Text>
                      </View>
                      <IconSymbol name="chevron.right" size={14} color="#1C1C1E" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* 完了済み（常に3枠表示・空枠はプレースホルダー） */}
              <View style={inProgress.length > 0 ? styles.cardSectionBorderTop : undefined}>
                <Text style={styles.cardSectionLabel}>完了した決断</Text>
                {[0, 1, 2].map((i) => {
                  const item = completed[i];
                  if (item) {
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.cardRow, i < 2 && styles.cardRowBorder]}
                        onPress={() => handleOpenProject(item)}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.cardRowIcon, styles.cardRowIconDone]}>
                          <IconSymbol name="checkmark.circle.fill" size={16} color="#34C759" />
                        </View>
                        <View style={styles.cardRowBody}>
                          <Text style={styles.cardRowTitle} numberOfLines={1}>{item.title}</Text>
                          <Text style={styles.cardRowMeta}>{formatDate(item.createdAt)}　完了</Text>
                        </View>
                        <IconSymbol name="chevron.right" size={14} color="#1C1C1E" />
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <View
                      key={`placeholder-${i}`}
                      style={[styles.cardRow, i < 2 && styles.cardRowBorder]}
                    >
                      <View style={[styles.cardRowIcon, styles.cardRowIconPlaceholder]}>
                        <IconSymbol name="clock" size={16} color="#C7C7CC" />
                      </View>
                      <View style={styles.cardRowBody}>
                        <Text style={styles.cardRowTitlePlaceholder}>決断を追加しよう</Text>
                      </View>
                    </View>
                  );
                })}
                {completed.length > 3 && (
                  <TouchableOpacity
                    style={styles.seeAllBtn}
                    onPress={() => router.push("/(tabs)/history")}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.seeAllText}>すべて見る（{completed.length}件）</Text>
                    <IconSymbol name="chevron.right" size={13} color="#5B4EFF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* CTAボタン（固定） */}
      <TouchableOpacity style={styles.ctaBtn} onPress={handleNewProject} activeOpacity={0.88}>
        <Text style={styles.ctaBtnText}>＋ 決断を始める</Text>
      </TouchableOpacity>

      {/* 下部グレーセクション（固定・内部スクロール） */}
      <View style={styles.bottomSection}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: insets.bottom + 100 }}
        >
          <TouchableOpacity style={styles.listCardShadow} activeOpacity={0.7}>
            <View style={styles.listCardInner}>
              <View style={styles.listTitleRow}>
                <Ionicons name="notifications-outline" size={22} color="#1C1C1E" style={styles.listIcon} />
                <Text style={styles.listTitle}>お知らせ</Text>
                <Ionicons name="chevron-forward" size={16} color="#1C1C1E" />
              </View>
              <Text style={styles.listSubtitle}>アップデート情報をお届けします</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.listCardShadow} activeOpacity={0.7}>
            <View style={styles.listCardInner}>
              <View style={styles.listTitleRow}>
                <Ionicons name="information-circle-outline" size={22} color="#1C1C1E" style={styles.listIcon} />
                <Text style={styles.listTitle}>使い方ガイド</Text>
                <Ionicons name="chevron-forward" size={16} color="#1C1C1E" />
              </View>
              <Text style={styles.listSubtitle}>決断スコアの使い方を確認する</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.listCardShadow} activeOpacity={0.7}>
            <View style={styles.listCardInner}>
              <View style={styles.listTitleRow}>
                <Ionicons name="star-outline" size={22} color="#1C1C1E" style={styles.listIcon} />
                <Text style={styles.listTitle}>プレミアムプラン</Text>
                <Ionicons name="chevron-forward" size={16} color="#1C1C1E" />
              </View>
              <Text style={styles.listSubtitle}>無制限で決断を作成できます</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFD4A8",
  },

  // ヘッダー
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  // メインカード（高さ固定）
  mainCardOuter: {
    marginHorizontal: 32,
    marginTop: 40,
    height: 280,
    borderRadius: 36,
    shadowColor: "#4A00B4",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 14,
  },
  mainCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    overflow: "hidden",
  },
  cardScroll: {
    flex: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  mainCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  mainCardTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 16,
  },
  mainCardSubtitle: {
    fontSize: 13,
    color: "#4A4A4A",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
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
  cardSectionBorderTop: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
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
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  cardRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "rgba(91,78,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardRowIconDone: {
    backgroundColor: "rgba(52,199,89,0.1)",
  },
  cardRowIconPlaceholder: {
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  cardRowTitlePlaceholder: {
    fontSize: 15,
    color: "#C7C7CC",
    letterSpacing: -0.2,
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
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5B4EFF",
  },

  // CTAボタン
  ctaBtn: {
    alignSelf: "center",
    backgroundColor: "#5B4EFF",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 56,
    marginTop: 20,
  },
  ctaBtnText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // 下部グレーセクション
  bottomSection: {
    backgroundColor: "#F2F2F7",
    marginTop: 24,
    flex: 1,
  },
  listCardShadow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: 24,
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  listCardInner: {
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    flexDirection: "column",
  },
  listTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  listIcon: {
    marginRight: 10,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1C1E",
    flex: 1,
  },
  listSubtitle: {
    fontSize: 12,
    color: "#8E8E93",
  },
});
