import { useEffect, useState } from "react";
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { GlassCard } from "@/components/glass-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getConfidenceMessage } from "@/lib/storage";

// ─── 型定義 ──────────────────────────────────────────
export type DecisionResultProps = {
  winner: string;
  scores: Record<string, number>;
  sortedCandidates: string[];
  criteria: string[];
  rankings: Record<string, string[]>;
  /** result.tsx ではアニメあり、history-detail.tsx ではなし */
  animated?: boolean;
  /** ScrollView の contentContainerStyle に追加する paddingBottom */
  scrollPaddingBottom?: number;
};

// ─── ランク色 ─────────────────────────────────────────
function getRankColor(index: number, total: number): string {
  if (index === 0) return "#22C55E";
  if (index === total - 1) return "#EF4444";
  if (index === 1) return "#F59E0B";
  return "#3C3C43";
}

// ─── メインコンポーネント ─────────────────────────────
export function DecisionResult({
  winner,
  scores,
  sortedCandidates,
  criteria,
  rankings,
  animated = true,
  scrollPaddingBottom = 20,
}: DecisionResultProps) {
  const winnerScore = scores[winner] || 0;
  const secondScore = sortedCandidates[1] ? scores[sortedCandidates[1]] || 0 : 0;
  const scoreDiff = winnerScore - secondScore;
  const confidenceMessage = getConfidenceMessage(scoreDiff);

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollPaddingBottom }]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1位発表 */}
      <Animated.View
        entering={animated ? FadeInDown.delay(200).duration(500) : undefined}
        style={styles.winnerSection}
      >
        <Text style={styles.winnerName}>{winner}</Text>
        <Text style={styles.winnerSubText}>総合1位</Text>
      </Animated.View>

      {/* 円形スコア */}
      <Animated.View
        entering={animated ? FadeInDown.delay(400).duration(500) : undefined}
        style={styles.scoreCircleContainer}
      >
        {animated ? (
          <CircularScoreAnimated score={winnerScore} />
        ) : (
          <CircularScoreStatic score={winnerScore} />
        )}
      </Animated.View>

      {/* 信頼度バッジ */}
      <Animated.View
        entering={animated ? FadeInDown.delay(800).duration(400) : undefined}
        style={styles.confidenceContainer}
      >
        <View style={[
          styles.confidenceBadge,
          { backgroundColor: "#22C55E15", borderColor: "#22C55E30" }
        ]}>
          <Text style={[styles.confidenceText, { color: "#22C55E" }]}>
            {scoreDiff}点差 — {confidenceMessage}
          </Text>
        </View>
      </Animated.View>

      {/* ランキング */}
      <Animated.View
        entering={animated ? FadeInDown.delay(1000).duration(400) : undefined}
      >
        <Text style={styles.sectionTitle}>ランキング</Text>
        {sortedCandidates.map((candidate, index) => {
          const score = scores[candidate] || 0;
          const rankColor = getRankColor(index, sortedCandidates.length);
          const isWinner = index === 0;
          return (
            <Animated.View
              key={`${candidate}-${index}`}
              entering={animated ? FadeInDown.delay(1100 + index * 100).duration(300) : undefined}
            >
              <GlassCard
                style={[
                  styles.rankItem,
                  isWinner && { borderColor: "#22C55E", borderWidth: 2 },
                ]}
              >
                <View style={styles.rankItemLeft}>
                  {isWinner ? (
                    <View style={[styles.rankBadge, { backgroundColor: "#DCFCE7", borderColor: "#22C55E", borderWidth: 1.5 }]}>
                      <IconSymbol name="trophy.fill" size={16} color="#22C55E" />
                    </View>
                  ) : (
                    <View style={[styles.rankBadge, { backgroundColor: rankColor + "20", borderColor: rankColor + "50", borderWidth: 1.5 }]}>
                      <Text style={[styles.rankBadgeText, { color: rankColor }]}>
                        {index + 1}
                      </Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.rankItemName,
                      { fontWeight: isWinner ? "700" : "500", color: isWinner ? "#1A1535" : "#3C3C43" },
                    ]}
                    numberOfLines={1}
                  >
                    {candidate}
                  </Text>
                </View>
                <View style={styles.rankItemRight}>
                  <Text style={[styles.rankItemScore, { color: rankColor, fontSize: isWinner ? 26 : 22 }]}>
                    {score}
                  </Text>
                  <Text style={styles.rankItemUnit}>点</Text>
                </View>
              </GlassCard>
            </Animated.View>
          );
        })}
      </Animated.View>

      {/* 項目別の順位 */}
      <Animated.View
        entering={animated ? FadeInDown.delay(1200).duration(400) : undefined}
      >
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>項目別の順位</Text>
        {criteria.map((criterion) => {
          const ordered = rankings[criterion] || [];
          return (
            <View key={criterion} style={styles.criterionDetail}>
              <Text style={styles.criterionDetailTitle}>{criterion}</Text>
              {ordered.map((candidate, idx) => (
                <View key={`${candidate}-${idx}`} style={styles.criterionRow}>
                  <Text style={styles.criterionRank}>{idx + 1}位</Text>
                  <Text style={styles.criterionCandidate}>{candidate}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </Animated.View>
    </ScrollView>
  );
}

// ─── アニメーションあり円グラフ（result.tsx用） ──────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function CircularScoreAnimated({ score }: { score: number }) {
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

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={styles.circularContainer}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#DCFCE7" strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="#22C55E" strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round" strokeDasharray={circumference}
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
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);
  return <Text style={styles.scoreValue}>{displayValue}</Text>;
}

// ─── アニメーションなし円グラフ（history-detail.tsx用） ─
function CircularScoreStatic({ score }: { score: number }) {
  const size = 200;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - score / 100);

  return (
    <View style={styles.circularContainer}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#DCFCE7" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="#22C55E" strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.scoreTextContainer}>
        <Text style={styles.scoreValue}>{score}</Text>
        <Text style={styles.scoreUnit}>/ 100点</Text>
      </View>
    </View>
  );
}

// ─── スタイル ─────────────────────────────────────────
const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
  },
  winnerSection: {
    alignItems: "center",
    paddingTop: 28,
    marginBottom: 8,
  },
  winnerName: {
    fontSize: 34,
    fontWeight: "700",
    color: "#1C1C1E",
    letterSpacing: -0.8,
    textAlign: "center",
  },
  winnerSubText: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 4,
    fontWeight: "500",
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
    fontSize: 56,
    fontWeight: "700",
    color: "#1C1C1E",
    letterSpacing: -2,
  },
  scoreUnit: {
    fontSize: 14,
    marginTop: -4,
    color: "#8E8E93",
  },
  confidenceContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  confidenceBadge: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  confidenceText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  rankItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  rankItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  rankBadgeText: {
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
    color: "#8E8E93",
  },
  criterionDetail: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    backgroundColor: "#FFFFFF",
    padding: 14,
    marginBottom: 10,
  },
  criterionDetailTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#5B4EFF",
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
    color: "#8E8E93",
    width: 30,
  },
  criterionCandidate: {
    fontSize: 15,
    color: "#1C1C1E",
  },
});
