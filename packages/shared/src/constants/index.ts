/**
 * Shared constants — credit packs, status colors, etc.
 * NOTE: API_BASE_URL should be set by the consuming app, not here.
 */

export const DEFAULT_API_URL = "http://localhost:3000";

export const CREDIT_PACKS = [
  { id: "starter", name: "Starter Pack", credits: 25, priceINR: 49 },
  { id: "explorer", name: "Explorer Pack", credits: 75, priceINR: 129 },
  { id: "guardian", name: "Guardian Pack", credits: 200, priceINR: 299 },
] as const;

export const INTENTS = [
  "TRANSIT",
  "SAFETY",
  "WEATHER",
  "GEO",
  "EMOTIONAL",
  "FARE",
  "TRIP_PLAN",
  "GENERAL",
] as const;

export type Intent = (typeof INTENTS)[number];

export const STATUS_COLORS = {
  critical: "#DC2626",
  warning: "#D97706",
  ok: "#059669",
  info: "#1A56E8",
} as const;

export const MAX_MESSAGE_LENGTH = 5000;
export const FREE_CREDITS = 12;
