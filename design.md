# Hita — Design System Reference

> Single source of truth for all design decisions.
> Derived from the Hita Design Document v1.0 by Harsha.

---

## 1. Design philosophy

### Core thesis

A conversation with AI is a relationship, and relationships deserve a hospitable environment. Hita borrows from Airbnb's spatial language — white surfaces, rounded geometry, generous whitespace, a single warm accent — to make AI feel approachable rather than utilitarian.

### Principles (in priority order)

1. **Hospitality over efficiency.** The interface feels like walking into a well-lit space, not opening a tool. Loading states are calm, empty states are inviting, errors apologise.
2. **Whitespace is a feature.** Density is not a virtue. Prefer one large, confident element over four medium ones.
3. **One accent, used sparingly.** Coral appears on the primary CTA, active states, and the brand mark — nowhere else. Everything else is calibrated grey.
4. **Cards are the atomic unit.** Conversations, prompts, suggestions, results — all cards. 16px radius, soft shadows, breathing room.
5. **The same Hita everywhere.** Web and mobile share one design language, one type ramp, one colour system, one motion vocabulary.

### What Hita is NOT

- Not a productivity tool with sidebars, tabs, and information density.
- Not a developer playground. No system-prompt fields, model toggles, or temperature sliders.
- Not a ChatGPT/Claude.ai clone. Differentiation lives in the room the conversation happens in.

---

## 2. Brand

### Logo

Wordmark "hita" in lowercase Cereal Medium. The "h" sits inside a 32px squircle in coral. The squircle (~40% corner smoothing) recurs on avatar, send button, and empty-state illustrations.

### Voice

- Warm, never chirpy. "Welcome back" beats "Hey there!! 👋"
- Specific over generic. "Pick up where you left off on the Hyderabad trip" beats "Continue your conversation."
- Short over clever. Microcopy maxes out at 12 words.

### Tagline

"A calmer way to think with AI."

---

## 3. Colour tokens

Four-tier system: neutrals carry the interface, one accent does the work, two semantics handle status, warm tint provides atmosphere.

### Neutrals

| Token | Light | Dark | Usage |
|---|---|---|---|
| `bg-canvas` | `#FFFFFF` | `#0F0F0F` | Page background |
| `bg-surface` | `#FAFAF7` | `#1A1A1A` | Cards, sheets |
| `bg-raised` | `#FFFFFF` | `#222222` | Elevated cards in feed |
| `bg-tint` | `#FFF8F6` | `#1F1816` | Warm tint for hero panels |
| `border-hairline` | `#EBEBEB` | `#2A2A2A` | Default border |
| `border-soft` | `#DDDDDD` | `#3A3A3A` | Hover, focus |
| `text-primary` | `#222222` | `#F7F7F5` | Headings, body |
| `text-secondary` | `#717171` | `#B0B0B0` | Meta, helper |
| `text-tertiary` | `#B0B0B0` | `#7A7A7A` | Disabled, placeholder |

### Accent

| Token | Light | Dark | Usage |
|---|---|---|---|
| `accent` | `#FF5A5F` | `#FF6B70` | Primary CTA, active state, brand |
| `accent-pressed` | `#E0484D` | `#D9484D` | Pressed CTA |

### Semantics

| Token | Light | Dark | Usage |
|---|---|---|---|
| `success` | `#008A05` | `#3FB54A` | Confirmations |
| `warning` | `#C13515` | `#E04E2A` | Errors, destructive |

### Discipline rules

- Accent appears on at most ONE element per visible viewport.
- No gradients on UI surfaces (only in marketing illustrations).
- Dark mode: surfaces lift to `#1A1A1A`, not pure black. Pure black reserved for `bg-canvas` only.

---

## 4. Typography

Two families only. No third font.

### Families

| Role | Font | Fallback | Usage |
|---|---|---|---|
| Display | Cereal / Söhne | system-ui, sans-serif | H1, H2, hero numbers, brand wordmark |
| Body | Inter Variable | system-ui, sans-serif | All UI text, chat messages, labels |

### Type ramp

| Token | Size/Line | Weight | Usage |
|---|---|---|---|
| `display-xl` | 56/64 | 600 | Marketing hero only |
| `h1` | 32/40 | 600 | Page titles (web) |
| `h2` | 24/32 | 600 | Section titles, mobile screen titles |
| `h3` | 20/28 | 500 | Card titles |
| `body-lg` | 17/26 | 400 | Conversation text, long-form |
| `body` | 15/22 | 400 | Default UI |
| `label` | 13/18 | 500 | Filter chips, badges |
| `caption` | 12/16 | 400 | Timestamps, meta |

### Rules

- Sentence case everywhere. No Title Case, no ALL CAPS.
- Max 70 characters per line in conversation bubbles. Bubble capped at 680px.
- Numerals are tabular in metric lists.

---

## 5. Spacing

4px base grid. Scale: `4, 8, 12, 16, 24, 32, 48, 64`.

| Context | Web | Mobile |
|---|---|---|
| Card internal padding | 24px | 20px |
| Section gaps | 48px | 32px |

---

## 6. Radii and shadows

### Radii

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 8px | Inputs, small chips |
| `radius-md` | 12px | Buttons, badges |
| `radius-lg` | 16px | Cards, modals |
| `radius-xl` | 24px | Hero panels, sheets |
| `radius-pill` | 999px | Filter chips, pills, composer input |

### Shadows

| Token | Value | Usage |
|---|---|---|
| `shadow-1` | `0 1px 2px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.05)` | Resting card (default) |
| `shadow-2` | `0 6px 16px rgba(0,0,0,0.08)` | Hover card, dropdown |
| `shadow-3` | `0 12px 32px rgba(0,0,0,0.12)` | Modals, sheets |

Rules: soft never harsh, no coloured shadows, shadow-1 is default.

---

## 7. Iconography

- Lucide icon set only. No mixing families.
- Stroke only, 1.5px weight, 24px default size.
- Icons always paired with a label on primary surfaces. Icon-only reserved for secondary toolbars.

---

## 8. Information architecture

### Four destinations

1. **Home** — greeting, suggested prompts, recent conversations
2. **Chat** — active conversation, modeless, full-bleed
3. **Library** — saved conversations, collections
4. **Profile** — account, preferences, plan

No "Explore" or "Discover" tab. Home absorbs that role.

### Navigation

- **Web:** persistent top bar (72px). Wordmark left, search centre, library + avatar right. No left sidebar.
- **Mobile:** bottom tab bar (56pt + safe area). Active tab = coral icon + 4px underline.

---

## 9. Key screen specs

### 9.1 Web — Home

- Top nav: 72px sticky. Wordmark left, capability switcher centre (*Ask / Write / Plan / Learn / Code*), library + avatar right.
- Greeting: H1 "Welcome back, {name}." Sub: "What's on your mind today?"
- Hero input: 96px tall, 880px max-width, pill-shaped, coral squircle send button (56x56).
- Suggested prompts: 4-column grid, 24px gap, 200px tall cards.
- Recent conversations: horizontal scroller, 280px-wide cards.

### 9.2 Web — Chat

- Conversation column: 720px centred on `bg-surface` canvas.
- User messages: right-aligned, coral-tinted pill (`#FFF1F0` bg, `#222` text, 20px radius).
- Hita messages: left-aligned, no bubble, bare text on canvas, 32px squircle avatar.
- Composer: fixed bottom, 88px, centred 720px input, coral squircle send button.
- Message metadata (timestamp, copy, regenerate): appears on hover only.
- Streaming: per-word fade-in at 60ms stagger. Cursor = 2px coral underline.
- Inline cards for structured output: `radius-lg`, `shadow-1`, inset 16px.

### 9.3 Web — Library

- 3-column card grid, 24px gap. Cards: 320x280px.
- Two-tab segmented control: Conversations / Collections.
- Filter chips: All / This week / This month / Pinned.

### 9.4 Web — Profile

- Single column, 560px max-width.
- Avatar (96px squircle), display name, email.
- Section cards: Preferences, Plan, Data & privacy, Sign out.

### 9.5 Mobile — Home

- No top app bar. Wordmark inline with greeting.
- H2 greeting (24pt, lighter weight than web).
- Hero input: full-width pill, 64pt, tapping opens composer sheet.
- Capability chips: horizontal scroll, active = coral fill.
- Recent conversations: vertical list (not horizontal cards), 72pt rows.

### 9.6 Mobile — Chat

- No top bar by default. Pull down reveals 56pt bar with title + back.
- Full-width messages, 16pt side insets.
- User bubbles: coral-tinted pills, max 75% width.
- Composer: fixed bottom, 72pt + safe area.

### 9.7 Mobile — Composer sheet

- Bottom sheet rises to 92% viewport on input tap.
- 24pt top radius, drag handle, focused multi-line input.
- 300ms cubic-bezier rise, canvas scales to 96%.

---

## 10. Component inventory

### Buttons

| Variant | Background | Text | Radius | Height (web/mobile) |
|---|---|---|---|---|
| Primary | `accent` | white | 12px | 48/52pt |
| Secondary | white | `text-primary` | 12px | 48/52pt |
| Tertiary | transparent | `text-primary` | — | — |
| Icon | transparent | `text-primary` | — | 40x40pt |
| FAB/Send | `accent` squircle | white arrow | squircle | 56x56pt |

### Inputs

| Variant | Height | Radius | Notes |
|---|---|---|---|
| Text | 48pt | 12px | Coral 1.5px border on focus |
| Textarea | 48–240pt | 12px | Auto-grows |
| Pill (composer) | 64pt | 999px | Coral squircle send on right |
| Search | 48pt | 999px | Leading magnifier icon |

### Cards

| Variant | Radius | Shadow | Notes |
|---|---|---|---|
| Conversation | 16px | shadow-1 | Title, 4-line preview, timestamp, bookmark |
| Prompt suggestion | 16px | shadow-1 | Icon top-left, 2-line title, 1-line meta. Hover = shadow-2 |
| Collection | 16px | shadow-1 | 3 stacked thumbnails, title, count |
| Inline result | 16px | shadow-1 | Inside chat, inset 16px from message edge |

### Chips and badges

- Filter chip: pill, 32pt tall, 12pt h-padding. Active = coral fill + white text.
- Status badge: pill, 24pt tall. Tags like "Saved", "Shared", "Draft".

### Avatars

- Always squircles, never circles.
- Sizes: 32, 48, 96pt.
- User: pastel fill + initial. Hita: coral squircle + white "h".

### Sheets and modals

- Bottom sheet (mobile): 60% or 92%, 24pt top radius, drag handle, 40% black scrim.
- Modal (web): centred, 480–640px, 16px radius, shadow-3.
- Toast: bottom-centred, 320pt, 12px radius, auto-dismiss 4s.

### Empty states

- 200pt squircle illustration centred.
- H3 title + single body line in `text-secondary`.
- At most one tertiary CTA. Never a primary CTA.

### Loading states

1. **Skeleton:** hairline-bordered placeholders, no shimmer.
2. **Streaming cursor:** 2px coral underline, holds 600ms after last token.
3. **Indeterminate:** 2pt coral progress line at screen top.

### Errors

- Conversational tone: "I couldn't reach the server just now. Want me to try again?"
- Warning colour as 4px left border only, never full background fill.

---

## 11. Motion

### Principles

- Default duration: 200ms.
- Default curve: `cubic-bezier(0.2, 0.8, 0.2, 1)` (soft ease-out). Linear and ease-in forbidden.
- One thing moves at a time.
- Every motion has a function (feedback, direction, or state change).

### Signature moments

| Moment | Duration | Detail |
|---|---|---|
| Composer sheet rise | 300ms | Canvas scales to 96% behind scrim |
| Send button press | 100ms + 200ms | Compress to 92%, rebound |
| Conversation save | 600ms | Coral squircle rises from bookmark, scales 1.4x, fades |
| Streaming response | 60ms/word | Per-word fade-in stagger |

### Hover (web only)

- Cards: shadow-1 to shadow-2, no scale.
- Buttons: darken 4%, no transform.
- Links: 1px coral underline grows from left in 200ms.

---

## 12. Accessibility

- All text meets WCAG AA contrast.
- Focus ring: 2px coral outline, 2px offset.
- Touch targets: min 44x44pt mobile, 40x40px web.
- `prefers-reduced-motion`: disable non-essential animation. Composer sheet still rises but instantly.
- Screen readers: cards labelled with title + meta. Composer announces "Message Hita".
- Keyboard: full Tab/Shift+Tab/Enter/Esc navigation. Cmd+Enter to send. `/` focuses home input.
- Dark mode: every screen has a tested dark variant.

---

## 13. Breakpoints

| Name | Width | Notes |
|---|---|---|
| Mobile | 375px | Mirrors native mobile design |
| Tablet | 768px | Responsive adaptation |
| Desktop compact | 1024px | Reduced margins |
| Desktop | 1440px | Reference frame |

---

## 14. Implementation mapping

### CSS custom properties (Tailwind v4 @theme)

All tokens above map to `--color-*`, `--shadow-*`, `--radius-*` variables in `globals.css`.

### Token package (@hita/ui)

`packages/ui/src/tokens.ts` exports JS objects for colours, spacing, radii, fonts, and shadows — consumed by both web (Tailwind) and mobile (React Native StyleSheet).

### Font loading

- Inter Variable: Google Fonts CDN, `display=swap`.
- Cereal/Söhne: self-hosted or fallback to system-ui for v1 (licensing TBD).
