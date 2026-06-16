/**
 * Memory Agent Tests
 *
 * Tests read/write of user facts and session history.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/redis.js", () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
}));

import { memoryAgent, addMessage, addUserFact } from "../../src/services/agents/memoryAgent.js";
import { cacheGet, cacheSet } from "../../src/lib/redis.js";
import type { RequestContext } from "../../src/types/agent.js";

const mockContext: RequestContext = {
  sessionId: "test",
  conversationHistory: [],
  timestamp: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("memoryAgent", () => {
  it("has correct name", () => {
    expect(memoryAgent.name).toBe("memoryAgent");
  });

  it("returns empty state for new session", async () => {
    const result = await memoryAgent.run(
      { sessionId: "new-session", currentMessage: "hello" },
      mockContext
    );

    expect(result.userFacts).toEqual([]);
    expect(result.conversationHistory).toEqual([]);
    expect(result.sessionContext).toEqual({});
  });

  it("loads from Redis cache when in-memory is empty", async () => {
    const cachedMessages = [
      { role: "user" as const, content: "hi", timestamp: new Date() },
    ];
    vi.mocked(cacheGet).mockResolvedValueOnce(cachedMessages);

    const result = await memoryAgent.run(
      { sessionId: "cached-session", currentMessage: "next message" },
      mockContext
    );

    expect(result.conversationHistory).toEqual(cachedMessages);
  });
});

describe("addMessage", () => {
  it("persists messages to Redis", async () => {
    await addMessage("session-1", "user", "hello world");

    expect(cacheSet).toHaveBeenCalledWith(
      "session:session-1:messages",
      expect.arrayContaining([
        expect.objectContaining({ role: "user", content: "hello world" }),
      ]),
      86400
    );
  });
});

describe("addUserFact", () => {
  it("persists facts to Redis", async () => {
    await addUserFact("user-1", "Prefers vegetarian food");

    expect(cacheSet).toHaveBeenCalledWith(
      "user:user-1:facts",
      expect.arrayContaining(["Prefers vegetarian food"]),
      86400 * 30
    );
  });
});
