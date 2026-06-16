# Hita Backend

> AI guardian companion for anyone in an unfamiliar place — backend services, agents, and orchestration.

The Hita backend is a Fastify (Node.js + TypeScript) server that orchestrates 12 specialised AI agents to power conversational responses across web, Android, and iOS clients. This README documents how to set it up, how it's structured, and how to extend it.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [The Agent System](#the-agent-system)
- [Orchestration Flow](#orchestration-flow)
- [API Endpoints](#api-endpoints)
- [Database](#database)
- [Adding a New Agent](#adding-a-new-agent)
- [Adding a New Intent](#adding-a-new-intent)
- [System Prompts](#system-prompts)
- [Local Development](#local-development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/harsha-arrimalla/hita.git
cd hita/backend
npm install

# Set up environment variables
cp .env.example .env
# Fill in your API keys (see Environment Variables section)

# Set up the database
npx prisma migrate dev
npx prisma db seed

# Start the dev server
npm run dev
```

The server starts on `http://localhost:3000`. Test it:

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I just landed at Hyderabad airport", "sessionId": "test-1"}'
```

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript | Type safety across agents and prompts |
| Framework | Fastify | Faster than Express, great for streaming AI responses |
| AI (Brain) | Anthropic Claude | Best for nuanced conversational replies |
| AI (Cheap calls) | Google Gemini 2.0 Flash | Intent classification, voice transcription |
| Database | Postgres (via Supabase) | JSONB for memory, full-text search built-in |
| ORM | Prisma | Type-safe queries, smooth migrations |
| Cache | Upstash Redis | Sessions, rate limiting, agent response cache |
| File storage | Cloudflare R2 | Voice recordings, generated PDFs, document vault |
| Hosting | Railway / Fly.io | Auto-deploy from GitHub |

---

## Project Structure

```
backend/
├── src/
│   ├── server.ts                  # Fastify entry point — starts server, auto-seeds DB
│   ├── routes/
│   │   ├── chat.ts                # POST /chat and POST /voice endpoints
│   │   ├── auth.ts                # Auth-related routes (Supabase JWT verification)
│   │   ├── credits.ts             # Credit balance, purchase endpoints
│   │   └── health.ts              # GET /health for uptime monitoring
│   ├── services/
│   │   ├── orchestrator.ts        # Master router — the brain that calls all agents
│   │   ├── intentClassifier.ts    # Routes messages to the right agent
│   │   ├── llm.ts                 # Anthropic + Gemini client wrappers
│   │   ├── contextManager.ts      # Builds dynamic system prompt per request
│   │   │
│   │   ├── agents/
│   │   │   ├── hitaBrain.ts       # Composes the final reply (always last)
│   │   │   ├── safetyAgent.ts     # Safety scoring for routes/areas/times
│   │   │   ├── geoAgent.ts        # Location resolution + nearby places
│   │   │   ├── transitAgent.ts    # Route finding via TomTom
│   │   │   ├── weatherAgent.ts    # Weather context
│   │   │   ├── fareGuard.ts       # Overcharge detection
│   │   │   ├── heartAgent.ts      # Emotional support and distress handling
│   │   │   ├── voiceAgent.ts      # Audio transcription via Gemini multimodal
│   │   │   ├── memoryAgent.ts     # Recalls past conversations + user facts
│   │   │   ├── relocationAgent.ts # Ring 3: visa + neighbourhood plans (v2.0+)
│   │   │   └── familyShareAgent.ts # WhatsApp/SMS family alerts
│   │   │
│   │   └── integrations/
│   │       ├── googlePlaces.ts    # Google Places API client
│   │       ├── nominatim.ts       # OpenStreetMap geocoding
│   │       ├── openWeather.ts     # Weather API client
│   │       ├── tomtom.ts          # Routing API client
│   │       ├── razorpay.ts        # Indian payments
│   │       ├── stripe.ts          # International payments (v2.0+)
│   │       ├── whatsapp.ts        # WhatsApp Business API
│   │       └── resend.ts          # Transactional email
│   │
│   ├── prompts/
│   │   ├── hita.system.ts         # Main personality prompt (the soul of Hita)
│   │   ├── intentClassifier.ts    # Intent classification prompt
│   │   ├── safety.ts              # Safety agent prompt
│   │   ├── relocation.ts          # Relocation agent prompt (v2.0+)
│   │   └── geo.ts                 # Geo agent JSON output format
│   │
│   ├── data/
│   │   ├── cities/                # Per-city safety, fare, scam data
│   │   │   ├── hyderabad.json
│   │   │   ├── delhi.json
│   │   │   ├── bangalore.json
│   │   │   └── ...
│   │   └── corridors/             # Abroad corridor data (v2.0+)
│   │       ├── india_usa.json
│   │       ├── india_germany.json
│   │       └── india_uk.json
│   │
│   ├── types/
│   │   ├── chat.ts                # SessionData, MessageType definitions
│   │   ├── agent.ts               # Agent input/output contracts
│   │   └── api.ts                 # API request/response shapes
│   │
│   └── lib/
│       ├── redis.ts               # Upstash Redis client
│       ├── auth.ts                # JWT verification middleware
│       └── rateLimit.ts           # Per-user rate limiting
│
├── prisma/
│   ├── schema.prisma              # Database schema (single source of truth)
│   ├── migrations/                # Auto-generated migration history
│   └── seed.ts                    # Seeds initial city + safety data
│
├── tests/
│   ├── agents/                    # Per-agent unit tests
│   └── e2e/                       # End-to-end flow tests
│
├── .env.example                   # Template for required env vars
├── package.json
├── tsconfig.json
└── README.md                      # ← you are here
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# === REQUIRED ===

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...        # Main Hita Brain
GEMINI_API_KEY=...                  # Intent + voice (cheap, fast)

# Database
DATABASE_URL=postgresql://...       # Supabase Postgres connection string

# Auth
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...       # Server-only, never expose

# Maps & Location
GOOGLE_MAPS_API_KEY=...             # Places + geocoding
TOMTOM_API_KEY=...                  # Transit routing

# Weather
OPENWEATHER_API_KEY=...

# Payments
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Communications
WHATSAPP_API_KEY=...                # Via Gupshup or Meta Cloud API
WHATSAPP_PHONE_NUMBER_ID=...
RESEND_API_KEY=re_...

# Cache
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Server
PORT=3000
NODE_ENV=development                # development | staging | production
LOG_LEVEL=info                      # debug | info | warn | error

# === OPTIONAL (graceful fallback if missing) ===
SENTRY_DSN=...                      # Error tracking
POSTHOG_API_KEY=...                 # Analytics
STRIPE_SECRET_KEY=sk_test_...       # International payments (v2.0+)
```

> **Security:** Never commit `.env` to Git. The `.gitignore` already excludes it. Use Doppler or Vercel environment variables for production secrets.

---

## The Agent System

Hita is built as 12 specialised agents. Each agent has **one job**, calls **0–N external APIs**, and returns **structured JSON**. They're composed by the orchestrator into a coherent response.

| # | Agent | Responsibility |
|---|---|---|
| 1 | Intent Classifier | Routes incoming messages to the right agents |
| 2 | Hita Brain | Composes the final natural-language reply |
| 3 | Safety Agent | Assesses safety of route, area, time of day |
| 4 | Geo Agent | Resolves locations, finds nearby places |
| 5 | Transit Agent | Best route from A to B |
| 6 | Weather Agent | Adds weather context |
| 7 | Fare Guard | Detects overcharging and scams |
| 8 | Heart Agent | Handles distress, anxiety, loneliness |
| 9 | Voice Agent | Transcribes audio + replies |
| 10 | Memory Agent | Recalls past conversations and user facts |
| 11 | Relocation Agent | Generates abroad moving plans (v2.0+) |
| 12 | Family Share Agent | Trusted contact alerts via WhatsApp/SMS |

### Agent Contract

Every agent implements the same interface for consistency:

```ts
interface Agent<TInput, TOutput> {
  name: string;
  run(input: TInput, context: RequestContext): Promise<TOutput>;
}
```

This means agents are interchangeable, mockable in tests, and easy to add. See `src/types/agent.ts` for the full contract.

---

## Orchestration Flow

Every user message goes through the same 7-step lifecycle. The implementation lives in `src/services/orchestrator.ts`.

```
1. RECEIVE    User message arrives at /chat endpoint
2. CLASSIFY   Intent Classifier identifies type (TRANSIT, SAFETY, EMOTIONAL, ...)
3. CONTEXT    Memory Agent fetches relevant past context from DB
4. DISPATCH   Orchestrator calls 1–N specialist agents in parallel
5. ENRICH     Each agent calls external APIs, returns structured data
6. COMPOSE    Hita Brain takes all outputs + system prompt → final reply
7. RETURN     Response sent to client: text + structured uiAction
```

### Example Trace — "I just landed at Hyderabad airport, going to Trident Hotel"

```
Step 1  RECEIVE     POST /chat with the message
Step 2  CLASSIFY    intent: TRANSIT
                    entities: { from: "HYD airport", to: "Trident Hotel" }
Step 3  CONTEXT     User profile: solo female, name "Nikita"
Step 4  DISPATCH    Calls in parallel:
                    - Geo Agent      → resolve "Trident Hotel" coords
                    - Transit Agent  → find route options
                    - Safety Agent   → check time of day, area
                    - Fare Guard     → expected fare for HYD → Hitech City
Step 5  ENRICH      All 4 agents return JSON
Step 6  COMPOSE     Hita Brain greets Nikita, suggests taxi (safety + traffic),
                    shows fare range, offers family-share option
Step 7  RETURN      { reply: "Hi Nikita...", uiAction: { type: "TransitCard", ... } }
```

---

## API Endpoints

### `POST /chat`

The main conversation endpoint. Used by web and mobile clients.

**Request:**
```json
{
  "message": "I just landed at Hyderabad airport",
  "sessionId": "uuid-here",
  "userId": "supabase-user-id"
}
```

**Response:**
```json
{
  "reply": "Hi Nikita! Welcome to Hyderabad. How can I help you today?",
  "uiAction": {
    "type": "AirportSelector",
    "options": [{ "code": "HYD", "name": "Rajiv Gandhi International" }]
  },
  "suggestions": ["Find a taxi", "Check safety", "Share trip"],
  "creditsUsed": 1,
  "creditsRemaining": 11
}
```

### `POST /voice`

Voice input — accepts audio buffer, returns transcript + reply.

**Request:** `multipart/form-data` with `audio` file + `sessionId`

**Response:** Same shape as `/chat` plus `transcript` field.

### `GET /credits/:userId`

Returns user's credit balance and recent transactions.

### `POST /credits/purchase`

Initiates Razorpay checkout for a credit pack.

### `POST /webhooks/razorpay`

Razorpay payment confirmation webhook → triggers credit top-up.

### `GET /health`

Returns `{ status: "ok", uptime: 123 }`. Used by uptime monitors.

---

## Database

Hita uses Postgres via Supabase. Schema lives in `prisma/schema.prisma` — this is the single source of truth.

### Core Models

```
USERS & AUTH
  users · sessions · user_credits · credit_transactions

MEMORY & CONVERSATION
  conversations · messages · user_memory
  trips · saved_places · trusted_contacts

SAFETY & CITY DATA
  safety_zones · emergency_contacts · scam_alerts
  fare_benchmarks · affirmations · emotional_scripts

RELOCATION (v2.0+)
  neighbourhoods · visa_checklists · cost_of_living

OPERATIONS
  feature_flags · audit_log · api_usage_log
```

### Migrations

```bash
# Create a new migration after editing schema.prisma
npx prisma migrate dev --name describe_your_change

# Apply migrations in production
npx prisma migrate deploy

# Reset DB (dev only — wipes all data!)
npx prisma migrate reset
```

### Seeding

Initial city safety data, scam alerts, and emotional scripts are seeded automatically on first run. To re-seed:

```bash
npx prisma db seed
```

---

## Adding a New Agent

Hita is designed for easy extension. To add a new agent:

**1. Create the agent file** at `src/services/agents/yourAgent.ts`:

```ts
import { Agent, RequestContext } from "../../types/agent";

interface YourAgentInput {
  // What this agent needs
}

interface YourAgentOutput {
  // What it returns
}

export const yourAgent: Agent<YourAgentInput, YourAgentOutput> = {
  name: "yourAgent",
  async run(input, context) {
    // 1. Call any external APIs needed
    // 2. Process the data
    // 3. Return structured output
    return { /* ... */ };
  }
};
```

**2. Register it in the orchestrator** (`src/services/orchestrator.ts`):

```ts
import { yourAgent } from "./agents/yourAgent";

// Inside the dispatch logic:
case "YOUR_INTENT":
  results.yourAgent = await yourAgent.run(input, context);
  break;
```

**3. Update Hita Brain's prompt** (`src/prompts/hita.system.ts`) to know how to use this agent's output.

**4. Write a test** at `tests/agents/yourAgent.test.ts`.

That's it. The pattern is intentionally simple — it scales without becoming spaghetti.

---

## Adding a New Intent

Intents are how the classifier routes messages. To add one:

**1. Update the intent type** in `src/services/intentClassifier.ts`:

```ts
export type Intent =
  | "TRANSIT"
  | "WEATHER"
  | "GEO"
  | "EMOTIONAL"
  | "FINANCIAL"
  | "TRIP_PLAN"
  | "RELOCATION"
  | "VISA"
  | "YOUR_NEW_INTENT"   // ← add here
  | "GENERAL";
```

**2. Add it to the classifier system prompt** at `src/prompts/intentClassifier.ts` with examples and entity expectations.

**3. Handle it in the orchestrator** — call the right agent(s) for this intent.

**4. Test with realistic user messages** to make sure the classifier picks it up.

---

## System Prompts

System prompts are the actual product. The conversation quality is entirely determined by how well these are written.

| File | Purpose |
|---|---|
| `prompts/hita.system.ts` | The Hita personality, tone, guardian rules. The soul of the product. |
| `prompts/intentClassifier.ts` | How the classifier identifies intents and entities. |
| `prompts/safety.ts` | How the Safety Agent reasons about risk. |
| `prompts/relocation.ts` | How the Relocation Agent generates abroad plans (v2.0+). |
| `prompts/geo.ts` | Forces JSON output format for the Geo Agent. |

> **Iteration tip:** When a user gives weird feedback ("Hita felt cold here"), don't change the code first. Look at the prompt. 90% of conversation quality issues are prompt issues, not code bugs.

---

## Local Development

```bash
# Start the dev server with hot reload
npm run dev

# Run TypeScript type checking
npm run typecheck

# Run linter
npm run lint

# Format code
npm run format
```

### Recommended workflow

1. Make changes to a single agent or prompt at a time
2. Test it directly with `curl` or Postman
3. Watch the logs — every agent logs its inputs and outputs
4. Once happy, write a test, then commit

### Hot tips

- Use **Cursor** or **Claude Code** for boilerplate — agents follow a predictable pattern
- Test prompts in Anthropic's playground before committing them
- Keep one terminal running `npm run dev` and one for `curl` tests
- The `LOG_LEVEL=debug` env var shows full agent traces

---

## Testing

```bash
# Run all tests
npm test

# Run a specific test file
npm test -- tests/agents/safetyAgent.test.ts

# Watch mode
npm test -- --watch
```

### What to test

- **Each agent** in isolation with mocked external APIs
- **Intent classifier** with realistic user messages from the 60 scenarios
- **Orchestrator end-to-end** with a few critical flows (airport arrival, safety, family share)
- **API endpoints** with auth + rate limiting

> Don't aim for 100% coverage. Aim for 100% coverage of the critical user paths.

---

## Deployment

### Production: Railway

```bash
# First-time setup
npm install -g @railway/cli
railway login
railway link

# Deploy
git push origin main   # Auto-deploys via GitHub integration
```

### Environment-specific configs

- **Development:** `localhost:3000`, debug logs, mock payments
- **Staging:** `staging-api.hita.in`, full integrations, test Razorpay keys
- **Production:** `api.hita.in`, real Razorpay, Sentry alerts on

### Health checks

Railway pings `GET /health` every 30 seconds. If 3 consecutive failures, it auto-restarts the container. BetterStack also monitors externally and alerts via email/Slack.

---

## Troubleshooting

### "Cannot connect to database"

- Check `DATABASE_URL` is correct
- Make sure Supabase project isn't paused (free tier auto-pauses after 7 days inactive)
- Run `npx prisma migrate deploy` to apply pending migrations

### "Anthropic API rate limit"

- Check your usage in the Anthropic console
- For high-volume calls (intent classification, voice), use Gemini Flash instead — much cheaper
- Add Redis caching for repeated identical queries

### "Agent returns empty response"

- Check the agent's logs (`LOG_LEVEL=debug`)
- Test the prompt directly in Anthropic playground
- Verify all required env vars for that agent's external APIs are set

### "Voice transcription fails"

- Check audio format (Gemini multimodal expects `audio/wav` or `audio/mpeg`)
- File size must be under 20MB
- Ensure `GEMINI_API_KEY` has multimodal access (Gemini 2.0 Flash or higher)

### "WhatsApp messages not sending"

- Verify the user's phone number is in WhatsApp's allowed list (during sandbox)
- Check the WhatsApp Business API token hasn't expired (24-hour session windows)
- Review the Gupshup/Meta dashboard for delivery status

---

## Contributing (for future Harsha or any collaborator)

1. Always run `npm run typecheck` and `npm test` before committing
2. Keep agents small and focused — if an agent grows past 200 lines, split it
3. Update this README when you add a new agent or change the architecture
4. Prompt changes are product changes — write a brief note in the commit explaining the intent

---

## License

Proprietary — Hita is a closed-source product by Harshavardhan Arrimalla.

---

## Contact

Maintainer: **Harshavardhan Arrimalla**
Email: arrimallaharshavardhan@gmail.com
LinkedIn: [linkedin.com/in/harshavardhan-arrimalla-a557141a2](https://linkedin.com/in/harshavardhan-arrimalla-a557141a2)
Product: [hita.in](https://hita.in)

---

*Hita (Sanskrit: हित) — beneficial, well-wishing, in one's best interest.*
