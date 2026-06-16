# Hita Backend — Implementation Plan

> Living document. Updated as we build. ✅ = done.

---

## Smoke Test Scenarios (Validation Gates)

After every phase, these 3 curl commands must produce reasonable output:

```bash
# Scenario 1: Airport arrival (Geo + Safety + Transit + Fare + Brain)
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I just landed at Hyderabad airport, going to Trident Hotel", "sessionId": "smoke-1"}'

# Scenario 2: Emotional + Safety (Heart + Safety + Brain)
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "It'\''s late and I feel scared walking alone", "sessionId": "smoke-2"}'

# Scenario 3: Simple geo query (Geo + Brain)
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Find a quiet cafe nearby", "sessionId": "smoke-3"}'
```

**Rule:** If these don't work after a phase, don't move to the next phase. Fix first.

**Status:** All 3 smoke tests verified with live API calls ✅

---

## Phase 1: Foundation ✅

> Goal: Server starts, types exist, DB schema is ready, prompts define the product, minimal city data is in place.

- [x] `npm init` + install core dependencies
  - fastify, @fastify/cors, @fastify/helmet, fastify-raw-body
  - typescript, tsx, @types/node
  - @supabase/supabase-js (replaced Prisma direct connection)
  - @anthropic-ai/sdk, @google/generative-ai
  - @upstash/redis
  - zod (input validation)
  - dotenv
- [x] `tsconfig.json` — strict mode, ES2022 target, NodeNext module
- [x] `package.json` scripts — `dev`, `build`, `start`, `typecheck`, `test`, `test:watch`
- [x] `.env.example` — all required + optional env vars documented
- [x] `.gitignore` — node_modules, .env, dist, prisma/*.db
- [x] `src/server.ts` — Fastify entry point with CORS, helmet, error handler, graceful shutdown
- [x] `GET /health` endpoint — `{ status: "ok", uptime: N }`
- [x] `GET /health/ready` — deep health check (Supabase + Redis + Gemini)
- [x] `src/types/agent.ts` — `Agent<TInput, TOutput>` interface, `RequestContext`
- [x] `src/types/chat.ts` — `SessionData`, `MessageType`, `ChatRequest`, `ChatResponse`
- [x] `src/types/api.ts` — API request/response shapes
- [x] `prisma/schema.prisma` — full DB schema (15 models)
- [x] `src/prompts/hita.system.ts` — v0 system prompt (personality, tone, guardian rules)
- [x] `src/prompts/intentClassifier.ts` — v0 classification prompt with all intents + examples
- [x] `src/data/cities/hyderabad.json` — safety, fare, scam data

---

## Phase 2: The Brain ✅

> Goal: Messages go in, classified intent comes out, Brain composes a reply using memory context.

- [x] `src/lib/redis.ts` — Upstash Redis client wrapper (graceful fallback if unavailable)
- [x] `src/services/llm.ts` — Gemini + Anthropic client wrappers with timeout, error handling
- [x] `src/services/intentClassifier.ts` — Gemini Flash call, returns `{ intent, entities, confidence }`
- [x] `src/services/contextManager.ts` — builds dynamic system prompt from user profile + memory + city data
- [x] `src/services/agents/memoryAgent.ts` — in-memory + Redis + Supabase DB 3-tier conversation history
- [x] `src/services/agents/hitaBrain.ts` — full version: takes agent outputs + system prompt → composes reply via Gemini
- [x] `src/services/orchestrator.ts` — master router: classify → fetch context → dispatch agents → compose via Brain
- [x] Wire `POST /chat` endpoint (`src/routes/chat.ts`)
- [x] `SKIP_AUTH=true` env flag for dev (blocked in production)

---

## Phase 3: Agents ✅

> Goal: Add agents incrementally. Each one tested via `/chat`.

### 3a: Weather Agent ✅
- [x] `src/services/integrations/openWeather.ts` — OpenWeather API client (10s timeout)
- [x] `src/services/agents/weatherAgent.ts` — fetches weather, returns structured JSON
- [x] Register in orchestrator for `WEATHER` intent

### 3b: Geo Agent ✅
- [x] `src/services/integrations/googlePlaces.ts` — Google Places API client (10s timeout)
- [x] `src/services/integrations/nominatim.ts` — OpenStreetMap geocoding fallback (10s timeout)
- [x] `src/services/agents/geoAgent.ts` — resolve locations, find nearby places
- [x] `src/prompts/geo.ts` — JSON output format prompt
- [x] Register in orchestrator for `GEO` intent

### 3c: Safety Agent ✅
- [x] `src/services/agents/safetyAgent.ts` — safety scoring using city JSON data + time of day
- [x] `src/prompts/safety.ts` — safety reasoning prompt
- [x] Register in orchestrator for `SAFETY` intent

### 3d: Transit Agent ✅
- [x] `src/services/integrations/tomtom.ts` — TomTom routing API client (10s timeout)
- [x] `src/services/agents/transitAgent.ts` — route finding, ETA, transport options
- [x] Register in orchestrator for `TRANSIT` intent

### 3e: Fare Guard ✅
- [x] `src/services/agents/fareGuard.ts` — fare benchmarks lookup, overcharge detection
- [x] Register in orchestrator (co-triggered with `TRANSIT`)

### 3f: Heart Agent ✅
- [x] `src/services/agents/heartAgent.ts` — emotional support, distress detection, affirmations
- [x] Register in orchestrator for `EMOTIONAL` intent

### After all 3a–3f: ✅
- [x] Full Hita Brain — nuanced composition across all agent outputs
- [x] All 3 smoke tests produce multi-agent responses

---

## Phase 4: Auth, Credits & Payments ✅

> Goal: Production-ready API with authentication, rate limiting, and monetization.

- [x] `src/lib/auth.ts` — Supabase JWT verification middleware (return on failure, blocked in prod)
- [x] `src/routes/auth.ts` — `GET /auth/me`
- [x] Wire auth middleware to `/chat` (respects `SKIP_AUTH=true` in dev only)
- [x] `src/lib/rateLimit.ts` — per-user rate limiting via Redis (returns on 429)
- [x] `src/routes/credits.ts` — `GET /credits/:userId`, `POST /credits/purchase`
- [x] `src/services/integrations/razorpay.ts` — Razorpay client (timingSafeEqual signature verification)
- [x] `POST /webhooks/razorpay` — payment confirmation → credit top-up (uses rawBody)
- [x] Deduct credits per `/chat` call, return `creditsUsed` and `creditsRemaining` in response
- [x] Atomic credit operations with `.gte()` guard to prevent race conditions
- [x] `src/lib/supabase.ts` — Supabase JS client for credits, conversations, messages

---

## Phase 5: Seed Data ✅

> Goal: Safety, fare, and scam data for 3 major Indian cities.

- [x] `src/data/cities/delhi.json` — safety zones, fare benchmarks, scam alerts
- [x] `src/data/cities/bangalore.json` — same structure
- [x] `src/data/cities/hyderabad.json` — full data
- [x] `prisma/seed.ts` — loads cities + affirmations + emotional scripts

---

## Phase 6: Prompt Refinement (ongoing)

> Goal: Hita sounds like Hita — warm, protective, specific, not generic AI.

- [x] Fixed intent classifier — removed 0.6 confidence threshold that caused false GENERAL classifications
- [x] Fixed geo agent — uses city from context as fallback for better results
- [x] Brain switched from Claude to Gemini — single LLM provider
- [ ] Test with 10+ varied user messages beyond the 3 smoke tests
- [ ] Get feedback from a real person on conversation quality

---

## Phase 7: Testing ✅

> Goal: Confidence that nothing breaks when you ship.

- [x] `tests/agents/weatherAgent.test.ts`
- [x] `tests/agents/geoAgent.test.ts`
- [x] `tests/agents/safetyAgent.test.ts`
- [x] `tests/agents/transitAgent.test.ts`
- [x] `tests/agents/fareGuard.test.ts`
- [x] `tests/agents/heartAgent.test.ts`
- [x] `tests/agents/memoryAgent.test.ts`
- [x] `tests/agents/hitaBrain.test.ts`
- [x] `tests/e2e/chatFlow.test.ts`
- [x] `tests/e2e/intentClassifier.test.ts`
- [x] CI: GitHub Actions — typecheck + test on every push (`.github/workflows/ci.yml`)
- **Result:** 88 tests across 10 files, all passing

---

## Production Hardening ✅ (added post-plan)

> Security and reliability fixes applied after initial build.

- [x] `@fastify/helmet` — security headers
- [x] `fastify-raw-body` — webhook signature verification with actual raw bytes
- [x] `crypto.timingSafeEqual` — timing-attack-safe HMAC comparison
- [x] CORS restricted to allowlist in production
- [x] `SKIP_AUTH` blocked when `NODE_ENV=production`
- [x] Auth user ID takes precedence over body userId (prevents account takeover)
- [x] Rate limiter returns after 429 (was a no-op before)
- [x] Auth middleware returns after 401 (was falling through before)
- [x] 10s `AbortSignal.timeout` on all external API calls
- [x] Bounded in-memory Maps — LRU eviction at 10k sessions / 50k users
- [x] Atomic credit deduction with `.gte()` guard (prevents race condition)
- [x] Deep health check at `/health/ready` (Supabase + Redis + Gemini)
- [x] `unhandledRejection` + `uncaughtException` process handlers
- [x] Graceful shutdown with 15s drain timeout
- [x] Failed agent dispatches logged via `runAgentsParallel`
- [x] Credit deduction return value checked in chat route
- [x] Env var name fixed: `NEXT_PUBLIC_SUPABASE_URL` → `SUPABASE_URL`
- [x] `maxTokens` now passed to Gemini via `generationConfig`
- [x] Credit transactions loaded from Supabase in `GET /credits/:userId`
- [x] Conversation history hydrated from Supabase DB on cold start

---

## Deferred to v2.0+

These are explicitly out of scope for v1.0. Do not build them.

- [ ] Relocation Agent (`relocationAgent.ts`)
- [ ] Corridor data (`india_usa.json`, `india_germany.json`, `india_uk.json`)
- [ ] Stripe integration (international payments)
- [ ] Voice Agent (`voiceAgent.ts`) — moved to v1.5, users will type first
- [ ] Family Share Agent (`familyShareAgent.ts`) — WhatsApp/SMS alerts, needs business API approval

---

## Dependencies & API Keys

| Service | What For | Status |
|---------|----------|--------|
| Google Gemini Flash | Brain + intent classification + all agents | ✅ Configured |
| Supabase | Postgres DB + Auth | ✅ Configured |
| Upstash Redis | Sessions, rate limiting, cache | ⚠️ Optional (graceful fallback) |
| Google Maps/Places | Location resolution | ✅ Configured |
| TomTom | Transit routing | ✅ Configured |
| OpenWeather | Weather data | ✅ Configured |
| Razorpay | Indian payments | ⚠️ Needs test keys |
| Anthropic Claude | Available but unused (Gemini preferred) | ⚠️ Optional |

---

## Decision Log

| Date | Decision | Reason |
|------|----------|--------|
| Day 0 | Skip Voice Agent for v1.0 | Users type first, voice adds complexity |
| Day 0 | Skip Family Share for v1.0 | Needs WhatsApp Business API approval (slow) |
| Day 0 | Skip Relocation Agent for v1.0 | v2.0 feature, not core to initial value prop |
| Day 0 | Prompts in Phase 1, not Phase 6 | Prompts are architecture, not polish |
| Day 0 | Hita Brain stub before other agents | Enables end-to-end testing per agent |
| Day 0 | Weather Agent first after Brain | Simplest agent, validates the pattern |
| Day 0 | /chat wired in Phase 2, not Phase 4 | Shortens feedback loop to real curl tests |
| Day 0 | SKIP_AUTH=true flag | Test AI responses without JWT setup |
| Day 0 | Hyderabad data in Phase 1 | Safety Agent needs it, don't delay |
| Later | Brain switched from Claude to Gemini | User preferred single LLM provider, no paid Anthropic key |
| Later | Supabase JS client instead of Prisma | Supabase pooler connection failed across AWS regions |
| Later | Removed intent classifier confidence threshold | 0.6 threshold caused too many GENERAL fallbacks |
| Later | Production hardening pass | 18 security/reliability fixes applied post-build |

---

*Last updated: Phase 7 complete + production hardening. v1.0 ready to deploy.*
