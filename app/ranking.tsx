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

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCurrentOrder((prev) => {
      const newData = [...prev];
      const temp = newData[index];
      newData[index] = newData[index - 1];
      newData[index - 1] = temp;
      return newData;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setCurrentOrder((prev) => {
      if (index === prev.length - 1) return prev;
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const newData = [...prev];
      const temp = newData[index];
      newData[index] = newData[index + 1];
      newData[index + 1] = temp;
      return newData;
    });
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

  const renderItem = useCallback(({ item, drag, isActive, getIndex }: RenderItemParams<string>) => {
    const index = getIndex() ?? 0;
    const isFirst = index === 0;
    const isLastItem = index === currentOrder.length - 1;
    return (
      <TouchableOpacity
        onLongPress={drag}
        delayLongPress={150}
        activeOpacity={0.85}
        style={{
          backgroundColor: isActive ? '#F0EEFF' : '#FFFFFF',
          borderWidth: 2,
          borderColor: isActive ? '#5B4EFF' : 'transparent',
          borderRadius: 12,
          padding: 16,
          marginBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View style={{ width: 11, marginRight: 8 }}>
          {[0, 1, 2].map((row) => (
            <View key={row} style={{ flexDirection: 'row', marginBottom: row < 2 ? 3 : 0 }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#C7C7CC' }} />
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#C7C7CC', marginLeft: 3 }} />
            </View>
          ))}
        </View>

        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>

        <Text style={styles.itemName} numberOfLines={1}>{item}</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity
            onPress={() => handleMoveUp(index)}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderColor: isFirst ? '#C7C7CC' : '#5B4EFF',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="arrow-up" size={16} color={isFirst ? '#C7C7CC' : '#5B4EFF'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleMoveDown(index)}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderColor: isLastItem ? '#C7C7CC' : '#5B4EFF',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="arrow-down" size={16} color={isLastItem ? '#C7C7CC' : '#5B4EFF'} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [currentOrder.length, handleMoveUp, handleMoveDown]);

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
      <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.navHeader}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.navBackBtn}
            activeOpacity={0.7}
          >
            <IconSymbol name="chevron.left" size={20} color="#5B4EFF" />
            <Text style={styles.navBackText}>戻る</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>順位をつける</Text>
          <View style={styles.navSpacer} />
        </Animated.View>

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
            「{currentCriterion}」が優れていると思う順に並べてください。{'\n'}ドラッグまたは ↑↓ ボタンで並び替えできます。
          </Text>
        </Animated.View>

        <GestureHandlerRootView style={styles.listContainer}>
          <DraggableFlatList
            data={currentOrder}
            keyExtractor={(item, index) => `${item}-${index}`}
            onDragEnd={handleDragEnd}
            renderItem={renderItem}
            activationDistance={5}
            scrollEnabled={true}
          />
        </GestureHandlerRootView>

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
    color: "#5B4EFF",
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
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#5B4EFF',
    marginRight: 10,
  },
  rankText: {
    fontSize: 15,
    fontWeight: "700",
    color: '#FFFFFF',
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    paddingLeft: 4,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
});
