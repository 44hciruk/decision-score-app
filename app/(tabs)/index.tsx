import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { loadProjects, type Project } from "@/lib/storage";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { COLORS, FLAT_FONTS, RADIUS } from "@/constants/theme";

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
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <IconSymbol name="sparkles" size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.logoText}>決断スコア</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.75}
            onPress={() => router.push("/(tabs)/history")}
          >
            <IconSymbol name="clock.fill" size={17} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.75}>
            <IconSymbol name="person.fill" size={17} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* メインカード */}
      <View style={styles.mainCardOuter}>
        <View style={styles.mainCard}>
          {projects.length === 0 && (
            <View style={styles.emptyWrap}>
              <View style={styles.mainCardIcon}>
                <IconSymbol name="checkmark.circle.fill" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.mainCardTitle}>現在の決断はありません</Text>
              <Text style={styles.mainCardSubtitle}>
                下のボタンから最初の決断を{"\n"}作成してみましょう
              </Text>
            </View>
          )}

          {projects.length > 0 && (
            <View style={styles.cardScroll}>
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
                        <IconSymbol name="doc.text.fill" size={16} color={COLORS.primary} />
                      </View>
                      <View style={styles.cardRowBody}>
                        <Text style={styles.cardRowTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.cardRowMeta}>{item.candidates?.length ?? 0}つの選択肢</Text>
                      </View>
                      <IconSymbol name="chevron.right" size={14} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

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
                          <IconSymbol name="checkmark.circle.fill" size={16} color={COLORS.success} />
                        </View>
                        <View style={styles.cardRowBody}>
                          <Text style={styles.cardRowTitle} numberOfLines={1}>{item.title}</Text>
                          <Text style={styles.cardRowMeta}>{formatDate(item.createdAt)}　完了</Text>
                        </View>
                        <IconSymbol name="chevron.right" size={14} color={COLORS.textPrimary} />
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
                    <IconSymbol name="chevron.right" size={13} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* CTAボタン */}
      <TouchableOpacity style={styles.ctaBtn} onPress={handleNewProject} activeOpacity={0.88}>
        <Text style={styles.ctaBtnText}>＋ 決断を始める</Text>
      </TouchableOpacity>

      {/* 下部セクション */}
      <View style={styles.bottomSection}>
        <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 16 }}>
          <TouchableOpacity style={styles.listCard} activeOpacity={0.7}>
            <View style={styles.listCardInner}>
              <View style={styles.listTitleRow}>
                <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} style={styles.listIcon} />
                <Text style={styles.listTitle}>お知らせ</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textPrimary} />
              </View>
              <Text style={styles.listSubtitle}>アップデート情報をお届けします</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.listCard} activeOpacity={0.7}>
            <View style={styles.listCardInner}>
              <View style={styles.listTitleRow}>
                <Ionicons name="information-circle-outline" size={22} color={COLORS.textPrimary} style={styles.listIcon} />
                <Text style={styles.listTitle}>使い方ガイド</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textPrimary} />
              </View>
              <Text style={styles.listSubtitle}>決断スコアの使い方を確認する</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.listCard} activeOpacity={0.7}>
            <View style={styles.listCardInner}>
              <View style={styles.listTitleRow}>
                <Ionicons name="star-outline" size={22} color={COLORS.textPrimary} style={styles.listIcon} />
                <Text style={styles.listTitle}>プレミアムプラン</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textPrimary} />
              </View>
              <Text style={styles.listSubtitle}>無制限で決断を作成できます</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 20,
    fontFamily: FLAT_FONTS.bold,
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  mainCardOuter: {
    marginHorizontal: 32,
    marginTop: 24,
    height: 280,
    borderRadius: RADIUS.lg,
  },
  mainCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  mainCardTitle: {
    fontSize: 17,
    fontFamily: FLAT_FONTS.medium,
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  mainCardSubtitle: {
    fontSize: 13,
    fontFamily: FLAT_FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  cardSectionLabel: {
    fontSize: 12,
    fontFamily: FLAT_FONTS.medium,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  cardSectionBorderTop: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  cardRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardRowIcon: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardRowIconDone: {
    backgroundColor: "rgba(76,175,130,0.12)",
  },
  cardRowIconPlaceholder: {
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  cardRowTitlePlaceholder: {
    fontSize: 15,
    fontFamily: FLAT_FONTS.regular,
    color: "#C7C7CC",
    letterSpacing: -0.2,
  },
  cardRowBody: {
    flex: 1,
    gap: 2,
  },
  cardRowTitle: {
    fontSize: 15,
    fontFamily: FLAT_FONTS.medium,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  cardRowMeta: {
    fontSize: 12,
    fontFamily: FLAT_FONTS.regular,
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
    fontFamily: FLAT_FONTS.medium,
    color: COLORS.primary,
  },
  ctaBtn: {
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 14,
    paddingHorizontal: 56,
    marginTop: 16,
  },
  ctaBtnText: {
    fontSize: 17,
    fontFamily: FLAT_FONTS.medium,
    color: "#FFFFFF",
  },
  bottomSection: {
    backgroundColor: COLORS.background,
    marginTop: 16,
    flex: 1,
  },
  listCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginHorizontal: 24,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listCardInner: {
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
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
    fontFamily: FLAT_FONTS.medium,
    color: COLORS.textPrimary,
    flex: 1,
  },
  listSubtitle: {
    fontSize: 12,
    fontFamily: FLAT_FONTS.regular,
    color: COLORS.textSecondary,
  },
});
