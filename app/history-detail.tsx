import { useMemo, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useProjectContext } from "@/lib/project-context";
import { getConfidenceMessage, getScoreColor } from "@/lib/storage";

export default function HistoryDetailScreen() {
  const router = useRouter();
  const colors = useColors();
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
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
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
          <Text style={[styles.errorText, { color: colors.muted }]}>
            プロジェクトが見つかりません
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.primary }]}
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

  const winnerScore = project.scores[project.winner] || 0;
  const secondScore = sortedCandidates[1]
    ? project.scores[sortedCandidates[1]] || 0
    : 0;
  const scoreDiff = winnerScore - secondScore;
  const confidenceMessage = getConfidenceMessage(scoreDiff);
  const scoreColor = getScoreColor(winnerScore);

  const date = new Date(project.createdAt);
  const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

  // Static circular score (no animation for history)
  const size = 180;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - winnerScore / 100);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      {/* Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navBtn}
          activeOpacity={0.7}
        >
          <IconSymbol name="chevron.left" size={20} color="#6D28D9" />
        </TouchableOpacity>
        <Text
          style={[styles.navTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {project.title}
        </Text>
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.navBtn}
          activeOpacity={0.7}
        >
          <IconSymbol name="trash.fill" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date */}
        <Text style={[styles.dateText, { color: colors.muted }]}>
          {dateStr}
        </Text>

        {/* Winner */}
        <View style={styles.winnerSection}>
          <View style={styles.trophyIconWrap}>
            <IconSymbol name="trophy.fill" size={32} color="#22C55E" />
          </View>
          <Text style={[styles.winnerName, { color: colors.foreground }]}>
            {project.winner}
          </Text>
        </View>

        {/* Circular score (static) */}
        <View style={styles.scoreCircleContainer}>
          <View style={styles.circularContainer}>
            <Svg width={size} height={size}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors.border}
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={scoreColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>
            <View style={styles.scoreTextContainer}>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>
                {winnerScore}
              </Text>
              <Text style={[styles.scoreUnit, { color: colors.muted }]}>
                / 100点
              </Text>
            </View>
          </View>
        </View>

        {/* Confidence */}
        <View
          style={[
            styles.confidenceBadge,
            {
              backgroundColor: scoreColor + "15",
              borderColor: scoreColor + "30",
            },
          ]}
        >
          <Text style={[styles.confidenceText, { color: scoreColor }]}>
            {scoreDiff}点差 — {confidenceMessage}
          </Text>
        </View>

        {/* Rankings */}
        <Text style={[styles.rankingTitle, { color: colors.foreground }]}>
          ランキング
        </Text>
        {sortedCandidates.map((candidate, index) => {
          const score = project.scores[candidate] || 0;
          const color = getScoreColor(score);
          return (
            <Animated.View
              key={candidate}
              entering={FadeInDown.delay(index * 80).duration(300)}
            >
              <View
                style={[
                  styles.rankItem,
                  {
                    backgroundColor: colors.surface,
                    borderColor:
                      index === 0 ? scoreColor + "40" : colors.border,
                    borderWidth: index === 0 ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.rankItemLeft}>
                  {index === 0 ? (
                    <View style={[styles.rankNumber, { backgroundColor: "#DCFCE7", borderWidth: 1.5, borderColor: "#86EFAC" }]}>
                      <IconSymbol name="trophy.fill" size={16} color="#22C55E" />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.rankNumber,
                        { backgroundColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.rankNumberText,
                          { color: colors.muted },
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.rankItemName,
                      {
                        color: colors.foreground,
                        fontWeight: index === 0 ? "700" : "500",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {candidate}
                  </Text>
                </View>
                <View style={styles.rankItemRight}>
                  <Text
                    style={[
                      styles.rankItemScore,
                      {
                        color: color,
                        fontSize: index === 0 ? 22 : 18,
                      },
                    ]}
                  >
                    {score}
                  </Text>
                  <Text
                    style={[styles.rankItemUnit, { color: colors.muted }]}
                  >
                    点
                  </Text>
                </View>
              </View>
            </Animated.View>
          );
        })}

        {/* Detail: criteria rankings */}
        <Text
          style={[
            styles.rankingTitle,
            { color: colors.foreground, marginTop: 24 },
          ]}
        >
          項目別の順位
        </Text>
        {project.criteria.map((criterion) => {
          const ordered = project.rankings[criterion] || [];
          return (
            <View
              key={criterion}
              style={[
                styles.criterionDetail,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.criterionDetailTitle,
                  { color: colors.primary },
                ]}
              >
                {criterion}
              </Text>
              {ordered.map((candidate, idx) => (
                <View key={candidate} style={styles.criterionRow}>
                  <Text
                    style={[styles.criterionRank, { color: colors.muted }]}
                  >
                    {idx + 1}位
                  </Text>
                  <Text
                    style={[
                      styles.criterionCandidate,
                      { color: colors.foreground },
                    ]}
                  >
                    {candidate}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    flex: 1,
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dateText: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
  },
  winnerSection: {
    alignItems: "center",
    marginBottom: 8,
  },
  trophyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#86EFAC",
  },
  winnerName: {
    fontSize: 26,
    fontWeight: "700",
  },
  scoreCircleContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  circularContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreTextContainer: {
    position: "absolute",
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: "700",
  },
  scoreUnit: {
    fontSize: 13,
    marginTop: -4,
  },
  confidenceBadge: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 28,
  },
  confidenceText: {
    fontSize: 15,
    fontWeight: "600",
  },
  rankingTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  rankItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  rankItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },

  rankNumber: {
    width: 32,
    height: 32,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  rankNumberText: {
    fontSize: 15,
    fontWeight: "700",
  },
  rankItemName: {
    fontSize: 16,
    flex: 1,
  },
  rankItemRight: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  rankItemScore: {
    fontWeight: "700",
  },
  rankItemUnit: {
    fontSize: 13,
  },
  criterionDetail: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  criterionDetailTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  criterionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 3,
  },
  criterionRank: {
    fontSize: 13,
    width: 30,
  },
  criterionCandidate: {
    fontSize: 15,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  errorText: {
    fontSize: 16,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
