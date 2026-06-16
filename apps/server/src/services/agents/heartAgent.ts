/**
 * Heart Agent
 *
 * Handles emotional support — fear, anxiety, loneliness, homesickness.
 * The most important agent after Safety. When someone is distressed,
 * empathy comes before information.
 */

import type { Agent, RequestContext } from "../../types/agent.js";

// -------------------------------------------------------------------------- //
//                              TYPES                                          //
// -------------------------------------------------------------------------- //

export interface HeartAgentInput {
  emotion: string;
  intensity: "low" | "medium" | "high";
  message: string;
}

export interface HeartAgentOutput {
  emotionalResponse: string;
  groundingTechnique?: string;
  actionableSuggestions: string[];
  shouldEscalate: boolean;
  escalationReason?: string;
}

// -------------------------------------------------------------------------- //
//                        AFFIRMATION SCRIPTS                                  //
// -------------------------------------------------------------------------- //

const RESPONSES: Record<string, Record<string, string>> = {
  scared: {
    high: "I hear you, and what you're feeling is completely valid. You're not alone right now — I'm here. Let's focus on getting you somewhere safe.",
    medium: "It's okay to feel uneasy. Let's figure out the safest option for you right now.",
    low: "I understand the concern. Let me check the area for you so you can feel more confident.",
  },
  anxious: {
    high: "Take a slow breath. You're safe. Let's handle one thing at a time — what feels most urgent right now?",
    medium: "I get it — being in an unfamiliar place can feel overwhelming. Let me help you with the next step.",
    low: "Totally normal to feel a bit on edge. Let's get you sorted.",
  },
  sad: {
    high: "I'm sorry you're going through this. It's okay to feel this way, especially far from home. Would it help to talk, or would you like me to find something comforting nearby?",
    medium: "I hear you. Missing home is real. Let me know how I can help — even just talking helps.",
    low: "That's understandable. Being away isn't always easy. I'm here if you need anything.",
  },
  frustrated: {
    high: "That sounds really frustrating. Let's try to fix this — tell me exactly what happened and I'll help you sort it out.",
    medium: "I get it — that's annoying. Let me see what I can do to help.",
    low: "Fair enough. Let's figure out a better option.",
  },
  angry: {
    high: "I hear you. That's not okay and your frustration is justified. Let me help you deal with this properly.",
    medium: "That's understandable. Let's see what your options are.",
    low: "Got it. Let me help you with an alternative.",
  },
};

const GROUNDING_TECHNIQUES: Record<string, string> = {
  scared: "Try the 5-4-3-2-1 technique: notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste. It helps your mind settle.",
  anxious: "Try breathing slowly: in for 4 counts, hold for 4, out for 6. Even 3 rounds makes a difference.",
  sad: "Sometimes it helps to call someone who makes you feel at home. Even a quick voice note can bridge the distance.",
};

// -------------------------------------------------------------------------- //
//                              AGENT                                          //
// -------------------------------------------------------------------------- //

export const heartAgent: Agent<HeartAgentInput, HeartAgentOutput> = {
  name: "heartAgent",

  async run(input, context) {
    const { emotion, intensity, message } = input;

    // Step 1: Get the right emotional response
    const emotionKey = mapEmotion(emotion);
    const responseMap = RESPONSES[emotionKey] || RESPONSES["anxious"];
    const emotionalResponse = responseMap[intensity] || responseMap["medium"];

    // Step 2: Get grounding technique if intensity is high
    const groundingTechnique = intensity === "high" ? GROUNDING_TECHNIQUES[emotionKey] : undefined;

    // Step 3: Generate actionable suggestions based on situation
    const actionableSuggestions = generateSuggestions(emotionKey, intensity, context);

    // Step 4: Determine if we should escalate (suggest calling someone)
    const shouldEscalate = intensity === "high" && (emotionKey === "scared" || emotionKey === "sad");
    const escalationReason = shouldEscalate
      ? "Consider reaching out to a trusted contact or local helpline."
      : undefined;

    return {
      emotionalResponse,
      groundingTechnique,
      actionableSuggestions,
      shouldEscalate,
      escalationReason,
    };
  },
};

// -------------------------------------------------------------------------- //
//                           HELPERS                                           //
// -------------------------------------------------------------------------- //

function mapEmotion(emotion: string): string {
  const lower = emotion.toLowerCase();

  if (lower.includes("scar") || lower.includes("fear") || lower.includes("afraid")) return "scared";
  if (lower.includes("anxi") || lower.includes("nervous") || lower.includes("overwhelm") || lower.includes("stress")) return "anxious";
  if (lower.includes("sad") || lower.includes("lonel") || lower.includes("miss") || lower.includes("homesick")) return "sad";
  if (lower.includes("frustrat") || lower.includes("annoy")) return "frustrated";
  if (lower.includes("angry") || lower.includes("mad") || lower.includes("furious")) return "angry";

  return "anxious"; // Default
}

function generateSuggestions(
  emotion: string,
  intensity: string,
  context: RequestContext
): string[] {
  const suggestions: string[] = [];

  if (emotion === "scared" || intensity === "high") {
    suggestions.push("Share your live location with a trusted contact");
    if (context.cityData) {
      const emergencyNumbers = (context.cityData as unknown as Record<string, Record<string, string>>).emergencyNumbers;
      if (emergencyNumbers) {
        suggestions.push(`Emergency: Police ${emergencyNumbers.police || "100"}, Women's helpline ${emergencyNumbers.women_helpline || "181"}`);
      }
    }
    suggestions.push("Move to a well-lit, busy area nearby");
  }

  if (emotion === "sad" || emotion === "anxious") {
    suggestions.push("Call or message someone you trust");
    suggestions.push("Find a comfortable cafe or public space nearby");
  }

  if (emotion === "frustrated" || emotion === "angry") {
    suggestions.push("Take a moment before responding to the situation");
    suggestions.push("Document what happened (photos, screenshots) in case you need it later");
  }

  return suggestions;
}
