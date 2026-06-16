/**
 * Agent system types — every agent implements this contract.
 */

export interface RequestContext {
  sessionId: string;
  userId?: string;
  userProfile?: UserProfile;
  location?: LocationContext;
  conversationHistory: ConversationMessage[];
  cityData?: CityData;
  timestamp: Date;
}

export interface UserProfile {
  name?: string;
  gender?: string;
  travelStyle?: string;
  preferredLanguage?: string;
  emergencyContacts?: EmergencyContact[];
  memorizedFacts?: string[];
}

export interface LocationContext {
  lat: number;
  lng: number;
  city?: string;
  area?: string;
  country?: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface CityData {
  name: string;
  safetyZones: SafetyZone[];
  fareBenchmarks: FareBenchmark[];
  scamAlerts: ScamAlert[];
  emergencyNumbers: Record<string, string>;
}

export interface SafetyZone {
  area: string;
  safetyScore: number; // 1-10
  dayScore: number;
  nightScore: number;
  notes: string;
}

export interface FareBenchmark {
  from: string;
  to: string;
  mode: "auto" | "cab" | "metro" | "bus";
  expectedFareMin: number;
  expectedFareMax: number;
  currency: string;
}

export interface ScamAlert {
  type: string;
  area: string;
  description: string;
  severity: "low" | "medium" | "high";
}

/**
 * The core Agent interface. Every agent implements this.
 * TInput = what the agent needs
 * TOutput = what it returns (always structured JSON)
 */
export interface Agent<TInput, TOutput> {
  name: string;
  run(input: TInput, context: RequestContext): Promise<TOutput>;
}
