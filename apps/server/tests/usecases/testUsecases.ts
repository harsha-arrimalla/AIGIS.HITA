/**
 * Use-Case Validation Script
 *
 * Tests all 100 use cases from usecases.md against the intent classifier.
 * Maps expected triggers to acceptable intents and reports pass/fail.
 *
 * Usage: cd apps/server && npx tsx tests/usecases/testUsecases.ts
 * Env: Requires GEMINI_API_KEY in .env
 */

import { classifyIntent, type Intent } from "../../src/services/intentClassifier.js";

// Mapping from agent names in usecases.md → acceptable intents
const AGENT_TO_INTENT: Record<string, Intent[]> = {
  "Safety Agent": ["SAFETY"],
  "Heart Agent": ["EMOTIONAL"],
  "Geo Agent": ["GEO"],
  "Transit Agent": ["TRANSIT"],
  "Fare Guard": ["FARE"],
  "Weather Agent": ["WEATHER"],
  "Memory Agent": ["GENERAL", "GEO", "FARE", "TRIP_PLAN"], // memory runs always
  "Family Share Agent": ["SAFETY", "EMOTIONAL"], // not a separate intent
  "Emergency Mode": ["SAFETY", "EMOTIONAL"], // maps to safety/emotional
};

interface UseCase {
  id: string;
  message: string;
  triggers: string[];
  acceptableIntents: Intent[];
}

// Derive acceptable intents from triggers (excluding memory, which runs always)
function deriveAcceptableIntents(triggers: string[]): Intent[] {
  const intents = new Set<Intent>();
  for (const trigger of triggers) {
    const mapped = AGENT_TO_INTENT[trigger];
    if (mapped) {
      for (const intent of mapped) intents.add(intent);
    }
  }
  // Remove overly broad intents if we have specific ones
  const specific: Intent[] = ["SAFETY", "EMOTIONAL", "TRANSIT", "FARE", "WEATHER"];
  const hasSpecific = specific.some((i) => intents.has(i));
  if (hasSpecific) {
    intents.delete("GENERAL");
  }
  return [...intents];
}

const USE_CASES: UseCase[] = [
  // === 1. Airport & Arrival ===
  { id: "1.1", message: "I just landed in Mumbai but I don't know which terminal", triggers: ["Geo Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "1.2", message: "I have a connecting flight in 90 minutes, will I make it?", triggers: ["Geo Agent", "Transit Agent"], acceptableIntents: [] },
  { id: "1.3", message: "My bag didn't come on the carousel", triggers: ["Geo Agent", "Heart Agent"], acceptableIntents: [] },
  { id: "1.4", message: "First time in India, what do I do at the airport?", triggers: ["Geo Agent", "Fare Guard", "Memory Agent"], acceptableIntents: [] },
  { id: "1.5", message: "My friend is picking me up but I can't find the pickup zone", triggers: ["Geo Agent", "Fare Guard"], acceptableIntents: [] },
  { id: "1.6", message: "My next flight is from Terminal 3 in Delhi but I'm at Terminal 1", triggers: ["Transit Agent", "Geo Agent", "Fare Guard"], acceptableIntents: [] },
  { id: "1.7", message: "I just landed in Hyderabad with no hotel booked", triggers: ["Geo Agent", "Memory Agent", "Fare Guard"], acceptableIntents: [] },
  { id: "1.8", message: "Should I exchange money at the airport?", triggers: ["Fare Guard", "Memory Agent"], acceptableIntents: [] },
  { id: "1.9", message: "Should I buy a SIM card here at the airport?", triggers: ["Fare Guard", "Geo Agent"], acceptableIntents: [] },
  { id: "1.10", message: "Should I take a prepaid taxi or book Ola from the airport?", triggers: ["Fare Guard", "Safety Agent", "Transit Agent"], acceptableIntents: [] },

  // === 2. Late-Night & Safety ===
  { id: "2.1", message: "Walking home from a party at 1 AM", triggers: ["Safety Agent", "Geo Agent"], acceptableIntents: [] },
  { id: "2.2", message: "My friend was supposed to pick me up an hour ago and isn't responding", triggers: ["Safety Agent", "Heart Agent", "Family Share Agent"], acceptableIntents: [] },
  { id: "2.3", message: "Last metro left without me and I'm in MG Road", triggers: ["Transit Agent", "Safety Agent", "Fare Guard"], acceptableIntents: [] },
  { id: "2.4", message: "I think someone is following me", triggers: ["Safety Agent", "Family Share Agent", "Emergency Mode"], acceptableIntents: [] },
  { id: "2.5", message: "Which is the safest way to get from Banjara Hills to Jubilee Hills?", triggers: ["Safety Agent", "Transit Agent", "Geo Agent"], acceptableIntents: [] },
  { id: "2.6", message: "My phone is at 4% and I'm not at my hotel yet", triggers: ["Geo Agent", "Safety Agent", "Heart Agent"], acceptableIntents: [] },
  { id: "2.7", message: "I think my Ola driver is drunk", triggers: ["Safety Agent", "Emergency Mode", "Family Share Agent"], acceptableIntents: [] },
  { id: "2.8", message: "I'm hungry and it's 2 AM", triggers: ["Geo Agent", "Safety Agent"], acceptableIntents: [] },
  { id: "2.9", message: "Something doesn't feel right about my hotel room", triggers: ["Safety Agent", "Geo Agent", "Heart Agent"], acceptableIntents: [] },
  { id: "2.10", message: "Going back to hotel at 3 AM, will the gate be open?", triggers: ["Geo Agent", "Safety Agent"], acceptableIntents: [] },

  // === 3. Solo Female Traveler ===
  { id: "3.1", message: "I'm alone in a cab heading home, can you stay with me?", triggers: ["Safety Agent", "Family Share Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "3.2", message: "I want my parents to know I'm safe but they don't use smart apps", triggers: ["Family Share Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "3.3", message: "People keep staring at me, I feel uncomfortable", triggers: ["Safety Agent", "Heart Agent", "Geo Agent"], acceptableIntents: [] },
  { id: "3.4", message: "First time staying alone in a hotel, what should I know?", triggers: ["Memory Agent", "Safety Agent", "Heart Agent"], acceptableIntents: [] },
  { id: "3.5", message: "I'm a woman landing alone in Delhi at 2 AM", triggers: ["Safety Agent", "Family Share Agent", "Fare Guard", "Transit Agent"], acceptableIntents: [] },
  { id: "3.6", message: "I got my period and I'm not prepared, help", triggers: ["Geo Agent", "Heart Agent"], acceptableIntents: [] },
  { id: "3.7", message: "I feel weird eating alone at this restaurant", triggers: ["Heart Agent"], acceptableIntents: [] },
  { id: "3.8", message: "The hotel staff is being weird with me", triggers: ["Safety Agent", "Heart Agent", "Geo Agent", "Emergency Mode"], acceptableIntents: [] },
  { id: "3.9", message: "This bus is too crowded and I feel uncomfortable", triggers: ["Safety Agent", "Transit Agent", "Heart Agent"], acceptableIntents: [] },
  { id: "3.10", message: "I'm drained, this trip is too much", triggers: ["Heart Agent", "Memory Agent"], acceptableIntents: [] },

  // === 4. Family Travel ===
  { id: "4.1", message: "I'm traveling with my elderly parents, any tips?", triggers: ["Memory Agent", "Geo Agent", "Heart Agent"], acceptableIntents: [] },
  { id: "4.2", message: "My 5-year-old is throwing up in the car", triggers: ["Heart Agent", "Geo Agent", "Safety Agent"], acceptableIntents: [] },
  { id: "4.3", message: "My family of 6 got separated at the airport", triggers: ["Heart Agent", "Family Share Agent", "Geo Agent"], acceptableIntents: [] },
  { id: "4.4", message: "We need 2 hotel rooms for a family of 5 in Goa", triggers: ["Memory Agent", "Fare Guard", "Geo Agent"], acceptableIntents: [] },
  { id: "4.5", message: "My 13-year-old wants to walk around the mall alone", triggers: ["Heart Agent", "Family Share Agent"], acceptableIntents: [] },
  { id: "4.6", message: "My brother has autism, we're flying for the first time", triggers: ["Heart Agent", "Memory Agent", "Geo Agent"], acceptableIntents: [] },
  { id: "4.7", message: "I'm 7 months pregnant traveling with 2 kids", triggers: ["Heart Agent", "Geo Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "4.8", message: "My mom keeps forgetting where we are, she seems confused", triggers: ["Heart Agent", "Geo Agent", "Safety Agent"], acceptableIntents: [] },
  { id: "4.9", message: "Planning honeymoon, want something romantic but not too crazy", triggers: ["Memory Agent", "Fare Guard", "Geo Agent"], acceptableIntents: [] },
  { id: "4.10", message: "Planning a trip for 12 people across 3 generations", triggers: ["Memory Agent", "Fare Guard", "Geo Agent"], acceptableIntents: [] },

  // === 5. Emotional & Mental Support ===
  { id: "5.1", message: "I just moved here and I'm missing home already", triggers: ["Heart Agent", "Memory Agent", "Geo Agent"], acceptableIntents: [] },
  { id: "5.2", message: "I've traveled 4 weeks straight, I'm exhausted", triggers: ["Heart Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "5.3", message: "My chest feels tight and my heart is racing", triggers: ["Heart Agent", "Safety Agent"], acceptableIntents: [] },
  { id: "5.4", message: "I just got bad news from home, I can't think straight", triggers: ["Heart Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "5.5", message: "I have a big presentation tomorrow and I can't sleep", triggers: ["Heart Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "5.6", message: "I'm on a work trip but I hate my job and feel trapped", triggers: ["Heart Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "5.7", message: "I'm traveling alone after a breakup, feeling everything at once", triggers: ["Heart Agent", "Memory Agent", "Geo Agent"], acceptableIntents: [] },
  { id: "5.8", message: "I haven't talked to anyone in 3 days", triggers: ["Heart Agent", "Geo Agent"], acceptableIntents: [] },
  { id: "5.9", message: "Everyone here seems smarter than me, I don't belong", triggers: ["Heart Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "5.10", message: "Too many things to do, too many choices, I'm paralyzed", triggers: ["Heart Agent", "Geo Agent"], acceptableIntents: [] },

  // === 6. Money & Scam Protection ===
  { id: "6.1", message: "Auto driver says meter is broken, asking ₹500 for what should be ₹150", triggers: ["Fare Guard", "Safety Agent", "Geo Agent"], acceptableIntents: [] },
  { id: "6.2", message: "Hotel is charging me extra at checkout I wasn't told about", triggers: ["Fare Guard", "Memory Agent"], acceptableIntents: [] },
  { id: "6.3", message: "This restaurant menu has weird prices, no taxes listed", triggers: ["Fare Guard", "Geo Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "6.4", message: "ATM didn't give cash but money got debited from my account", triggers: ["Heart Agent", "Fare Guard", "Memory Agent"], acceptableIntents: [] },
  { id: "6.5", message: "Airport forex is giving me ₹78 per dollar when Google says ₹83", triggers: ["Fare Guard", "Memory Agent"], acceptableIntents: [] },
  { id: "6.6", message: "I think my Uber driver is taking a longer route", triggers: ["Fare Guard", "Transit Agent", "Safety Agent"], acceptableIntents: [] },
  { id: "6.7", message: "This shopkeeper is asking ₹1500 for a scarf, is that fair?", triggers: ["Fare Guard", "Memory Agent"], acceptableIntents: [] },
  { id: "6.8", message: "Hotel is charging me 25% in taxes, that seems high", triggers: ["Fare Guard", "Memory Agent"], acceptableIntents: [] },
  { id: "6.9", message: "They're charging me ₹150 for water and ₹80 for plain bread", triggers: ["Fare Guard", "Memory Agent"], acceptableIntents: [] },
  { id: "6.10", message: "Someone called saying my SIM will expire, asked for OTP", triggers: ["Safety Agent", "Emergency Mode", "Heart Agent"], acceptableIntents: [] },

  // === 7. Health & Emergencies ===
  { id: "7.1", message: "I have terrible stomach pain, throwing up, just ate at a road stall", triggers: ["Geo Agent", "Heart Agent", "Safety Agent"], acceptableIntents: [] },
  { id: "7.2", message: "My lips are swelling, I think I'm allergic to something", triggers: ["Safety Agent", "Geo Agent", "Heart Agent", "Emergency Mode"], acceptableIntents: [] },
  { id: "7.3", message: "I twisted my ankle 1 km from the road", triggers: ["Safety Agent", "Geo Agent", "Emergency Mode"], acceptableIntents: [] },
  { id: "7.4", message: "I have 103°F fever, just started 2 hours ago", triggers: ["Safety Agent", "Geo Agent", "Heart Agent"], acceptableIntents: [] },
  { id: "7.5", message: "I lost my bag with my BP medicines, what do I do?", triggers: ["Geo Agent", "Heart Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "7.6", message: "I don't want to be here anymore", triggers: ["Heart Agent", "Emergency Mode", "Safety Agent"], acceptableIntents: [] },
  { id: "7.7", message: "Feel dizzy, weak, been outside for 3 hours in the heat", triggers: ["Safety Agent", "Geo Agent", "Heart Agent"], acceptableIntents: [] },
  { id: "7.8", message: "I have an itchy red rash on my arms", triggers: ["Geo Agent", "Heart Agent"], acceptableIntents: [] },
  { id: "7.9", message: "I have a really bad toothache, can barely focus", triggers: ["Geo Agent", "Heart Agent"], acceptableIntents: [] },
  { id: "7.10", message: "My chest hurts and I'm scared it's a heart attack", triggers: ["Emergency Mode", "Safety Agent", "Geo Agent", "Heart Agent"], acceptableIntents: [] },

  // === 8. First-Time-in-City Moments ===
  { id: "8.1", message: "First time in Mumbai, feels overwhelming", triggers: ["Geo Agent", "Heart Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "8.2", message: "How do I get around in Delhi, there are too many options?", triggers: ["Transit Agent", "Geo Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "8.3", message: "When am I supposed to bargain and when not?", triggers: ["Fare Guard", "Memory Agent"], acceptableIntents: [] },
  { id: "8.4", message: "I don't want to offend anyone, what should I avoid?", triggers: ["Memory Agent", "Geo Agent"], acceptableIntents: [] },
  { id: "8.5", message: "How much should I tip in India?", triggers: ["Memory Agent", "Fare Guard"], acceptableIntents: [] },
  { id: "8.6", message: "Can I drink tap water in India?", triggers: ["Safety Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "8.7", message: "I'm completely lost in this market", triggers: ["Geo Agent", "Heart Agent"], acceptableIntents: [] },
  { id: "8.8", message: "I can't handle very spicy food, what do I order?", triggers: ["Memory Agent", "Geo Agent"], acceptableIntents: [] },
  { id: "8.9", message: "I'm here during Diwali, will anything be open?", triggers: ["Memory Agent", "Geo Agent"], acceptableIntents: [] },
  { id: "8.10", message: "I'm scared to use public bathrooms here", triggers: ["Geo Agent", "Heart Agent"], acceptableIntents: [] },

  // === 9. Daily Life Navigation ===
  { id: "9.1", message: "Need a café with good WiFi and quiet for work", triggers: ["Geo Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "9.2", message: "I need to do laundry but I'm in a hotel", triggers: ["Geo Agent", "Fare Guard"], acceptableIntents: [] },
  { id: "9.3", message: "Need a haircut, don't trust random salons", triggers: ["Geo Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "9.4", message: "I want to keep my workouts going while traveling", triggers: ["Geo Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "9.5", message: "Where can I find contact lens solution in Hyderabad?", triggers: ["Geo Agent"], acceptableIntents: [] },
  { id: "9.6", message: "I'm in a small town and can't find an ATM", triggers: ["Geo Agent", "Heart Agent"], acceptableIntents: [] },
  { id: "9.7", message: "Lost my phone, need a new SIM with same number", triggers: ["Geo Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "9.8", message: "I have a Zoom call in an hour and hotel WiFi is terrible", triggers: ["Geo Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "9.9", message: "What's happening tonight in Bangalore?", triggers: ["Geo Agent", "Memory Agent"], acceptableIntents: [] },
  { id: "9.10", message: "I need to send a package back home from India", triggers: ["Geo Agent", "Memory Agent"], acceptableIntents: [] },

  // === 10. Edge Cases & Rare Situations ===
  { id: "10.1", message: "I lost my passport, I'm a foreign tourist", triggers: ["Emergency Mode", "Geo Agent", "Heart Agent"], acceptableIntents: [] },
  { id: "10.2", message: "There's a protest going on and I'm stuck", triggers: ["Safety Agent", "Geo Agent", "Emergency Mode"], acceptableIntents: [] },
  { id: "10.3", message: "There's flooding and my hotel area is getting affected", triggers: ["Emergency Mode", "Safety Agent", "Geo Agent", "Family Share Agent"], acceptableIntents: [] },
  { id: "10.4", message: "Police are asking me questions and I'm scared", triggers: ["Emergency Mode", "Safety Agent", "Heart Agent", "Geo Agent"], acceptableIntents: [] },
  { id: "10.5", message: "My wallet got stolen, all my cards are gone", triggers: ["Emergency Mode", "Heart Agent", "Geo Agent"], acceptableIntents: [] },
  { id: "10.6", message: "My flight just got cancelled and I have a meeting tomorrow", triggers: ["Transit Agent", "Memory Agent", "Heart Agent"], acceptableIntents: [] },
  { id: "10.7", message: "My dog is throwing up and seems weak, I'm in a new city", triggers: ["Geo Agent", "Heart Agent", "Safety Agent"], acceptableIntents: [] },
  { id: "10.8", message: "Elevator stopped between floors, I'm stuck", triggers: ["Emergency Mode", "Safety Agent", "Heart Agent", "Family Share Agent"], acceptableIntents: [] },
  { id: "10.9", message: "I just saw an accident, what should I do?", triggers: ["Emergency Mode", "Safety Agent", "Geo Agent", "Heart Agent"], acceptableIntents: [] },
  { id: "10.10", message: "I don't know what I'm doing with my life", triggers: ["Heart Agent", "Memory Agent"], acceptableIntents: [] },
];

// Compute acceptable intents from triggers
for (const uc of USE_CASES) {
  uc.acceptableIntents = deriveAcceptableIntents(uc.triggers);
}

// ──────────────────────────────────────────────────────────────────────── //

const DELAY_BETWEEN_CALLS_MS = 2000; // Stay under 15 RPM free tier
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 15000; // Longer pause between batches

async function runTests() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         Hita — 100 Use Case Intent Classification Test    ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  let passed = 0;
  let failed = 0;
  let errors = 0;
  const failures: { id: string; message: string; expected: string; got: string }[] = [];

  for (let i = 0; i < USE_CASES.length; i++) {
    const uc = USE_CASES[i]!;

    // Batch pause every BATCH_SIZE calls
    if (i > 0 && i % BATCH_SIZE === 0) {
      console.log(`\n⏳ Batch pause (${BATCH_DELAY_MS / 1000}s) to respect rate limits...\n`);
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }

    try {
      const result = await classifyIntent(uc.message);
      const isPass = uc.acceptableIntents.includes(result.intent);

      if (isPass) {
        passed++;
        console.log(`✅ ${uc.id} → ${result.intent} (${result.confidence}) | "${uc.message.slice(0, 50)}"`);
      } else {
        failed++;
        const expectedStr = uc.acceptableIntents.join("|");
        console.log(`❌ ${uc.id} → ${result.intent} (${result.confidence}) expected [${expectedStr}] | "${uc.message.slice(0, 50)}"`);
        failures.push({ id: uc.id, message: uc.message, expected: expectedStr, got: result.intent });
      }
    } catch (err: any) {
      errors++;
      console.log(`💥 ${uc.id} → ERROR: ${err.message?.slice(0, 80)} | "${uc.message.slice(0, 50)}"`);
    }

    // Delay between calls
    if (i < USE_CASES.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_CALLS_MS));
    }
  }

  // ── Summary ──
  console.log("\n" + "═".repeat(60));
  console.log("RESULTS SUMMARY");
  console.log("═".repeat(60));
  console.log(`Total:   ${USE_CASES.length}`);
  console.log(`Passed:  ${passed} (${((passed / USE_CASES.length) * 100).toFixed(1)}%)`);
  console.log(`Failed:  ${failed} (${((failed / USE_CASES.length) * 100).toFixed(1)}%)`);
  console.log(`Errors:  ${errors}`);
  console.log("═".repeat(60));

  if (failures.length > 0) {
    console.log("\nFAILURES:");
    for (const f of failures) {
      console.log(`  ${f.id}: "${f.message.slice(0, 60)}" → got ${f.got}, expected [${f.expected}]`);
    }
  }
}

runTests().catch(console.error);
