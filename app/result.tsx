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
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { GradientScreen } from "@/components/gradient-screen";
import { DarkGlassCard } from "@/components/glass-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useProjectContext } from "@/lib/project-context";
import {
  calculateScores,
  getConfidenceMessage,
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

  const scores = useMemo(
    () => calculateScores(candidates, criteria, rankings),
    [candidates, criteria, rankings]
  );

  const sortedCandidates = useMemo(
    () => [...candidates].sort((a, b) => (scores[b] || 0) - (scores[a] || 0)),
    [candidates, scores]
  );

  const winner = sortedCandidates[0] || "";
  const winnerScore = scores[winner] || 0;
  const secondScore = sortedCandidates[1] ? scores[sortedCandidates[1]] || 0 : 0;
  const scoreDiff = winnerScore - secondScore;
  const confidenceMessage = getConfidenceMessage(scoreDiff);

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
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.dismissAll();
  }, [router]);

  // 順位に基づいて色を決める（信号カラー）
  const getRankColor = (index: number, total: number) => {
    if (index === 0) return "#34D399"; // 1位: 緑
    if (index === 1) return "#FBBF24"; // 2位: オレンジ
    if (index === total - 1) return "#F87171"; // 最下位: 赤
    return "rgba(255,255,255,0.5)"; // その他: 白半透明
  };

  return (
    <GradientScreen edges={["top", "bottom", "left", "right"]}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.navHeader}>
        <View style={styles.navBtn} />
        <Text style={styles.navTitle}>結果発表</Text>
        <View style={styles.navBtn} />
      </Animated.View>

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
          <View style={styles.winnerBadge}>
            <Text style={styles.winnerBadgeText}>決断スコア 1位</Text>
          </View>
          <Text style={styles.winnerName}>{winner}</Text>
        </Animated.View>

        {/* Circular score */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          style={styles.scoreCircleContainer}
        >
          <CircularScore score={winnerScore} />
        </Animated.View>

        {/* Confidence message */}
        <Animated.View entering={FadeInDown.delay(800).duration(400)} style={styles.confidenceContainer}>
          <DarkGlassCard style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              {scoreDiff}点差 — {confidenceMessage}
            </Text>
          </DarkGlassCard>
        </Animated.View>

        {/* Rankings */}
        <Animated.View entering={FadeInDown.delay(1000).duration(400)}>
          <Text style={styles.rankingTitle}>ランキング</Text>
          {sortedCandidates.map((candidate, index) => {
            const score = scores[candidate] || 0;
            const rankColor = getRankColor(index, sortedCandidates.length);
            const isWinner = index === 0;
            return (
              <Animated.View
                key={candidate}
                entering={FadeInDown.delay(1100 + index * 100).duration(300)}
              >
                <DarkGlassCard
                  style={[
                    styles.rankItem,
                    isWinner && styles.rankItemWinner,
                  ]}
                >
                  <View style={styles.rankItemLeft}>
                    {isWinner ? (
                      <Text style={styles.crownEmoji}>👑</Text>
                    ) : (
                      <View style={[styles.rankBadge, { backgroundColor: rankColor + "25", borderColor: rankColor + "50" }]}>
                        <Text style={[styles.rankBadgeText, { color: rankColor }]}>
                          {index + 1}
                        </Text>
                      </View>
                    )}
                    <Text
                      style={[
                        styles.rankItemName,
                        { fontWeight: isWinner ? "700" : "500" },
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
                          color: rankColor,
                          fontSize: isWinner ? 24 : 20,
                        },
                      ]}
                    >
                      {score}
                    </Text>
                    <Text style={styles.rankItemUnit}>点</Text>
                  </View>
                </DarkGlassCard>
              </Animated.View>
            );
          })}
        </Animated.View>
      </ScrollView>

      {/* Bottom buttons */}
      <Animated.View entering={FadeInDown.delay(1400).duration(400)} style={styles.bottomBar}>
        <View style={styles.buttonRow}>
          <Pressable
            onPress={handleRetry}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.secondaryBtnText}>保存せずに戻る</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <Text style={styles.primaryBtnText}>保存して戻る</Text>
          </Pressable>
        </View>
      </Animated.View>
    </GradientScreen>
  );
}

// ============================================================
// Circular Score Component
// ============================================================

function CircularScore({ score }: { score: number }) {
  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(score / 100, {
      duration: 1400,
      easing: Easing.out(Easing.cubic),
    });
  }, [score]);

  const animatedCircleProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: circumference * (1 - animatedProgress.value),
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
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#34D399"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedCircleProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.scoreTextContainer}>
        <AnimatedScoreText score={score} />
        <Text style={styles.scoreUnit}>/ 100点</Text>
      </View>
    </View>
  );
}

function AnimatedScoreText({ score }: { score: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1400;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * score));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <Text style={styles.scoreValue}>{displayValue}</Text>
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
    color: "#FFFFFF",
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
    fontSize: 56,
    marginBottom: 8,
  },
  winnerBadge: {
    backgroundColor: "rgba(52,211,153,0.2)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.4)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  winnerBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#34D399",
    letterSpacing: 0.5,
  },
  winnerName: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  scoreCircleContainer: {
    alignItems: "center",
    marginVertical: 12,
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
    fontSize: 52,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  scoreUnit: {
    fontSize: 14,
    marginTop: -4,
    color: "rgba(255,255,255,0.6)",
  },
  confidenceContainer: {
    marginBottom: 24,
  },
  confidenceBadge: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  confidenceText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  rankingTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  rankItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  rankItemWinner: {
    borderColor: "rgba(52,211,153,0.5)",
    borderWidth: 1.5,
  },
  rankItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  crownEmoji: {
    fontSize: 26,
    width: 36,
    textAlign: "center",
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  rankBadgeText: {
    fontSize: 15,
    fontWeight: "800",
  },
  rankItemName: {
    fontSize: 16,
    flex: 1,
    color: "#FFFFFF",
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
    color: "rgba(255,255,255,0.6)",
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  primaryBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6366F1",
  },
});
