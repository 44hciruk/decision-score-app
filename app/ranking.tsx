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

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { COLORS, FONTS, RADIUS } from "@/constants/theme";

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
        pathname: "/result-animation",
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
    return (
      <TouchableOpacity
        onLongPress={drag}
        delayLongPress={150}
        activeOpacity={0.85}
        style={{
          backgroundColor: isActive ? COLORS.primaryLight : COLORS.surface,
          borderWidth: isActive ? 2 : 0,
          borderColor: isActive ? COLORS.primary : 'transparent',
          borderRadius: RADIUS.md,
          padding: 16,
          marginBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View style={{ width: 11, marginRight: 8 }}>
          {[0, 1, 2].map((row) => (
            <View key={row} style={{ flexDirection: 'row', marginBottom: row < 2 ? 5 : 0 }}>
              <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.textSecondary }} />
              <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.textSecondary, marginLeft: 3 }} />
            </View>
          ))}
        </View>

        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>

        <Text style={styles.itemName} numberOfLines={1}>{item}</Text>

        <View style={styles.stepperContainer}>
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => handleMoveUp(index)}
            disabled={index === 0}
          >
            <IconSymbol
              name="chevron.up"
              size={14}
              color={index === 0 ? 'transparent' : COLORS.textSecondary}
            />
          </TouchableOpacity>
          <View style={styles.stepperDivider} />
          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => handleMoveDown(index)}
            disabled={index === candidates.length - 1}
          >
            <IconSymbol
              name="chevron.down"
              size={14}
              color={index === candidates.length - 1 ? 'transparent' : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [currentOrder.length, handleMoveUp, handleMoveDown]);

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.navHeader}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.navBackBtn}
            activeOpacity={0.7}
          >
            <IconSymbol name="chevron.left" size={20} color={COLORS.primary} />
            <Text style={styles.navBackText}>戻る</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>順位をつける</Text>
          <View style={styles.navSpacer} />
        </Animated.View>

        <Animated.View key={currentCriterionIndex} entering={FadeIn.duration(300)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 16, marginBottom: 4 }}>
            <Text style={{ fontSize: 22, fontFamily: FONTS.bold, color: COLORS.textPrimary }}>
              {currentCriterion}
            </Text>
            <Text style={{ fontSize: 15, fontFamily: FONTS.medium, color: COLORS.textSecondary }}>
              {currentCriterionIndex + 1} / {criteria.length}
            </Text>
          </View>
          <Text style={{ fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginHorizontal: 16, marginBottom: 16 }}>
            「{currentCriterion}」が優れていると思う順に並べてください。{'\n'}長押しでドラッグ、またはボタンで並び替えできます。
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
              <Text style={{ fontSize: 14, fontFamily: FONTS.medium, color: COLORS.primary }}>← 前の項目に戻る</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.85}
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: RADIUS.full,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontFamily: FONTS.medium }}>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
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
    fontFamily: FONTS.medium,
    color: COLORS.primary,
  },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.primary,
    marginRight: 10,
  },
  rankText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    paddingLeft: 4,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },
});
