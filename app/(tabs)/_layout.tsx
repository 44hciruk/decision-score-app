import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, StyleSheet, Platform } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

type TabIconProps = {
  focused: boolean;
  color: string;
  iconName: "house.fill" | "gearshape.fill";
  label: string;
};

function TabIcon({ focused, iconName, label }: TabIconProps) {
  return (
    <View style={tabStyles.iconWrap}>
      <IconSymbol
        name={iconName}
        size={24}
        color={focused ? "#5B4EFF" : "#8E8E93"}
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
    fontWeight: "500",
    color: "#8E8E93",
  },
  labelActive: {
    color: "#5B4EFF",
    fontWeight: "600",
  },
});

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: {
          paddingTop: 6,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E5EA",
          borderTopWidth: StyleSheet.hairlineWidth,
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
