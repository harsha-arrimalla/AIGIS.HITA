# Hita Landing Page — Content & Tasks

> Complete task breakdown of every content section, every live data signal, and every backend endpoint needed for the Hita landing page.

**Version:** 1.0
**Last updated:** April 2026
**Status:** In progress
**Owner:** Harshavardhan Arrimalla

---

## Table of Contents

- [Summary](#summary)
- [Total Task Count](#total-task-count)
- [Current State (what's already shipped)](#current-state)
- [Section 1 — Hero Section](#section-1--hero-section)
- [Section 2 — Live Trust Strip](#section-2--live-trust-strip-new)
- [Section 3 — What Hita Does](#section-3--what-hita-does-new)
- [Section 4 — Things To Do Right Now](#section-4--things-to-do-right-now)
- [Section 5 — Live Safety Dashboard](#section-5--live-safety-dashboard-new)
- [Section 6 — Real Stories](#section-6--real-stories-new)
- [Section 7 — How It Works](#section-7--how-it-works-new)
- [Section 8 — Cities Hita Knows](#section-8--cities-hita-knows)
- [Section 9 — Built Different](#section-9--built-different-new)
- [Section 10 — Numbers That Matter](#section-10--numbers-that-matter-new)
- [Section 11 — Footer](#section-11--footer)
- [Backend — Live Data Requirements](#backend--live-data-requirements)
- [What NOT to Show](#what-not-to-show)
- [Priority & Build Order](#priority--build-order)

---

## Summary

The current Hita landing page has the right structural pattern — personalized hero, featured suggestion, recommended experiences, city explorer. What's missing is positioning clarity, live trust signals, and the differentiation that tells a first-time visitor "this is a guardian, not a booking engine."

This document lists every content section, every live data signal, and every backend task required to upgrade the landing page from MVP-shipped to v1.0-launch-ready.

---

## Total Task Count

| Category | Count |
|---|---|
| Content sections to refine | 4 |
| New content sections to add | 7 |
| Live data signals (frontend) | 23 |
| Backend endpoints to build | 8 |
| Database queries to optimize | 12 |
| Copy items to write | 47 |
| Images/assets to source | 28 |
| **Total tasks** | **129** |

---

## Current State

### What's already shipped ✅

- [x] Hero with personalized greeting ("Good afternoon, Harsha 👋")
- [x] Featured suggestion card ("Try the biryani at Paradise, Secunderabad")
- [x] Carousel with multiple suggestions (5 dots indicator)
- [x] Chat input with voice button
- [x] "Things to do right now" section (5 experience cards)
- [x] "Explore the world" section (4 destination cards)
- [x] Footer with copyright and links
- [x] Top nav with logo, "+ New chat", "Sign in"

### What's missing 🔲

- [ ] Positioning line for first-time visitors (logged-out state)
- [ ] Live trust signals (real-time counters, activity strip)
- [ ] "What Hita does" feature explanation
- [ ] Live safety dashboard (Hita's killer differentiator)
- [ ] Real user stories (replace generic testimonials)
- [ ] How it works (3-step explainer)
- [ ] Differentiation section ("Built different")
- [ ] Numbers section with animated counters
- [ ] Status page link
- [ ] WhatsApp Business contact
- [ ] Updated city card metadata (last updated timestamps)

---

## Section 1 — Hero Section

**Current state:** Personalized greeting works for logged-in users. Logged-out visitors see same greeting, which is confusing.

### Tasks

- [ ] **Task 1.1:** Build two hero variants — logged-in and logged-out
- [ ] **Task 1.2:** Write 3 positioning headline options for logged-out hero (A/B test later)
- [ ] **Task 1.3:** Add subheadline that explains what Hita is in one line
- [ ] **Task 1.4:** Add small "Free to try. No download needed." trust line below input
- [ ] **Task 1.5:** Set up time-of-day-aware greeting (Good morning / afternoon / evening / late night)
- [ ] **Task 1.6:** Add late-night warmth — special greeting after 10 PM ("Still up? I'm here.")

### Content to use

**Logged-out hero:**

Headline options:
- "Travel safer, anywhere in India"
- "Your AI guardian for any new place"
- "The friend who's been there before you arrive"

Subheadline:
"Hita walks with you through unfamiliar cities — 24/7 safety, fair fares, and someone who listens."

CTA below input:
"Free to try. No app download. Just type or speak."

**Logged-in hero (existing):**

Keep "Good afternoon, [name] 👋" — it works.

Add a status line below name:
"Hita helped 12,847 travelers this week"

---

## Section 2 — Live Trust Strip (NEW)

A horizontal strip directly below the hero with rotating live stats. The single most impactful addition.

### Tasks

- [ ] **Task 2.1:** Design horizontal strip component (mobile-responsive, no scroll)
- [ ] **Task 2.2:** Write copy for 5 live stats
- [ ] **Task 2.3:** Build `GET /stats/live` backend endpoint
- [ ] **Task 2.4:** Set up WebSocket or 30-second polling for real-time updates
- [ ] **Task 2.5:** Add subtle animation when numbers update (count-up effect)
- [ ] **Task 2.6:** Cache stats in Redis with 30-second TTL
- [ ] **Task 2.7:** Add fallback static numbers if API fails (graceful degradation)

### Content (5 stats to display)

Show 3 at a time on mobile, all 5 on desktop:

1. **"12,847 travelers helped this week"** — live counter, animates up
2. **"3 people getting safety check-ins right now"** — live, updates real-time
3. **"₹2.3 Cr in scam-overcharges prevented"** — running total since launch
4. **"98.7% reach destinations safely"** — anchor stat, less volatile
5. **"Trusted in 47 Indian cities"** — coverage signal

### Visual notes

- Thin strip (60px tall on desktop, 80px on mobile)
- Each stat in its own segment with subtle dividers
- Small green dot pulse next to "live" stats
- Subtle gradient or warm tint background

---

## Section 3 — What Hita Does (NEW)

Three columns explaining the product in 30 seconds. Currently missing — visitors don't know what Hita is.

### Tasks

- [ ] **Task 3.1:** Design 3-column layout (stack on mobile)
- [ ] **Task 3.2:** Source or design 3 illustrations/icons (one per pillar)
- [ ] **Task 3.3:** Write headline + body for each pillar
- [ ] **Task 3.4:** Add live data signal under each pillar
- [ ] **Task 3.5:** Connect each pillar's signal to backend stats endpoint
- [ ] **Task 3.6:** Add hover state with subtle animation

### Content

**Pillar 1: Always with you**
- Icon/illustration: Walking figure with shield
- Headline: "From airport pickup to late-night walks"
- Body: "Hita is the friend who's been there before you arrive. Routes, safety, fares — all in one chat."
- Live signal: "Used by 5,200 travelers today"

**Pillar 2: Watches your back**
- Icon/illustration: Eye with shield or radar pulse
- Headline: "We notice what you can't"
- Body: "Real-time safety scores, fare protection, scam alerts. Hita's watching the road so you don't have to."
- Live signal: "₹47,000 saved from overcharges this week"

**Pillar 3: Knows your city**
- Icon/illustration: Map pin with neighborhoods
- Headline: "Built with locals, for travelers"
- Body: "Hyderabad, Delhi, Bangalore, and 44 more cities — mapped down to neighborhood-level safety, fares, and tips."
- Live signal: "12 cities added this month"

---

## Section 4 — Things To Do Right Now

**Current state:** Section exists with 5 experience cards. Working well. Just needs refinement.

### Tasks

- [ ] **Task 4.1:** Add "Updated [time] ago" microcopy to each card
- [ ] **Task 4.2:** Add live activity counter to each card ("47 exploring right now")
- [ ] **Task 4.3:** Add trending indicator for trending experiences (↑ "3x more popular")
- [ ] **Task 4.4:** Build `GET /experiences/trending` backend endpoint
- [ ] **Task 4.5:** Pull experience images from real backend, not hardcoded
- [ ] **Task 4.6:** Add filter chips above cards: All / Food & Drink / Must See / Adventure / Experience
- [ ] **Task 4.7:** Make "View all" link work (currently dead) — opens experiences explore page
- [ ] **Task 4.8:** Optimize images for fast load (WebP format, lazy loading)

### Content additions per card

Existing card content stays. Add these microcopy elements:

- Below traveler count: "Updated 2 hours ago"
- Top-right corner badge for trending: "↑ Trending today" or "🔥 Asked 3x more than last week"
- Bottom of card: "47 travelers exploring this right now" (live counter)

### Headline refinement

Current: "Things to do right now" — works. Keep.
Subhead current: "Popular experiences other travelers are asking about" — strong, keep.

---

## Section 5 — Live Safety Dashboard (NEW)

**This is Hita's killer differentiator.** No other AI travel app has this. Highest-priority new section.

### Tasks

- [ ] **Task 5.1:** Design dashboard component layout (3 sub-sections)
- [ ] **Task 5.2:** Build city heatmap visualization (SVG India map with safety dots)
- [ ] **Task 5.3:** Build rolling alerts ticker component
- [ ] **Task 5.4:** Build scams-blocked counter component
- [ ] **Task 5.5:** Build `GET /safety/cities-pulse` backend endpoint
- [ ] **Task 5.6:** Build `GET /safety/active-alerts` backend endpoint
- [ ] **Task 5.7:** Build `GET /safety/scams-blocked-today` backend endpoint
- [ ] **Task 5.8:** Set up real-time updates via WebSocket
- [ ] **Task 5.9:** Add city tap-to-detail interaction (modal with city info)
- [ ] **Task 5.10:** Source India map SVG (no external API for privacy)

### Content & data structure

**Headline:** "What Hita is watching right now"
**Subhead:** "Real-time across 47 Indian cities"

**Sub-section 1: City Safety Pulse**

Visual: India map with colored dots per monitored city
- Green dot = normal safety
- Yellow dot = caution (heavy traffic, weather, etc.)
- Red dot = active alert

Below map:
- "47 cities monitored"
- "Last updated: 2 minutes ago"
- "Tap any city for current conditions"

**Sub-section 2: Active Alerts (rolling list)**

Format: Auto-scrolling ticker, max 5 visible at a time

Sample alerts (live, from backend):
- "⚠ Fare overcharge spike near Bangalore airport — 6 reports in last hour"
- "🌧 Heavy rain in Mumbai — flight delays expected"
- "🌙 Late-night curfew in select Delhi areas — verified taxis recommended"
- "✓ Hyderabad Metro service normal"
- "📍 Festival traffic on MG Road, Bangalore — alternate routes available"

**Sub-section 3: Scams Blocked Today (counter)**

Big number, animated counter:
- "47" (large)
- "Overcharges flagged in the last 24 hours"
- Below: "₹18,500 saved from scam fares this week"

---

## Section 6 — Real Stories (NEW)

Replace generic testimonials with specific moments where Hita helped. Format matters more than quantity.

### Tasks

- [ ] **Task 6.1:** Design story card component (different from testimonial card)
- [ ] **Task 6.2:** Collect 5 real stories from beta users (with permission)
- [ ] **Task 6.3:** Get permission to use first names + city + age
- [ ] **Task 6.4:** Get optional photo or use illustrated avatar
- [ ] **Task 6.5:** Add "Hita feature used" tag (e.g., "Late-night safety mode")
- [ ] **Task 6.6:** Add "Read by X travelers this week" live counter
- [ ] **Task 6.7:** Build carousel for stories (3 visible on desktop, 1 on mobile)
- [ ] **Task 6.8:** Add option to submit a story (link to form)

### Content (5 example stories — replace with real ones)

**Headline:** "When Hita made the difference"
**Subhead:** "Real moments from travelers across India"

**Story 1 — Late-night safety**
> "Late at night I felt unsafe walking back to my hotel. Hita stayed with me the whole 12 minutes home. That kind of presence — I didn't know I needed it until I had it."
>
> — Priya, 26, Bangalore
> Used: Late-night safety mode
>
> Read by 3,400 travelers this week

**Story 2 — Fare protection**
> "Driver was charging ₹650 for what Hita said should be ₹250. Showed him the screen. He didn't argue. Saved me ₹400 in 30 seconds."
>
> — Karthik, 31, Hyderabad
> Used: Fare Guard
>
> Read by 2,100 travelers this week

**Story 3 — Solo female traveler**
> "I'm a 24-year-old woman traveling alone for work. Hita's late-night mode and family-share feature gave my parents peace of mind. They could see I was safe without me having to text constantly."
>
> — Ananya, 24, Delhi
> Used: Family Share + Late-night mode
>
> Read by 4,800 travelers this week

**Story 4 — Lost in unfamiliar city**
> "Driver dropped me at the wrong place at midnight. Hita guided me to a 24-hour cafe nearby and stayed in chat until I found another ride. Felt like having a friend on the phone."
>
> — Mohammed, 29, Chennai
> Used: Emergency mode
>
> Read by 1,900 travelers this week

**Story 5 — Emotional support**
> "My first time in Mumbai. The crowds overwhelmed me. Hita didn't just give directions — it asked if I was okay. We did a 30-second breathing exercise. Then I was ready to move."
>
> — Tejasri, 22, first-time Mumbai visitor
> Used: Heart Agent
>
> Read by 5,200 travelers this week

---

## Section 7 — How It Works (NEW)

For first-time visitors who don't yet know what Hita does. Three steps with visual examples.

### Tasks

- [ ] **Task 7.1:** Design 3-step layout (horizontal on desktop, stacked on mobile)
- [ ] **Task 7.2:** Create animated illustrations for each step (or simple chat mockups)
- [ ] **Task 7.3:** Write headline + description for each step
- [ ] **Task 7.4:** Add subtle hover/scroll animation
- [ ] **Task 7.5:** Add CTA at the bottom: "Try Hita now (free)"
- [ ] **Task 7.6:** Add "No app download needed" reassurance below CTA

### Content

**Headline:** "How Hita works"
**Subhead:** "Three steps. No app needed. Free to try."

**Step 1: Tell Hita where you are**
- Visual: Chat bubble showing user typing "I just landed at Hyderabad airport"
- Caption: "Type or speak. Hita understands you naturally — even mixed Hindi-English."

**Step 2: Get instant guidance**
- Visual: Response card showing transit options + safety score
- Caption: "Routes, fare ranges, safety scores. All from one chat."

**Step 3: Stay safe, all the way home**
- Visual: Family share notification on phone
- Caption: "Hita can share your trip with family. Stays with you until you're safely home."

**Below the steps:**
- Big CTA button: "Start chatting (free)"
- Small text: "No app download. No payment for safety features. Ever."

---

## Section 8 — Cities Hita Knows

**Current state:** "Explore the world" section with 4 destination cards. Working but content needs reframing.

### Tasks

- [ ] **Task 8.1:** Update headline from "Explore the world" to Hita-aligned
- [ ] **Task 8.2:** Add "Updated [time] ago" to each city card
- [ ] **Task 8.3:** Add "X active travelers right now" live counter
- [ ] **Task 8.4:** Add "Show all (47)" link that goes to full city directory
- [ ] **Task 8.5:** Build `GET /cities` backend endpoint with full city list
- [ ] **Task 8.6:** Build city detail pages (one per city)
- [ ] **Task 8.7:** Add hover state on city cards (subtle lift + shadow)
- [ ] **Task 8.8:** Add city safety score badge to each card
- [ ] **Task 8.9:** Reorder cities by user's location proximity (if available)
- [ ] **Task 8.10:** Add "More cities coming" CTA at the end

### Content

**Headline (replace current):**

Current: "Explore the world"
New options:
- "Cities where Hita has your back"
- "Where Hita knows the streets"
- "47 cities, deep local knowledge"

Recommended: **"Cities where Hita knows the streets"**

**Subhead (refine current):**

Current: "Destinations where Hita has your back"
New: "Real-time safety, fares, and tips for 47 Indian cities"

**Per-city card (additions):**

Existing:
- City image
- City name (large)
- Tagline ("Pink city palaces & colorful bazaars")
- "12k+ travelers helped"

Add:
- Safety score badge: "Safety: 8.2/10" (top-right)
- "Updated 6 hours ago" (microcopy below tagline)
- "5 travelers using Hita here right now" (live indicator at bottom)

---

## Section 9 — Built Different (NEW)

A short section that pre-empts "how is this different from ChatGPT or MakeMyTrip?"

### Tasks

- [ ] **Task 9.1:** Design 4-pillar grid (2x2 on desktop, stacked on mobile)
- [ ] **Task 9.2:** Source or design 4 small icons
- [ ] **Task 9.3:** Write headline + body for each pillar
- [ ] **Task 9.4:** Add subtle accent color treatment per pillar
- [ ] **Task 9.5:** Add hover state with explanation expansion

### Content

**Headline:** "Why Hita, not just any AI"
**Subhead:** "What we built differently — on purpose"

**Pillar 1: Built for India**
"47 Indian cities mapped at neighborhood level. Hita knows local scams, festival traffic, prepaid taxi counters — the things only a local would know."

**Pillar 2: Watches in real time**
"Every fare, every route, every area — checked against current conditions. Not generic answers from training data. Live data, every time."

**Pillar 3: Free where it matters**
"Emergency mode, family share, safety alerts — always free. We never charge to keep you safe. Premium is for convenience, not protection."

**Pillar 4: Privacy by design**
"Your location data is yours. Voice recordings deleted after transcription. Trusted contacts only see what you allow. We never sell your data."

---

## Section 10 — Numbers That Matter (NEW)

Big animated counters near the bottom. Final trust push before footer.

### Tasks

- [ ] **Task 10.1:** Design 6-stat grid (3x2 on desktop, 2x3 on mobile)
- [ ] **Task 10.2:** Build animated counter component (counts up on viewport entry)
- [ ] **Task 10.3:** Connect each stat to live backend endpoint
- [ ] **Task 10.4:** Add "Updated live, every 30 seconds" microcopy
- [ ] **Task 10.5:** Add subtle background treatment (warm gradient or texture)
- [ ] **Task 10.6:** Optimize counter animation for performance

### Content

**Headline:** "Travelers we've stood with"
**Subhead:** "The numbers update live. Every 30 seconds."

**Six big numbers:**

```
47           5,200          12,847
Cities       Travelers      Helped this
covered      using right    month
             now

₹2.3 Cr      98.7%          24/7
Saved from   Reach          Always here
overcharges  destinations
             safely
```

**Below the grid:**
- "Updated live, every 30 seconds"
- Status indicator: "● All systems operational" (links to status.hita.in)

---

## Section 11 — Footer

**Current state:** Basic footer with copyright, Privacy, Terms.

### Tasks

- [ ] **Task 11.1:** Add status page link: "● All systems operational"
- [ ] **Task 11.2:** Add "Hita on WhatsApp" link with WhatsApp Business number
- [ ] **Task 11.3:** Add "Made in Hyderabad with care for India" founder note
- [ ] **Task 11.4:** Add "Press / Media" link
- [ ] **Task 11.5:** Add "Contact / Support" link
- [ ] **Task 11.6:** Add social media links (LinkedIn for now — Twitter when ready)
- [ ] **Task 11.7:** Add language switcher placeholder (for future v3.0)
- [ ] **Task 11.8:** Add "Built with care, not VC pressure" small tagline (optional)
- [ ] **Task 11.9:** Add sitemap structure for SEO

### Content

**Existing:**
- © 2026 Hita — A calmer way to think with AI
- Privacy
- Terms

**Additions:**

```
HITA
Made in Hyderabad with care for India
arrimallaharshavardhan@gmail.com

PRODUCT          COMPANY          SUPPORT
Features         About            Help center
Pricing          Press            Contact us
Cities           Careers          WhatsApp us
Status           Privacy          API status
Roadmap          Terms

● All systems operational
Built solo, with care.
```

---

## Backend — Live Data Requirements

Every "live" element on the page needs a backend endpoint. Group these into a single stats service for efficiency.

### Endpoints to build

- [ ] **Endpoint 1:** `GET /api/stats/live` — top-level live stats (rotating strip)
- [ ] **Endpoint 2:** `GET /api/stats/totals` — large numbers (cities, travelers helped, etc.)
- [ ] **Endpoint 3:** `GET /api/safety/cities-pulse` — city heatmap data
- [ ] **Endpoint 4:** `GET /api/safety/active-alerts` — rolling alerts ticker
- [ ] **Endpoint 5:** `GET /api/safety/scams-blocked-today` — scam counter
- [ ] **Endpoint 6:** `GET /api/experiences/trending` — trending experience cards
- [ ] **Endpoint 7:** `GET /api/cities` — full city directory with metadata
- [ ] **Endpoint 8:** `GET /api/stats/system-health` — for "All systems operational" indicator

### Data points to track in DB

- [ ] Count of active conversations right now
- [ ] Count of conversations per day, week, month, all-time
- [ ] Cities with active users right now
- [ ] Voice messages processed today
- [ ] Plans/cards generated today
- [ ] Overcharges flagged (Fare Guard activations)
- [ ] Family shares triggered today
- [ ] Emergency mode activations
- [ ] Late-night safety check-ins delivered
- [ ] "Reached safely" confirmations
- [ ] Repeat user rate
- [ ] Average session count per user

### Caching strategy

- [ ] Cache `GET /api/stats/live` in Redis with 30-second TTL
- [ ] Cache `GET /api/stats/totals` in Redis with 5-minute TTL
- [ ] Cache `GET /api/safety/active-alerts` with 1-minute TTL
- [ ] Cache `GET /api/cities` with 1-hour TTL
- [ ] Use SWR (stale-while-revalidate) pattern for graceful degradation

### WebSocket vs Polling decision

- [ ] Decide: WebSocket connection for active alerts (real-time)
- [ ] Decide: 30-second polling for stats (simpler, less overhead)
- [ ] Recommended: Polling for v1.0, upgrade to WebSocket in v1.5

---

## What NOT to Show

These are tempting but should be excluded from the landing page.

### Do NOT include:

- [ ] ❌ Pricing tiers (let users discover via in-app upgrade flow)
- [ ] ❌ "Sign up for newsletter" form (cluttering, low value at MVP)
- [ ] ❌ Social media follower counts (looks weak when low)
- [ ] ❌ "As featured in Forbes / TechCrunch" badges (unless real)
- [ ] ❌ Comparison tables vs MakeMyTrip / ChatGPT (defensive, not confident)
- [ ] ❌ Award badges from random sites
- [ ] ❌ "100% AI-powered" tagline (users distrust this; show AI working instead)
- [ ] ❌ Generic 5-star testimonials (replace with specific stories)
- [ ] ❌ Booking buttons or hotel listings (Hita is not a booking platform)
- [ ] ❌ "Coming soon" features (only show what works today)

---

## Priority & Build Order

If you can't ship everything at once, build in this order:

### Phase 1 — Trust & positioning (Week 1)

Highest impact for new visitors. Ship these first.

- [ ] Section 2 — Live Trust Strip (4 stats)
- [ ] Section 1.2 — Hero positioning line for logged-out users
- [ ] Section 3 — What Hita Does (3 pillars)
- [ ] Section 11 — Footer additions (status page, WhatsApp)

**Why first:** A new visitor needs to understand Hita and trust it within 5 seconds. These sections do that.

### Phase 2 — Differentiation (Week 2)

What makes Hita different from any AI travel app.

- [ ] Section 5 — Live Safety Dashboard (the killer differentiator)
- [ ] Section 9 — Built Different (4 pillars)
- [ ] Section 7 — How It Works (3 steps)

**Why second:** After basic trust, visitors ask "why this and not ChatGPT?" These answer it.

### Phase 3 — Social proof & numbers (Week 3)

Final conversion push.

- [ ] Section 6 — Real Stories (5 stories)
- [ ] Section 10 — Numbers That Matter (6 stats)
- [ ] Section 4 refinements — Live activity on experience cards
- [ ] Section 8 refinements — City card metadata + safety scores

**Why third:** Once visitors trust and understand, social proof closes the deal.

---

## Quality Checklist

Before considering the landing page "done," verify each:

### Content quality

- [ ] Every claim has a corresponding live data signal
- [ ] No generic phrases like "world-class," "best-in-class," "revolutionary"
- [ ] Tone matches Hita's personality (warm, calm, present)
- [ ] Indian context throughout (₹, Indian cities, Hindi-English mixing)
- [ ] No emojis except in chat-style examples and Hita's voice
- [ ] Every section has one clear takeaway

### Technical quality

- [ ] All live endpoints respond in < 500ms (cached)
- [ ] Page loads in < 1.5s on 4G mobile
- [ ] All images use WebP with fallback
- [ ] Lazy loading enabled below the fold
- [ ] No layout shift during data load
- [ ] Graceful fallbacks if any API fails
- [ ] Mobile-first responsive (375px minimum)

### Trust quality

- [ ] Every statistic is real (not fabricated)
- [ ] Every story has user permission and verification
- [ ] Privacy policy linked and current
- [ ] Status page actually exists and works
- [ ] Contact email/WhatsApp actually responds
- [ ] No dark patterns (forced signup, hidden costs)

---

## Final Note

The single most important content recommendation: **Section 5 (Live Safety Dashboard) is the highest-leverage addition.** No other AI travel app shows real-time safety monitoring with live alerts and scam counters. This is what makes Hita feel alive, watchful, and worth trusting.

If you can only add one thing from this entire document, add Section 5.

Second priority: Section 2 (Live Trust Strip) — quick credibility right below the hero.

Third: Section 7 (How It Works) — closes the gap for new visitors.

---

**Maintained by:** Harshavardhan Arrimalla
**Project:** Hita — AI guardian companion for India
**Total tasks:** 129
**Estimated build time:** 3 weeks (Phase 1 + 2 + 3 sequential)
**Status:** Ready for implementation
