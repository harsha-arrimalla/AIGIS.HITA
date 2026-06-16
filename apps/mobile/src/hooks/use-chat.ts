/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useRef } from "react";

// Expo env constants are injected by Metro at build time
declare const process: { env: Record<string, string | undefined> };

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  agentsUsed?: string[];
  places?: Array<{
    name: string;
    type: "restaurant" | "activity" | "attraction" | "hotel" | "cafe";
    image?: string;
    rating?: number;
    reviewCount?: string;
    priceLevel?: string;
    location: string;
    distance?: string;
    placeId?: string;
    lat?: number;
    lng?: number;
  }>;
  status?: string;
  timestamp: Date;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  creditsRemaining: number | null;
  statusText: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export function useChat(): UseChatReturn {
  const userId = "dev-user-001"; // TODO: wire Supabase auth
  const sessionIdRef = useRef(generateId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(
    null
  );
  const [statusText, setStatusText] = useState<string | null>(null);

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

      // Add empty assistant message to stream into
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ]);

      try {
        const response = await fetch(`${API_URL}/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            sessionId: sessionIdRef.current,
            userId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const reader = (response as any).body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new (globalThis as any).TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

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
                        ? {
                            ...msg,
                            content:
                              msg.content + (event.data as string),
                          }
                        : msg
                    )
                  );
                  setStatusText(null);
                  break;

                case "done": {
                  const doneData = event.data as {
                    suggestions?: string[];
                    agentsUsed?: string[];
                    places?: Message["places"];
                  };
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantId
                        ? {
                            ...msg,
                            suggestions: doneData.suggestions,
                            agentsUsed: doneData.agentsUsed,
                            places: doneData.places,
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
        const msg =
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : "Failed to send message";
        setError(msg);
        setMessages((prev) =>
          prev.filter(
            (m) => !(m.id === assistantId && m.content === "")
          )
        );
      } finally {
        setIsLoading(false);
        setStatusText(null);
      }
    },
    [isLoading, userId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setStatusText(null);
    sessionIdRef.current = generateId();
  }, []);

  return {
    messages,
    isLoading,
    error,
    creditsRemaining,
    statusText,
    sendMessage,
    clearMessages,
  };
}
