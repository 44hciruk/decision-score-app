import { useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  Pressable,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeIn,
} from "react-native-reanimated";

import { GradientScreen } from "@/components/gradient-screen";
import { GlassCard, DarkGlassCard } from "@/components/glass-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useProjectContext } from "@/lib/project-context";
import { getScoreColor, type Project } from "@/lib/storage";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { state, removeProject, canAddProject, refresh } = useProjectContext();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleNewProject = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (!canAddProject()) {
      Alert.alert(
        "保存上限に達しました",
        "無料版ではプロジェクトを3個まで保存できます。",
        [{ text: "OK" }]
      );
      return;
    }
    router.push("/new-project");
  }, [canAddProject, router]);

  const handleDelete = useCallback(
    (project: Project) => {
      Alert.alert(
        "プロジェクトを削除",
        `「${project.title}」を削除しますか？`,
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "削除",
            style: "destructive",
            onPress: () => {
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              }
              removeProject(project.id);
            },
          },
        ]
      );
    },
    [removeProject]
  );

  const handleProjectTap = useCallback(
    (project: Project) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      router.push({
        pathname: "/history-detail",
        params: { projectId: project.id },
      });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Project; index: number }) => (
      <ProjectCard
        project={item}
        index={index}
        onPress={() => handleProjectTap(item)}
        onDelete={() => handleDelete(item)}
      />
    ),
    [handleProjectTap, handleDelete]
  );

  const keyExtractor = useCallback((item: Project) => item.id, []);

  return (
    <GradientScreen>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
        <Text style={styles.headerTitle}>決断スコア</Text>
        <Text style={styles.headerSubtitle}>迷ったら、スコアで決めよう</Text>
      </Animated.View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {state.projects.length === 0 ? (
          <EmptyState />
        ) : (
          <FlatList
            data={state.projects}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* FAB */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(500)}
        style={styles.fabContainer}
      >
        <Pressable
          onPress={handleNewProject}
          style={({ pressed }) => [
            styles.fab,
            pressed && { transform: [{ scale: 0.92 }], opacity: 0.85 },
          ]}
        >
          <IconSymbol name="plus" size={28} color="#FFFFFF" />
        </Pressable>
      </Animated.View>
    </GradientScreen>
  );
}

// ============================================================
// Project Card
// ============================================================

function ProjectCard({
  project,
  index,
  onPress,
  onDelete,
}: {
  project: Project;
  index: number;
  onPress: () => void;
  onDelete: () => void;
}) {
  const sortedCandidates = Object.entries(project.scores).sort(
    ([, a], [, b]) => b - a
  );
  const winnerScore = project.scores[project.winner] || 0;
  const date = new Date(project.createdAt);
  const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;

  // Rank-based color
  const rankColor = "#34D399"; // 1st = green

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <Pressable
        onPress={onPress}
        onLongPress={onDelete}
        style={({ pressed }) => [
          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
        ]}
      >
        <DarkGlassCard style={styles.card}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {project.title}
            </Text>
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => [
                styles.deleteBtn,
                pressed && { opacity: 0.5 },
              ]}
            >
              <IconSymbol name="trash.fill" size={16} color="rgba(255,255,255,0.5)" />
            </Pressable>
          </View>

          {/* Winner */}
          <View style={styles.winnerRow}>
            <View style={styles.winnerBadge}>
              <Text style={styles.winnerBadgeText}>👑 1位</Text>
            </View>
            <Text style={styles.winnerName}>{project.winner}</Text>
            <Text style={[styles.winnerScore, { color: rankColor }]}>
              {winnerScore}点
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: rankColor,
                  width: `${winnerScore}%`,
                },
              ]}
            />
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.cardDate}>{dateStr}</Text>
            <Text style={styles.cardMeta}>
              {project.candidates.length}候補 · {project.criteria.length}項目
            </Text>
          </View>
        </DarkGlassCard>
      </Pressable>
    </Animated.View>
  );
}

// ============================================================
// Empty State
// ============================================================

function EmptyState() {
  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.emptyContainer}>
      <DarkGlassCard style={styles.emptyCard}>
        <Text style={styles.emptyIcon}>⚖️</Text>
        <Text style={styles.emptyTitle}>まだプロジェクトがありません</Text>
        <Text style={styles.emptySubtitle}>
          右下の「＋」ボタンから{"\n"}最初のプロジェクトを作成しましょう
        </Text>
      </DarkGlassCard>
    </Animated.View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 38,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
    fontWeight: "500",
  },
  contentContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    marginRight: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  winnerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  winnerBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  winnerBadgeText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  winnerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  winnerScore: {
    fontSize: 22,
    fontWeight: "800",
  },
  progressBg: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardDate: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
  },
  cardMeta: {
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
  },
  fabContainer: {
    position: "absolute",
    bottom: 24,
    right: 20,
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyCard: {
    padding: 32,
    alignItems: "center",
    width: "100%",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 22,
  },
});
