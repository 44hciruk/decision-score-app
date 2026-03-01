import { useCallback, useEffect, useMemo } from "react";
import {
  Text,
  View,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DecisionResult } from "@/components/decision-result";
import { useProjectContext } from "@/lib/project-context";
import {
  calculateScores,
  generateId,
  type Project,
} from "@/lib/storage";

export default function ResultScreen() {
  const router = useRouter();
  const { addProject } = useProjectContext();
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

  useEffect(() => {
    if (Platform.OS !== "web") {
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 800);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const project: Project = {
      id: generateId(),
      title: params.title || "無題",
      createdAt: new Date().toISOString(),
      candidates,
      criteria,
      rankings,
      scores,
      winner,
    };
    await addProject(project);
    router.dismissAll();
  }, [params.title, candidates, criteria, rankings, scores, winner, addProject, router]);

  const handleRetry = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.dismissAll();
  }, [router]);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
        {/* ヘッダー */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.navHeader}>
          <TouchableOpacity
            onPress={handleRetry}
            style={styles.navBackBtn}
            activeOpacity={0.7}
          >
            <IconSymbol name="chevron.left" size={20} color="#5B4EFF" />
            <Text style={styles.navBackText}>戻る</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>結果発表</Text>
          <View style={styles.navSpacer} />
        </Animated.View>

        {/* 共通コンポーネント */}
        <DecisionResult
          winner={winner}
          scores={scores}
          sortedCandidates={sortedCandidates}
          criteria={criteria}
          rankings={rankings}
          animated={true}
          scrollPaddingBottom={20}
        />
      </View>

      {/* ボトムボタン */}
      <Animated.View entering={FadeInDown.delay(1400).duration(400)} style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.85}
          style={styles.primaryBtn}
        >
          <IconSymbol name="checkmark" size={18} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>保存して戻る</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleRetry}
          activeOpacity={0.7}
          style={styles.secondaryBtn}
        >
          <Text style={styles.secondaryBtnText}>最初からやり直す</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
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
  navSpacer: { minWidth: 80 },
  navTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1C1C1E",
    letterSpacing: -0.3,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  primaryBtn: {
    backgroundColor: "#5B4EFF",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontSize: 14,
    color: "#5B4EFF",
  },
});
