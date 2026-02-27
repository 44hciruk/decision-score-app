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
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { GradientScreen } from "@/components/gradient-screen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const ITEM_HEIGHT = 64;
const ITEM_GAP = 10;
const ITEM_TOTAL = ITEM_HEIGHT + ITEM_GAP;

export default function RankingScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{
    title: string;
    candidates: string;
    criteria: string;
  }>();

  const candidates: string[] = params.candidates ? JSON.parse(params.candidates) : [];
  const criteria: string[] = params.criteria ? JSON.parse(params.criteria) : [];

  const [currentCriterionIndex, setCurrentCriterionIndex] = useState(0);
  const [rankings, setRankings] = useState<Record<string, string[]>>({});
  const [currentOrder, setCurrentOrder] = useState<string[]>([...candidates]);

  const currentCriterion = criteria[currentCriterionIndex] || "";
  const isLast = currentCriterionIndex === criteria.length - 1;
  const progress = ((currentCriterionIndex + 1) / criteria.length) * 100;

  const handleReorder = useCallback((newOrder: string[]) => {
    setCurrentOrder(newOrder);
  }, []);

  const handleBack = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentCriterionIndex > 0) {
      setCurrentCriterionIndex((prev) => prev - 1);
      setCurrentOrder([...candidates]);
    } else {
      router.back();
    }
  }, [currentCriterionIndex, candidates, router]);

  const handleNext = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const updatedRankings = {
      ...rankings,
      [currentCriterion]: [...currentOrder],
    };
    setRankings(updatedRankings);

    if (isLast) {
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
  }, [rankings, currentCriterion, currentOrder, isLast, candidates, params, router]);

  return (
    <GradientScreen edges={["top", "left", "right"]}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.navHeader}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.5 }]}
        >
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.navTitle}>順位をつける</Text>
        <View style={styles.navBtn} />
      </Animated.View>

      {/* Progress bar */}
      <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <Animated.View
            style={[styles.progressBarFill, { width: `${progress}%` }]}
          />
        </View>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>
            {criteria[currentCriterionIndex]}
          </Text>
          <Text style={styles.progressText}>
            {currentCriterionIndex + 1} / {criteria.length}
          </Text>
        </View>
      </Animated.View>

      {/* Current criterion */}
      <Animated.View
        key={currentCriterionIndex}
        entering={FadeIn.duration(300)}
        style={styles.criterionContainer}
      >
        <View style={styles.criterionBadge}>
          <Text style={styles.criterionBadgeText}>評価基準</Text>
        </View>
        <Text style={styles.criterionName}>{currentCriterion}</Text>
        <Text style={styles.criterionHint}>
          長押しでドラッグ。上が1位です。
        </Text>
      </Animated.View>

      {/* Sortable list */}
      <View style={styles.listContainer}>
        <ScrollView
          scrollEnabled={false}
          style={styles.sortableListWrapper}
          contentContainerStyle={styles.listContent}
        >
          {currentOrder.map((item, visualIndex) => (
            <DraggableItem
              key={item}
              item={item}
              visualIndex={visualIndex}
              itemCount={currentOrder.length}
              items={currentOrder}
              onReorder={handleReorder}
              colors={colors}
            />
          ))}
        </ScrollView>
      </View>

      {/* Bottom button */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.bottomBar}>
        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextBtn,
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
          ]}
        >
          <Text style={styles.nextBtnText}>
            {isLast ? "結果を見る 🏆" : "次の評価項目へ"}
          </Text>
          {!isLast && <IconSymbol name="arrow.right" size={20} color="#6366F1" />}
        </Pressable>
      </Animated.View>
    </GradientScreen>
  );
}

// ============================================================
// Global Drag State
// ============================================================

let globalDragState = {
  draggedItemId: null as string | null,
  draggedIndex: -1,
  draggedTranslateY: 0,
  currentOrder: [] as string[],
};

// ============================================================
// Draggable Item Component
// ============================================================

const RANK_COLORS = ["#34D399", "#FBBF24", "#F472B6", "#60A5FA", "#A78BFA", "#FB923C"];

function DraggableItem({
  item,
  visualIndex,
  itemCount,
  items,
  onReorder,
  colors,
}: {
  item: string;
  visualIndex: number;
  itemCount: number;
  items: string[];
  onReorder: (items: string[]) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const translateY = useSharedValue(0);
  const isActive = useSharedValue(false);
  const zIdx = useSharedValue(1);
  const scale = useSharedValue(1);
  const otherItemTranslateY = useSharedValue(0);
  const isHighlighted = useSharedValue(0);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const gesture = Gesture.Pan()
    .minDistance(5)
    .activateAfterLongPress(50)
    .onStart(() => {
      globalDragState.draggedItemId = item;
      globalDragState.draggedIndex = visualIndex;
      globalDragState.currentOrder = items;
      globalDragState.draggedTranslateY = 0;

      isActive.value = true;
      zIdx.value = 100;
      scale.value = withTiming(1.03, { duration: 100 });
      runOnJS(setIsDragging)(true);
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
      globalDragState.draggedTranslateY = event.translationY;

      if (globalDragState.draggedItemId && globalDragState.draggedItemId !== item) {
        const draggedTranslateY = globalDragState.draggedTranslateY;
        const draggedIndex = globalDragState.draggedIndex;
        const currentIndex = visualIndex;
        const draggedPosition = draggedIndex + draggedTranslateY / ITEM_TOTAL;

        if (draggedPosition > currentIndex) {
          if (draggedPosition >= currentIndex + 0.5) {
            otherItemTranslateY.value = withTiming(ITEM_TOTAL, {
              duration: 150,
              easing: Easing.out(Easing.cubic),
            });
            isHighlighted.value = withTiming(1, { duration: 150 });
          } else {
            otherItemTranslateY.value = withTiming(0, {
              duration: 150,
              easing: Easing.out(Easing.cubic),
            });
            isHighlighted.value = withTiming(0, { duration: 150 });
          }
        } else if (draggedPosition < currentIndex) {
          if (draggedPosition <= currentIndex - 0.5) {
            otherItemTranslateY.value = withTiming(-ITEM_TOTAL, {
              duration: 150,
              easing: Easing.out(Easing.cubic),
            });
            isHighlighted.value = withTiming(1, { duration: 150 });
          } else {
            otherItemTranslateY.value = withTiming(0, {
              duration: 150,
              easing: Easing.out(Easing.cubic),
            });
            isHighlighted.value = withTiming(0, { duration: 150 });
          }
        } else {
          isHighlighted.value = withTiming(0, { duration: 150 });
        }
      }
    })
    .onEnd((event) => {
      scale.value = withTiming(1, { duration: 100 });
      translateY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
      isActive.value = false;
      zIdx.value = 1;
      otherItemTranslateY.value = withTiming(0, { duration: 150, easing: Easing.out(Easing.cubic) });
      runOnJS(setIsDragging)(false);

      const offset = Math.round(event.translationY / ITEM_TOTAL);
      const targetIndex = Math.max(0, Math.min(visualIndex + offset, itemCount - 1));

      if (targetIndex !== visualIndex) {
        const newItems = [...items];
        const [movedItem] = newItems.splice(visualIndex, 1);
        newItems.splice(targetIndex, 0, movedItem);
        runOnJS(onReorder)(newItems);
      }

      globalDragState.draggedItemId = null;
      globalDragState.draggedIndex = -1;
      globalDragState.draggedTranslateY = 0;
    })
    .onFinalize(() => {
      scale.value = withTiming(1, { duration: 100 });
      translateY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
      isActive.value = false;
      zIdx.value = 1;
      otherItemTranslateY.value = withTiming(0, { duration: 150, easing: Easing.out(Easing.cubic) });
      runOnJS(setIsDragging)(false);
      globalDragState.draggedItemId = null;
      globalDragState.draggedIndex = -1;
      globalDragState.draggedTranslateY = 0;
    })
    .runOnJS(true);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      zIndex: zIdx.value,
      backgroundColor: "rgba(255,255,255,0.25)",
      borderColor: "rgba(255,255,255,0.6)",
      borderWidth: 1.5,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 12,
    };
  });

  const otherItemAnimatedStyle = useAnimatedStyle(() => {
    const highlighted = isHighlighted.value > 0.5;
    return {
      transform: [{ translateY: otherItemTranslateY.value }],
      backgroundColor: highlighted ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)",
      borderWidth: highlighted ? 1.5 : 1,
      borderColor: highlighted ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
      borderRadius: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 3,
    };
  });

  const rankColor = RANK_COLORS[visualIndex % RANK_COLORS.length];

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.draggableItem,
          isDragging ? animatedStyle : otherItemAnimatedStyle,
        ]}
      >
        {/* Rank badge */}
        <View style={[styles.rankBadge, { backgroundColor: rankColor + "30", borderColor: rankColor + "60" }]}>
          <Text style={[styles.rankText, { color: rankColor }]}>
            {visualIndex + 1}
          </Text>
        </View>

        <Text style={styles.itemName} numberOfLines={1}>
          {item}
        </Text>

        {/* Drag handle */}
        <View style={styles.dragHandle}>
          <View style={styles.handleDot} />
          <View style={styles.handleDot} />
          <View style={styles.handleDot} />
          <View style={styles.handleDot} />
          <View style={styles.handleDot} />
          <View style={styles.handleDot} />
        </View>
      </Animated.View>
    </GestureDetector>
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
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    flex: 1,
  },
  progressText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  criterionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  criterionBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  criterionBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 0.5,
  },
  criterionName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  criterionHint: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  sortableListWrapper: {
    flex: 1,
  },
  listContent: {
    gap: ITEM_GAP,
  },
  draggableItem: {
    height: ITEM_HEIGHT,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  rankText: {
    fontSize: 15,
    fontWeight: "800",
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  dragHandle: {
    width: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  handleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6366F1",
  },
});
