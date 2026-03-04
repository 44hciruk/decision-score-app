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
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useProjectContext } from "@/lib/project-context";
import { FREE_LIMITS, PREMIUM_LIMITS } from "@/lib/storage";
import { COLORS, FONTS, RADIUS } from "@/constants/theme";

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
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.premiumIconWrap}>
              <IconSymbol name="star.fill" size={22} color={COLORS.primary} />
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
              trackColor={{ false: COLORS.primaryLight, true: COLORS.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.limitsContainer}>
            <LimitRow icon="person.2.fill" label="比較候補" value={`${limits.candidates === Infinity ? "無制限" : limits.candidates + "個"}`} />
            <LimitRow icon="list.bullet" label="評価項目" value={`${limits.criteria === Infinity ? "無制限" : limits.criteria + "個"}`} />
            <LimitRow icon="bookmark.fill" label="プロジェクト保存" value={`${limits.projects === Infinity ? "無制限" : limits.projects + "個"}`} />
          </View>

          {!state.settings.isPremium && (
            <TouchableOpacity
              onPress={() => setShowPremiumModal(true)}
              activeOpacity={0.85}
              style={styles.upgradeBtn}
            >
              <IconSymbol name="sparkles" size={18} color="#FFFFFF" />
              <Text style={styles.upgradeBtnText}>プレミアムにアップグレード</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* App info */}
        <View style={styles.card}>
          <View style={styles.infoCardHeader}>
            <View style={styles.infoIconWrap}>
              <IconSymbol name="info.circle" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>アプリ情報</Text>
          </View>
          <View style={styles.divider} />
          <InfoRow label="バージョン" value="1.0.0" />
          <InfoRow label="開発" value="決断スコア" />
        </View>

        <Text style={styles.noteText}>
          ※ プレミアム機能のトグルはデモ用です。実際のアプリストア公開時にはStoreKit / Google Play Billingと連携します。
        </Text>
      </ScrollView>

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

function LimitRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.limitRow}>
      <View style={styles.limitLabelRow}>
        <IconSymbol name={icon as any} size={16} color={COLORS.primary} />
        <Text style={styles.limitLabel}>{label}</Text>
      </View>
      <Text style={styles.limitValue}>{value}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function PremiumModal({ visible, onClose, onUpgrade }: { visible: boolean; onClose: () => void; onUpgrade: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.navBtn} />
          <Text style={styles.modalTitle}>プレミアムプラン</Text>
          <TouchableOpacity onPress={onClose} style={styles.navBtn} activeOpacity={0.7}>
            <IconSymbol name="xmark" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.modalIconWrap}>
            <IconSymbol name="star.fill" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.modalHeading}>すべての機能を解放</Text>

          {[
            { icon: "checkmark.circle.fill", text: "比較候補：最大10個" },
            { icon: "checkmark.circle.fill", text: "評価項目：無制限" },
            { icon: "checkmark.circle.fill", text: "プロジェクト保存：無制限" },
            { icon: "checkmark.circle.fill", text: "重み付け機能（今後追加予定）" },
            { icon: "checkmark.circle.fill", text: "レーダーチャート表示（今後追加予定）" },
          ].map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <IconSymbol name={feature.icon as any} size={20} color={COLORS.primary} />
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}

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
              <Text style={[styles.pricingPrice, { color: COLORS.primary }]}>¥980</Text>
              <Text style={styles.pricingPeriod}>永久利用</Text>
            </View>
          </View>

          <TouchableOpacity onPress={onUpgrade} activeOpacity={0.85} style={styles.modalUpgradeBtn}>
            <IconSymbol name="sparkles" size={18} color="#FFFFFF" />
            <Text style={styles.modalUpgradeBtnText}>プレミアムを有効にする（デモ）</Text>
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
    fontFamily: FONTS.bold,
    letterSpacing: -1,
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginTop: 4,
    color: COLORS.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  premiumIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    marginVertical: 14,
    backgroundColor: COLORS.border,
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
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  limitValue: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  upgradeBtn: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: RADIUS.full,
    alignItems: "center",
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    minHeight: 56,
  },
  upgradeBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: FONTS.bold,
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
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  noteText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 10,
    color: COLORS.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  modalIconWrap: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeading: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    marginBottom: 24,
    textAlign: "center",
    color: COLORS.textPrimary,
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
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
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
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  pricingCardHighlight: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    position: "relative",
    backgroundColor: COLORS.primaryLight,
  },
  bestValueBadge: {
    position: "absolute",
    top: -10,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  bestValueText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
  pricingLabel: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginBottom: 4,
    color: COLORS.textSecondary,
  },
  pricingPrice: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  pricingPeriod: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
    color: COLORS.textSecondary,
  },
  modalUpgradeBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: RADIUS.full,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    minHeight: 56,
  },
  modalUpgradeBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  laterText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
    paddingVertical: 8,
    color: COLORS.textSecondary,
  },
});
