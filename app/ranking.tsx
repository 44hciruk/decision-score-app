import { useState, useCallback } from "react";
import {
  Text,
  View,
  Platform,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

const ITEM_HEIGHT = 68;
const ITEM_GAP = 10;
const ITEM_TOTAL = ITEM_HEIGHT + ITEM_GAP;

export default function RankingScreen() {
  const router = useRouter();
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
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
      <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      {/* ナビゲーションヘッダー */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.navHeader}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.navBackBtn}
          activeOpacity={0.7}
        >
          <IconSymbol name="chevron.left" size={20} color="#6D28D9" />
          <Text style={styles.navBackText}>戻る</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>順位をつける</Text>
        <View style={styles.navSpacer} />
      </Animated.View>

      {/* 評価基準名 + カウンター */}
      <Animated.View key={currentCriterionIndex} entering={FadeIn.duration(300)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 16, marginBottom: 4 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#1C1C1E' }}>
            {currentCriterion}
          </Text>
          <Text style={{ fontSize: 15, color: '#8E8E93', fontWeight: '500' }}>
            {currentCriterionIndex + 1} / {criteria.length}
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: '#8E8E93', marginHorizontal: 16, marginBottom: 16 }}>
          評価基準ごとに順位をつけてください
        </Text>
      </Animated.View>

      {/* ソータブルリスト */}
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
            />
          ))}
        </ScrollView>
      </View>

      {/* ボトムボタン */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.bottomBar}>
        {currentCriterionIndex > 0 && (
          <TouchableOpacity
            onPress={handleBack}
            style={{ alignItems: 'center', paddingVertical: 12 }}
          >
            <Text style={{ fontSize: 14, color: '#5B4EFF' }}>← 前の項目に戻る</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#5B4EFF',
              borderRadius: 20,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '600' }}>
              {isLast ? '結果を見る' : '次の評価項目へ'}
            </Text>
          </TouchableOpacity>
      </Animated.View>
      </View>
    </ScreenContainer>
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

// 1位:緑、2位:オレンジ、それ以外:紫グラデーション
const RANK_COLORS = ["#22C55E", "#F59E0B", "#6D28D9", "#6366F1", "#8B5CF6", "#A78BFA"];

function DraggableItem({
  item,
  visualIndex,
  itemCount,
  items,
  onReorder,
}: {
  item: string;
  visualIndex: number;
  itemCount: number;
  items: string[];
  onReorder: (items: string[]) => void;
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
      transform: [{ translateY: translateY.value }],
      borderWidth: 2,
      borderColor: '#5B4EFF',
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      zIndex: 999,
    };
  });

  const otherItemAnimatedStyle = useAnimatedStyle(() => {
    const highlighted = isHighlighted.value > 0.5;
    return {
      transform: [{ translateY: otherItemTranslateY.value }],
      backgroundColor: highlighted ? "#F5F3FF" : "#FFFFFF",
      borderWidth: highlighted ? 1.5 : 1,
      borderColor: highlighted ? "#6D28D9" : "rgba(109, 40, 217, 0.1)",
      borderRadius: 12,
    };
  });

  const rankColor = RANK_COLORS[Math.min(visualIndex, RANK_COLORS.length - 1)];

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.draggableItem,
          isDragging ? animatedStyle : otherItemAnimatedStyle,
        ]}
      >
        {/* 順位バッジ */}
        <View style={[styles.rankBadge, { backgroundColor: '#5B4EFF', borderColor: '#5B4EFF' }]}>
          <Text style={[styles.rankText, { color: '#FFFFFF' }]}>
            {visualIndex + 1}
          </Text>
        </View>

        <Text style={styles.itemName} numberOfLines={1}>
          {item}
        </Text>

        {/* ドラッグハンドル */}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
    backgroundColor: "#FFFFFF",
  },
  navBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingRight: 12,
    minWidth: 80,
  },
  navBackText: {
    fontSize: 16,
    color: "#6D28D9",
    fontWeight: "500",
  },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#1C1C1E",
    textAlign: "center",
  },
  navSpacer: {
    minWidth: 80,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "#EDE9FF",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#6D28D9",
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 13,
    color: "#8E8E93",
    flex: 1,
  },
  progressText: {
    fontSize: 13,
    color: "#6D28D9",
    fontWeight: "700",
  },
  criterionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  criterionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "#EDE9FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  criterionBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6D28D9",
    letterSpacing: 0.5,
  },
  criterionName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  criterionHint: {
    fontSize: 13,
    color: "#8E8E93",
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
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  rankText: {
    fontSize: 15,
    fontWeight: "700",
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
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
    backgroundColor: "#8E8E93",
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: "#6D28D9",
    gap: 8,
    minHeight: 56,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
