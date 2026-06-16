/**
 * Memory Agent
 *
 * Responsible for:
 * - Storing and retrieving user facts (name, preferences, past trips)
 * - Loading conversation history for a session
 * - Extracting memorable facts from conversations
 *
 * For v1.0 (no DB yet), this uses in-memory storage.
 * Will be swapped to Prisma queries once DB is connected.
 */

import type { Agent, RequestContext, ConversationMessage } from "../../types/agent.js";
import { cacheGet, cacheSet } from "../../lib/redis.js";
import { loadMessages as dbLoadMessages } from "../../lib/supabase.js";

// -------------------------------------------------------------------------- //
//                              TYPES                                          //
// -------------------------------------------------------------------------- //

export interface MemoryAgentInput {
  sessionId: string;
  userId?: string;
  currentMessage: string;
}

export interface MemoryAgentOutput {
  userFacts: string[];
  conversationHistory: ConversationMessage[];
  sessionContext: Record<string, unknown>;
}

// -------------------------------------------------------------------------- //
//                          BOUNDED IN-MEMORY STORE                            //
// -------------------------------------------------------------------------- //

const MAX_SESSIONS = 10_000;
const MAX_USERS = 50_000;

// Temporary in-memory stores with bounded size
const sessionMessages = new Map<string, ConversationMessage[]>();
const userMemory = new Map<string, string[]>();
const sessionContextStore = new Map<string, Record<string, unknown>>();

/** Evict oldest entries when a Map exceeds max size */
function boundedSet<T>(map: Map<string, T>, key: string, value: T, max: number): void {
  if (map.size >= max && !map.has(key)) {
    // Delete oldest entry (first key in insertion order)
    const oldest = map.keys().next().value;
    if (oldest !== undefined) map.delete(oldest);
  }
  map.set(key, value);
}

// -------------------------------------------------------------------------- //
//                              AGENT                                          //
// -------------------------------------------------------------------------- //

export const memoryAgent: Agent<MemoryAgentInput, MemoryAgentOutput> = {
  name: "memoryAgent",

  async run(input, _context) {
    const { sessionId, userId } = input;

    // 1. Load conversation history for this session
    let history = sessionMessages.get(sessionId) || [];

    // Try Redis cache first if in-memory is empty
    if (history.length === 0) {
      const cached = await cacheGet<ConversationMessage[]>(`session:${sessionId}:messages`);
      if (cached) {
        history = cached;
        boundedSet(sessionMessages, sessionId, history, MAX_SESSIONS);
      }
    }

    // Try Supabase DB if still empty (cold start recovery)
    if (history.length === 0) {
      try {
        const dbMessages = await dbLoadMessages(sessionId);
        if (dbMessages.length > 0) {
          history = dbMessages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: new Date(m.created_at),
          }));
          boundedSet(sessionMessages, sessionId, history, MAX_SESSIONS);
        }
      } catch {
        // Supabase unavailable — continue without history
      }
    }

    // 2. Load user facts
    let facts: string[] = [];
    if (userId) {
      facts = userMemory.get(userId) || [];

      if (facts.length === 0) {
        const cached = await cacheGet<string[]>(`user:${userId}:facts`);
        if (cached) {
          facts = cached;
          boundedSet(userMemory, userId, facts, MAX_USERS);
        }
      }
    }

    // 3. Load session context (city, ongoing trip, etc.)
    const sessionCtx =
      sessionContextStore.get(sessionId) ||
      (await cacheGet<Record<string, unknown>>(`session:${sessionId}:context`)) || {};

    return {
      userFacts: facts,
      conversationHistory: history,
      sessionContext: sessionCtx,
    };
  },
};

// -------------------------------------------------------------------------- //
//                           WRITE HELPERS                                     //
// -------------------------------------------------------------------------- //

/**
 * Append a message to session history.
 */
export async function addMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const history = sessionMessages.get(sessionId) || [];
  history.push({ role, content, timestamp: new Date() });

  // Keep last 50 messages per session
  if (history.length > 50) {
    history.splice(0, history.length - 50);
  }

  boundedSet(sessionMessages, sessionId, history, MAX_SESSIONS);

  // Persist to Redis with 24h TTL
  await cacheSet(`session:${sessionId}:messages`, history, 86400);
}

/**
 * Store a fact about the user.
 */
export async function addUserFact(userId: string, fact: string): Promise<void> {
  const facts = userMemory.get(userId) || [];

  // Don't duplicate
  if (facts.includes(fact)) return;

  facts.push(fact);
  boundedSet(userMemory, userId, facts, MAX_USERS);

  await cacheSet(`user:${userId}:facts`, facts, 86400 * 30); // 30 day TTL
}

/**
 * Update session context (e.g., current city, active trip).
 */
export async function updateSessionContext(
  sessionId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const existing =
    sessionContextStore.get(sessionId) ||
    (await cacheGet<Record<string, unknown>>(`session:${sessionId}:context`)) || {};

  const merged = { ...existing, ...updates };
  boundedSet(sessionContextStore, sessionId, merged, MAX_SESSIONS);
  await cacheSet(`session:${sessionId}:context`, merged, 86400);
}
