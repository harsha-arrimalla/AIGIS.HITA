/**
 * API request/response shapes for non-chat endpoints.
 */

// Credits
export interface CreditBalanceResponse {
  userId: string;
  balance: number;
  transactions: CreditTransaction[];
}

export interface CreditTransaction {
  id: string;
  amount: number;
  type: "purchase" | "usage" | "bonus";
  description: string;
  createdAt: Date;
}

export interface PurchaseRequest {
  userId: string;
  packId: string;
}

export interface PurchaseResponse {
  orderId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
}

// Auth
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
}

// Health
export interface HealthResponse {
  status: "ok" | "degraded" | "down";
  uptime: number;
  timestamp: string;
  version: string;
}

// Voice
export interface VoiceRequest {
  sessionId: string;
  userId?: string;
}

export interface VoiceResponse {
  transcript: string;
  reply: string;
  uiAction?: {
    type: string;
    data: Record<string, unknown>;
  };
  suggestions?: string[];
}

// Errors
export interface APIError {
  statusCode: number;
  error: string;
  message: string;
}
