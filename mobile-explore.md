# Hita — Explore Screen Specification

> The Explore screen is not a discovery feed. It is a **context engine** that changes its job
> depending on where the user is and what they are doing. This document defines the states,
> the content in each, how each block works, and how the screen decides which state to show.

---

## 1. Core principle

Most travel apps build one Explore screen and stuff everything into it. Hita does the opposite:
the screen detects the user's situation and **re-weights itself** around the single question that
matters in that moment.

| State | The question the screen answers | User mindset | Tense |
|-------|--------------------------------|--------------|-------|
| **Home** | "Where might I go someday?" | Dreaming, collecting, low intent | Future |
| **Pre-departure** | "What do I need to know before I leave?" | Preparing, slightly anxious | Near future |
| **Trip** | "What should I do in the next few hours — and is it safe?" | Acting, deciding, on the ground | Present |

The same component tree renders all three. What changes is **which blocks appear, in what order,
and how aggressively the guardian layer surfaces.** This is the same pattern Google Maps uses
(commute / exploration / navigation modes) and Spotify's behavior-based home reordering — the layout
is a reflection of context, rebuilt each session, not a static screen.

**One-line rule to hold onto:** at home Hita inspires; on a trip Hita protects.

---

## 2. The state machine

```
                 trip booked
   ┌────────┐  ───────────────▶  ┌───────────────┐  geofence: arrived at dest  ┌────────┐
   │  HOME  │                    │ PRE-DEPARTURE │  ─────────────────────────▶ │  TRIP  │
   └────────┘  ◀───────────────  └───────────────┘                             └────────┘
                trip cancelled                          geofence: returned home /
                                                         trip end date passed
```

### How the state is decided

The screen picks a state from a small set of signals, in priority order. First match wins.

1. **Active trip + user is inside the destination geofence** → `TRIP`
2. **Active trip exists, departure date is near, user still at home** → `PRE-DEPARTURE`
3. **No active trip, user at or near home location** → `HOME`
4. **Fallback / unknown location** → `HOME` (safest default; never block the screen)

**Signals used**
- **GPS / current coordinates** — primary "where are you now" input.
- **Home location** — set during onboarding or inferred from where the device spends nights.
- **Trip records** — destination, dates, booked items. Drives Pre-departure and Trip framing.
- **Geofence around the destination** — a radius around the trip's city/area. Crossing it is the
  trigger that flips Home/Pre-departure → Trip.
- **Confidence** — if GPS is weak or the user is mid-flight, hold the last known good state rather
  than flickering between modes.

### The transition is a feature, not plumbing

When the user lands and the screen flips Home → Trip **on its own**, that is a deliberate
"this thing has my back" moment. Treat the arrival flip as a designed transition — a brief welcome
to the city, the safety brief surfacing, the day's first suggestion ready — not a silent data swap.

---

## 3. HOME state — inspiration mode

**Job:** seed future trips and give the user a reason to reopen the app when they aren't travelling.
At home nobody is buying — they are collecting. So the core mechanic here is **save**, not book.

Blocks, top to bottom (highest intent first):

### 3.1 Weekend-feasible getaways `← lead block`
- **What:** trips that are actually doable from the user's home city in a weekend — drivable or short
  flight, 1–2 nights.
- **Why on top:** it's the nearest-term, highest-conversion decision. "3 hours from Hyderabad this
  weekend" acts on impulse far better than "beautiful places around the world."
- **How it works:** filter the destination catalogue by travel time from home location, feasibility
  for the coming weekend (weather, season, events), and the user's saved/past preferences.
- **Interaction:** tap → destination detail; long-press / save icon → wishlist. Quietly offer
  "plan this weekend" which seeds a Pre-departure trip.

### 3.2 Rising / trending in India right now
- **What:** destinations getting attention this month — seasonal spots in their window, festival
  happenings, places spiking in interest.
- **Why:** freshness is the reason to reopen. A static feed gets checked once.
- **How it works:** seasonal calendar (e.g. monsoon spots in monsoon, hill stations in summer) +
  trending signals + event data, scoped to India.
- **Behaviour:** rotate weekly so the screen feels alive between sessions.

### 3.3 Beautiful places around the world
- **What:** the aspirational, save-for-later band. Heavy on full-bleed imagery.
- **Why:** the dream layer keeps the emotional pull alive even when no trip is realistic right now.
- **How it works:** curated global collections, lightly personalised by what the user saves.
- **Note:** lives lower in the scroll. It's mood, not action — never put it above the weekend block.

### 3.4 "Best time to visit" framing everywhere
- At home the user is planning **when**, not **now**. Every card should carry a season / best-window
  cue so a saved place becomes a timed intention, not just a bookmark.

### 3.5 Saved / wishlist as a first-class surface
- Saving is the primary verb of Home mode. Make it one tap, give saved places a home, and let them
  flow into trip planning later. A saved place + a free weekend = the perfect moment for Hita to
  proactively suggest a trip.

**What HOME deliberately does NOT show:** real-time "near me" nudges, local-essentials, heavy safety
overlays. The user is safe at home and knows the area — surfacing that here is noise.

---

## 4. PRE-DEPARTURE state — the briefing

**Job:** start the guardian relationship *before* the user leaves, so protection doesn't begin only
on landing. Triggered when a trip exists but the user hasn't crossed the destination geofence yet.

Blocks:

### 4.1 Countdown + trip summary
- Days/hours to departure, destination, dates, what's booked. Orienting glance.

### 4.2 Area safety brief for the destination
- A read-ahead of where they're going: which areas are well-regarded vs to-be-cautious, general
  safety notes, women's-safety context, scams common to that destination.
- **Why:** unfamiliar-place anxiety peaks before arrival. Answering it early builds trust early.

### 4.3 "Know before you go"
- Local know-how surfaced ahead of time: how local transport works (auto / metro / ride apps),
  tipping norms, key phrases, currency, plug types, SIM/data options. Critical for Ring 3 (abroad).

### 4.4 What to pack / conditions there
- Weather at the destination across the trip window → packing prompts. Small, concrete, useful.

### 4.5 Soft itinerary seeding
- If they've saved places or it's a known destination, offer a light starting loop they can accept
  or ignore. Don't force a plan — offer a spine.

---

## 5. TRIP state — active / guardian mode

**Job:** help the user make the most of where they are, safely, in real time. This is where Hita
stops looking like a gallery of places and becomes a companion. Everything flips to present tense.

Blocks, ordered by how often the user needs them on the ground:

### 5.1 Right now, around me `← the heartbeat`
- **What:** nearby, open-now, walkable things — each carrying the safety/trust read.
- **Example card:** "Charminar · 600m · open till 9 · light crowd right now · area: safe by day."
- **Why first:** this is the most-used block in trip mode. It answers "what's good immediately
  around me" without the user typing anything.
- **How it works:** current GPS → places API for nearby POIs → filter by open-now and walkable
  radius → rank by relevance to user profile → attach the safety read and live conditions to each.
- **Behaviour:** proactive. The best version nudges before being asked ("rain in 40 min — 3 indoor
  options nearby"), matching the 2026 "glanceable, barely-open-the-app" bar.

### 5.2 What's next in my day
- **What:** the next stop if they have an itinerary — travel time to it, how to get there locally,
  conditions on arrival.
- **No-plan fallback:** "You've got ~3 hours before sunset — here's a tight loop nearby."
- **How it works:** itinerary data + current time + current location + local transport options.

### 5.3 Safety context for *this* place `← the differentiator`
- **What:** neighbourhood-level awareness, time-of-day shifts (fine at noon, caution at midnight),
  local scams to watch for, and emergency proximity — nearest hospital, pharmacy, police, and
  embassy when abroad.
- **Why near the top:** at home the user knows which areas to avoid; on a trip they don't. This is
  the single thing no MakeMyTrip/Booking Explore leads with, and it's Hita's moat.
- **How it works:** the safety read is a composite signal (see §6.1). Display it as a glanceable
  status, not a wall of text — quiet until it needs attention.

### 5.4 Local essentials
- **What:** the unglamorous critical band — food (with veg / non-veg filtering), ATM, pharmacy,
  SIM/data, clean restrooms, drinking water.
- **Why:** "I just landed and need basics" is a real, frequent need that pure discovery apps ignore.
  Solving it is what makes a guardian feel practical, not decorative.

### 5.5 Local-only / hidden gems near me
- **What:** the "live like a local, not a tourist" discovery — the spots that make the trip feel
  earned. Lower priority than essentials and safety, but it's the delight layer.

### 5.6 Practical local know-how (contextual)
- Surfaced when relevant: how to get an auto/metro here, tipping, phrases, currency. Huge for Ring 3
  abroad; still useful city-to-city within India.

### 5.7 Companion / check-in
- Guardian features made glanceable while out: share live location, "let someone know where I am,"
  quick check-in. Always reachable in trip mode.

**Ordering logic for Trip mode:** safety + essentials sit high because need-frequency and anxiety are
both highest there. Pure discovery (hidden gems, beautiful spots) sits lower — on a trip it's the
garnish, not the meal. This is the inverse of Home, where discovery is the whole point.

---

## 6. Cross-cutting systems

These run across all states and are what make Explore feel like Hita rather than a template.

### 6.1 The safety / trust read
Every recommendation in trip mode carries a read — not a star rating, a *trust* signal. Conceptually
it composites:
- **Area reputation** for the location (and how it shifts by time of day)
- **Verification / vouching** — verified, community-flagged, or unknown
- **Women's-safety signals** where relevant
- **Proximity to help** (hospital / pharmacy / police / embassy)
- **Live conditions** — crowd, wait, open/closed

Display it glanceably (a quiet status chip / colour cue), expandable for the "why." The point:
a place isn't just *rated*, it's *vouched for*. That reframing is the product.

### 6.2 Natural-language intent (the AI entry)
Top-of-screen input takes intent, not filter chips: "non-veg places near me that are safe after dark,"
"scenic route to the fort avoiding crowds." This is context-aware ranking over keyword matching, and
it's where Hita's agentic UI layer does the work other apps fake with rigid filters.

### 6.3 Proof, not guesswork
Show *why* something surfaced (matches your profile / verified / community-loved). The 2026 discovery
shift rewards verifiable, legible recommendations over vibes. It also reinforces the guardian framing.

### 6.4 Save → seed loop
Saves made in Home mode aren't dead bookmarks. A saved place + a free weekend is the trigger for Hita
to proactively propose a trip — closing the loop from inspiration (Home) to action (Pre-departure → Trip).

---

## 7. Layout & structure

- **Container:** map-anchored Explore with a **draggable bottom sheet** carrying the feed. The bottom
  sheet is the dominant 2026 pattern for secondary content and fits Hita's guardian/navigation core —
  the map shows safety zones and POIs spatially, the sheet carries the discovery feed.
- **Map's role shifts by state:** ambient backdrop in Home (mood), active safety/zone layer in Trip.
- **Aesthetic:** quiet UI, intelligence underneath — minimal surface, fewer steps, more automation.
  Glassmorphic sheet over a soft map, consistent with the Hita design system
  (Space Grotesk / DM Sans / JetBrains Mono, no default component look).
- **Primary actions in the nav bar**, not a stack of floating buttons.

---

## 8. Decisions still open

- [ ] How wide is the destination geofence, and how do we handle multi-city trips?
- [ ] What's the exact set of signals behind the safety read, and where does the data come from?
- [ ] Does Pre-departure start at a fixed time before departure (e.g. 48h) or on booking?
- [ ] How aggressive should proactive nudges be before they feel intrusive?
- [ ] Offline behaviour — travellers hit poor connectivity; what does Trip mode show with no signal?

---

## 9. The summary that matters

> **Home answers "where might I go someday?" — Trip answers "what should I do in the next few hours,
> and is it safe?"** One screen, two opposite jobs, decided automatically by where the user is.
> Every trip-mode card carries a safety/trust read, and the whole screen reorganises by state.
> That's what makes this Explore unmistakably Hita and not a clone.