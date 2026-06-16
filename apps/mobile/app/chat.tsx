import { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { HitaLogo } from "@/components/hita-logo";
import { useChat, type Message } from "@/hooks/use-chat";
import { PlaceBottomSheet, type PlaceData } from "@/components/place-bottom-sheet";
import { colors, spacing, radii, shadows } from "@/lib/tokens";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* ── Chat Bubble ── */
function ChatBubble({
  message,
  onPlaceSelect,
}: {
  message: Message;
  onPlaceSelect: (place: PlaceData) => void;
}) {
  const isUser = message.role === "user";
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 12 : -12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 14,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.bubbleRow,
        isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <HitaLogo size={14} color={colors.canvas} />
        </View>
      )}
      <View style={{ flexShrink: 1, maxWidth: "85%" }}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAssistant,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
            ]}
          >
            {message.content || "\u2026"}
          </Text>
        </View>

        {/* Place cards */}
        {message.places && message.places.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16, gap: 8 }}
            style={{ marginTop: 8 }}
          >
            {message.places.map((place, i) => (
              <Pressable
                key={`${place.name}-${i}`}
                onPress={() => onPlaceSelect(place)}
                style={({ pressed }) => [
                  styles.placeCard,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                {place.image ? (
                  <Image
                    source={{ uri: place.image }}
                    style={styles.placeImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.placeImage, styles.placePlaceholder]}>
                    <Feather name="map-pin" size={20} color={colors.textTertiary} />
                  </View>
                )}
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName} numberOfLines={1}>
                    {place.name}
                  </Text>
                  <View style={styles.placeMetaRow}>
                    {place.rating && (
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>{place.rating}</Text>
                      </View>
                    )}
                    <Text style={styles.placeLocation} numberOfLines={1}>
                      {place.distance || place.location}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Animated.View>
  );
}

/* ── Typing Indicator ── */
function TypingIndicator({ text }: { text: string }) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    dots.forEach((dot, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: -5, duration: 250, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 250, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={styles.statusRow}>
      <View style={styles.dotsRow}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
      <Text style={styles.statusText}>{text}</Text>
    </View>
  );
}

/* ── Empty State ── */
function EmptyState({ onSend }: { onSend: (text: string) => void }) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const suggestions = [
    { label: "What\u2019s around me?", icon: "map-pin" as const },
    { label: "Is this area safe?", icon: "shield" as const },
    { label: "Best restaurants nearby", icon: "coffee" as const },
    { label: "Help me plan my day", icon: "compass" as const },
  ];

  return (
    <Animated.View style={[styles.emptyState, { opacity: fade }]}>
      <HitaLogo size={40} color={colors.ink} />
      <Text style={styles.emptyTitle}>How can I help?</Text>
      <Text style={styles.emptySubtitle}>
        Ask about safety, directions, weather, or anything about your journey.
      </Text>
      <View style={styles.suggestionsGrid}>
        {suggestions.map((s) => (
          <Pressable
            key={s.label}
            onPress={() => onSend(s.label)}
            style={({ pressed }) => [
              styles.suggestionCard,
              pressed && { backgroundColor: colors.hover },
            ]}
          >
            <Feather name={s.icon} size={18} color={colors.textSecondary} style={{ marginBottom: 6 }} />
            <Text style={styles.suggestionLabel}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

/* ── Main Chat Screen ── */
export default function ChatScreen() {
  const router = useRouter();
  const { initialMessage, conversationId } = useLocalSearchParams<{
    initialMessage?: string;
    conversationId?: string;
  }>();

  const {
    messages,
    isLoading,
    error,
    statusText,
    creditsRemaining,
    sendMessage,
    clearMessages,
  } = useChat();

  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceData | null>(null);
  const hasSentInitial = useRef(false);

  // Auto-send initial message
  useEffect(() => {
    if (initialMessage && !hasSentInitial.current) {
      hasSentInitial.current = true;
      sendMessage(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  const lastMessage = messages[messages.length - 1];
  const showSuggestions =
    lastMessage?.role === "assistant" &&
    lastMessage.suggestions?.length &&
    !isLoading;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [
            styles.headerBtn,
            pressed && { backgroundColor: colors.hover },
          ]}
        >
          <Feather name="arrow-left" size={20} color={colors.ink} />
        </Pressable>
        <View style={styles.headerCenter}>
          <HitaLogo size={18} color={colors.ink} />
          <Text style={styles.headerTitle}>hita</Text>
        </View>
        <View style={styles.headerRight}>
          {creditsRemaining != null && (
            <Text style={styles.creditsText}>{creditsRemaining}</Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 ? (
          <EmptyState onSend={sendMessage} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatBubble
                message={item}
                onPlaceSelect={setSelectedPlace}
              />
            )}
            contentContainerStyle={styles.listContent}
            style={styles.flex}
          />
        )}

        {/* Typing indicator */}
        {statusText && <TypingIndicator text={statusText} />}

        {/* Error */}
        {error && (
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Suggestion chips */}
        {showSuggestions && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {lastMessage.suggestions!.map((s: string) => (
              <Pressable
                key={s}
                onPress={() => sendMessage(s)}
                style={({ pressed }) => [
                  styles.chip,
                  pressed && { backgroundColor: colors.pressed },
                ]}
              >
                <Text style={styles.chipText}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Message hita..."
            placeholderTextColor={colors.textTertiary}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!isLoading}
            multiline
            maxLength={2000}
          />
          <Pressable
            onPress={handleSend}
            disabled={isLoading || !input.trim()}
            style={({ pressed }) => [
              styles.sendButton,
              (!input.trim() || isLoading) && styles.sendButtonDisabled,
              pressed && { transform: [{ scale: 0.9 }] },
            ]}
          >
            <Feather name="arrow-up" size={18} color={colors.canvas} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Place Bottom Sheet */}
      {selectedPlace && (
        <PlaceBottomSheet
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderHairline,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  headerRight: {
    width: 36,
    alignItems: "flex-end",
  },
  creditsText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: "500",
  },

  /* Empty state */
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
    maxWidth: 280,
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
    maxWidth: 340,
  },
  suggestionCard: {
    width: "48%",
    padding: 16,
    backgroundColor: colors.tint,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  suggestionLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textPrimary,
    lineHeight: 18,
  },

  /* Messages */
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  bubbleRowUser: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
  },
  bubbleRowAssistant: {
    alignSelf: "flex-start",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: 2,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    flexShrink: 1,
  },
  bubbleUser: {
    backgroundColor: colors.ink,
    borderBottomRightRadius: 6,
  },
  bubbleAssistant: {
    backgroundColor: colors.tint,
    borderBottomLeftRadius: 6,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: colors.canvas,
  },
  bubbleTextAssistant: {
    color: colors.textPrimary,
  },

  /* Place cards */
  placeCard: {
    width: 170,
    backgroundColor: colors.canvas,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    overflow: "hidden",
  },
  placeImage: {
    width: "100%",
    height: 90,
  },
  placePlaceholder: {
    backgroundColor: colors.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  placeInfo: {
    padding: 10,
  },
  placeName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 3,
  },
  placeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  ratingBadge: {
    backgroundColor: colors.ink,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.canvas,
  },
  placeLocation: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },

  /* Status */
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.ink,
  },
  statusText: {
    fontSize: 12,
    color: colors.textTertiary,
  },

  /* Error */
  errorRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    backgroundColor: colors.tint,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  errorText: {
    fontSize: 13,
    color: colors.textPrimary,
  },

  /* Chips */
  chips: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    backgroundColor: colors.canvas,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  /* Input bar */
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderHairline,
    backgroundColor: colors.canvas,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.tint,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.3,
  },
});
