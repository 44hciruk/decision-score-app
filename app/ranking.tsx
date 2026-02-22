import { useState, useCallback } from "react";
import {
  Text,
  View,
  Pressable,
  Platform,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  withTiming,
} from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function RankingScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{
    title: string;
    candidates: string;
    criteria: string;
  }>();

  const candidates: string[] = params.candidates
    ? JSON.parse(params.candidates)
    : [];
  const criteria: string[] = params.criteria
    ? JSON.parse(params.criteria)
    : [];

  const [currentCriterionIndex, setCurrentCriterionIndex] = useState(0);
  const [rankings, setRankings] = useState<Record<string, string[]>>({});
  const [currentOrder, setCurrentOrder] = useState<string[]>([...candidates]);

  const currentCriterion = criteria[currentCriterionIndex] || "";
  const isLast = currentCriterionIndex === criteria.length - 1;
  const progress = ((currentCriterionIndex + 1) / criteria.length) * 100;

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const moveUp = useCallback(
    (index: number) => {
      if (index > 0) {
        const newOrder = [...currentOrder];
        [newOrder[index], newOrder[index - 1]] = [
          newOrder[index - 1],
          newOrder[index],
        ];
        setCurrentOrder(newOrder);
        triggerHaptic();
      }
    },
    [currentOrder, triggerHaptic]
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index < currentOrder.length - 1) {
        const newOrder = [...currentOrder];
        [newOrder[index], newOrder[index + 1]] = [
          newOrder[index + 1],
          newOrder[index],
        ];
        setCurrentOrder(newOrder);
        triggerHaptic();
      }
    },
    [currentOrder, triggerHaptic]
  );

  const handleNext = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    console.log(`[RANKING] Criterion: "${currentCriterion}"`);
    console.log(`[RANKING] Current Order:`, currentOrder);

    const updatedRankings = {
      ...rankings,
      [currentCriterion]: [...currentOrder],
    };
    setRankings(updatedRankings);

    if (isLast) {
      console.log(`[RANKING] All rankings:`, updatedRankings);
      router.push({
        pathname: "/result",
        params: {
          title: params.title || "",
          candidates: params.candidates || "[]",
          criteria: params.criteria || "[]",
          rankings: JSON.stringify(updatedRankings),
        },
      });
    } else {
      setCurrentCriterionIndex((prev) => prev + 1);
      setCurrentOrder([...candidates]);
    }
  }, [
    rankings,
    currentCriterion,
    currentOrder,
    isLast,
    candidates,
    params,
    router,
  ]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      {/* Header */}
      <View style={styles.navHeader}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.navBtn,
            pressed && { opacity: 0.5 },
          ]}
        >
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>
          並び替え
        </Text>
        <View style={styles.navBtn} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { backgroundColor: colors.primary, width: `${progress}%` },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.muted }]}>
          {currentCriterionIndex + 1} / {criteria.length} 項目
        </Text>
      </View>

      {/* Current criterion */}
      <Animated.View
        key={currentCriterionIndex}
        entering={FadeIn.duration(300)}
        style={styles.criterionContainer}
      >
        <Text style={[styles.criterionLabel, { color: colors.muted }]}>
          この項目で順位をつけてください
        </Text>
        <Text style={[styles.criterionName, { color: colors.primary }]}>
          {currentCriterion}
        </Text>
        <Text style={[styles.criterionHint, { color: colors.muted }]}>
          上から順に「1位→最下位」です。↑↓ボタンで順序を変更してください。
        </Text>
      </Animated.View>

      {/* Sortable list */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {currentOrder.map((item, index) => (
          <RankItem
            key={item}
            item={item}
            rank={index + 1}
            isFirst={index === 0}
            isLast={index === currentOrder.length - 1}
            onMoveUp={() => moveUp(index)}
            onMoveDown={() => moveDown(index)}
            colors={colors}
          />
        ))}
      </ScrollView>

      {/* Bottom button */}
      <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextBtn,
            { backgroundColor: colors.primary },
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
          ]}
        >
          <Text style={styles.nextBtnText}>
            {isLast ? "結果を見る" : "次の項目へ"}
          </Text>
          <IconSymbol name="arrow.right" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

// ============================================================
// Rank Item Component
// ============================================================

function RankItem({
  item,
  rank,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  colors,
}: {
  item: string;
  rank: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const getRankColor = (r: number) => {
    if (r === 1) return "#F59E0B";
    if (r === 2) return "#94A3B8";
    if (r === 3) return "#CD7F32";
    return colors.muted;
  };

  return (
    <View
      style={[
        styles.rankItem,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Rank badge */}
      <View
        style={[
          styles.rankBadge,
          { backgroundColor: getRankColor(rank) + "20" },
        ]}
      >
        <Text style={[styles.rankText, { color: getRankColor(rank) }]}>
          {rank}
        </Text>
      </View>

      {/* Item name */}
      <Text
        style={[styles.itemName, { color: colors.foreground }]}
        numberOfLines={1}
      >
        {item}
      </Text>

      {/* Up/Down buttons */}
      <View style={styles.buttonGroup}>
        <Pressable
          onPress={onMoveUp}
          disabled={isFirst}
          style={({ pressed }) => [
            styles.moveBtn,
            {
              backgroundColor: isFirst ? colors.border : colors.primary,
              opacity: pressed && !isFirst ? 0.8 : 1,
            },
          ]}
        >
          <IconSymbol
            name="arrow.up"
            size={18}
            color={isFirst ? colors.muted : "#FFFFFF"}
          />
        </Pressable>

        <Pressable
          onPress={onMoveDown}
          disabled={isLast}
          style={({ pressed }) => [
            styles.moveBtn,
            {
              backgroundColor: isLast ? colors.border : colors.primary,
              opacity: pressed && !isLast ? 0.8 : 1,
            },
          ]}
        >
          <IconSymbol
            name="arrow.down"
            size={18}
            color={isLast ? colors.muted : "#FFFFFF"}
          />
        </Pressable>
      </View>
    </View>
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
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    textAlign: "right",
  },
  criterionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  criterionLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  criterionName: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  criterionHint: {
    fontSize: 13,
    textAlign: "center",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    gap: 8,
    paddingBottom: 16,
  },
  rankItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: {
    fontSize: 16,
    fontWeight: "800",
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 6,
  },
  moveBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 0.5,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
