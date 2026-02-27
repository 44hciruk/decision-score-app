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
      <View style={[tabStyles.pill, focused && tabStyles.pillActive]}>
        <IconSymbol
          name={iconName}
          size={22}
          color={focused ? "#6D28D9" : "#9CA3AF"}
        />
      </View>
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
  },
  pill: {
    width: 52,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  pillActive: {
    backgroundColor: "#EDE9FE",
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  labelActive: {
    color: "#6D28D9",
    fontWeight: "700",
  },
});

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 64 + bottomPadding;

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
          borderTopColor: "rgba(109, 40, 217, 0.08)",
          borderTopWidth: 1,
          shadowColor: "#1E1B4B",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 8,
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
