/**
 * Conversations Route
 *
 * GET  /conversations/:userId     — List user's conversations
 * GET  /conversations/:userId/:id — Load messages for a conversation
 */

import { FastifyInstance } from "fastify";
import { authMiddleware } from "../lib/auth.js";
import { getSupabase } from "../lib/supabase.js";

export async function conversationsRoute(server: FastifyInstance) {
  // GET /conversations/:userId — list conversations
  server.get<{
    Params: { userId: string };
    Querystring: { limit?: string };
  }>(
    "/conversations/:userId",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { userId } = request.params;
      const limit = Math.min(parseInt(request.query.limit || "50", 10), 100);
      const sb = getSupabase();

      const { data, error } = await sb
        .from("conversations")
        .select("id, created_at, status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        request.log.error({ err: error }, "Failed to list conversations");
        return reply.code(500).send({ statusCode: 500, error: "Database Error", message: "Could not load conversations" });
      }

      // For each conversation, get the first user message as the title and message count
      const conversations = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: msgs } = await sb
            .from("messages")
            .select("content, role")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: true })
            .limit(2);

          const firstUserMsg = msgs?.find((m) => m.role === "user");
          const title = firstUserMsg?.content?.slice(0, 80) || "New conversation";
          const lastMsg = msgs?.[msgs.length - 1]?.content?.slice(0, 100) || "";

          // Get total message count
          const { count } = await sb
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", conv.id);

          return {
            id: conv.id,
            title,
            lastMessage: lastMsg,
            updatedAt: conv.created_at,
            messageCount: count || 0,
          };
        })
      );

      return { conversations };
    }
  );

  // GET /conversations/:userId/:id — load messages for a conversation
  server.get<{
    Params: { userId: string; id: string };
    Querystring: { limit?: string };
  }>(
    "/conversations/:userId/:id",
    { preHandler: authMiddleware },
    async (request, reply) => {
      const { id } = request.params;
      const limit = Math.min(parseInt(request.query.limit || "100", 10), 200);
      const sb = getSupabase();

      const { data, error } = await sb
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) {
        request.log.error({ err: error }, "Failed to load messages");
        return reply.code(500).send({ statusCode: 500, error: "Database Error", message: "Could not load messages" });
      }

      return {
        conversationId: id,
        messages: (data || []).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.created_at,
        })),
      };
    }
  );
}
