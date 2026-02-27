import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { loadProjects, deleteProject, type Project } from "@/lib/storage";
import * as Haptics from "expo-haptics";
import { Platform, Dimensions } from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH * 0.78;

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

  const handleDelete = useCallback(
    async (id: string) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      await deleteProject(id);
      loadData();
    },
    [loadData]
  );

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
      {/* ── 全画面グラデーション背景 ── */}
      <LinearGradient
        colors={["#E9E0FF", "#D4C5F9", "#F5F0FF", "#F2F2F7"]}
        locations={[0, 0.25, 0.55, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* ── ヘッダー行 ── */}
        <View style={styles.header}>
          {/* ロゴプレースホルダー（後でロゴ画像に差し替え） */}
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <IconSymbol name="sparkles" size={16} color="#6D28D9" />
            </View>
            <Text style={styles.logoText}>決断スコア</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              activeOpacity={0.75}
            >
              <IconSymbol name="clock.fill" size={17} color="#3C3C43" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              activeOpacity={0.75}
            >
              <IconSymbol name="person.fill" size={17} color="#3C3C43" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 横スクロールカードエリア（melmoのかかりつけカード相当） ── */}
        {projects.length > 0 ? (
          <View style={styles.cardsSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsScroll}
              snapToInterval={CARD_WIDTH + 12}
              decelerationRate="fast"
            >
              {projects.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.projectCard,
                    { width: CARD_WIDTH },
                    pressed && { opacity: 0.9 },
                  ]}
                  onPress={() => handleOpenProject(item)}
                >
                  {/* カード上部：タイトル＋メタ */}
                  <View style={styles.cardTop}>
                    <View style={styles.cardIconWrap}>
                      {item.winner ? (
                        <IconSymbol
                          name="checkmark.circle.fill"
                          size={22}
                          color="#34C759"
                        />
                      ) : (
                        <IconSymbol
                          name="doc.text.fill"
                          size={22}
                          color="#6D28D9"
                        />
                      )}
                    </View>
                    <View style={styles.cardMeta}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        {item.candidates?.length ?? 0}つの選択肢　
                        {item.criteria?.length ?? 0}つの評価軸
                      </Text>
                    </View>
                  </View>

                  {/* カード下部：アクションボタン行（melmoのアイコンボタン行相当） */}
                  <LinearGradient
                    colors={
                      item.winner
                        ? ["#F0FDF4", "#DCFCE7"]
                        : ["#F5F3FF", "#EDE9FE"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cardActions}
                  >
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => handleOpenProject(item)}
                      activeOpacity={0.75}
                    >
                      <IconSymbol
                        name={item.winner ? "trophy.fill" : "chevron.right"}
                        size={18}
                        color={item.winner ? "#34C759" : "#6D28D9"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => handleOpenProject(item)}
                      activeOpacity={0.75}
                    >
                      <IconSymbol name="list.bullet" size={18} color="#6D28D9" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => handleDelete(item.id)}
                      activeOpacity={0.75}
                    >
                      <IconSymbol name="trash.fill" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </LinearGradient>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* ── CTAボタン（melmoの「予約する」ボタン相当） ── */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleNewProject}
            activeOpacity={0.88}
          >
            <IconSymbol name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.ctaBtnText}>新しい決断を始める</Text>
          </TouchableOpacity>
        </View>

        {/* ── 白シートボトムセクション（melmoの下部セクション相当） ── */}
        <View style={styles.sheet}>
          {/* 空状態 */}
          {projects.length === 0 && (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconCircle}>
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={36}
                  color="#C4B5FD"
                />
              </View>
              <Text style={styles.emptyTitle}>現在の決断はありません</Text>
              <Text style={styles.emptyText}>
                上のボタンから最初の決断を{"\n"}作成してみましょう
              </Text>
            </View>
          )}

          {/* 進行中リスト */}
          {inProgress.length > 0 && (
            <View style={styles.listSection}>
              <Text style={styles.listSectionLabel}>進行中の決断</Text>
              {inProgress.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.listRow,
                    index < inProgress.length - 1 && styles.listRowBorder,
                  ]}
                  onPress={() => handleOpenProject(item)}
                  activeOpacity={0.75}
                >
                  <View style={styles.listRowIcon}>
                    <IconSymbol name="doc.text.fill" size={16} color="#6D28D9" />
                  </View>
                  <View style={styles.listRowBody}>
                    <Text style={styles.listRowTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.listRowMeta}>
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
            <View style={styles.listSection}>
              <Text style={styles.listSectionLabel}>完了した決断</Text>
              {completed.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.listRow,
                    index < completed.length - 1 && styles.listRowBorder,
                  ]}
                  onPress={() => handleOpenProject(item)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.listRowIcon, styles.listRowIconDone]}>
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={16}
                      color="#34C759"
                    />
                  </View>
                  <View style={styles.listRowBody}>
                    <Text style={styles.listRowTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.listRowMeta}>
                      {formatDate(item.createdAt)}　完了
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={14} color="#C7C7CC" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 無料プランお知らせ行（melmoの「お知らせ」「やることリスト」相当） */}
          <View style={styles.listSection}>
            <TouchableOpacity
              style={[styles.listRow, styles.listRowBorder]}
              activeOpacity={0.75}
            >
              <View style={styles.listRowIcon}>
                <IconSymbol name="info.circle" size={16} color="#6D28D9" />
              </View>
              <View style={styles.listRowBody}>
                <Text style={styles.listRowTitle}>使い方ガイド</Text>
                <Text style={styles.listRowMeta}>
                  決断スコアの使い方を確認する
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={14} color="#C7C7CC" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.listRow} activeOpacity={0.75}>
              <View style={styles.listRowIcon}>
                <IconSymbol name="star.fill" size={16} color="#FF9500" />
              </View>
              <View style={styles.listRowBody}>
                <Text style={styles.listRowTitle}>プレミアムプラン</Text>
                <Text style={styles.listRowMeta}>
                  無制限で決断を作成できます
                </Text>
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
  scrollContent: {
    paddingHorizontal: 0,
  },

  // ── ヘッダー ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
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
    backgroundColor: "#EDE9FE",
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
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },

  // ── 横スクロールカード ──
  cardsSection: {
    marginBottom: 16,
  },
  cardsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  projectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    gap: 12,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardMeta: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#8E8E93",
  },
  cardActions: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  cardActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },

  // ── CTAボタン ──
  ctaSection: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6D28D9",
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },

  // ── 白シートボトム ──
  sheet: {
    backgroundColor: "#F2F2F7",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: 0,
    paddingBottom: 20,
  },
  listSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  listSectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  listRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  listRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  listRowIconDone: {
    backgroundColor: "#F0FDF4",
  },
  listRowBody: {
    flex: 1,
    gap: 2,
  },
  listRowTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1C1C1E",
    letterSpacing: -0.2,
  },
  listRowMeta: {
    fontSize: 12,
    color: "#8E8E93",
  },

  // ── 空状態 ──
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
});
