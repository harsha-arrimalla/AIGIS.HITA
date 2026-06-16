/**
 * Places Route — GET /places/:placeId
 *
 * Returns detailed place info + LLM-generated insights (history, things to do,
 * time-aware suggestion, nearby recommendations).
 */

import { FastifyInstance } from "fastify";
import { getPlaceDetails, findNearbyPlaces } from "../services/integrations/googlePlaces.js";
import { callGemini } from "../services/llm.js";

const placeInsightPrompt = (
  name: string,
  address: string,
  types: string[],
  hour: number,
  city: string
) => `You are Hita, a knowledgeable local travel companion. Given a place, return a JSON object with these fields:

- "history": 2-3 sentences about the place's history, cultural significance, or interesting backstory. Be specific to THIS place, not generic.
- "thingsToDo": Array of 3-4 short strings — specific activities/experiences at or around this place.
- "timeSuggestion": A friendly, time-aware suggestion based on the current hour (${hour}:00). Examples: "It's late afternoon — perfect time for chai at the rooftop cafe" or "Morning visit? Start with the sunrise view". Be creative and specific to the place type.
- "vibe": A 3-5 word phrase capturing the place's vibe (e.g., "Bustling street food heaven", "Peaceful lakeside retreat")

Place: "${name}"
Address: "${address}"
Types: ${types.join(", ")}
City: ${city}
Current hour: ${hour}:00

Return ONLY valid JSON, no markdown.`;

export async function placesRoute(server: FastifyInstance) {
  server.get<{ Params: { placeId: string }; Querystring: { lat?: string; lng?: string } }>(
    "/places/:placeId",
    {
      schema: {
        params: {
          type: "object",
          required: ["placeId"],
          properties: { placeId: { type: "string" } },
        },
        querystring: {
          type: "object",
          properties: {
            lat: { type: "string" },
            lng: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { placeId } = request.params;

      try {
        // Fetch details from Google
        const details = await getPlaceDetails(placeId);
        if (!details) {
          return reply.code(404).send({ error: "Place not found" });
        }

        // Extract city from address
        const addressParts = details.address.split(",").map((s) => s.trim());
        const city = addressParts.length >= 3
          ? addressParts[addressParts.length - 3]
          : addressParts[addressParts.length - 1];

        const currentHour = new Date().getHours();

        // Run LLM insights + nearby search in parallel
        const [insightsRaw, nearbyPlaces] = await Promise.all([
          callGemini({
            prompt: placeInsightPrompt(
              details.name,
              details.address,
              details.types,
              currentHour,
              city
            ),
            temperature: 0.7,
            maxTokens: 512,
          }),
          findNearbyPlaces(details.lat, details.lng, "point_of_interest", 800).catch(() => []),
        ]);

        // Parse LLM response
        let insights = { history: "", thingsToDo: [] as string[], timeSuggestion: "", vibe: "" };
        try {
          const cleaned = insightsRaw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
          insights = JSON.parse(cleaned);
        } catch {
          insights.history = details.editorialSummary || "A notable local spot worth visiting.";
          insights.thingsToDo = ["Explore the area", "Take photos", "Try local food"];
          insights.timeSuggestion = "A great time to visit!";
          insights.vibe = "Local favourite";
        }

        // Filter out the place itself from nearby
        const nearby = nearbyPlaces
          .filter((p) => p.placeId !== placeId)
          .slice(0, 4);

        return {
          ...details,
          insights,
          nearby,
        };
      } catch (err) {
        request.log.error(err, "Failed to fetch place details");
        return reply.code(500).send({ error: "Failed to fetch place details" });
      }
    }
  );
}
