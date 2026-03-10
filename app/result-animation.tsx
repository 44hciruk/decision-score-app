import { useEffect, useMemo, useState } from "react";
import { Text, View, StyleSheet, Dimensions } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { calculateScores } from "@/lib/storage";
import { COLORS, FONTS } from "@/constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ResultAnimationScreen() {
  const router = useRouter();
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
  const targetScore = scores[winner] || 0;

  // ─── アニメーション ─────────────────────────────────
  const blueHeight = useSharedValue(0);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // 青い矩形が下から上へ: 0 → 画面高さ (1200ms)
    blueHeight.value = withTiming(SCREEN_HEIGHT, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });

    // スコアカウンター: 1200ms開始, 0→targetScore (400ms)
    const scoreTimer = setTimeout(() => {
      const duration = 400;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayScore(Math.round(eased * targetScore));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, 1200);

    // 自動遷移: アニメーション完了後に /result へ
    const navTimer = setTimeout(() => {
      router.replace({
        pathname: "/result",
        params: {
          title: params.title || "",
          candidates: params.candidates || "[]",
          criteria: params.criteria || "[]",
          rankings: params.rankings || "{}",
        },
      });
    }, 2400);

    return () => {
      clearTimeout(scoreTimer);
      clearTimeout(navTimer);
    };
  }, []);

  const animatedBlueStyle = useAnimatedStyle(() => ({
    height: blueHeight.value,
  }));

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#FFFFFF]">
      <View style={styles.container}>
        <Animated.View style={[styles.blueRect, animatedBlueStyle]} />
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{displayScore}</Text>
          <Text style={styles.scoreLabel}>/ 100点</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  blueRect: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
  },
  scoreContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 72,
    fontFamily: FONTS.bold,
    color: "#FFFFFF",
    letterSpacing: -3,
  },
  scoreLabel: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: "rgba(255,255,255,0.8)",
    marginTop: -4,
  },
});
