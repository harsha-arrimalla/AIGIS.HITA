"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Shield, CloudSun, Compass } from "lucide-react";
import { PlansModal } from "@/components/chat/plans-modal";
import { useChat } from "@/hooks/use-chat";
import { useAPI } from "@/lib/api-provider";
import { useAuth } from "@/lib/auth-provider";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { PlaceDetailPanel } from "@/components/chat/place-detail-panel";
import { ActivityPanel, MapPanel } from "@/components/chat/results-panel";
import { Sidebar, type Conversation } from "@/components/sidebar/sidebar";
import EmergencyOverlay from "@/components/sidebar/emergency-overlay";
import { HitaLogo } from "@/components/hita-logo";
import type { PlaceData } from "@/components/chat/place-card";

const SUGGESTIONS = [
  { icon: MapPin, text: "What\u2019s around me right now?" },
  { icon: Shield, text: "Is this area safe to walk at night?" },
  { icon: CloudSun, text: "What\u2019s the weather like today?" },
  { icon: Compass, text: "Help me plan my day" },
];

function EmptyState({ onSend }: { onSend: (text: string) => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ minHeight: "65vh", padding: "0 20px" }}
    >
      <div
        className="flex items-center justify-center animate-breathe"
        style={{
          marginBottom: 24,
        }}
      >
        <HitaLogo size={48} color="var(--color-ink)" />
      </div>

      <h1
        className="animate-fade-up"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          fontWeight: 400,
          lineHeight: 1.2,
          color: "var(--color-ink)",
          marginBottom: 8,
          textAlign: "center",
          animationDelay: "100ms",
        }}
      >
        How can I help?
      </h1>
      <p
        className="animate-fade-up"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 14,
          fontWeight: 400,
          lineHeight: 1.6,
          color: "var(--color-text-secondary)",
          marginBottom: 32,
          textAlign: "center",
          maxWidth: 320,
          animationDelay: "200ms",
        }}
      >
        Ask about safety, directions, weather, or anything about your journey.
      </p>

      <div
        className="grid gap-2.5 w-full"
        style={{ maxWidth: 400, gridTemplateColumns: "1fr 1fr" }}
      >
        {SUGGESTIONS.map((s, i) => (
          <button
            key={s.text}
            onClick={() => onSend(s.text)}
            className="flex items-start gap-2.5 text-left animate-fade-up transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
               border: "1px solid var(--color-border-hairline)",
               backgroundColor: "var(--color-paper)",
               boxShadow: "var(--shadow-sm)",
               animationDelay: `${250 + i * 75}ms`,
            }}
            onMouseEnter={(e) => {
               e.currentTarget.style.boxShadow = "var(--shadow-card)";
               e.currentTarget.style.borderColor = "var(--color-border-medium)";
            }}
            onMouseLeave={(e) => {
               e.currentTarget.style.boxShadow = "var(--shadow-sm)";
               e.currentTarget.style.borderColor = "var(--color-border-hairline)";
            }}
          >
            <s.icon
              className="shrink-0"
              strokeWidth={1.5}
               style={{ width: 16, height: 16, color: "var(--color-coral)", marginTop: 1 }}
            />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 400,
                lineHeight: 1.45,
                color: "var(--color-body)",
              }}
            >
              {s.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusIndicator({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 animate-fade-up-sm" style={{ marginBottom: 16, paddingTop: 5 }}>
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="typing-dot rounded-full"
            style={{
              width: 5,
              height: 5,
              backgroundColor: "var(--color-ink)",
            }}
          />
        ))}
      </div>
      <span
        style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontStyle: "italic",
            color: "var(--color-tertiary)",
          }}
        >
          {text}
        </span>
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { messages, isLoading, error, creditsRemaining, statusText, sessionId, sendMessage, retryLastMessage, clearMessages, loadConversation } = useChat(userLocation);
  const api = useAPI();
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id || "00000000-0000-0000-0000-000000000000";
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [plansMode, setPlansMode] = useState<"welcome" | "out" | null>(null);

  // ── Gate 1: chat requires login ──
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/sign-in?next=/chat");
    }
  }, [authLoading, user, router]);

  // ── Gate 2: first-time users see the plans before their first answer ──
  const welcomeKey = user ? `hita-plans-welcomed-${user.id}` : null;
  const guardedSend = useCallback(
    (text: string) => {
      if (welcomeKey && !localStorage.getItem(welcomeKey)) {
        setPendingMessage(text);
        setPlansMode("welcome");
        return;
      }
      if (creditsRemaining !== null && creditsRemaining <= 0) {
        setPendingMessage(text);
        setPlansMode("out");
        return;
      }
      sendMessage(text);
    },
    [welcomeKey, creditsRemaining, sendMessage],
  );

  const handleStartFree = useCallback(() => {
    if (welcomeKey) localStorage.setItem(welcomeKey, "1");
    setPlansMode(null);
    if (pendingMessage) {
      sendMessage(pendingMessage);
      setPendingMessage(null);
    }
  }, [welcomeKey, pendingMessage, sendMessage]);

  // ── Gate 3: out of credits mid-conversation ──
  useEffect(() => {
    if (creditsRemaining !== null && creditsRemaining <= 0 && messages.length > 0) {
      setPlansMode((m) => m ?? "out");
    }
  }, [creditsRemaining, messages.length]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [initialSent, setInitialSent] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Fetch conversation history for sidebar
  const refreshConversations = useCallback(() => {
    api
      .listConversations(userId)
      .then((data) => {
        setConversations(
          data.conversations.map((c) => ({
            id: c.id,
            title: c.title,
            lastMessage: c.lastMessage,
            updatedAt: new Date(c.updatedAt),
            messageCount: c.messageCount,
          }))
        );
      })
      .catch(() => {});
  }, [api, userId]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // Refresh conversation list when messages change (new message sent)
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      refreshConversations();
    }
  }, [messages.length, isLoading, refreshConversations]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, // silently ignore if denied
      { enableHighAccuracy: false, maximumAge: 300_000 }
    );
  }, []);

  useEffect(() => {
    if (initialSent || !user) return; // wait for auth before consuming the pending message
    const initial = sessionStorage.getItem("hita-initial-message");
    if (initial) {
      sessionStorage.removeItem("hita-initial-message");
      setInitialSent(true);
      guardedSend(initial);
    }
  }, [initialSent, user, guardedSend]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, statusText]);

  const [mapSrc, setMapSrc] = useState<string | null>(null);

  // When a place is selected, update map to show it
  const handlePlaceSelect = useCallback((place: PlaceData) => {
    setSelectedPlace(place);
    if (place.lat && place.lng) {
      setMapSrc(`https://maps.google.com/maps?q=${encodeURIComponent(place.name)}&ll=${place.lat},${place.lng}&z=16&output=embed`);
    }
  }, []);

  // Wait for auth before rendering anything (redirect handled above)
  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: "var(--color-canvas)" }}>
        <HitaLogo size={40} color="var(--color-coral)" />
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--color-canvas)" }}>
      {plansMode && (
        <PlansModal
          mode={plansMode}
          onStartFree={handleStartFree}
          onClose={plansMode === "out" ? () => setPlansMode(null) : undefined}
        />
      )}
      {/* ── Col 1: Chat ── */}
      <div className="relative flex flex-col min-w-0 w-full lg:w-[400px] lg:min-w-[360px] lg:max-w-[440px] lg:border-r lg:border-border-hairline">
        <ChatHeader
          creditsRemaining={creditsRemaining}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onNewChat={() => {
            clearMessages();
            setSidebarOpen(false);
          }}
          onToggleSOS={() => setSosOpen(true)}
        />

        <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 110 }}>
          <div className="mx-auto" style={{ maxWidth: 680, padding: "0 16px" }}>
            {messages.length === 0 ? (
              <EmptyState onSend={guardedSend} />
            ) : (
              <div style={{ paddingTop: 20 }}>
                {messages.map((msg, idx) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    isStreaming={isLoading && msg.role === "assistant" && idx === messages.length - 1}
                    onSuggestionClick={guardedSend}
                    userLocation={userLocation}
                    onPlaceSelect={handlePlaceSelect}
                    onRegenerate={msg.role === "assistant" && idx === messages.length - 1 ? retryLastMessage : undefined}
                  />
                ))}

                {statusText && <StatusIndicator text={statusText} />}

                {error && (
                  <div
                    className="animate-fade-up-sm"
                    style={{
                      marginBottom: 16,
                      padding: "12px 16px",
                      fontFamily: "var(--font-body)",
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: "var(--color-body)",
                      backgroundColor: "var(--color-paper)",
                      borderRadius: "var(--radius-md)",
                      borderLeft: "3px solid var(--color-danger)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {error}{" "}
                    <button
                      onClick={retryLastMessage}
                      style={{ fontWeight: 500, textDecoration: "underline", color: "var(--color-ink)" }}
                    >
                      Try again
                    </button>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </main>

        <ChatInput onSend={guardedSend} isLoading={isLoading} />
      </div>

      {/* ── Col 2: Activity Details (only when a place is selected) ── */}
      {selectedPlace && (
        <div className="hidden lg:flex w-[340px] min-w-[300px] max-w-[380px] flex-col min-h-0 border-r border-border-hairline animate-panel-slide-in">
          <ActivityPanel
            selectedPlace={selectedPlace}
            onClose={() => setSelectedPlace(null)}
            onMapSrcChange={setMapSrc}
          />
        </div>
      )}

      {/* ── Col 3 (or 2 when no details): Map (desktop only) ── */}
      <div className="hidden lg:flex flex-1 flex-col min-w-0 min-h-0">
        <MapPanel
          mapSrc={mapSrc}
          userLocation={userLocation}
        />
      </div>

      {/* ── Mobile: PlaceDetailPanel overlay (small screens only) ── */}
      <div className="lg:hidden">
        {selectedPlace && (
          <PlaceDetailPanel
            place={selectedPlace}
            onClose={() => setSelectedPlace(null)}
          />
        )}
      </div>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeId={sessionId}
        onSelect={(id) => {
          loadConversation(id);
          setSidebarOpen(false);
        }}
        onNew={() => {
          clearMessages();
          setSidebarOpen(false);
        }}
        onDelete={(id) => setConversations((c) => c.filter((x) => x.id !== id))}
      />

      <EmergencyOverlay
        isOpen={sosOpen}
        onClose={() => setSosOpen(false)}
      />
    </div>
  );
}
