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
import { useProjectContext } from "@/lib/project-context";
import { FREE_LIMITS, PREMIUM_LIMITS } from "@/lib/storage";

export default function SettingsScreen() {
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
        <Text style={styles.headerTitle}>設定</Text>
        <Text style={styles.headerSubtitle}>アプリの設定を管理します</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium section */}
        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.premiumIconWrap}>
              <IconSymbol name="star.fill" size={22} color="#5B4EFF" />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>プレミアム</Text>
              <Text style={styles.cardSubtitle}>
                {state.settings.isPremium
                  ? "すべての機能が使えます"
                  : "機能制限があります"}
              </Text>
            </View>
            <Switch
              value={state.settings.isPremium}
              onValueChange={handleTogglePremium}
              trackColor={{ false: "#E5E5EA", true: "#5B4EFF" }}
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
            />
            <LimitRow
              icon="list.bullet"
              label="評価項目"
              value={`${limits.criteria === Infinity ? "無制限" : limits.criteria + "個"}`}
            />
            <LimitRow
              icon="bookmark.fill"
              label="プロジェクト保存"
              value={`${limits.projects === Infinity ? "無制限" : limits.projects + "個"}`}
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
              <IconSymbol name="info.circle" size={22} color="#5B4EFF" />
            </View>
            <Text style={styles.cardTitle}>アプリ情報</Text>
          </View>
          <View style={styles.divider} />
          <InfoRow label="バージョン" value="1.0.0" />
          <InfoRow label="開発" value="決断スコア" />
        </GlassCard>

        {/* Note about premium */}
        <Text style={styles.noteText}>
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
      />
    </ScreenContainer>
  );
}

function LimitRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.limitRow}>
      <View style={styles.limitLabelRow}>
        <IconSymbol name={icon as any} size={16} color="#5B4EFF" />
        <Text style={styles.limitLabel}>{label}</Text>
      </View>
      <Text style={styles.limitValue}>{value}</Text>
    </View>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function PremiumModal({
  visible,
  onClose,
  onUpgrade,
}: {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.modalNavBtn} />
          <Text style={styles.modalTitle}>プレミアムプラン</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.modalNavBtn}
            activeOpacity={0.7}
          >
            <IconSymbol name="xmark" size={22} color="#1C1C1E" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.modalIconWrap}>
            <IconSymbol name="star.fill" size={40} color="#5B4EFF" />
          </View>
          <Text style={styles.modalHeading}>すべての機能を解放</Text>

          {/* Features */}
          {[
            { icon: "checkmark.circle.fill", text: "比較候補：最大10個" },
            { icon: "checkmark.circle.fill", text: "評価項目：無制限" },
            { icon: "checkmark.circle.fill", text: "プロジェクト保存：無制限" },
            { icon: "checkmark.circle.fill", text: "重み付け機能（今後追加予定）" },
            { icon: "checkmark.circle.fill", text: "レーダーチャート表示（今後追加予定）" },
          ].map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <IconSymbol name={feature.icon as any} size={20} color="#5B4EFF" />
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}

          {/* Pricing */}
          <View style={styles.pricingContainer}>
            <View style={styles.pricingCard}>
              <Text style={styles.pricingLabel}>月額プラン</Text>
              <Text style={styles.pricingPrice}>¥300</Text>
              <Text style={styles.pricingPeriod}>/月</Text>
            </View>
            <View style={[styles.pricingCard, styles.pricingCardHighlight]}>
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>おすすめ</Text>
              </View>
              <Text style={styles.pricingLabel}>買い切り</Text>
              <Text style={[styles.pricingPrice, { color: "#5B4EFF" }]}>¥980</Text>
              <Text style={styles.pricingPeriod}>永久利用</Text>
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
            <Text style={styles.laterText}>後で</Text>
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
    color: "#8E8E93",
  },
  scrollContent: {
    paddingHorizontal: 16,
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
    backgroundColor: "#EDEDFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5EA",
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
    color: "#8E8E93",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
    backgroundColor: "#E5E5EA",
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
    color: "#8E8E93",
  },
  limitValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5B4EFF",
  },
  upgradeBtn: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    backgroundColor: "#5B4EFF",
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
  },
  infoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EDEDFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5EA",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: "#8E8E93",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  noteText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 10,
    color: "#8E8E93",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
    backgroundColor: "#FFFFFF",
  },
  modalNavBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: "center",
    paddingTop: 24,
  },
  modalIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#EDEDFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5EA",
  },
  modalHeading: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
    color: "#1C1C1E",
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
    color: "#1C1C1E",
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E5EA",
    padding: 16,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  pricingCardHighlight: {
    borderWidth: 2,
    borderColor: "#5B4EFF",
    backgroundColor: "#EDEDFF",
    position: "relative",
  },
  bestValueBadge: {
    position: "absolute",
    top: -10,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "#5B4EFF",
  },
  bestValueText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  pricingLabel: {
    fontSize: 13,
    marginBottom: 4,
    color: "#8E8E93",
  },
  pricingPrice: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  pricingPeriod: {
    fontSize: 13,
    marginTop: 2,
    color: "#8E8E93",
  },
  modalUpgradeBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#5B4EFF",
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
    color: "#8E8E93",
  },
});
