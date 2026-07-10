/**
 * Places Route — GET /places/:placeId
 *
 * Returns detailed place info + LLM-generated insights (history, things to do,
 * time-aware suggestion, nearby recommendations).
 */

import { FastifyInstance } from "fastify";
import { getPlaceDetails, findNearbyPlaces } from "../services/integrations/googlePlaces.js";
import { reverseGeocode } from "../services/integrations/nominatim.js";
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
  server.get<{ Querystring: { lat: string; lng: string } }>(
    "/places/nearby",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["lat", "lng"],
          properties: {
            lat: { type: "string" },
            lng: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const lat = Number(request.query.lat);
      const lng = Number(request.query.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return reply.code(400).send({ error: "Invalid coordinates" });
      }

      try {
        const [location, attractions, food] = await Promise.all([
          reverseGeocode(lat, lng).catch(() => null),
          findNearbyPlaces(lat, lng, "tourist_attraction", 5000).catch(() => []),
          findNearbyPlaces(lat, lng, "restaurant", 3000).catch(() => []),
        ]);

        const seen = new Set<string>();
        const places = [...attractions, ...food]
          .filter((p) => {
            if (!p.photoUrl || !p.rating || seen.has(p.placeId)) return false;
            seen.add(p.placeId);
            return true;
          })
          .slice(0, 8)
          .map((p) => ({
            placeId: p.placeId,
            name: p.name,
            address: p.address,
            rating: p.rating,
            totalRatings: p.totalRatings,
            photoUrl: p.photoUrl,
            isOpen: p.isOpen,
          }));

        return {
          city: location?.city ?? null,
          state: location?.state ?? null,
          places,
        };
      } catch (err) {
        request.log.error(err, "Failed to fetch nearby places");
        return reply.code(500).send({ error: "Failed to fetch nearby places" });
      }
    }
  );

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
