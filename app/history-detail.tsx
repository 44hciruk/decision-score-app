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
import { COLORS, FONTS, RADIUS } from "@/constants/theme";

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
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBackBtn} activeOpacity={0.7}>
            <IconSymbol name="chevron.left" size={20} color={COLORS.primary} />
            <Text style={styles.navBackText}>戻る</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>{project.title}</Text>
          <TouchableOpacity onPress={handleDelete} style={styles.navBtn} activeOpacity={0.7}>
            <IconSymbol name="trash.fill" size={22} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        <Text style={styles.dateText}>{dateStr}</Text>

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
            animated={true}
            scoreStrokeColor="#4CAF82"
            scoreTextColor="#4CAF82"
            scoreUnitColor={COLORS.textSecondary}
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
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  navBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  navBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingRight: 12,
    minWidth: 80,
  },
  navBackText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  navTitle: {
    fontSize: 17,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  dateText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: COLORS.background,
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
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
});
