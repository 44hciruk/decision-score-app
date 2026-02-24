import { useState, useCallback, useMemo, useRef } from "react";
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
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const ITEM_HEIGHT = 60;
const ITEM_GAP = 8;
const ITEM_TOTAL = ITEM_HEIGHT + ITEM_GAP;

// デバウンス処理用ユーティリティ
function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: any[]) => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;
}

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
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>
          順位をつける
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
          {currentCriterionIndex + 1} / {criteria.length}
        </Text>
      </View>

      {/* Current criterion */}
      <Animated.View
        key={currentCriterionIndex}
        entering={FadeIn.duration(300)}
        style={styles.criterionContainer}
      >
        <Text style={[styles.criterionName, { color: colors.primary }]}>
          {currentCriterion}
        </Text>
        <Text style={[styles.criterionHint, { color: colors.muted }]}>
          上から順に「1位→最下位」です。ドラッグして並び替えてください。
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
              onReorder={setCurrentOrder}
              colors={colors}
            />
          ))}
        </ScrollView>
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
            {isLast ? "結果を見る" : "次へ"}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
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
  const [isDragging, setIsDragging] = useState(false);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);

  const translateY = useSharedValue(0);
  const isActive = useSharedValue(false);
  const zIdx = useSharedValue(1);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  // 方法2: デバウンス処理で状態更新の頻度を削減
  const debouncedSetDraggedOverIndex = useDebounce(setDraggedOverIndex, 30);
  const debouncedOnReorder = useDebounce(onReorder, 30);

  const gesture = Gesture.Pan()
    .activateAfterLongPress(100)
    .onStart(() => {
      isActive.value = true;
      zIdx.value = 100;
      runOnJS(setIsDragging)(true);
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      // 方法1: 位置計算を簡潔化
      // 方法3: Animated.Valueで同期的に位置を追跡
      translateY.value = event.translationY;

      // シンプルな計算: translationY を直接 ITEM_TOTAL で割る
      const targetPos = Math.round(event.translationY / ITEM_TOTAL);
      const clampedPos = Math.max(0, Math.min(visualIndex + targetPos, itemCount - 1));

      // デバウンス処理で状態更新の頻度を削減
      runOnJS(debouncedSetDraggedOverIndex)(clampedPos);

      // Reorder if position changed
      if (clampedPos !== visualIndex) {
        const newItems = [...items];
        const [movedItem] = newItems.splice(visualIndex, 1);
        newItems.splice(clampedPos, 0, movedItem);

        console.log(
          `[DRAG] Moving "${item}" from position ${visualIndex} to ${clampedPos}`,
          newItems
        );

        runOnJS(debouncedOnReorder)(newItems);
      }
    })
    .onEnd(() => {
      // スムーズなアニメーション: withTiming で 150ms で 0 に戻す
      translateY.value = withTiming(0, {
        duration: 150,
        easing: Easing.out(Easing.cubic),
      });
      isActive.value = false;
      zIdx.value = 1;
      runOnJS(setIsDragging)(false);
      runOnJS(setDraggedOverIndex)(null);
    })
    .runOnJS(true);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      zIndex: zIdx.value,
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.draggableItem,
          {
            backgroundColor: isDragging
              ? colors.primary + "15"
              : draggedOverIndex === visualIndex
                ? colors.primary + "08"
                : colors.surface,
            borderColor:
              draggedOverIndex === visualIndex ? colors.primary : colors.border,
            borderWidth: draggedOverIndex === visualIndex ? 2 : 1,
            borderStyle: draggedOverIndex === visualIndex ? "dashed" : "solid",
          },
          animatedStyle,
        ]}
      >
        <View style={styles.dragHandle}>
          <Text style={[styles.handleIcon, { color: colors.muted }]}>≡</Text>
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
    marginBottom: 20,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    textAlign: "right",
  },
  criterionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  criterionName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },
  criterionHint: {
    fontSize: 13,
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
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 12,
  },
  dragHandle: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  handleIcon: {
    fontSize: 20,
    fontWeight: "700",
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
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
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
