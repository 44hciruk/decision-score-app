import { useCallback, useState } from "react";
import {
  Text,
  View,
  Pressable,
  Switch,
  ScrollView,
  Platform,
  Alert,
  StyleSheet,
  Modal,
} from "react-native";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useProjectContext } from "@/lib/project-context";
import { FREE_LIMITS, PREMIUM_LIMITS } from "@/lib/storage";

export default function SettingsScreen() {
  const colors = useColors();
  const { state, updateSettings } = useProjectContext();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const handleTogglePremium = useCallback(
    (value: boolean) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      updateSettings({ ...state.settings, isPremium: value });
    },
    [state.settings, updateSettings]
  );

  const limits = state.settings.isPremium ? PREMIUM_LIMITS : FREE_LIMITS;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          設定
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium section */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.premiumIcon}>⭐</Text>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                プレミアム
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.muted }]}>
                {state.settings.isPremium
                  ? "すべての機能が使えます"
                  : "機能制限があります"}
              </Text>
            </View>
            <Switch
              value={state.settings.isPremium}
              onValueChange={handleTogglePremium}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Current limits */}
          <View style={styles.limitsContainer}>
            <LimitRow
              label="比較候補"
              value={`${limits.candidates === Infinity ? "無制限" : limits.candidates + "個"}`}
              colors={colors}
            />
            <LimitRow
              label="評価項目"
              value={`${limits.criteria === Infinity ? "無制限" : limits.criteria + "個"}`}
              colors={colors}
            />
            <LimitRow
              label="プロジェクト保存"
              value={`${limits.projects === Infinity ? "無制限" : limits.projects + "個"}`}
              colors={colors}
            />
          </View>

          {!state.settings.isPremium && (
            <Pressable
              onPress={() => setShowPremiumModal(true)}
              style={({ pressed }) => [
                styles.upgradeBtn,
                { backgroundColor: colors.primary },
                pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
              ]}
            >
              <Text style={styles.upgradeBtnText}>
                プレミアムにアップグレード
              </Text>
            </Pressable>
          )}
        </View>

        {/* App info */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.foreground, marginBottom: 12 }]}>
            アプリ情報
          </Text>
          <InfoRow label="バージョン" value="1.0.0" colors={colors} />
          <InfoRow label="開発" value="決断スコア" colors={colors} />
        </View>

        {/* Note about premium */}
        <Text style={[styles.noteText, { color: colors.muted }]}>
          ※ プレミアム機能のトグルはデモ用です。実際のアプリストア公開時にはStoreKit / Google Play Billingと連携します。
        </Text>
      </ScrollView>

      {/* Premium Modal */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={() => {
          handleTogglePremium(true);
          setShowPremiumModal(false);
        }}
        colors={colors}
      />
    </ScreenContainer>
  );
}

function LimitRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.limitRow}>
      <Text style={[styles.limitLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.limitValue, { color: colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

function InfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

function PremiumModal({
  visible,
  onClose,
  onUpgrade,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[styles.modalContainer, { backgroundColor: colors.background }]}
      >
        <View style={styles.modalHeader}>
          <View style={styles.navBtn} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            プレミアムプラン
          </Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.navBtn,
              pressed && { opacity: 0.5 },
            ]}
          >
            <IconSymbol name="xmark" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalEmoji}>⭐</Text>
          <Text style={[styles.modalHeading, { color: colors.foreground }]}>
            すべての機能を解放
          </Text>

          {/* Features */}
          {[
            { icon: "✓", text: "比較候補：最大10個" },
            { icon: "✓", text: "評価項目：無制限" },
            { icon: "✓", text: "プロジェクト保存：無制限" },
            { icon: "✓", text: "重み付け機能（今後追加予定）" },
            { icon: "✓", text: "レーダーチャート表示（今後追加予定）" },
          ].map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={[styles.featureCheck, { color: colors.primary }]}>
                {feature.icon}
              </Text>
              <Text
                style={[styles.featureText, { color: colors.foreground }]}
              >
                {feature.text}
              </Text>
            </View>
          ))}

          {/* Pricing */}
          <View style={styles.pricingContainer}>
            <View
              style={[
                styles.pricingCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[styles.pricingLabel, { color: colors.muted }]}
              >
                月額プラン
              </Text>
              <Text
                style={[styles.pricingPrice, { color: colors.foreground }]}
              >
                ¥300
              </Text>
              <Text style={[styles.pricingPeriod, { color: colors.muted }]}>
                /月
              </Text>
            </View>
            <View
              style={[
                styles.pricingCard,
                styles.pricingCardHighlight,
                {
                  backgroundColor: colors.primary + "10",
                  borderColor: colors.primary,
                },
              ]}
            >
              <View
                style={[
                  styles.bestValueBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.bestValueText}>おすすめ</Text>
              </View>
              <Text
                style={[styles.pricingLabel, { color: colors.muted }]}
              >
                買い切り
              </Text>
              <Text
                style={[styles.pricingPrice, { color: colors.foreground }]}
              >
                ¥980
              </Text>
              <Text style={[styles.pricingPeriod, { color: colors.muted }]}>
                永久利用
              </Text>
            </View>
          </View>

          {/* Upgrade button (demo) */}
          <Pressable
            onPress={onUpgrade}
            style={({ pressed }) => [
              styles.modalUpgradeBtn,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <Text style={styles.modalUpgradeBtnText}>
              プレミアムを有効にする（デモ）
            </Text>
          </Pressable>

          <Pressable onPress={onClose}>
            <Text style={[styles.laterText, { color: colors.muted }]}>
              後で
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  premiumIcon: {
    fontSize: 28,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  limitsContainer: {
    gap: 8,
  },
  limitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  limitLabel: {
    fontSize: 14,
  },
  limitValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  upgradeBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  upgradeBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  noteText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  modalEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  modalHeading: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
    paddingVertical: 6,
  },
  featureCheck: {
    fontSize: 18,
    fontWeight: "700",
  },
  featureText: {
    fontSize: 16,
  },
  pricingContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 28,
    marginBottom: 24,
    width: "100%",
  },
  pricingCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  pricingCardHighlight: {
    borderWidth: 2,
    position: "relative",
  },
  bestValueBadge: {
    position: "absolute",
    top: -10,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bestValueText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  pricingLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  pricingPrice: {
    fontSize: 28,
    fontWeight: "800",
  },
  pricingPeriod: {
    fontSize: 13,
    marginTop: 2,
  },
  modalUpgradeBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  modalUpgradeBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  laterText: {
    fontSize: 15,
    paddingVertical: 8,
  },
});
