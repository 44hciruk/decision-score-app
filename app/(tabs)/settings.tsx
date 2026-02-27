import { useCallback, useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Switch,
  ScrollView,
  Platform,
  StyleSheet,
  Modal,
} from "react-native";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { GlassCard } from "@/components/glass-card";
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
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          設定
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
          アプリの設定を管理します
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium section */}
        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.premiumIconWrap}>
              <IconSymbol name="star.fill" size={22} color="#7C3AED" />
            </View>
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
              trackColor={{ false: "#E5E1FF", true: "#7C3AED" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {/* Current limits */}
          <View style={styles.limitsContainer}>
            <LimitRow
              icon="person.2.fill"
              label="比較候補"
              value={`${limits.candidates === Infinity ? "無制限" : limits.candidates + "個"}`}
              colors={colors}
            />
            <LimitRow
              icon="list.bullet"
              label="評価項目"
              value={`${limits.criteria === Infinity ? "無制限" : limits.criteria + "個"}`}
              colors={colors}
            />
            <LimitRow
              icon="bookmark.fill"
              label="プロジェクト保存"
              value={`${limits.projects === Infinity ? "無制限" : limits.projects + "個"}`}
              colors={colors}
            />
          </View>

          {!state.settings.isPremium && (
            <TouchableOpacity
              onPress={() => setShowPremiumModal(true)}
              activeOpacity={0.85}
              style={styles.upgradeBtn}
            >
              <IconSymbol name="sparkles" size={18} color="#FFFFFF" />
              <Text style={styles.upgradeBtnText}>
                プレミアムにアップグレード
              </Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* App info */}
        <GlassCard style={styles.card}>
          <View style={styles.infoCardHeader}>
            <View style={styles.infoIconWrap}>
              <IconSymbol name="info.circle" size={22} color="#7C3AED" />
            </View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              アプリ情報
            </Text>
          </View>
          <View style={styles.divider} />
          <InfoRow label="バージョン" value="1.0.0" colors={colors} />
          <InfoRow label="開発" value="決断スコア" colors={colors} />
        </GlassCard>

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
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.limitRow}>
      <View style={styles.limitLabelRow}>
        <IconSymbol name={icon as any} size={16} color="#7C3AED" />
        <Text style={[styles.limitLabel, { color: colors.muted }]}>{label}</Text>
      </View>
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
          <TouchableOpacity
            onPress={onClose}
            style={styles.navBtn}
            activeOpacity={0.7}
          >
            <IconSymbol name="xmark" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.modalIconWrap}>
            <IconSymbol name="star.fill" size={40} color="#7C3AED" />
          </View>
          <Text style={[styles.modalHeading, { color: colors.foreground }]}>
            すべての機能を解放
          </Text>

          {/* Features */}
          {[
            { icon: "checkmark.circle.fill", text: "比較候補：最大10個" },
            { icon: "checkmark.circle.fill", text: "評価項目：無制限" },
            { icon: "checkmark.circle.fill", text: "プロジェクト保存：無制限" },
            { icon: "checkmark.circle.fill", text: "重み付け機能（今後追加予定）" },
            { icon: "checkmark.circle.fill", text: "レーダーチャート表示（今後追加予定）" },
          ].map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <IconSymbol name={feature.icon as any} size={20} color="#7C3AED" />
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
                  borderColor: "#E5E1FF",
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
                  backgroundColor: "#EDE9FF",
                  borderColor: "#7C3AED",
                },
              ]}
            >
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>おすすめ</Text>
              </View>
              <Text
                style={[styles.pricingLabel, { color: colors.muted }]}
              >
                買い切り
              </Text>
              <Text
                style={[styles.pricingPrice, { color: "#7C3AED" }]}
              >
                ¥980
              </Text>
              <Text style={[styles.pricingPeriod, { color: colors.muted }]}>
                永久利用
              </Text>
            </View>
          </View>

          {/* Upgrade button (demo) */}
          <TouchableOpacity
            onPress={onUpgrade}
            activeOpacity={0.85}
            style={styles.modalUpgradeBtn}
          >
            <IconSymbol name="sparkles" size={18} color="#FFFFFF" />
            <Text style={styles.modalUpgradeBtnText}>
              プレミアムを有効にする（デモ）
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={[styles.laterText, { color: colors.muted }]}>
              後で
            </Text>
          </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -1,
    color: "#1C1C1E",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  premiumIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EDE9FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
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
    backgroundColor: "rgba(109, 40, 217, 0.08)",
  },
  limitsContainer: {
    gap: 12,
  },
  limitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  limitLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  limitLabel: {
    fontSize: 14,
  },
  limitValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6D28D9",
  },
  upgradeBtn: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#6D28D9",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    minHeight: 56,
  },
  upgradeBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 0,
  },
  infoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EDE9FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
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
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  modalIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#EDE9FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#DDD6FE",
  },
  modalHeading: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 16,
    fontWeight: "500",
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
    borderRadius: 12,
    borderWidth: 1.5,
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
    backgroundColor: "#7C3AED",
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
    fontWeight: "700",
  },
  pricingPeriod: {
    fontSize: 13,
    marginTop: 2,
  },
  modalUpgradeBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#7C3AED",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    minHeight: 56,
  },
  modalUpgradeBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  laterText: {
    fontSize: 15,
    paddingVertical: 8,
    fontWeight: "600",
  },
});
