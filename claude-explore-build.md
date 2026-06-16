# CLAUDE.md — Hita Explore Screen (build rules)

Build the Explore screen for Hita (Expo React Native). This file is **binding**. The last build got
the structure right but defaulted to generic styling and broke safe-area. Do not repeat that.

---

## 0. Non-negotiables (read first)

These four caused the last build to fail. They override convenience.

1. **It must look like Hita, not a generic light travel app.** Glassmorphic, ambient, futuristic,
   minimal-enterprise. If the output looks like a default RN starter or a Figma travel kit, it's wrong.
2. **Respect safe-area insets.** The header must never collide with the status bar / Dynamic Island.
   Use `react-native-safe-area-context` (`useSafeAreaInsets` / `SafeAreaView`), not hardcoded padding.
3. **Home has NO map.** Home is a content-discovery feed (hero + rows). The map belongs only to Trip mode.
4. **Save is the only commitment verb in Home.** No "Route", no "Book", no "Flight + stay" on Home cards.
5. **Text contrast is enforced, not guessed.** Text never sits directly on raw images; it must sit on a gradient scrim or a solid/glass panel, and contrast is verified to WCAG (4.5:1 body, 3:1 large).
6. **Place taps open detail sheets, not chat.** Tapping a place opens a place-detail bottom sheet over the current surface (location data + Save / Plan / Ask Hita). Only explicit **Ask Hita** actions navigate to chat.

---

## 1. Design system (enforce, do not substitute)

**Type** — load via `expo-font`, no system fallback in final UI:
- Space Grotesk → display / titles / hero name
- DM Sans → body / labels / descriptions
- JetBrains Mono → numbers, ranks, distances, data ("2 hrs", "Top 10")

**Surfaces** — glassmorphic:
- Use `expo-blur` `BlurView` for sheets, cards-over-map, and the nav bar (intensity ~40–60).
- Translucent fills over an ambient background, not opaque `#FFFFFF` panels.
- Soft, ambient backdrop. Subtle, low-contrast. Never raw white.

**Color discipline** — restrained palette, 60-30-10. One accent for trust/active states. No rainbow.
Trust chips and active nav use the accent; everything else is neutral glass + type.

**Components** — custom. No shadcn defaults, no default RN component look. Custom chips, cards,
buttons, nav. Consistent radii, 8pt spacing grid, defined component states (default/press/disabled).

**Motion** — quiet and ambient. Subtle, not bouncy. Use `react-native-reanimated` for the sheet.

---

## 2. Navigation shell
Bottom tab bar (glass `BlurView`): **Chats · Explore · Profile**. Explore active by default.
Primary actions live in the nav bar — do not scatter floating buttons.

---

## 3. State logic (must actually switch — do not hardcode Home)
Detect state, first match wins:
1. Active trip + inside destination geofence → `TRIP`
2. Active trip + departure near + still home → `PRE_DEPARTURE`
3. No trip + at/near home → `HOME`
4. Unknown / weak GPS → `HOME` (safe default)

Signals: GPS, home location, trip records, destination geofence, GPS confidence (hold last good state
on weak signal — don't flicker). The Home→Trip flip on arrival is a designed transition, not a swap.

---

## 4. HOME — content-discovery feed (build this first)

Vertical `ScrollView`. **No map anywhere on this screen.**

```
SafeAreaView (top inset respected)
└─ Header (pinned)        "Explore" / "Dream and save future trips"
└─ Search (persistent)    pill: "Where to next? Ask Hita anything"  → opens NL search
└─ Hero (one)             featured weekend-feasible trip, full-width
└─ Row: Weekend getaways from {homeCity}   ← lead row
└─ Row: Trending in India now              ← ranked (Top-10 style)
└─ Row: Beautiful places worldwide
└─ Row: Because you saved {x}              ← personalized
└─ Row: Best in {season} now               ← seasonal
   (4–6 rows MAX — not 30)
```

**Hero card** (glass overlay on image): "This weekend" tag · trust chip · name · one-line context ·
feasibility line ("5 hrs from Hyderabad · best time now") · actions: **Save** + **Ask Hita** only.

**Rows** = horizontal `FlatList` (`horizontal`, `showsHorizontalScrollIndicator={false}`), each with a
title + chevron. "Trending" row shows a JetBrains-Mono rank number per tile.

**Tile anatomy** (every card):
- image · name · one-line cue (distance + season) · **Save heart**
- trust chip where relevant: `Verified` / `Untouched` / community-flagged

**Forbidden in Home:** map, Route button, Book/Flight+stay, real-time "near me", safety overlays,
top filter chips (the rows are the categories).

**Save → seed:** saving adds to "My List"; a saved place + a free weekend should be able to trigger a
Hita trip proposal later. Wire the save action to persist, not just toggle a heart.

---

## 5. TRIP — map-first guardian (build second)
`MapView` surface (styled to the design system — muted/ambient, not raw Google/Apple Maps) +
**draggable glass bottom sheet** (`BlurView` + reanimated, snap points: peek / half / full).

Sheet content, in order: Right now around me (with safety read) → What's next in my day → Safety
context for this area → Local essentials (food w/ veg-nonveg filter, ATM, pharmacy, SIM, restrooms,
water) → Hidden gems → Companion / check-in. **Route is valid here.**

---

## 6. PRE-DEPARTURE — briefing cards
Countdown + trip summary · destination safety brief · know-before-you-go · conditions + packing ·
soft itinerary seed.

---

## 7. Cross-cutting
- Natural-language search at top of Home and Trip — intent, not filters.
- Safety/trust read attached to every Trip recommendation; glanceable chip, expandable "why".
- "Why this surfaced" proof cue on recommendations.

---

## 8. Definition of done (self-check before declaring complete)
- [ ] Header clears the status bar / Dynamic Island on a notched device (safe-area verified)
- [ ] Space Grotesk / DM Sans / JetBrains Mono actually loaded and rendering (no system font)
- [ ] Surfaces are glass (BlurView), not opaque white
- [ ] Home has no map and no Route/Book buttons
- [ ] Home = hero + 4–6 horizontal rows; tiles carry distance + season + save + trust chip
- [ ] State switches Home/Pre-departure/Trip from signals (not hardcoded)
- [ ] Trip is map-first with a draggable glass sheet; Route present
- [ ] Bottom nav is glass: Chats / Explore / Profile
- [ ] Nothing looks like a default RN starter or a generic travel template