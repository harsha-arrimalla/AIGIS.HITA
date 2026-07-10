/**
 * Intent Classifier
 *
 * Uses Gemini Flash (cheap + fast) to classify user messages into intents.
 * Returns the intent, extracted entities, confidence score, and emotional tone.
 */

import { callGemini, parseJsonResponse } from "./llm.js";
import { INTENT_CLASSIFIER_PROMPT } from "../prompts/intentClassifier.js";

export type Intent =
  | "TRANSIT"
  | "SAFETY"
  | "WEATHER"
  | "GEO"
  | "EMOTIONAL"
  | "FARE"
  | "TRIP_PLAN"
  | "FOOD"
  | "GENERAL";

export interface ClassificationResult {
  intent: Intent;
  confidence: number;
  entities: Record<string, string>;
  secondaryIntent?: Intent;
  emotionalTone: string;
}

const DEFAULT_RESULT: ClassificationResult = {
  intent: "GENERAL",
  confidence: 0.5,
  entities: {},
  emotionalTone: "neutral",
};

export async function classifyIntent(
  message: string,
  conversationContext?: string
): Promise<ClassificationResult> {
  const prompt = conversationContext
    ? `Recent conversation context:\n${conversationContext}\n\nNew message to classify:\n"${message}"`
    : `Classify this message:\n"${message}"`;

  try {
    const raw = await callGemini({
      prompt,
      systemInstruction: INTENT_CLASSIFIER_PROMPT,
      temperature: 0.1, // Low temp for consistent classification
    });

    const result = parseJsonResponse<ClassificationResult>(raw);

    // Debug log the raw classification
    if (process.env.LOG_LEVEL === "debug") {
      console.log("[intentClassifier] Raw classification:", JSON.stringify(result));
    }

    // Validate and normalize
    if (!result.intent || !isValidIntent(result.intent)) {
      result.intent = "GENERAL";
    }
    if (typeof result.confidence !== "number") {
      result.confidence = 0.7;
    }
    if (!result.emotionalTone) {
      result.emotionalTone = "neutral";
    }
    if (!result.entities) {
      result.entities = {};
    }

    return result;
  } catch (err) {
    console.error("[intentClassifier] Classification failed, defaulting to GENERAL:", err);
    return DEFAULT_RESULT;
  }
}

function isValidIntent(intent: string): intent is Intent {
  const validIntents: Intent[] = [
    "TRANSIT",
    "SAFETY",
    "WEATHER",
    "GEO",
    "EMOTIONAL",
    "FARE",
    "TRIP_PLAN",
    "FOOD",
    "GENERAL",
  ];
  return validIntents.includes(intent as Intent);
}
