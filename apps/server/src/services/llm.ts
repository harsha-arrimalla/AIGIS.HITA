/**
 * LLM Client Wrappers
 *
 * Two clients:
 * - Claude (Anthropic): available but currently unused — kept for future high-quality tasks
 * - Gemini Flash (Google): primary LLM — used for intent classification, agents, and Hita Brain
 *
 * Both have retry logic, timeout, and structured error handling.
 */

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// -------------------------------------------------------------------------- //
//                          RETRY WITH BACKOFF                                 //
// -------------------------------------------------------------------------- //

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const status = err?.status ?? err?.httpCode;
      // Retry only on 429 (rate limit) or 503 (overloaded)
      if (status !== 429 && status !== 503) throw err;
      if (attempt === MAX_RETRIES) break;

      // Use Google's suggested retry delay if available, else exponential backoff
      let delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500;
      const retryInfo = err?.errorDetails?.find(
        (d: any) => d?.["@type"]?.includes("RetryInfo")
      );
      if (retryInfo?.retryDelay) {
        const parsed = parseInt(retryInfo.retryDelay);
        if (!isNaN(parsed) && parsed > 0) delay = parsed * 1000;
      }

      // Cap at 60s to avoid unreasonably long waits
      delay = Math.min(delay, 60_000);

      console.warn(`[llm] ${label} got ${status}, retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// -------------------------------------------------------------------------- //
//                               CLIENTS                                       //
// -------------------------------------------------------------------------- //

let anthropicClient: Anthropic | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

function getAnthropic(): Anthropic {
  if (anthropicClient) return anthropicClient;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}

function getGemini(): GoogleGenerativeAI {
  if (geminiClient) return geminiClient;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  geminiClient = new GoogleGenerativeAI(apiKey);
  return geminiClient;
}

// -------------------------------------------------------------------------- //
//                              CLAUDE CALL                                    //
// -------------------------------------------------------------------------- //

export interface ClaudeOptions {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
}

export async function callClaude(options: ClaudeOptions): Promise<string> {
  const { systemPrompt, userMessage, maxTokens = 1024, temperature = 0.7 } = options;

  const client = getAnthropic();

  const startTime = Date.now();

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const latency = Date.now() - startTime;
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    if (process.env.LOG_LEVEL === "debug") {
      console.log(`[llm] Claude responded in ${latency}ms (${text.length} chars)`);
    }

    return text;
  } catch (err) {
    const latency = Date.now() - startTime;
    console.error(`[llm] Claude error after ${latency}ms:`, err);
    throw err;
  }
}

// -------------------------------------------------------------------------- //
//                             GEMINI CALL                                     //
// -------------------------------------------------------------------------- //

export interface GeminiOptions {
  prompt: string;
  systemInstruction?: string;
  maxTokens?: number;
  temperature?: number;
  /**
   * Gemini 2.5 thinking budget. Defaults to 0 (off) — thinking tokens are
   * drawn from maxOutputTokens and can starve the visible reply, cutting it
   * mid-sentence. Set >0 only for tasks that need deliberate reasoning.
   */
  thinkingBudget?: number;
}

export async function callGemini(options: GeminiOptions): Promise<string> {
  const { prompt, systemInstruction, maxTokens, temperature = 0.3, thinkingBudget = 0 } = options;

  const client = getGemini();
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemInstruction || undefined,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      // Passed through to the v1beta API; not in the old SDK's types
      ...({ thinkingConfig: { thinkingBudget } } as Record<string, unknown>),
    },
  });

  const startTime = Date.now();

  return withRetry(async () => {
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const latency = Date.now() - startTime;

      if (process.env.LOG_LEVEL === "debug") {
        console.log(`[llm] Gemini responded in ${latency}ms (${text.length} chars)`);
      }

      return text;
    } catch (err) {
      const latency = Date.now() - startTime;
      console.error(`[llm] Gemini error after ${latency}ms:`, err);
      throw err;
    }
  }, "callGemini");
}

// -------------------------------------------------------------------------- //
//                          GEMINI STREAMING                                    //
// -------------------------------------------------------------------------- //

export async function* callGeminiStream(options: GeminiOptions): AsyncGenerator<string> {
  const { prompt, systemInstruction, maxTokens, temperature = 0.3, thinkingBudget = 0 } = options;

  const client = getGemini();
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemInstruction || undefined,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      // Passed through to the v1beta API; not in the old SDK's types
      ...({ thinkingConfig: { thinkingBudget } } as Record<string, unknown>),
    },
  });

  const startTime = Date.now();

  // For streaming, retry only the initial connection
  const result = await withRetry(
    () => model.generateContentStream(prompt),
    "callGeminiStream"
  );

  try {
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }

    // Surface abnormal stops (MAX_TOKENS, RECITATION, SAFETY) — these cut
    // the reply mid-sentence with no error thrown.
    const finishReason = (await result.response).candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== "STOP") {
      console.warn(`[llm] Gemini stream ended abnormally: ${finishReason}`);
    }

    const latency = Date.now() - startTime;
    if (process.env.LOG_LEVEL === "debug") {
      console.log(`[llm] Gemini stream completed in ${latency}ms`);
    }
  } catch (err) {
    const latency = Date.now() - startTime;
    console.error(`[llm] Gemini stream error after ${latency}ms:`, err);
    throw err;
  }
}

// -------------------------------------------------------------------------- //
//                            JSON PARSING HELPER                              //
// -------------------------------------------------------------------------- //

/**
 * Attempts to parse JSON from an LLM response.
 * Handles common issues: markdown code fences, trailing commas, extra text.
 */
export function parseJsonResponse<T>(raw: string): T {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  // Try direct parse
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to extract JSON object from surrounding text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    throw new Error(`Failed to parse JSON from LLM response: ${raw.slice(0, 200)}`);
  }
}
