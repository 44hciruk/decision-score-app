import { useState, useCallback } from "react";
import {
  Text,
  View,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DraggableFlatList, { RenderItemParams } from "react-native-draggable-flatlist";
import { Ionicons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

const ITEM_HEIGHT = 68;
const ITEM_GAP = 10;

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

  const handleDragEnd = useCallback(({ data }: { data: string[] }) => {
    setCurrentOrder(data);
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

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<string>) => {
    const visualIndex = getIndex() ?? 0;
    return (
        <TouchableOpacity
          onLongPress={drag}
          delayLongPress={150}
          activeOpacity={0.85}
          style={{
            backgroundColor: isActive ? '#F0EEFF' : '#FFFFFF',
            borderWidth: isActive ? 2 : 0,
            borderColor: '#5B4EFF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}
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

          {/* 上下移動ボタン */}
          <View style={{ flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {visualIndex > 0 && (
              <TouchableOpacity
                onPress={() => {
                  const newData = [...currentOrder];
                  const temp = newData[visualIndex];
                  newData[visualIndex] = newData[visualIndex - 1];
                  newData[visualIndex - 1] = temp;
                  setCurrentOrder(newData);
                }}
              >
                <Ionicons name="chevron-up" size={20} color="#5B4EFF" />
              </TouchableOpacity>
            )}
            {visualIndex < currentOrder.length - 1 && (
              <TouchableOpacity
                onPress={() => {
                  const newData = [...currentOrder];
                  const temp = newData[visualIndex];
                  newData[visualIndex] = newData[visualIndex + 1];
                  newData[visualIndex + 1] = temp;
                  setCurrentOrder(newData);
                }}
              >
                <Ionicons name="chevron-down" size={20} color="#5B4EFF" />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
    );
  };

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
        <GestureHandlerRootView style={styles.listContainer}>
          <DraggableFlatList
            data={currentOrder}
            keyExtractor={(item) => item}
            onDragEnd={handleDragEnd}
            renderItem={renderItem}
            activationDistance={5}
            scrollEnabled={false}
          />
        </GestureHandlerRootView>

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
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 4,
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
    marginRight: 12,
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
});
