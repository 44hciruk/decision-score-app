import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useProjectContext } from "@/lib/project-context";
import type { Project } from "@/lib/storage";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { state, removeProject } = useProjectContext();

  const completed = state.projects.filter((p) => !!p.winner);

  const handleOpen = useCallback((project: Project) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: "/history-detail",
      params: { projectId: project.id },
    });
  }, []);

  const handleDelete = useCallback((project: Project) => {
    Alert.alert(
      "削除の確認",
      `「${project.title}」を削除しますか？`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            await removeProject(project.id);
          },
        },
      ]
    );
  }, [removeProject]);

  const handleDeleteAll = useCallback(() => {
    if (completed.length === 0) return;
    Alert.alert(
      "すべて削除",
      `完了した決断 ${completed.length}件をすべて削除しますか？\nこの操作は取り消せません。`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "すべて削除",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            for (const p of completed) {
              await removeProject(p.id);
            }
          },
        },
      ]
    );
  }, [completed, removeProject]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <View style={styles.root}>
      {/* ヘッダー */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>履歴</Text>
            <Text style={styles.headerSubtitle}>完了した決断の記録</Text>
          </View>
          {completed.length > 0 && (
            <TouchableOpacity
              style={styles.deleteAllBtn}
              onPress={handleDeleteAll}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteAllText}>すべて削除</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 空状態 */}
        {completed.length === 0 && (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <IconSymbol name="clock.fill" size={32} color="#C7C7CC" />
            </View>
            <Text style={styles.emptyTitle}>まだ完了した決断はありません</Text>
            <Text style={styles.emptySubtitle}>
              決断を完了すると、ここに記録されます
            </Text>
          </View>
        )}

        {/* 完了済みリスト */}
        {completed.length > 0 && (
          <View style={styles.listCard}>
            <Text style={styles.sectionLabel}>
              {completed.length}件の記録
            </Text>
            {completed.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.row,
                  index < completed.length - 1 && styles.rowBorder,
                ]}
              >
                {/* タップで詳細へ */}
                <TouchableOpacity
                  style={styles.rowMain}
                  onPress={() => handleOpen(item)}
                  activeOpacity={0.75}
                >
                  <View style={styles.rowIcon}>
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={16}
                      color="#34C759"
                    />
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {formatDate(item.createdAt)}　勝者：{item.winner}
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={14} color="#C7C7CC" />
                </TouchableOpacity>

                {/* 削除ボタン */}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="trash.fill" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#F2F2F7",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1C1E",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  deleteAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.08)",
  },
  deleteAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EF4444",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 20,
  },
  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "rgba(52,199,89,0.1)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1C1C1E",
    letterSpacing: -0.2,
  },
  rowMeta: {
    fontSize: 12,
    color: "#8E8E93",
  },
  deleteBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
});
