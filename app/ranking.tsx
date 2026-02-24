import { useState, useCallback, useRef, useEffect } from "react";
import {
  Text,
  View,
  Pressable,
  Platform,
  StyleSheet,
  ScrollView,
  PanResponder,
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

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const ITEM_HEIGHT = 60;
const ITEM_GAP = 8;
const ITEM_TOTAL = ITEM_HEIGHT + ITEM_GAP;
const LONG_PRESS_DURATION = 50;

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

  const handleReorder = useCallback((newOrder: string[]) => {
    setCurrentOrder(newOrder);
  }, []);

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
              onReorder={handleReorder}
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
// Global Drag State (useRef で保存、Reactive でない)
// ============================================================

let globalDragState = {
  isDragging: false,
  draggedItemId: null as string | null,
  draggedIndex: -1,
  currentTouchY: 0,
  startTouchY: 0,
  startTime: 0,
  currentOrder: [] as string[],
  itemCount: 0,
};

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

  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIdx = useSharedValue(1);

  // タッチ座標を useRef で保存（Reactive でない）
  const touchStateRef = useRef({
    isTouching: false,
    startY: 0,
    currentY: 0,
    startTime: 0,
  });

  const animationFrameRef = useRef<number | null>(null);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  // requestAnimationFrame でアニメーション更新
  const updateAnimation = useCallback(() => {
    if (!touchStateRef.current.isTouching) {
      animationFrameRef.current = null;
      return;
    }

    const deltaY = touchStateRef.current.currentY - touchStateRef.current.startY;
    translateY.value = deltaY;

    // グローバル状態を更新（Reactive でない）
    globalDragState.currentTouchY = touchStateRef.current.currentY;

    animationFrameRef.current = requestAnimationFrame(updateAnimation);
  }, []);

  const handleTouchStart = useCallback(
    (e: any) => {
      const touchY = e.nativeEvent.pageY || e.nativeEvent.touches?.[0]?.pageY || 0;

      touchStateRef.current = {
        isTouching: true,
        startY: touchY,
        currentY: touchY,
        startTime: Date.now(),
      };

      globalDragState.isDragging = false;
      globalDragState.draggedItemId = item;
      globalDragState.draggedIndex = visualIndex;
      globalDragState.currentOrder = items;
      globalDragState.itemCount = itemCount;
    },
    [item, visualIndex, items, itemCount]
  );

  const handleTouchMove = useCallback(
    (e: any) => {
      if (!touchStateRef.current.isTouching) return;

      const touchY = e.nativeEvent.pageY || e.nativeEvent.touches?.[0]?.pageY || 0;
      const deltaY = touchY - touchStateRef.current.startY;
      const elapsedTime = Date.now() - touchStateRef.current.startTime;

      // 長押し検出（50ms以上）
      if (elapsedTime >= LONG_PRESS_DURATION && !globalDragState.isDragging) {
        globalDragState.isDragging = true;
        setIsDragging(true);
        scale.value = withTiming(1.02, { duration: 100 });
        zIdx.value = 100;
        triggerHaptic();

        // requestAnimationFrame 開始
        if (!animationFrameRef.current) {
          animationFrameRef.current = requestAnimationFrame(updateAnimation);
        }
      }

      // ドラッグ中なら位置を更新
      if (globalDragState.isDragging) {
        touchStateRef.current.currentY = touchY;
      }
    },
    [updateAnimation, triggerHaptic]
  );

  const handleTouchEnd = useCallback(() => {
    touchStateRef.current.isTouching = false;

    if (!globalDragState.isDragging) {
      globalDragState.draggedItemId = null;
      return;
    }

    // ドラッグ終了時のアニメーション
    scale.value = withTiming(1, { duration: 100 });
    translateY.value = withTiming(0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
    zIdx.value = 1;
    setIsDragging(false);

    // 配列を更新
    const deltaY = touchStateRef.current.currentY - touchStateRef.current.startY;
    const offset = Math.round(deltaY / ITEM_TOTAL);
    const targetIndex = Math.max(
      0,
      Math.min(visualIndex + offset, itemCount - 1)
    );

    if (targetIndex !== visualIndex) {
      const newItems = [...items];
      const [movedItem] = newItems.splice(visualIndex, 1);
      newItems.splice(targetIndex, 0, movedItem);
      onReorder(newItems);
    }

    globalDragState.isDragging = false;
    globalDragState.draggedItemId = null;

    // requestAnimationFrame キャンセル
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [visualIndex, itemCount, items, onReorder]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      zIndex: zIdx.value,
    };
  });

  // 他のアイテムの位置を計算
  const otherItemAnimatedStyle = useAnimatedStyle(() => {
    if (
      globalDragState.isDragging &&
      globalDragState.draggedItemId &&
      globalDragState.draggedItemId !== item
    ) {
      const draggedDeltaY = globalDragState.currentTouchY - globalDragState.startTouchY;
      const draggedPosition = globalDragState.draggedIndex + draggedDeltaY / ITEM_TOTAL;
      const currentIndex = visualIndex;

      // このアイテムがドラッグ中のアイテムより上にある場合
      if (draggedPosition > currentIndex) {
        // ドラッグ中のアイテムがこのアイテムを越えたら、下に移動
        if (draggedPosition >= currentIndex + 0.5) {
          return {
            transform: [{ translateY: ITEM_TOTAL }],
          };
        }
      }
      // このアイテムがドラッグ中のアイテムより下にある場合
      else if (draggedPosition < currentIndex) {
        // ドラッグ中のアイテムがこのアイテムを越えたら、上に移動
        if (draggedPosition <= currentIndex - 0.5) {
          return {
            transform: [{ translateY: -ITEM_TOTAL }],
          };
        }
      }
    }

    return {
      transform: [{ translateY: 0 }],
    };
  });

  return (
    <Animated.View
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={[
        styles.draggableItem,
        {
          backgroundColor: isDragging
            ? colors.primary + "15"
            : colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderStyle: "solid",
        },
        isDragging ? animatedStyle : otherItemAnimatedStyle,
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
