import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { colors } from "@/lib/tokens";
import { useRouter } from "expo-router";

const SETTINGS = [
  { label: "Location", value: "Auto", icon: "map-pin" as const },
  { label: "Notifications", value: "On", icon: "bell" as const },
  { label: "Currency", value: "INR", icon: "dollar-sign" as const },
  { label: "Language", value: "English", icon: "globe" as const },
];

const ABOUT = [
  { label: "Help & Support", icon: "help-circle" as const },
  { label: "Privacy Policy", icon: "lock" as const },
  { label: "Terms of Service", icon: "file-text" as const },
  { label: "Rate the app", icon: "star" as const },
];

const SAFETY_NUMBERS = [
  { label: "Emergency", number: "112", icon: "phone-call" as const },
  { label: "Police", number: "100", icon: "shield" as const },
  { label: "Ambulance", number: "108", icon: "activity" as const },
  { label: "Women helpline", number: "1091", icon: "phone" as const },
];

const SAFETY_QUERIES = [
  "Is this area safe right now?",
  "Safe routes to walk at night",
  "Nearest police station",
];

export default function ProfileTab() {
  const router = useRouter();

  const handleCall = (label: string, number: string) => {
    Alert.alert(`Call ${label}`, `Dial ${number}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Call", style: "destructive", onPress: () => Linking.openURL(`tel:${number}`) },
    ]);
  };

  const handleSafetyQuery = (text: string) => {
    router.push({ pathname: "/chat", params: { initialMessage: text } });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Feather name="user" size={24} color={colors.textSecondary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Traveler</Text>
            <Text style={styles.profilePlan}>Free plan · 1,000 credits</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textTertiary} />
        </View>

        {/* Settings */}
        <Text style={styles.sectionLabel}>Settings</Text>
        {SETTINGS.map((item) => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [
              styles.row,
              pressed && { backgroundColor: colors.hover },
            ]}
          >
            <View style={styles.rowIcon}>
              <Feather name={item.icon} size={16} color={colors.textSecondary} />
            </View>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowValue}>{item.value}</Text>
            <Feather name="chevron-right" size={16} color={colors.textTertiary} />
          </Pressable>
        ))}

        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Safety</Text>
        <Pressable
          style={({ pressed }) => [
            styles.sosRow,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => handleCall("Emergency", "112")}
        >
          <View style={styles.sosIconWrap}>
            <Feather name="shield" size={17} color={colors.canvas} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sosTitle}>Emergency SOS</Text>
            <Text style={styles.sosSubtitle}>Tap to call 112 immediately</Text>
          </View>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.75)" />
        </Pressable>

        {SAFETY_NUMBERS.map((item) => (
          <Pressable
            key={item.number}
            style={({ pressed }) => [
              styles.row,
              pressed && { backgroundColor: colors.hover },
            ]}
            onPress={() => handleCall(item.label, item.number)}
          >
            <View style={styles.rowIcon}>
              <Feather name={item.icon} size={16} color={colors.textSecondary} />
            </View>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowValue}>{item.number}</Text>
            <Feather name="phone" size={16} color={colors.textTertiary} />
          </Pressable>
        ))}

        {SAFETY_QUERIES.map((query) => (
          <Pressable
            key={query}
            style={({ pressed }) => [
              styles.row,
              pressed && { backgroundColor: colors.hover },
            ]}
            onPress={() => handleSafetyQuery(query)}
          >
            <View style={styles.rowIcon}>
              <Feather name="message-circle" size={16} color={colors.textSecondary} />
            </View>
            <Text style={styles.rowLabel}>{query}</Text>
            <Feather name="chevron-right" size={16} color={colors.textTertiary} />
          </Pressable>
        ))}

        {/* About */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>About</Text>
        {ABOUT.map((item) => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [
              styles.row,
              pressed && { backgroundColor: colors.hover },
            ]}
          >
            <View style={styles.rowIcon}>
              <Feather name={item.icon} size={16} color={colors.textSecondary} />
            </View>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Feather name="chevron-right" size={16} color={colors.textTertiary} />
          </Pressable>
        ))}

        {/* Sign out */}
        <Pressable
          style={({ pressed }) => [
            styles.signOut,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Feather name="log-out" size={16} color={colors.danger} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        {/* Version */}
        <Text style={styles.version}>hita v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scroll: {
    paddingBottom: 40,
  },

  /* Header */
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.5,
  },

  /* Profile card */
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 28,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.tint,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  profilePlan: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },

  /* Sections */
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textTertiary,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  /* Rows */
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 20,
    height: 20,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  rowValue: {
    fontSize: 14,
    color: colors.textTertiary,
    marginRight: 8,
  },

  sosRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.danger,
  },
  sosIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 0,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  sosTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.canvas,
  },
  sosSubtitle: {
    marginTop: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
  },

  /* Sign out */
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.danger,
  },

  /* Version */
  version: {
    textAlign: "center",
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 16,
  },
});
