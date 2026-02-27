import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Image,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GradientScreen } from "@/components/gradient-screen";
import { GlassCard } from "@/components/glass-card";
import { loadProjects, deleteProject, type Project } from "@/lib/storage";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const EMPTY_ILLUSTRATION = "https://d2xsxph8kpxj0f.cloudfront.net/310519663052010650/QvpxtMpaw894VmQC38hjVz/empty-state-illustration-8Fiy6ke8RLmnWgxsrTuDSb.png";

export default function HomeScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const insets = useSafeAreaInsets();
  const fabScale = useRef(new Animated.Value(1)).current;

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

  const onFabPressIn = () => {
    Animated.spring(fabScale, { toValue: 0.93, useNativeDriver: true, speed: 30 }).start();
  };
  const onFabPressOut = () => {
    Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  return (
    <GradientScreen>
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <View>
            {/* ロゴプレースホルダー（後でロゴ画像に差し替え） */}
            <View style={styles.logoRow}>
              <View style={styles.logoIconWrap}>
                <IconSymbol name="scale.3d" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.appTitle}>決断スコア</Text>
            </View>
            <Text style={styles.appSubtitle}>迷ったら、スコアで決めよう</Text>
          </View>
          <TouchableOpacity
            style={styles.headerBadge}
            onPress={handleNewProject}
            activeOpacity={0.8}
          >
            <IconSymbol name="plus" size={18} color="#6D28D9" />
          </TouchableOpacity>
        </View>

        {/* プロジェクトリスト or 空状態 */}
        {projects.length === 0 ? (
          <View style={styles.emptyContainer}>
            {/* イラスト */}
            <Image
              source={{ uri: EMPTY_ILLUSTRATION }}
              style={styles.emptyIllustration}
              resizeMode="contain"
            />
            {/* テキスト */}
            <Text style={styles.emptyTitle}>まだ決断がありません</Text>
            <Text style={styles.emptyText}>
              複数の選択肢をスコアで比較して{"\n"}最善の決断を導き出しましょう
            </Text>
            {/* CTA */}
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleNewProject}
              activeOpacity={0.85}
            >
              <IconSymbol name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>最初の決断を始める</Text>
            </TouchableOpacity>
            {/* ヒント */}
            <View style={styles.hintRow}>
              <IconSymbol name="info.circle" size={14} color="#9CA3AF" />
              <Text style={styles.hintText}>無料で3つまで作成できます</Text>
            </View>
          </View>
        ) : (
          <>
            {/* セクションヘッダー */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>進行中の決断</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{projects.length}</Text>
              </View>
            </View>
            <FlatList
              data={projects}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: insets.bottom + 100 },
              ]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleOpenProject(item)}
                  style={({ pressed }) => [pressed && { opacity: 0.88 }]}
                >
                  <GlassCard variant="elevated" style={styles.projectCard}>
                    {/* 上部：タイトル＋削除 */}
                    <View style={styles.cardTop}>
                      <View style={styles.cardIconWrap}>
                        <IconSymbol name="doc.text.fill" size={18} color="#6D28D9" />
                      </View>
                      <Text style={styles.projectTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(item.id)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <IconSymbol name="trash.fill" size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>

                    {/* 区切り線 */}
                    <View style={styles.divider} />

                    {/* 下部：メタ情報 */}
                    <View style={styles.cardBottom}>
                      <View style={styles.metaItem}>
                        <IconSymbol name="person.2.fill" size={13} color="#A78BFA" />
                        <Text style={styles.metaText}>
                          {item.candidates?.length ?? 0}つの選択肢
                        </Text>
                      </View>
                      <View style={styles.metaDivider} />
                      <View style={styles.metaItem}>
                        <IconSymbol name="list.bullet" size={13} color="#A78BFA" />
                        <Text style={styles.metaText}>
                          {item.criteria?.length ?? 0}つの評価軸
                        </Text>
                      </View>
                      <View style={styles.metaDivider} />
                      <View style={styles.metaItem}>
                        <IconSymbol name="clock.fill" size={13} color="#A78BFA" />
                        <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
                      </View>
                      <View style={{ flex: 1 }} />
                      {item.winner ? (
                        <View style={styles.completedBadge}>
                          <Text style={styles.completedBadgeText}>完了</Text>
                        </View>
                      ) : (
                        <View style={styles.inProgressBadge}>
                          <Text style={styles.inProgressBadgeText}>進行中</Text>
                        </View>
                      )}
                    </View>
                  </GlassCard>
                </Pressable>
              )}
            />
          </>
        )}
      </View>

      {/* FABボタン */}
      <Animated.View
        style={[
          styles.fabWrap,
          { bottom: insets.bottom + 24 },
          { transform: [{ scale: fabScale }] },
        ]}
      >
        <TouchableOpacity
          style={styles.fab}
          onPress={handleNewProject}
          onPressIn={onFabPressIn}
          onPressOut={onFabPressOut}
          activeOpacity={1}
        >
          <IconSymbol name="plus" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // ヘッダー
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 20,
    paddingBottom: 28,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  logoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#6D28D9",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.8,
  },
  appSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
    marginLeft: 46,
    letterSpacing: 0.1,
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(109, 40, 217, 0.15)",
    marginTop: 4,
  },
  // セクションヘッダー
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    letterSpacing: 0.1,
  },
  countBadge: {
    backgroundColor: "#EDE9FE",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6D28D9",
  },
  // 空状態
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
    paddingHorizontal: 8,
  },
  emptyIllustration: {
    width: 200,
    height: 200,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#6D28D9",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  hintText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  // プロジェクトカード
  listContent: {
    gap: 14,
  },
  projectCard: {
    padding: 0,
    overflow: "hidden",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 10,
  },
  cardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  projectTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.2,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(109, 40, 217, 0.06)",
    marginHorizontal: 16,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 4,
  },
  completedBadge: {
    backgroundColor: "#ECFDF5",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  inProgressBadge: {
    backgroundColor: "#EDE9FE",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  inProgressBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6D28D9",
  },
  // FAB
  fabWrap: {
    position: "absolute",
    right: 24,
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#6D28D9",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
});
