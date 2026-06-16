/**
 * Chat-related types — sessions, messages, request/response shapes.
 */

export interface ChatRequest {
  message: string;
  sessionId: string;
  userId?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface ChatResponse {
  reply: string;
  uiAction?: UIAction;
  suggestions?: string[];
  creditsUsed?: number;
  creditsRemaining?: number;
  agentsUsed?: string[];
  debug?: DebugInfo;
}

export interface UIAction {
  type: string;
  data: Record<string, unknown>;
}

export interface SessionData {
  sessionId: string;
  userId?: string;
  city?: string;
  startedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  currentIntent?: string;
  context: Record<string, unknown>;
}

export type MessageRole = "user" | "assistant" | "system";

export interface StoredMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  intent?: string;
  agentsUsed?: string[];
  createdAt: Date;
}

export interface DebugInfo {
  intent: string;
  confidence: number;
  entities: Record<string, string>;
  agentTimings: Record<string, number>;
  totalLatencyMs: number;
}
