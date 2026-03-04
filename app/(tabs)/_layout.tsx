import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, StyleSheet, Platform } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { COLORS, FONTS } from "@/constants/theme";

type TabIconProps = {
  focused: boolean;
  color: string;
  iconName: "house.fill" | "clock.fill" | "gearshape.fill";
  label: string;
};

function TabIcon({ focused, iconName, label }: TabIconProps) {
  return (
    <View style={tabStyles.iconWrap}>
      <IconSymbol
        name={iconName}
        size={24}
        color={focused ? COLORS.primary : COLORS.textSecondary}
      />
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>
        {label}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    gap: 3,
    paddingTop: 4,
  },
  label: {
    fontSize: 10,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  labelActive: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
});

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          paddingBottom: Platform.OS === "ios" ? 24 : 12,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 80 : 64,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "ホーム",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} iconName="house.fill" label="ホーム" />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "履歴",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} iconName="clock.fill" label="履歴" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "設定",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} iconName="gearshape.fill" label="設定" />
          ),
        }}
      />
    </Tabs>
  );
}
