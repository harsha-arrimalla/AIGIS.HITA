import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/lib/tokens";
import { StyleSheet } from "react-native";
import { BlurView } from "expo-blur";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: "600", fontSize: 17 },
        headerShadowVisible: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopColor: "transparent",
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 90,
          paddingTop: 8,
          paddingBottom: 12,
          zIndex: 10,
          elevation: 10,
        },
        tabBarBackground: () => (
          <BlurView
            tint="light"
            intensity={52}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarActiveTintColor: colors.coral,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chats",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="compass" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
