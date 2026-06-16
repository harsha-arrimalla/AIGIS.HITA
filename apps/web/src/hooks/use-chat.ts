"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-provider";
import { useAPI } from "@/lib/api-provider";

export interface UIAction {
  type: string;
  data: Record<string, unknown>;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  agentsUsed?: string[];
  uiAction?: UIAction;
  status?: string;
  timestamp: Date;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  creditsRemaining: number | null;
  statusText: string | null;
  sessionId: string;
  sendMessage: (text: string) => Promise<void>;
  retryLastMessage: () => void;
  clearMessages: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function useChat(location?: { lat: number; lng: number } | null): UseChatReturn {
  const { user } = useAuth();
  const api = useAPI();
  const userId = user?.id || "dev-user-001";
  const sessionIdRef = useRef(generateId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch initial credit balance
  useEffect(() => {
    fetch(`${API_URL}/credits/${encodeURIComponent(userId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.balance != null) setCreditsRemaining(data.balance);
      })
      .catch(() => {});
  }, [userId]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      const assistantId = generateId();

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);
      setStatusText(null);

      // Add empty assistant message that we'll stream into
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ]);

      // Create abort controller for cancellation
      const abort = new AbortController();
      abortRef.current = abort;

      try {
        const response = await fetch(`${API_URL}/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            sessionId: sessionIdRef.current,
            userId,
            ...(location && { location: { lat: location.lat, lng: location.lng } }),
          }),
          signal: abort.signal,
        });

        if (!response.ok) {
          const errBody = await response.text().catch(() => "");
          throw new Error(
            response.status === 402
              ? "No credits remaining. Please purchase more to continue."
              : response.status === 429
                ? "Too many requests. Please wait a moment."
                : `Server error (${response.status}): ${errBody.slice(0, 100)}`
          );
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE lines
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr) as {
                type: string;
                data: unknown;
              };

              switch (event.type) {
                case "status":
                  setStatusText(event.data as string);
                  break;

                case "token":
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, content: msg.content + (event.data as string) }
                        : msg
                    )
                  );
                  setStatusText(null);
                  break;

                case "done": {
                  const doneData = event.data as {
                    suggestions?: string[];
                    agentsUsed?: string[];
                    uiAction?: UIAction;
                  };
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? {
                            ...msg,
                            suggestions: doneData.suggestions,
                            agentsUsed: doneData.agentsUsed,
                            uiAction: doneData.uiAction,
                          }
                        : msg
                    )
                  );
                  break;
                }

                case "credits": {
                  const creditData = event.data as {
                    creditsRemaining?: number;
                  };
                  if (creditData.creditsRemaining != null) {
                    setCreditsRemaining(creditData.creditsRemaining);
                  }
                  break;
                }

                case "error":
                  setError(event.data as string);
                  break;
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // User cancelled — remove empty assistant message
          setMessages((prev) =>
            prev.filter(
              (msg) => !(msg.id === assistantId && msg.content === "")
            )
          );
        } else {
          const msg =
            err && typeof err === "object" && "message" in err
              ? (err as { message: string }).message
              : "Failed to send message";
          setError(msg);
          // Remove the empty assistant message on error
          setMessages((prev) =>
            prev.filter(
              (msg) => !(msg.id === assistantId && msg.content === "")
            )
          );
        }
      } finally {
        setIsLoading(false);
        setStatusText(null);
        abortRef.current = null;
      }
    },
    [isLoading, userId]
  );

  const retryLastMessage = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg || isLoading) return;

    // Remove the last failed assistant message (if empty or errored)
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && (!last.content || error)) {
        return prev.slice(0, -1);
      }
      return prev;
    });
    setError(null);
    sendMessage(lastUserMsg.content);
  }, [messages, isLoading, error, sendMessage]);

  const clearMessages = useCallback(() => {
    // Abort any in-flight stream
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setStatusText(null);
    sessionIdRef.current = generateId();
  }, []);

  const loadConversation = useCallback(
    async (conversationId: string) => {
      try {
        const data = await api.loadConversation(userId, conversationId);
        sessionIdRef.current = conversationId;
        setMessages(
          data.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
          }))
        );
        setError(null);
        setStatusText(null);
      } catch {
        setError("Could not load conversation");
      }
    },
    [api, userId]
  );

  return {
    messages,
    isLoading,
    error,
    creditsRemaining,
    statusText,
    sessionId: sessionIdRef.current,
    sendMessage,
    retryLastMessage,
    clearMessages,
    loadConversation,
  };
}
