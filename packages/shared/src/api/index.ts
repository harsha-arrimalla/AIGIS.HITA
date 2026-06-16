/**
 * Hita API Client — works in both web (fetch) and React Native (fetch).
 */

import type { ChatRequest, ChatResponse, CreditBalance, CreditPack, HealthCheck, AuthUser, APIError } from "../types/index.js";

export class HitaAPI {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: APIError = await response.json().catch(() => ({
        statusCode: response.status,
        error: response.statusText,
        message: "Request failed",
      }));
      throw error;
    }

    return response.json() as Promise<T>;
  }

  // Chat
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Auth
  async getMe(): Promise<AuthUser> {
    return this.request<AuthUser>("/auth/me");
  }

  // Credits
  async getCredits(userId: string): Promise<CreditBalance> {
    return this.request<CreditBalance>(`/credits/${userId}`);
  }

  async purchaseCredits(userId: string, packId: string): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    razorpayOrderId: string;
    packName: string;
    credits: number;
  }> {
    return this.request(`/credits/purchase`, {
      method: "POST",
      body: JSON.stringify({ userId, packId }),
    });
  }

  async verifyPayment(params: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{ success: boolean; balance: number; creditsAdded?: number; message: string }> {
    return this.request(`/credits/verify`, {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async getCreditPacks(): Promise<{ packs: CreditPack[] }> {
    return this.request(`/credits/packs`);
  }

  // Health
  async health(): Promise<HealthCheck> {
    return this.request<HealthCheck>("/health");
  }

  // Conversations
  async listConversations(userId: string): Promise<{
    conversations: Array<{
      id: string;
      title: string;
      lastMessage: string;
      updatedAt: string;
      messageCount: number;
    }>;
  }> {
    return this.request(`/conversations/${encodeURIComponent(userId)}`);
  }

  async loadConversation(userId: string, conversationId: string): Promise<{
    conversationId: string;
    messages: Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      timestamp: string;
    }>;
  }> {
    return this.request(`/conversations/${encodeURIComponent(userId)}/${encodeURIComponent(conversationId)}`);
  }
}

export function createHitaAPI(baseUrl?: string): HitaAPI {
  const url = baseUrl || "http://localhost:3000";
  return new HitaAPI(url);
}
