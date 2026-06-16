/**
 * Supabase Client
 *
 * Single shared client instance for all DB operations.
 * Uses the service role key for server-side operations.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }

  supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  return supabase;
}

// -------------------------------------------------------------------------- //
//                          CREDITS OPERATIONS                                 //
// -------------------------------------------------------------------------- //

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Get user's credit balance. Creates a record with 12 free credits if none exists.
 * Throws if userId is not a valid UUID (caller should fall back to in-memory).
 */
export async function getCredits(userId: string): Promise<number> {
  if (!UUID_RE.test(userId)) throw new Error("Non-UUID userId, use in-memory credits");
  const sb = getSupabase();

  const { data, error } = await sb
    .from("credits")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (error && error.code === "PGRST116") {
    // No record found — create one with 12 free credits
    const { data: newRecord, error: insertError } = await sb
      .from("credits")
      .insert({ user_id: userId, balance: 12 })
      .select("balance")
      .single();

    if (insertError) {
      console.error("[supabase] Failed to create credits:", insertError);
      return 12; // Fallback
    }
    return newRecord.balance;
  }

  if (error) {
    console.error("[supabase] Failed to get credits:", error);
    return 0;
  }

  return data.balance;
}

/**
 * Deduct credits from user atomically. Returns new balance.
 * Uses conditional update to prevent race conditions.
 */
export async function deductCredits(userId: string, amount: number = 1): Promise<number> {
  if (!UUID_RE.test(userId)) throw new Error("Non-UUID userId, use in-memory credits");
  const sb = getSupabase();

  // Atomic: only deduct if balance >= amount
  const { data, error } = await sb
    .rpc("deduct_credits", { p_user_id: userId, p_amount: amount });

  if (error) {
    // Fallback to non-atomic if RPC doesn't exist yet
    if (error.code === "42883") {
      // Function not found — use read-then-write with optimistic check
      const current = await getCredits(userId);
      if (current < amount) return 0;

      const newBalance = current - amount;
      const { error: updateError } = await sb
        .from("credits")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .gte("balance", amount); // guard: only update if balance still >= amount

      if (updateError) {
        console.error("[supabase] Failed to deduct credits:", updateError);
        return current;
      }

      await logTransaction(sb, userId, "chat_message", amount, { remaining: newBalance });
      return newBalance;
    }

    console.error("[supabase] Failed to deduct credits:", error);
    throw new Error("Credit deduction failed");
  }

  const newBalance = typeof data === "number" ? data : 0;
  await logTransaction(sb, userId, "chat_message", amount, { remaining: newBalance });
  return newBalance;
}

/**
 * Add credits to a user's balance atomically (e.g. after purchase).
 */
export async function addCredits(
  userId: string,
  amount: number,
  action: string,
  description: string
): Promise<number> {
  if (!UUID_RE.test(userId)) throw new Error("Non-UUID userId, use in-memory credits");
  const sb = getSupabase();

  // Use RPC if available, otherwise fallback
  const { data, error } = await sb
    .rpc("add_credits", { p_user_id: userId, p_amount: amount });

  if (error) {
    if (error.code === "42883") {
      // Function not found — fallback
      const current = await getCredits(userId);
      const newBalance = current + amount;

      const { error: updateError } = await sb
        .from("credits")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (updateError) {
        console.error("[supabase] Failed to add credits:", updateError);
        return current;
      }

      await logTransaction(sb, userId, action, -amount, { description, remaining: newBalance });
      return newBalance;
    }

    console.error("[supabase] Failed to add credits:", error);
    throw new Error("Credit addition failed");
  }

  const newBalance = typeof data === "number" ? data : 0;
  await logTransaction(sb, userId, action, -amount, { description, remaining: newBalance });
  return newBalance;
}

/**
 * Log a credit transaction. Errors are logged but don't propagate.
 */
async function logTransaction(
  sb: SupabaseClient,
  userId: string,
  action: string,
  creditsUsed: number,
  metadata: Record<string, unknown>
): Promise<void> {
  const { error } = await sb.from("credit_transactions").insert({
    user_id: userId,
    action,
    credits_used: creditsUsed,
    metadata,
  });
  if (error) {
    console.error("[supabase] Failed to log transaction:", error);
  }
}

// -------------------------------------------------------------------------- //
//                       CONVERSATION OPERATIONS                               //
// -------------------------------------------------------------------------- //

/**
 * Get or create a conversation for the session.
 */
export async function getOrCreateConversation(
  sessionId: string,
  userId: string
): Promise<string> {
  const sb = getSupabase();

  // Check if conversation exists with this ID
  const { data } = await sb
    .from("conversations")
    .select("id")
    .eq("id", sessionId)
    .single();

  if (data) return data.id;

  // Create new conversation
  const { data: newConv, error } = await sb
    .from("conversations")
    .insert({
      id: sessionId,
      user_id: userId,
      corridor: "domestic",
      journey_type: "travel",
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[supabase] Failed to create conversation:", error);
    return sessionId;
  }

  return newConv.id;
}

/**
 * Save a message to the database.
 */
export async function saveMessage(
  conversationId: string,
  userId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const sb = getSupabase();

  const { error } = await sb.from("messages").insert({
    conversation_id: conversationId,
    user_id: userId,
    role,
    content,
  });

  if (error) {
    console.error("[supabase] Failed to save message:", error);
  }
}

/**
 * Load recent messages for a conversation.
 */
export async function loadMessages(
  conversationId: string,
  limit: number = 20
): Promise<Array<{ role: string; content: string; created_at: string }>> {
  const sb = getSupabase();

  const { data, error } = await sb
    .from("messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[supabase] Failed to load messages:", error);
    return [];
  }

  return data || [];
}
