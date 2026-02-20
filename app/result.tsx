import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
  useDerivedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useProjectContext } from "@/lib/project-context";
import {
  calculateScores,
  getConfidenceMessage,
  getScoreColor,
  generateId,
  type Project,
} from "@/lib/storage";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ResultScreen() {
  const router = useRouter();
  const colors = useColors();
  const { addProject } = useProjectContext();
  const params = useLocalSearchParams<{
    title: string;
    candidates: string;
    criteria: string;
    rankings: string;
  }>();

  const candidates: string[] = useMemo(
    () => (params.candidates ? JSON.parse(params.candidates) : []),
    [params.candidates]
  );
  const criteria: string[] = useMemo(
    () => (params.criteria ? JSON.parse(params.criteria) : []),
    [params.criteria]
  );
  const rankings: Record<string, string[]> = useMemo(
    () => (params.rankings ? JSON.parse(params.rankings) : {}),
    [params.rankings]
  );

  // Calculate scores
  const scores = useMemo(() => {
    const result = calculateScores(candidates, criteria, rankings);
    console.log("[RESULT] Candidates:", candidates);
    console.log("[RESULT] Criteria:", criteria);
    console.log("[RESULT] Rankings:", rankings);
    console.log("[RESULT] Calculated Scores:", result);
    return result;
  }, [candidates, criteria, rankings]);

  // Sort candidates by score (descending)
  const sortedCandidates = useMemo(() => {
    const sorted = [...candidates].sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
    console.log("[RESULT] Sorted Candidates:", sorted);
    return sorted;
  }, [candidates, scores]);

  const winner = sortedCandidates[0] || "";
  const winnerScore = scores[winner] || 0;
  const secondScore = sortedCandidates[1] ? scores[sortedCandidates[1]] || 0 : 0;
  const scoreDiff = winnerScore - secondScore;
  const confidenceMessage = getConfidenceMessage(scoreDiff);
  const scoreColor = getScoreColor(winnerScore);

  // Haptic on mount
  useEffect(() => {
    if (Platform.OS !== "web") {
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 800);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const project: Project = {
      id: generateId(),
      title: params.title || "無題",
      createdAt: new Date().toISOString(),
      candidates,
      criteria,
      rankings,
      scores,
      winner,
    };
    await addProject(project);
    router.dismissAll();
  }, [params.title, candidates, criteria, rankings, scores, winner, addProject, router]);

  const handleRetry = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      {/* Header */}
      <View style={styles.navHeader}>
        <View style={styles.navBtn} />
        <Text style={[styles.navTitle, { color: colors.foreground }]}>
          結果発表
        </Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Winner section */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.winnerSection}
        >
          <Text style={styles.trophyEmoji}>🏆</Text>
          <Text style={[styles.winnerLabel, { color: colors.muted }]}>
            1位
          </Text>
          <Text style={[styles.winnerName, { color: colors.foreground }]}>
            {winner}
          </Text>
        </Animated.View>

        {/* Circular score */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          style={styles.scoreCircleContainer}
        >
          <CircularScore score={winnerScore} color={scoreColor} colors={colors} />
        </Animated.View>

        {/* Confidence message */}
        <Animated.View entering={FadeInDown.delay(800).duration(400)}>
          <View
            style={[
              styles.confidenceBadge,
              { backgroundColor: scoreColor + "15", borderColor: scoreColor + "30" },
            ]}
          >
            <Text style={[styles.confidenceText, { color: scoreColor }]}>
              {scoreDiff}点差 — {confidenceMessage}
            </Text>
          </View>
        </Animated.View>

        {/* Rankings */}
        <Animated.View entering={FadeInDown.delay(1000).duration(400)}>
          <Text style={[styles.rankingTitle, { color: colors.foreground }]}>
            ランキング
          </Text>
          {sortedCandidates.map((candidate, index) => {
            const score = scores[candidate] || 0;
            const color = getScoreColor(score);
            return (
              <Animated.View
                key={candidate}
                entering={FadeInDown.delay(1100 + index * 100).duration(300)}
              >
                <View
                  style={[
                    styles.rankItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: index === 0 ? scoreColor + "40" : colors.border,
                      borderWidth: index === 0 ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.rankItemLeft}>
                    {index === 0 ? (
                      <Text style={styles.crownEmoji}>👑</Text>
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
                    <Text style={[styles.rankItemUnit, { color: colors.muted }]}>
                      点
                    </Text>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>
      </ScrollView>

      {/* Bottom buttons */}
      <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
        <View style={styles.buttonRow}>
          <Pressable
            onPress={handleRetry}
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>
              やり直す
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <Text style={styles.primaryBtnText}>保存してホームへ</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

// ============================================================
// Circular Score Component
// ============================================================

function CircularScore({
  score,
  color,
  colors,
}: {
  score: number;
  color: string;
  colors: ReturnType<typeof useColors>;
}) {
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedScore = useSharedValue(0);
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedScore.value = withTiming(score, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
    animatedProgress.value = withTiming(score / 100, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [score]);

  const displayScore = useDerivedValue(() => {
    return Math.round(animatedScore.value);
  });

  const animatedCircleProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: circumference * (1 - animatedProgress.value),
    };
  });

  const scoreTextStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(1, { duration: 300 }),
    };
  });

  return (
    <View style={styles.circularContainer}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedCircleProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.scoreTextContainer}>
        <AnimatedScoreText score={score} color={color} />
        <Text style={[styles.scoreUnit, { color: colors.muted }]}>
          / 100点
        </Text>
      </View>
    </View>
  );
}

function AnimatedScoreText({
  score,
  color,
}: {
  score: number;
  color: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * score));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <Text style={[styles.scoreValue, { color }]}>
      {displayValue}
    </Text>
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  winnerSection: {
    alignItems: "center",
    marginBottom: 8,
  },
  trophyEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  winnerLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  winnerName: {
    fontSize: 28,
    fontWeight: "800",
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
    fontSize: 48,
    fontWeight: "900",
  },
  scoreUnit: {
    fontSize: 14,
    marginTop: -4,
  },
  confidenceBadge: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
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
  crownEmoji: {
    fontSize: 24,
    width: 32,
    textAlign: "center",
  },
  rankNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontWeight: "800",
  },
  rankItemUnit: {
    fontSize: 13,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 0.5,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
