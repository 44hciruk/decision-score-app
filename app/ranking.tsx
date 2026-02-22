import { useState, useCallback, useRef, useMemo } from "react";
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
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const ITEM_HEIGHT = 64;
const ITEM_GAP = 8;

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
          上から順に「1位→最下位」です。ドラッグして並び替えてください。
        </Text>
      </Animated.View>

      {/* Sortable list */}
      <View style={styles.listContainer}>
        <SortableList
          items={currentOrder}
          onReorder={setCurrentOrder}
          colors={colors}
        />
      </View>

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
// Sortable List Component
// ============================================================

function SortableList({
  items,
  onReorder,
  colors,
}: {
  items: string[];
  onReorder: (items: string[]) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={scrollViewRef}
      scrollEnabled={false}
      style={styles.sortableListWrapper}
      contentContainerStyle={styles.listContent}
    >
      {items.map((item, visualIndex) => (
        <DraggableItem
          key={item}
          item={item}
          visualIndex={visualIndex}
          itemCount={items.length}
          items={items}
          onReorder={onReorder}
          colors={colors}
        />
      ))}
    </ScrollView>
  );
}

// ============================================================
// Draggable Item Component
// ============================================================

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
  const translateY = useSharedValue(0);
  const isActive = useSharedValue(false);
  const zIdx = useSharedValue(1);
  const shadowOpacity = useSharedValue(0);

  // Track which visual position this item is currently at
  const currentVisualPos = useRef(visualIndex);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const gesture = Gesture.Pan()
    .activateAfterLongPress(150)
    .onStart(() => {
      isActive.value = true;
      zIdx.value = 100;
      shadowOpacity.value = 0.3;
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      // Update position based on drag
      translateY.value = event.translationY;

      // Calculate which position the item should snap to
      const itemsPerPixel = 1 / (ITEM_HEIGHT + ITEM_GAP);
      const dragDistance = event.translationY * itemsPerPixel;
      const newVisualPos = visualIndex + dragDistance;

      // Calculate the closest integer position
      const targetPos = Math.round(newVisualPos);
      const clampedPos = Math.max(0, Math.min(targetPos, itemCount - 1));

      // If we've moved to a different position, reorder
      if (clampedPos !== currentVisualPos.current) {
        const oldPos = currentVisualPos.current;
        const newPos = clampedPos;

        // Create new order by moving item from oldPos to newPos
        const newItems = [...items];
        const [movedItem] = newItems.splice(oldPos, 1);
        newItems.splice(newPos, 0, movedItem);

        console.log(
          `[DRAG] Moving "${item}" from position ${oldPos} to ${newPos}`,
          newItems
        );

        // Update current position
        currentVisualPos.current = newPos;

        // Call the reorder callback
        runOnJS(onReorder)(newItems);
      }
    })
    .onEnd(() => {
      // Snap back to grid
      translateY.value = withSpring(0, {
        damping: 15,
        mass: 1,
        stiffness: 100,
      });
      isActive.value = false;
      shadowOpacity.value = 0;
      zIdx.value = 1;
    })
    .runOnJS(true);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: withTiming(isActive.value ? 1.05 : 1, { duration: 100 }) },
      ],
      zIndex: zIdx.value,
      shadowOpacity: shadowOpacity.value,
    };
  });

  // Visual rank (1-based)
  const visualRank = visualIndex + 1;

  const getRankColor = (rank: number) => {
    if (rank === 1) return "#F59E0B";
    if (rank === 2) return "#94A3B8";
    if (rank === 3) return "#CD7F32";
    return colors.muted;
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.draggableItem,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 8,
            elevation: 5,
          },
          animatedStyle,
        ]}
      >
        <View style={styles.dragHandle}>
          <Text style={[styles.handleIcon, { color: colors.muted }]}>≡</Text>
        </View>
        <View
          style={[
            styles.rankBadge,
            { backgroundColor: getRankColor(visualRank) + "20" },
          ]}
        >
          <Text
            style={[styles.rankText, { color: getRankColor(visualRank) }]}
          >
            {visualRank}
          </Text>
        </View>
        <Text
          style={[styles.itemName, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {item}
        </Text>
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
    marginBottom: 24,
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
    paddingVertical: 8,
  },
  sortableListWrapper: {
    flex: 1,
  },
  listContent: {
    gap: ITEM_GAP,
  },
  draggableItem: {
    height: ITEM_HEIGHT,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 10,
  },
  dragHandle: {
    width: 28,
    alignItems: "center",
  },
  handleIcon: {
    fontSize: 22,
    fontWeight: "700",
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  rankText: {
    fontSize: 15,
    fontWeight: "800",
  },
  itemName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
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
