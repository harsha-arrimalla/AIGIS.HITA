/**
 * Chat API types — shared between web, mobile, and server.
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
  type: "PlaceList" | "RouteMap" | "EmergencyCard" | "WeatherCard";
  data: Record<string, unknown>;
}

export interface DebugInfo {
  intent: string;
  confidence: number;
  entities: Record<string, string>;
  agentTimings: Record<string, number>;
  totalLatencyMs: number;
}

export interface CreditBalance {
  userId: string;
  balance: number;
  transactions: CreditTransaction[];
  packs: CreditPack[];
}

export interface CreditTransaction {
  action: string;
  credits_used: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceINR: number;
}

export interface AuthUser {
  id: string;
  email?: string;
}

export interface HealthCheck {
  status: "ok" | "degraded";
  uptime: number;
  timestamp: string;
  version: string;
}

export interface APIError {
  statusCode: number;
  error: string;
  message: string;
}
