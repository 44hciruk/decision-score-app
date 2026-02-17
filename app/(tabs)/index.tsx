import { useCallback, useRef } from "react";
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
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (!canAddProject()) {
      Alert.alert(
        "保存上限に達しました",
        "無料版ではプロジェクトを3個まで保存できます。プレミアム版にアップグレードすると無制限に保存できます。",
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
        colors={colors}
      />
    ),
    [handleProjectTap, handleDelete, colors]
  );

  const keyExtractor = useCallback((item: Project) => item.id, []);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          決断スコア
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
          迷ったら、スコアで決めよう
        </Text>
      </View>

      {state.projects.length === 0 ? (
        <EmptyState colors={colors} />
      ) : (
        <FlatList
          data={state.projects}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={handleNewProject}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.primary },
          pressed && { transform: [{ scale: 0.95 }], opacity: 0.9 },
        ]}
      >
        <IconSymbol name="plus" size={28} color="#FFFFFF" />
      </Pressable>
    </ScreenContainer>
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
  colors,
}: {
  project: Project;
  index: number;
  onPress: () => void;
  onDelete: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const scoreColor = getScoreColor(project.scores[project.winner] || 0);
  const winnerScore = project.scores[project.winner] || 0;
  const date = new Date(project.createdAt);
  const dateStr = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <Pressable
        onPress={onPress}
        onLongPress={onDelete}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text
            style={[styles.cardTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {project.title}
          </Text>
          <Pressable
            onPress={onDelete}
            style={({ pressed }) => [
              styles.deleteBtn,
              pressed && { opacity: 0.5 },
            ]}
          >
            <IconSymbol name="trash.fill" size={18} color={colors.muted} />
          </Pressable>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.winnerRow}>
            <Text style={[styles.winnerLabel, { color: scoreColor }]}>
              👑 {project.winner}
            </Text>
            <Text style={[styles.winnerScore, { color: scoreColor }]}>
              {winnerScore}点
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: scoreColor,
                  width: `${winnerScore}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={[styles.cardDate, { color: colors.muted }]}>
            {dateStr}
          </Text>
          <Text style={[styles.cardMeta, { color: colors.muted }]}>
            {project.candidates.length}候補 · {project.criteria.length}項目
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ============================================================
// Empty State
// ============================================================

function EmptyState({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>⚖️</Text>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        まだプロジェクトがありません
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
        右下の「＋」ボタンから{"\n"}最初のプロジェクトを作成しましょう
      </Text>
    </Animated.View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  cardBody: {
    marginBottom: 12,
  },
  winnerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  winnerLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  winnerScore: {
    fontSize: 20,
    fontWeight: "800",
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(128,128,128,0.15)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardDate: {
    fontSize: 13,
  },
  cardMeta: {
    fontSize: 13,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
