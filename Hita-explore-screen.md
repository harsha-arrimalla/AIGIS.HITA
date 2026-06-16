# Hita — Explore Screen Specification (v2)

> The Explore screen is a **context engine**, not a single feed. It changes its primary surface and
> its job depending on where the user is. The biggest v2 change: **Home is a content-discovery feed
> (Netflix/Disney+ model), Trip is a map.** Two states, two opposite jobs, decided automatically.

---

## 1. Core principle

| State | Question it answers | Mindset | Tense | **Primary surface** |
|-------|--------------------|---------|-------|---------------------|
| **Home** | "Where might I go someday?" | Dreaming, collecting | Future | **Feed** (hero + rows) |
| **Pre-departure** | "What do I need before I leave?" | Preparing | Near future | Briefing cards |
| **Trip** | "What's good nearby, and is it safe?" | Acting, on the ground | Present | **Map** + sheet |

The screen doesn't just swap content between states — it swaps its **primary surface**. Inspiration
doesn't need geography, so Home has no map. Being on the ground is inherently spatial, so Trip leads
with a map. One-line rule: **at home Hita inspires; on a trip Hita protects.**

---

## 2. The state machine

```
                 trip booked                                geofence: arrived
   ┌────────┐  ───────────────▶  ┌───────────────┐  ────────────────────────▶ ┌────────┐
   │  HOME  │                    │ PRE-DEPARTURE │                             │  TRIP  │
   │ (feed) │  ◀───────────────  └───────────────┘  ◀──────────────────────── │ (map)  │
   └────────┘  trip cancelled                          returned home / trip end └────────┘
```

### How the state is decided (first match wins)
1. Active trip **and** user inside destination geofence → `TRIP`
2. Active trip, departure near, user still home → `PRE-DEPARTURE`
3. No active trip, user at/near home → `HOME`
4. Unknown / weak GPS → `HOME` (safe default; never block the screen)

### Signals
- **GPS** (where you are now) · **home location** (onboarding or inferred from overnight stays)
- **Trip records** (destination, dates, bookings) · **destination geofence** (the trigger to flip to Trip)
- **Confidence** — on weak GPS or mid-flight, hold last good state; don't flicker.

### The arrival flip is a designed moment
When the user lands and the screen flips Home → Trip on its own, treat it as a feature: a short
welcome to the city, the safety brief surfacing, the first nearby suggestion ready. Not a silent swap.

---

## 3. HOME state — content-discovery feed (the v2 rewrite)

**Model:** Netflix / Disney+ style discovery — a hero plus curated horizontal rows. **No map.**
Dreaming is an imagery job, not a geography job. **Save is the only commitment verb here** (the
"add to My List" analog); Route and booking belong to Trip mode.

### Layout, top to bottom
1. **Header (pinned, safe-area respected)** — "Explore" + "Dream and save future trips."
2. **Natural-language search** — one persistent input: "Where to next? Ask Hita anything." The rows
   are the categories, so top filter chips are redundant and removed.
3. **Hero — one, not many.** The single most compelling weekend-feasible trip right now, full-width.
   Carries: "This weekend" tag, trust chip, feasibility line ("5 hrs from Hyderabad · best time now"),
   and the two Home verbs — **Save** and **Ask Hita**. No "book," no "flight + stay."
4. **Curated rows (4–6 max — not 30).** Travel is a heavier decision than pressing play; too many
   lanes cause paralysis. Lanes, in priority order:
   - *Weekend getaways from [home city]* — lead row, nearest-term, highest conversion
   - *Trending in India now* — the Top-10 row, ranked numbers, rotates weekly
   - *Beautiful places worldwide* — aspirational, lower in scroll
   - *Because you saved [X]* — personalized, same engine as Netflix rows
   - *Best in [season] now* — seasonal lane (travel's "New Releases")
   - *Saved* — the "My List"
5. **Bottom nav** — Chats / Explore / Profile.

### Tile anatomy (every card)
- Image · name · one-line cue (distance + season, e.g. "2 hrs · best now")
- **Save heart** (primary verb)
- **Trust chip where relevant** — *Verified*, *Untouched*, community-flagged. This riding on the tile
  is what stops it being a generic travel carousel.

### Why travel ≠ streaming (the three adaptations)
1. **Feasibility axis** — every tile carries timing + distance + season. Netflix rows are pure taste;
   Hita rows are taste + when + how far.
2. **Lighter action** — Save now, go later. Never push "book" in inspiration mode.
3. **Trust read on the tile** — Netflix tiles don't need "Verified"; yours do. It's the differentiator.

### The make-or-break: save → seed loop
Netflix works because you watch tonight; a traveler might go in three months. So a save can't be a dead
mood board. **A saved place + a free weekend triggers Hita proposing an actual trip** (Home → Pre-departure).
That bridge from pretty-browse to real-intention is the whole game.

### Home deliberately does NOT show
Map, real-time "near me" nudges, local-essentials, heavy safety overlays. The user is safe at home and
knows the area — surfacing that here is noise.

---

## 4. PRE-DEPARTURE state — the briefing
Trigger: a trip exists but the user hasn't crossed the destination geofence. Start the guardian
relationship before they leave.
- **Countdown + trip summary** — days to departure, destination, dates, what's booked.
- **Area safety brief** — read-ahead of where they're going; safe vs caution areas, women's-safety
  context, common scams. Unfamiliar-place anxiety peaks before arrival.
- **Know before you go** — local transport, tipping, key phrases, currency, plug types, SIM/data.
  Critical for Ring 3 (abroad).
- **Conditions + packing** — destination weather across the window → packing prompts.
- **Soft itinerary seeding** — a light starting loop they can accept or ignore. Offer a spine, not a plan.

---

## 5. TRIP state — map-first guardian mode

**Model:** map-anchored with a **draggable glass bottom sheet.** Everything on a trip is spatial —
where am I, what's safe around me, what's nearby and open, where's next. A list flattens that; a map
carries it natively. **Route is valid here** (unlike Home).

- **Map surface** — shows the user, safe-vs-caution zones, nearby POIs, next-stop route.
- **Sheet block 1 — Right now, around me (the heartbeat):** open-now, walkable, each with the safety
  read. "Charminar · 600m · open till 9 · light crowd · safe by day." Proactive ("rain in 40 min — 3
  indoor options nearby").
- **What's next in my day** — next itinerary stop, travel time, how to get there locally.
- **Safety context for this place (the differentiator)** — neighbourhood awareness, time-of-day
  shifts, scams, emergency proximity (hospital / pharmacy / police / embassy abroad). No app's Explore
  leads with this — it's the moat.
- **Local essentials** — food (veg/non-veg filter), ATM, pharmacy, SIM/data, restrooms, water.
- **Hidden gems / local-only** — the delight layer, lower priority than safety + essentials.
- **Practical local know-how** — transport, tipping, phrases, currency (contextual; huge for Ring 3).
- **Companion / check-in** — share live location, "let someone know where I am."

Ordering logic: safety + essentials sit high because need-frequency and anxiety peak on a trip. Pure
discovery sits low — on the ground it's garnish, not the meal. The inverse of Home.

---

## 6. Cross-cutting systems
- **Safety / trust read** — a composite (area reputation by time of day, verification/vouching,
  women's-safety, proximity to help, live conditions). Displayed glanceably (quiet chip), expandable
  for the "why." A place isn't *rated*, it's *vouched for*.
- **Natural-language intent** — top-of-screen input takes intent, not filter chips. Context-aware
  ranking over keyword matching. Where the agentic UI layer earns its keep.
- **Proof, not guesswork** — show *why* something surfaced (matches profile / verified / loved).
- **Save → seed loop** — see §3; bridges Home inspiration to Trip action.
- **Readable text by rule, not taste** — text never sits directly on an image; it sits on a gradient scrim or a solid/glass panel, and contrast is verified to WCAG (4.5:1 body, 3:1 large).
- **Place tap behavior** — tapping a place opens a place-detail bottom sheet over the current surface (location data + Save / Plan / Ask Hita) and does not navigate. Only explicit **Ask Hita** actions open chat.

---

## 7. Layout & design system
- **Surface by state:** Home = feed (no map). Trip = map + draggable glass sheet. Pre-departure = cards.
- **Aesthetic:** ambient, futuristic, glassmorphic, minimal-enterprise. Quiet surface, intelligence
  underneath. Glass surfaces, soft ambient background, no default/shadcn component look.
- **Type:** Space Grotesk (display) / DM Sans (body) / JetBrains Mono (numeric, ranks, data).
- **Safe-area insets respected** — header never collides with status bar / Dynamic Island.
- **Primary actions in the nav bar**, not stacks of floating buttons.

---

## 8. Decisions still open
- [ ] Destination geofence radius + multi-city trip handling
- [ ] Exact signal set + data sources behind the safety read
- [ ] Pre-departure trigger: fixed window (e.g. 48h) or on booking?
- [ ] Proactive nudge aggressiveness before it feels intrusive
- [ ] Offline behaviour in Trip mode (travellers hit poor connectivity)

---

## 9. The summary that matters
> **Home answers "where might I go someday?" with a content-discovery feed — hero + curated rows,
> save-led, no map. Trip answers "what's good nearby, and is it safe?" with a map-first guardian
> surface.** The screen swaps its primary surface, not just its content. Every trip-mode card carries
> a safety/trust read; every home-mode tile carries timing + feasibility + a save. That's what makes
> this Explore unmistakably Hita and not a clone.