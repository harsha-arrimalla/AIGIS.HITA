import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  SectionList,
  StyleSheet,
  Animated,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { HitaLogo } from "@/components/hita-logo";
import { colors, spacing, radii } from "@/lib/tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ── Types ── */
interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: Date;
  messageCount: number;
}

/* ── Helpers ── */
function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function groupConversations(conversations: Conversation[]) {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfLast7 = new Date(startOfToday.getTime() - 7 * 86400000);
  const startOfLast30 = new Date(startOfToday.getTime() - 30 * 86400000);

  const buckets: { label: string; data: Conversation[] }[] = [
    { label: "Today", data: [] },
    { label: "Yesterday", data: [] },
    { label: "Previous 7 days", data: [] },
    { label: "Previous 30 days", data: [] },
    { label: "Older", data: [] },
  ];

  const sorted = [...conversations].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );

  for (const c of sorted) {
    const t = c.updatedAt.getTime();
    if (t >= startOfToday.getTime()) buckets[0].data.push(c);
    else if (t >= startOfYesterday.getTime()) buckets[1].data.push(c);
    else if (t >= startOfLast7.getTime()) buckets[2].data.push(c);
    else if (t >= startOfLast30.getTime()) buckets[3].data.push(c);
    else buckets[4].data.push(c);
  }

  return buckets.filter((b) => b.data.length > 0);
}

/* ── Conversation Row ── */
function ConversationRow({
  item,
  onPress,
}: {
  item: Conversation;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: colors.hover },
      ]}
    >
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.rowTime}>{timeAgo(item.updatedAt)}</Text>
        </View>
        <Text style={styles.rowPreview} numberOfLines={2}>
          {item.lastMessage}
        </Text>
      </View>
    </Pressable>
  );
}

/* ── Empty State ── */
function EmptyState() {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.empty, { opacity: fade }]}>
      <View style={styles.emptyIcon}>
        <Feather name="message-circle" size={28} color={colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Tap + to start your first chat
      </Text>
    </Animated.View>
  );
}

/* ── Main Screen ── */
export default function ChatsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  const sections = groupConversations(filtered);

  const handleNewChat = useCallback(() => {
    router.push("/chat");
  }, [router]);

  const handleSelect = useCallback(
    (id: string) => {
      router.push({ pathname: "/chat", params: { conversationId: id } });
    },
    [router]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <HitaLogo size={22} color={colors.coral} />
          <Text style={styles.headerTitle}>hita</Text>
        </View>
        <Pressable
          onPress={() => setSearchVisible((v) => !v)}
          hitSlop={8}
          style={({ pressed }) => [
            styles.headerBtn,
            pressed && { backgroundColor: colors.hover },
          ]}
        >
          <Feather
            name={searchVisible ? "x" : "search"}
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>

      {/* Search */}
      {searchVisible && (
        <View style={styles.searchWrap}>
          <Feather
            name="search"
            size={15}
            color={colors.textTertiary}
            style={{ marginLeft: 12 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
      )}

      {/* Conversation list */}
      {sections.length === 0 ? (
        <EmptyState />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{section.label}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              onPress={() => handleSelect(item.id)}
            />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + 96 }]}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* Floating New Chat Button */}
      <Pressable
        onPress={handleNewChat}
        style={({ pressed }) => [
          styles.fab,
          { bottom: tabBarHeight + Math.max(insets.bottom, 8) + 12 },
          pressed && { transform: [{ scale: 0.92 }], opacity: 0.9 },
        ]}
      >
        <Feather name="plus" size={24} color={colors.canvas} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Search */
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: colors.tint,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  /* List */
  listContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 6,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textTertiary,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  /* Row */
  row: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowContent: {
    gap: 4,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
    marginRight: 12,
    letterSpacing: -0.2,
  },
  rowTime: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: "400",
  },
  rowPreview: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  /* Empty */
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  /* FAB */
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
