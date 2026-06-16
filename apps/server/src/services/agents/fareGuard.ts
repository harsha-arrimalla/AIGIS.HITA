/**
 * Fare Guard Agent
 *
 * Detects overcharging by comparing quoted/paid fares against city benchmarks.
 * Also flags common transport scams.
 */

import type { Agent, RequestContext, FareBenchmark } from "../../types/agent.js";

// -------------------------------------------------------------------------- //
//                              TYPES                                          //
// -------------------------------------------------------------------------- //

export interface FareGuardInput {
  quotedAmount?: number;
  from?: string;
  to?: string;
  mode?: string;
}

export interface FareGuardOutput {
  verdict: "fair" | "slightly_high" | "overcharged" | "scam_likely" | "unknown";
  expectedRange?: { min: number; max: number; currency: string };
  quotedAmount?: number;
  overchargePercent?: number;
  advice: string;
  matchedBenchmark?: FareBenchmark;
  scamAlerts: string[];
  error?: string;
}

// -------------------------------------------------------------------------- //
//                              AGENT                                          //
// -------------------------------------------------------------------------- //

export const fareGuard: Agent<FareGuardInput, FareGuardOutput> = {
  name: "fareGuard",

  async run(input, context) {
    const { quotedAmount, from, to, mode } = input;

    try {
      // Step 1: Find matching fare benchmark
      const benchmark = findBenchmark(from, to, mode, context);

      // Step 2: Check for scam alerts in the area
      const scamAlerts = findScamAlerts(from, to, context);

      // Step 3: Determine verdict
      if (!benchmark) {
        return {
          verdict: "unknown",
          quotedAmount,
          advice: generateGenericAdvice(mode, from, scamAlerts),
          scamAlerts: scamAlerts.map((s) => s.description),
        };
      }

      const expectedRange = {
        min: benchmark.expectedFareMin,
        max: benchmark.expectedFareMax,
        currency: benchmark.currency,
      };

      if (!quotedAmount) {
        return {
          verdict: "fair",
          expectedRange,
          advice: `Expected fare for this route by ${mode || "cab"}: ₹${expectedRange.min}–₹${expectedRange.max}.`,
          matchedBenchmark: benchmark,
          scamAlerts: scamAlerts.map((s) => s.description),
        };
      }

      // Calculate overcharge
      const overchargePercent = Math.round(
        ((quotedAmount - expectedRange.max) / expectedRange.max) * 100
      );

      let verdict: FareGuardOutput["verdict"];
      let advice: string;

      if (quotedAmount <= expectedRange.max) {
        verdict = "fair";
        advice = `₹${quotedAmount} is within the expected range (₹${expectedRange.min}–₹${expectedRange.max}). Fair price.`;
      } else if (overchargePercent <= 20) {
        verdict = "slightly_high";
        advice = `₹${quotedAmount} is about ${overchargePercent}% above the usual fare (₹${expectedRange.min}–₹${expectedRange.max}). Might be surge pricing — try negotiating or check Ola/Uber.`;
      } else if (overchargePercent <= 80) {
        verdict = "overcharged";
        advice = `₹${quotedAmount} is ${overchargePercent}% above the fair price (₹${expectedRange.min}–₹${expectedRange.max}). Don't pay this. Use a metered ride or app-based cab instead.`;
      } else {
        verdict = "scam_likely";
        advice = `₹${quotedAmount} is ${overchargePercent}% above fair price — this is almost certainly a scam. The real fare should be ₹${expectedRange.min}–₹${expectedRange.max}. Walk away and book an Ola/Uber.`;
      }

      return {
        verdict,
        expectedRange,
        quotedAmount,
        overchargePercent: Math.max(0, overchargePercent),
        advice,
        matchedBenchmark: benchmark,
        scamAlerts: scamAlerts.map((s) => s.description),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fare check failed";
      console.error("[fareGuard] Error:", message);
      return {
        verdict: "unknown",
        advice: "I couldn't check the fare for this route. Use an app-based cab to be safe.",
        scamAlerts: [],
        error: message,
      };
    }
  },
};

// -------------------------------------------------------------------------- //
//                           HELPERS                                           //
// -------------------------------------------------------------------------- //

function findBenchmark(
  from: string | undefined,
  to: string | undefined,
  mode: string | undefined,
  context: RequestContext
): FareBenchmark | undefined {
  if (!context.cityData?.fareBenchmarks || !from || !to) return undefined;

  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  return context.cityData.fareBenchmarks.find((b) => {
    const bFrom = b.from.toLowerCase();
    const bTo = b.to.toLowerCase();
    const modeMatch = !mode || b.mode.toLowerCase() === mode.toLowerCase();

    return (
      modeMatch &&
      (fromLower.includes(bFrom) || bFrom.includes(fromLower)) &&
      (toLower.includes(bTo) || bTo.includes(toLower))
    );
  });
}

function findScamAlerts(
  from: string | undefined,
  to: string | undefined,
  context: RequestContext
) {
  if (!context.cityData?.scamAlerts) return [];

  return context.cityData.scamAlerts.filter((alert) => {
    if (alert.area === "City-wide") return true;

    const areaLower = alert.area.toLowerCase();
    const fromMatch = from && (from.toLowerCase().includes(areaLower) || areaLower.includes(from.toLowerCase()));
    const toMatch = to && (to.toLowerCase().includes(areaLower) || areaLower.includes(to.toLowerCase()));

    return fromMatch || toMatch;
  });
}

function generateGenericAdvice(
  mode: string | undefined,
  from: string | undefined,
  scamAlerts: Array<{ description: string }>
): string {
  const parts: string[] = [];

  if (mode === "auto") {
    parts.push("Always insist on the meter for autos. If they refuse, walk away and find another.");
  } else {
    parts.push("Use Ola/Uber for transparent pricing. If taking a local cab, agree on the fare before getting in.");
  }

  if (scamAlerts.length > 0) {
    parts.push(`Watch out: ${scamAlerts[0].description}`);
  }

  return parts.join(" ");
}
