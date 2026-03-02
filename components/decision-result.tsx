import { useEffect, useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
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
}: DecisionResultProps) {
  const [activeTab, setActiveTab] = useState<'overall' | 'criteria'>('overall');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const winnerScore = scores[winner] || 0;
  const secondScore = sortedCandidates[1] ? scores[sortedCandidates[1]] || 0 : 0;
  const scoreDiff = winnerScore - secondScore;
  const confidenceMessage = getConfidenceMessage(scoreDiff);

  return (
    <View style={styles.scrollContent}>
      {/* 1位発表 */}
      <Animated.View
        entering={animated ? FadeInDown.delay(200).duration(500) : undefined}
        style={styles.winnerSection}
      >
        <Text style={styles.winnerName}>{winner}</Text>
      </Animated.View>

      {/* 円形スコア */}
      <Animated.View
        entering={animated ? FadeInDown.delay(400).duration(500) : undefined}
        style={styles.scoreCircleContainer}
      >
        {animated !== false && (
          <CircularScoreAnimated score={winnerScore} />
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

      {/* タブ */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'overall' && styles.tabItemActive]}
          onPress={() => setActiveTab('overall')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'overall' && styles.tabTextActive]}>
            総合
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'criteria' && styles.tabItemActive]}
          onPress={() => setActiveTab('criteria')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'criteria' && styles.tabTextActive]}>
            項目別
          </Text>
        </TouchableOpacity>
      </View>

      {/* ランキング */}
      {activeTab === 'overall' && (
        <View>
          <View>
            <Text style={styles.sectionTitle}>ランキング</Text>
            {sortedCandidates.map((candidate, index) => {
              const score = scores[candidate] || 0;
              const rankColor = getRankColor(index, sortedCandidates.length);
              const isWinner = index === 0;
              return (
                <View
                  key={`${candidate}-${index}`}
                  style={[
                    styles.rankItem,
                    {
                      borderWidth: 1,
                      borderColor: index === 0 ? '#22C55E' : '#E5E5EA',
                    },
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
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 項目別の順位 */}
      {activeTab === 'criteria' && (
        <View>
          {criteria.map(criterion => {
            const ordered = rankings[criterion] || [];
            const isExpanded = expanded[criterion] || false;
            const displayList = isExpanded ? ordered : ordered.slice(0, 5);
            return (
              <View key={criterion} style={styles.criterionCard}>
                {/* セクションヘッダー */}
                <View style={styles.criterionHeader}>
                  <View style={styles.criterionHeaderAccent} />
                  <Text style={styles.criterionHeaderText}>{criterion}</Text>
                </View>

                {/* 候補リスト */}
                {displayList.map((candidate, idx) => (
                  <View
                    key={`${candidate}-${idx}`}
                    style={styles.criterionRow}
                  >
                    <Text style={[
                      styles.criterionName,
                      idx === 0 && styles.criterionNameFirst,
                    ]}>
                      {candidate}
                    </Text>
                    <Text style={[
                      styles.criterionRankLabel,
                      idx === 0 && styles.criterionRankLabelFirst,
                    ]}>
                      {idx + 1}位
                    </Text>
                  </View>
                ))}

                {/* 展開ボタン */}
                {ordered.length > 5 && (
                  <TouchableOpacity
                    onPress={() => setExpanded(prev => ({ ...prev, [criterion]: !isExpanded }))}
                    style={styles.expandButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.expandButtonText}>
                      {isExpanded ? '閉じる' : `もっと見る（残り${ordered.length - 5}件）`}
                    </Text>
                    <IconSymbol
                      name={isExpanded ? 'chevron.up' : 'chevron.down'}
                      size={14}
                      color="#5B4EFF"
                    />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── アニメーションあり円グラフ（result.tsx用） ──────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function CircularScoreAnimated({ score }: { score: number }) {
  const size = 160;
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
  const size = 160;
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
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
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
    fontSize: 40,
    fontWeight: "700",
    color: "#1C1C1E",
    letterSpacing: -2,
  },
  scoreUnit: {
    fontSize: 12,
    marginTop: -2,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
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
    marginBottom: 20,
  },
  criterionDetailTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 10,
  },
  rankNumber: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumberText: {
    fontSize: 15,
    fontWeight: '700',
  },
  rankName: {
    fontSize: 16,
    flex: 1,
  },
  rankScore: {
    fontSize: 14,
    fontWeight: '600',
  },
  criterionRankText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    width: 20,
    textAlign: 'center',
  },
  rankingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  criterionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    marginBottom: 16,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    marginTop: 4,
  },
  expandButtonText: {
    fontSize: 14,
    color: '#5B4EFF',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginBottom: 20,
    marginTop: 8,
  },
  criterionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  criterionHeaderAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#5B4EFF',
  },
  criterionHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  criterionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  criterionName: {
    fontSize: 15,
    color: '#8E8E93',
    flex: 1,
  },
  criterionNameFirst: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
  criterionRankLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  criterionRankLabelFirst: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
});
