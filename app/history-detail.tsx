import { useMemo, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DecisionResult } from "@/components/decision-result";
import { useProjectContext } from "@/lib/project-context";

export default function HistoryDetailScreen() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { state, removeProject } = useProjectContext();

  const project = useMemo(
    () => state.projects.find((p) => p.id === projectId),
    [state.projects, projectId]
  );

  const handleDelete = useCallback(() => {
    if (!project) return;
    Alert.alert(
      "プロジェクトを削除",
      `「${project.title}」を削除しますか？`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            await removeProject(project.id);
            router.back();
          },
        },
      ]
    );
  }, [project, removeProject, router]);

  if (!project) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={styles.center}>
          <Text style={styles.errorText}>プロジェクトが見つかりません</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>戻る</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const sortedCandidates = [...project.candidates].sort(
    (a, b) => (project.scores[b] || 0) - (project.scores[a] || 0)
  );

  const d = new Date(project.createdAt);
  const dateStr = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
        {/* ヘッダー */}
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} activeOpacity={0.7}>
            <IconSymbol name="chevron.left" size={20} color="#5B4EFF" />
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>{project.title}</Text>
          <TouchableOpacity onPress={handleDelete} style={styles.navBtn} activeOpacity={0.7}>
            <IconSymbol name="trash.fill" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* 日付（ScrollViewの外に出せないためdateTextをDecisionResultのscrollPaddingTopで代替） */}
        <Text style={styles.dateText}>{dateStr}</Text>

        {/* 共通コンポーネント */}
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <DecisionResult
            winner={project.winner}
            scores={project.scores}
            sortedCandidates={sortedCandidates}
            criteria={project.criteria}
            rankings={project.rankings}
            animated={false}
          />
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  navBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1C1E",
    flex: 1,
    textAlign: "center",
  },
  dateText: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: "#F2F2F7",
    marginBottom: 28,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#5B4EFF",
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
