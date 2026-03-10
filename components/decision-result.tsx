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
import { COLORS, FONTS, RADIUS } from "@/constants/theme";

// ─── 型定義 ──────────────────────────────────────────
export type DecisionResultProps = {
  winner: string;
  scores: Record<string, number>;
  sortedCandidates: string[];
  criteria: string[];
  rankings: Record<string, string[]>;
  animated?: boolean;
  variant?: 'default' | 'blue';
};

// ─── ランク色 ─────────────────────────────────────────
function getRankColor(index: number, total: number): string {
  if (index === 0) return COLORS.success;
  if (index === 1) return COLORS.warning;
  if (index === total - 1) return COLORS.danger;
  return COLORS.textSecondary;
}

// ─── テーマカラー ─────────────────────────────────────
function getThemeColors(isBlue: boolean) {
  return {
    text: isBlue ? '#FFFFFF' : COLORS.textPrimary,
    textSecondary: isBlue ? 'rgba(255,255,255,0.7)' : COLORS.textSecondary,
    surface: isBlue ? 'rgba(255,255,255,0.15)' : COLORS.surface,
    border: isBlue ? 'rgba(255,255,255,0.1)' : COLORS.border,
    accent: isBlue ? '#FFFFFF' : COLORS.primary,
    accentLight: isBlue ? 'rgba(255,255,255,0.2)' : COLORS.primaryLight,
    success: isBlue ? '#FFFFFF' : COLORS.success,
    tabBg: isBlue ? 'rgba(255,255,255,0.2)' : COLORS.border,
    tabActiveBg: isBlue ? '#FFFFFF' : COLORS.surfaceWhite,
    tabActiveText: isBlue ? COLORS.primary : COLORS.textPrimary,
    scoreStroke: isBlue ? '#FFFFFF' : COLORS.primary,
    scoreTrack: isBlue ? 'rgba(255,255,255,0.2)' : COLORS.primaryLight,
  };
}

// ─── メインコンポーネント ─────────────────────────────
export function DecisionResult({
  winner,
  scores,
  sortedCandidates,
  criteria,
  rankings,
  animated = true,
  variant = 'default',
}: DecisionResultProps) {
  const isBlue = variant === 'blue';
  const t = getThemeColors(isBlue);
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
        <Text style={[styles.winnerName, { color: t.text }]}>{winner}</Text>
      </Animated.View>

      {/* 円形スコア */}
      <Animated.View
        entering={animated ? FadeInDown.delay(400).duration(500) : undefined}
        style={styles.scoreCircleContainer}
      >
        {animated !== false && (
          <CircularScoreAnimated
            score={winnerScore}
            strokeColor={t.scoreStroke}
            trackColor={t.scoreTrack}
            scoreColor={t.accent}
            unitColor={t.accent}
          />
        )}
      </Animated.View>

      {/* 信頼度バッジ */}
      <Animated.View
        entering={animated ? FadeInDown.delay(800).duration(400) : undefined}
        style={styles.confidenceContainer}
      >
        <View style={[styles.confidenceBadge, isBlue && { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Text style={[styles.confidenceText, isBlue && { color: '#FFFFFF' }]}>
            {scoreDiff}点差 — {confidenceMessage}
          </Text>
        </View>
      </Animated.View>

      {/* タブ */}
      <View style={[styles.tabContainer, { backgroundColor: t.tabBg }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'overall' && [styles.tabItemActive, { backgroundColor: t.tabActiveBg }]]}
          onPress={() => setActiveTab('overall')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, { color: t.textSecondary }, activeTab === 'overall' && { color: t.tabActiveText, fontFamily: FONTS.bold }]}>
            総合
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'criteria' && [styles.tabItemActive, { backgroundColor: t.tabActiveBg }]]}
          onPress={() => setActiveTab('criteria')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, { color: t.textSecondary }, activeTab === 'criteria' && { color: t.tabActiveText, fontFamily: FONTS.bold }]}>
            項目別
          </Text>
        </TouchableOpacity>
      </View>

      {/* ランキング */}
      {activeTab === 'overall' && (
        <View>
          <Text style={[styles.rankingTitle, { color: t.text }]}>ランキング</Text>
          <View style={[styles.rankingCard, { backgroundColor: t.surface }]}>
            {sortedCandidates.map((candidate, index) => (
              <View
                key={`${candidate}-${index}`}
                style={[
                  styles.rankingRow,
                  { borderBottomColor: t.border },
                  index === sortedCandidates.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.rankingRowLeft}>
                  {index === 0 ? (
                    <View style={[styles.rankNumber1, isBlue && {
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderColor: 'rgba(255,255,255,0.4)',
                    }]}>
                      <IconSymbol name="trophy.fill" size={16} color={t.success} />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.rankNumber,
                        isBlue
                          ? {
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              borderColor: 'rgba(255,255,255,0.2)',
                              borderWidth: 1,
                            }
                          : {
                              backgroundColor: getRankColor(index, sortedCandidates.length) + '20',
                              borderColor: getRankColor(index, sortedCandidates.length) + '40',
                              borderWidth: 1,
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.rankNumberText,
                          { color: isBlue ? 'rgba(255,255,255,0.8)' : getRankColor(index, sortedCandidates.length) },
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.rankName,
                      { color: isBlue ? 'rgba(255,255,255,0.8)' : undefined },
                      index === 0 && { color: t.text, fontFamily: FONTS.bold },
                    ]}
                  >
                    {candidate}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.rankScore,
                    { color: isBlue ? '#FFFFFF' : (index === 0 ? COLORS.success : getRankColor(index, sortedCandidates.length)) },
                  ]}
                >
                  {scores[candidate]}
                  <Text style={[styles.rankScoreUnit, { color: t.textSecondary }]}>点</Text>
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 項目別の順位 */}
      {activeTab === 'criteria' && (
        <View>
          {criteria.map((criterion, criterionIndex) => {
            const ordered = rankings[criterion] || [];
            const isExpanded = expanded[criterion] || false;
            const displayList = isExpanded ? ordered : ordered.slice(0, 3);
            return (
              <View key={`${criterion}-${criterionIndex}`} style={[styles.criterionCard, { backgroundColor: t.surface }]}>
                <View style={styles.criterionHeader}>
                  <View style={[styles.criterionHeaderAccent, isBlue && { backgroundColor: '#FFFFFF' }]} />
                  <Text style={[styles.criterionHeaderText, { color: t.text }]}>{criterion}</Text>
                </View>

                {displayList.map((candidate, idx) => (
                  <View
                    key={`${candidate}-${idx}`}
                    style={[styles.criterionRow, { borderTopColor: t.border }]}
                  >
                    <Text style={[
                      styles.criterionName,
                      { color: t.textSecondary },
                      idx === 0 && { color: t.text, fontFamily: FONTS.medium },
                    ]}>
                      {candidate}
                    </Text>
                    <Text style={[
                      styles.criterionRankLabel,
                      { color: t.textSecondary },
                      idx === 0 && { color: t.text, fontFamily: FONTS.medium },
                    ]}>
                      {idx + 1}位
                    </Text>
                  </View>
                ))}

                {ordered.length > 5 && (
                  <TouchableOpacity
                    onPress={() => setExpanded(prev => ({ ...prev, [criterion]: !isExpanded }))}
                    style={styles.expandButton}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.expandButtonText, { color: t.accent }]}>
                      {isExpanded ? '閉じる' : `もっと見る（残り${ordered.length - 3}件）`}
                    </Text>
                    <IconSymbol
                      name={isExpanded ? 'chevron.up' : 'chevron.down'}
                      size={14}
                      color={t.accent}
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

// ─── アニメーションあり円グラフ ──────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function CircularScoreAnimated({
  score,
  strokeColor = COLORS.primary,
  trackColor = COLORS.primaryLight,
  scoreColor = COLORS.primary,
  unitColor = COLORS.primary,
}: {
  score: number;
  strokeColor?: string;
  trackColor?: string;
  scoreColor?: string;
  unitColor?: string;
}) {
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
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={strokeColor} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round" strokeDasharray={circumference}
          animatedProps={animatedCircleProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.scoreTextContainer}>
        <AnimatedScoreText score={score} color={scoreColor} />
        <Text style={[styles.scoreUnit, { color: unitColor }]}>/ 100点</Text>
      </View>
    </View>
  );
}

function AnimatedScoreText({ score, color = COLORS.primary }: { score: number; color?: string }) {
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
  return <Text style={[styles.scoreValue, { color }]}>{displayValue}</Text>;
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
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
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
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    letterSpacing: -2,
  },
  scoreUnit: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: -2,
    color: COLORS.primary,
  },
  confidenceContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  confidenceBadge: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.success + '15',
  },
  confidenceText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    textAlign: "center",
    color: COLORS.success,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.border,
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginBottom: 20,
    marginTop: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  tabItemActive: {
    backgroundColor: COLORS.surfaceWhite,
  },
  tabText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.bold,
  },
  rankingTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  rankingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rankingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
    fontFamily: FONTS.bold,
  },
  rankNumber1: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.success + '20',
    borderWidth: 1,
    borderColor: COLORS.success + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankName: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  rankScore: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  rankScoreUnit: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  criterionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    marginBottom: 16,
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
    backgroundColor: COLORS.primary,
  },
  criterionHeaderText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  criterionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  criterionName: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    flex: 1,
  },
  criterionNameFirst: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
  },
  criterionRankLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  criterionRankLabelFirst: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.medium,
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
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
});
