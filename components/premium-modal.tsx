import { Text, View, Pressable, StyleSheet, Modal } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "./ui/icon-symbol";

export function PremiumModal({
  visible,
  onClose,
  title,
  message,
  onUpgrade,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onUpgrade: () => void;
}) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          {/* Close button */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              pressed && { opacity: 0.6 },
            ]}
          >
            <IconSymbol name="xmark" size={24} color={colors.foreground} />
          </Pressable>

          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <IconSymbol name="star.fill" size={48} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground }]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.muted }]}>
            {message}
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <FeatureItem
              icon="checkmark.circle.fill"
              text="比較候補：最大10個"
              colors={colors}
            />
            <FeatureItem
              icon="checkmark.circle.fill"
              text="評価項目：無制限"
              colors={colors}
            />
            <FeatureItem
              icon="checkmark.circle.fill"
              text="プロジェクト保存：無制限"
              colors={colors}
            />
            <FeatureItem
              icon="checkmark.circle.fill"
              text="重み付け機能"
              colors={colors}
            />
          </View>

          {/* Pricing */}
          <View style={styles.pricingContainer}>
            <View style={styles.priceOption}>
              <Text style={[styles.priceLabel, { color: colors.muted }]}>
                月額
              </Text>
              <Text style={[styles.price, { color: colors.primary }]}>
                ¥300
              </Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceOption}>
              <Text style={[styles.priceLabel, { color: colors.muted }]}>
                買い切り
              </Text>
              <Text style={[styles.price, { color: colors.primary }]}>
                ¥980
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <Pressable
            onPress={onUpgrade}
            style={({ pressed }) => [
              styles.upgradeBtn,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <Text style={styles.upgradeBtnText}>プレミアムにアップグレード</Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={[styles.cancelBtnText, { color: colors.muted }]}>
              後で決める
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function FeatureItem({
  icon,
  text,
  colors,
}: {
  icon: string;
  text: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.featureItem}>
      <IconSymbol name={icon as any} size={20} color={colors.primary} />
      <Text style={[styles.featureText, { color: colors.foreground }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    borderRadius: 20,
    padding: 24,
    maxWidth: 400,
    width: "100%",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    fontWeight: "500",
  },
  pricingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 16,
  },
  priceOption: {
    flex: 1,
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: "800",
  },
  priceDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginHorizontal: 16,
  },
  upgradeBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  upgradeBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
