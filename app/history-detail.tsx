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
import { useProjectContext } from "@/lib/project-context";
import { getConfidenceMessage, getScoreColor } from "@/lib/storage";

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
          <Text style={styles.errorText}>
            プロジェクトが見つかりません
          </Text>
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

  const winnerScore = project.scores[project.winner] || 0;
  const secondScore = sortedCandidates[1]
    ? project.scores[sortedCandidates[1]] || 0
    : 0;
  const scoreDiff = winnerScore - secondScore;
  const confidenceMessage = getConfidenceMessage(scoreDiff);
  const scoreColor = getScoreColor(winnerScore);

  const date = new Date(project.createdAt);
  const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

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
          <IconSymbol name="chevron.left" size={20} color="#5B4EFF" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {project.title}
        </Text>
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.navBtn}
          activeOpacity={0.7}
        >
          <IconSymbol name="trash.fill" size={22} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date */}
        <Text style={styles.dateText}>{dateStr}</Text>

        {/* Winner */}
        <View style={styles.winnerSection}>
          <View style={styles.trophyIconWrap}>
            <IconSymbol name="trophy.fill" size={32} color="#22C55E" />
          </View>
          <Text style={styles.winnerName}>{project.winner}</Text>
        </View>

        {/* Circular score (static) */}
        <View style={styles.scoreCircleContainer}>
          <View style={styles.circularContainer}>
            <Svg width={size} height={size}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#E5E5EA"
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
              <Text style={styles.scoreUnit}>/ 100点</Text>
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
        <Text style={styles.rankingTitle}>ランキング</Text>
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
                    borderColor: index === 0 ? scoreColor + "40" : "#E5E5EA",
                    borderWidth: index === 0 ? 2 : StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View style={styles.rankItemLeft}>
                  {index === 0 ? (
                    <View style={[styles.rankNumber, { backgroundColor: "#DCFCE7", borderWidth: 1.5, borderColor: "#86EFAC" }]}>
                      <IconSymbol name="trophy.fill" size={16} color="#22C55E" />
                    </View>
                  ) : (
                    <View style={[styles.rankNumber, { backgroundColor: "#E5E5EA" }]}>
                      <Text style={styles.rankNumberText}>{index + 1}</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.rankItemName,
                      { fontWeight: index === 0 ? "700" : "500" },
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
                  <Text style={styles.rankItemUnit}>点</Text>
                </View>
              </View>
            </Animated.View>
          );
        })}

        {/* Detail: criteria rankings */}
        <Text style={[styles.rankingTitle, { marginTop: 24 }]}>
          項目別の順位
        </Text>
        {project.criteria.map((criterion) => {
          const ordered = project.rankings[criterion] || [];
          return (
            <View key={criterion} style={styles.criterionDetail}>
              <Text style={styles.criterionDetailTitle}>{criterion}</Text>
              {ordered.map((candidate, idx) => (
                <View key={candidate} style={styles.criterionRow}>
                  <Text style={styles.criterionRank}>{idx + 1}位</Text>
                  <Text style={styles.criterionCandidate}>{candidate}</Text>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
    backgroundColor: "#FFFFFF",
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
    color: "#1C1C1E",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 16,
  },
  dateText: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 12,
    color: "#8E8E93",
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#86EFAC",
  },
  winnerName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1C1C1E",
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
    color: "#8E8E93",
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
    color: "#1C1C1E",
  },
  rankItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
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
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  rankNumberText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#8E8E93",
  },
  rankItemName: {
    fontSize: 16,
    flex: 1,
    color: "#1C1C1E",
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
    color: "#8E8E93",
  },
  criterionDetail: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5EA",
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  criterionDetailTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    color: "#5B4EFF",
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
    color: "#8E8E93",
  },
  criterionCandidate: {
    fontSize: 15,
    color: "#1C1C1E",
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
    borderRadius: 28,
    backgroundColor: "#5B4EFF",
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
