import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GradientScreen } from "@/components/gradient-screen";
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

  // フォーカスが戻るたびに再読み込み
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
    router.push({
      pathname: "/candidates",
      params: { projectId: project.id },
    });
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <GradientScreen>
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>決断スコア</Text>
            <Text style={styles.appSubtitle}>迷ったら、スコアで決めよう</Text>
          </View>
          <View style={styles.headerIcon}>
            <IconSymbol name="scale.3d" size={24} color="#7C3AED" />
          </View>
        </View>

        {/* プロジェクトリスト */}
        {projects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <GlassCard style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <IconSymbol name="doc.text.fill" size={40} color="#7C3AED" />
              </View>
              <Text style={styles.emptyTitle}>まだ決断がありません</Text>
              <Text style={styles.emptyText}>
                右下の＋ボタンから{"\n"}最初の決断を始めましょう
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleNewProject}
                activeOpacity={0.8}
              >
                <IconSymbol name="plus" size={18} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>新しい決断を作成</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 100 },
            ]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <GlassCard style={styles.projectCard}>
                <Pressable
                  style={({ pressed }) => [
                    styles.projectCardInner,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => handleOpenProject(item)}
                >
                  {/* 左アクセントライン */}
                  <View style={styles.accentLine} />
                  <View style={styles.projectInfo}>
                    <Text style={styles.projectTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={styles.projectMeta}>
                      <IconSymbol name="person.2.fill" size={13} color="#9CA3AF" />
                      <Text style={styles.projectMetaText}>
                        {item.candidates?.length ?? 0}つの選択肢
                      </Text>
                      <View style={styles.metaDot} />
                      <IconSymbol name="clock.fill" size={13} color="#9CA3AF" />
                      <Text style={styles.projectMetaText}>
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.projectActions}>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(item.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <IconSymbol name="trash.fill" size={18} color="#DC2626" />
                    </TouchableOpacity>
                    <IconSymbol name="chevron.right" size={20} color="#C4B5FD" />
                  </View>
                </Pressable>
              </GlassCard>
            )}
          />
        )}
      </View>

      {/* FABボタン */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={handleNewProject}
        activeOpacity={0.85}
      >
        <IconSymbol name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </GradientScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 24,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1535",
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EDE9FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 80,
  },
  emptyCard: {
    padding: 32,
    alignItems: "center",
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#EDE9FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1535",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  listContent: {
    gap: 12,
  },
  projectCard: {
    overflow: "hidden",
  },
  projectCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    minHeight: 72,
  },
  accentLine: {
    width: 4,
    height: 40,
    borderRadius: 2,
    backgroundColor: "#7C3AED",
    marginRight: 14,
  },
  projectInfo: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1535",
    marginBottom: 6,
  },
  projectMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  projectMetaText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#D1D5DB",
    marginHorizontal: 4,
  },
  projectActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginLeft: 8,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
});
