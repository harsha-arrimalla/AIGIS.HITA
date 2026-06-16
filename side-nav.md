# Hita Sidebar — Specification

> The complete spec for Hita's side navigation. What goes in it, what's inside each item, what to show on hover, and what to skip.

**Version:** 1.0
**Last updated:** April 2026
**Owner:** Harshavardhan Arrimalla

---

## Table of Contents

- [Design Principles](#design-principles)
- [Sidebar Structure (4 sections)](#sidebar-structure)
- [Section 1 — Conversations](#section-1--conversations)
- [Section 2 — Hita Remembers](#section-2--hita-remembers)
- [Section 3 — Safety & Support](#section-3--safety--support)
- [Section 4 — Account](#section-4--account)
- [Visual Layout](#visual-layout)
- [Mobile Behavior](#mobile-behavior)
- [Trip Mode — Detailed Spec](#trip-mode--detailed-spec)
- [What NOT to Include](#what-not-to-include)
- [Version Roadmap](#version-roadmap)
- [Component States](#component-states)

---

## Design Principles

Three rules govern every sidebar decision:

### 1. Chat is always the home

The sidebar is for **discovering features, accessing past context, and triggering safety actions**. It's NOT primary navigation. The conversation IS the product. Sidebar items should feel like supporting tools, not destinations.

### 2. Safety items are visually distinct

Emergency, family share, and trusted contacts get their own visual treatment — different background tint, warmer accent color, slightly larger touch targets. They're not "navigation" — they're tools you reach for in stressful moments.

### 3. Less is more

Maximum **6–8 visible items** at any time. Anything more dilutes the product story. Items beyond this go inside Settings, not the top-level sidebar.

---

## Sidebar Structure

The sidebar has four sections, in this order from top to bottom:

```
┌──────────────────────────────────┐
│  [Hita logo]                     │
│  ────────────────────────────    │
│  Section 1 — CONVERSATIONS       │
│  ────────────────────────────    │
│  Section 2 — HITA REMEMBERS      │
│  ────────────────────────────    │
│  Section 3 — SAFETY & SUPPORT    │
│  ────────────────────────────    │
│  Section 4 — ACCOUNT (bottom)    │
└──────────────────────────────────┘
```

Each section has a small uppercase label (10px, light gray, letter-spaced) above its items. Spacing between sections is generous — 24px minimum.

---

## Section 1 — Conversations

The most-used section. Lives at the top, gets the most visual weight.

### 1.1 New chat (button)

**Type:** Primary CTA button at the top
**Always visible:** Yes
**Visual:** Filled accent color background, white text, 40px tall, rounded
**Icon:** + (plus) icon left of label
**Label:** "New chat"
**Action on click:** Clears current conversation, navigates to empty chat state, focuses input field
**Keyboard shortcut:** Cmd/Ctrl + N

**What's inside:** Just a button. No expansion.

**Behavior notes:**
- If user is mid-conversation, show a soft confirmation: "Start a new chat? Your current chat is saved automatically."
- After click, the empty chat state shows a warm Hita greeting + 3 suggested starter prompts based on time of day (morning vs late night vs afternoon).

---

### 1.2 Search conversations (input)

**Type:** Inline search input with magnifying glass icon
**Always visible:** Yes (only after user has 5+ conversations; hidden before)
**Visual:** Subtle border, placeholder "Search your chats…"
**Action:** As user types, filters the conversation list below in real time
**Keyboard shortcut:** Cmd/Ctrl + K

**What's inside:**
- Searches across conversation titles AND message contents
- Highlights matched text in results
- Supports queries like "Hyderabad" → finds all chats mentioning Hyderabad
- Empty state when no matches: "No chats found. Try different words."

**Behavior notes:**
- Search is fuzzy (allows typos). User searches "hydrebad" → still finds Hyderabad chats.
- After 0.3 seconds of no typing, debounced API call hits backend search endpoint.
- Recent searches appear as chips when input is focused but empty.

---

### 1.3 Recent conversations (list)

**Type:** Scrollable list of past chats
**Always visible:** Yes
**Visual:** Each item is 56px tall, has icon + title + timestamp
**Default count:** Show last 10, with "View all (47)" link at bottom

**What's inside each conversation item:**

```
┌────────────────────────────────────────┐
│  [icon]  Conversation title            │  ← title from first message or AI summary
│          2 days ago · 12 messages      │  ← timestamp + message count
└────────────────────────────────────────┘
```

**Title generation logic:**
- First-time chat: Use first user message, truncated to 40 chars
- After 3+ messages: AI generates a 4-6 word summary ("Hyderabad airport arrival to Trident Hotel")
- User can rename a conversation manually via right-click / long-press menu

**Hover state shows:**
- Three-dot menu appears on right
- Menu options: Rename · Pin to top · Share · Delete

**Pinned conversations:**
- User can pin up to 3 conversations
- Pinned chats appear at the top with a small pin icon
- Useful for active trips, ongoing emotional support, etc.

**Conversation item icons (left of title):**
- 🛬 Airport-related (auto-detected from intent)
- 🛡️ Safety-focused
- 💙 Emotional support
- 🚗 Transit/route
- 💰 Fare-related
- 💬 General (default fallback)

**Action on click:** Loads that conversation, focuses input, scrolls to last message.

---

### 1.4 View all conversations (link)

**Type:** Text link at bottom of recent list
**Always visible:** Only if user has 10+ conversations
**Visual:** Subtle, small, uppercase: "VIEW ALL (47)"
**Action:** Navigates to a full conversation history page with sort/filter options

**What's inside the full history page:**
- Filter by: All · This week · This month · By city · By type (safety, transit, emotional)
- Sort by: Most recent · Most messages · Pinned first
- Bulk actions: Select multiple → archive or delete
- Export option: Download all conversations as PDF (premium feature)

---

## Section 2 — Hita Remembers

This section is what makes Hita different from ChatGPT clones. It's about Hita knowing the user across time.

### 2.1 My places

**Icon:** 📍 (pin)
**Label:** "My places"
**Type:** Navigation item that opens a panel/screen

**What's inside:**

A list of saved locations Hita can reference automatically. Three categories:

**Category 1: Home & Stays**
- Home address (encrypted, never shared in chat unless user invokes it)
- Hotels visited and saved
- Hostels, guesthouses, friend's places

**Category 2: Frequent destinations**
- Office address
- Gym, regular café, frequently-visited friend's home
- These auto-populate based on chat patterns ("You've asked about routes to Hitech City 5 times — save it?")

**Category 3: Wishlist**
- Places user wants to go
- Saved during chats: "Add to wishlist" appears under place recommendations

**Each saved place item shows:**
- Place name
- Full address (collapsed by default, expands on tap)
- Last visited timestamp
- Tag (Home · Hotel · Office · etc.)
- Edit/Delete on hover

**How Hita uses this:**
- User says "going home" → Hita already knows the address, calculates route automatically
- User says "back to Trident" → Hita references the saved hotel
- Privacy: places are user-only, never shared with third parties

**Adding a place:**
- Manual: tap "+ Add place" button at top of list
- Automatic: Hita suggests saving after 3+ mentions of the same destination
- From chat: "Save this location" appears under any GeoCard in conversation

---

### 2.2 My trips

**Icon:** ✈️ (plane)
**Label:** "My trips"
**Type:** Navigation item with a small badge showing active trip count

**What's inside:**

Three states: Upcoming · Active · Past

**Upcoming trips (next 30 days)**
- Trip name (e.g., "Bangalore — work trip")
- Start date, end date
- Destination city
- Status: "Starts Friday"
- Tap to view detail

**Active trips (currently happening)**
- Highlighted with accent color border
- Shows current location if Trip Mode is on
- "Trip mode" toggle visible on this trip
- Quick actions: Share with family · Emergency · End trip

**Past trips (last 90 days)**
- Trip name + dates
- Quick "View summary" — AI generates a recap
- Useful for memory: "We last visited Goa together 3 months ago"

**Trip detail page shows:**
- Trip overview (where, when, why)
- Saved places visited during trip
- Conversations related to this trip (linked)
- Emergency contacts active for this trip
- Notes section for personal trip journal

**Creating a trip:**
- Manual: "+ New trip" button
- Automatic: Hita detects trip intent in chat ("Going to Mumbai next week — want me to set this up as a trip?")
- Imported: Forward booking confirmation emails to trips@hita.in (v1.5+)

---

### 2.3 Trusted contacts

**Icon:** 👥 (people)
**Label:** "Trusted contacts"
**Type:** Navigation item with badge showing count

**What's inside:**

A list of people who can receive Hita's safety alerts and trip shares.

**Each contact shows:**
- Name and photo (or initials if no photo)
- Phone number (last 4 digits visible)
- Relationship tag: Family · Friend · Partner · Roommate
- Permissions: What this contact can receive (toggle list below)

**Per-contact permissions:**
- ☐ Receive trip shares
- ☐ Receive safe arrival messages
- ☐ Receive emergency alerts (always ON if contact is added)
- ☐ Receive late-night travel notifications
- ☐ See live location during emergencies

**Adding a contact:**
- Tap "+ Add contact"
- Form: Name (required), phone with country code (required), relationship (dropdown)
- Send invite via WhatsApp: "Hi, [User] has added you as a trusted contact on Hita..."
- Contact verifies by replying YES

**Privacy & limits:**
- Maximum 5 trusted contacts in free tier
- Up to 10 in premium tier
- Contacts can be removed any time, takes effect immediately
- Removed contacts get notified

**Why this lives in "Hita Remembers" not "Safety":**
Adding a contact is a slow, deliberate action you do once. Using a contact (in emergency or trip share) is fast and lives in the chat flow itself.

---

## Section 3 — Safety & Support

Visually distinct section. Slightly different background tint (subtle warm beige), warmer icon colors. This is the section users reach for in stressful moments — it should feel like a different surface.

### 3.1 Emergency

**Icon:** 🛡️ (shield)
**Label:** "Emergency"
**Type:** High-prominence button (slightly larger, accent color border)
**Always visible:** Yes — never hide this even on small screens

**What's inside:**

When tapped, opens the Emergency Mode overlay (full screen, takes over the entire UI).

**Emergency Mode shows:**

**Top section — Immediate actions (red CTAs):**
- Big button: "Call 112" (Indian emergency number)
- Big button: "Call my emergency contact"
- Big button: "Send my location to all trusted contacts"

**Middle section — What's around me:**
- Nearest hospitals (with distance and call buttons)
- Nearest police stations
- Safe public places nearby (24-hour cafes, hotels, fuel stations)
- Map view with current location pinned

**Bottom section — Reassurance:**
- Hita message in calm voice: "I'm here. Take a breath. Tell me what's happening."
- Voice activation auto-enables (one-tap to talk)
- Live location share starts automatically (with confirmation)

**Behavior notes:**
- Emergency mode persists even if user accidentally exits — confirmation needed to leave
- Logs emergency activation timestamp for safety review
- Triggers a notification to all trusted contacts marked as "emergency receivers"

---

### 3.2 Trip mode (toggle)

**Icon:** ⊙ (circle, filled when ON)
**Label:** "Trip mode" with state suffix: "(Off)" or "(On — Bangalore)"
**Type:** Toggle switch, not a navigation item

**What's inside (when toggled ON):**

A modal asks for trip context:
- "Where are you going?" (city autocomplete)
- "Until when?" (date picker)
- "Should I notify your trusted contacts?" (yes/no)
- "Is this a solo trip?" (changes Hita's safety vigilance)

**Trip mode behaviors when ON:**

**Proactive check-ins:**
- "You've been at the airport for 2 hours — everything okay?"
- "Your hotel is 30 mins away. Want me to help you get there safely?"
- "It's been 3 hours since your last message. Just checking in."

**Heightened safety mode:**
- All safety scores are recalculated more strictly
- Late-night warnings come earlier (e.g., 9 PM instead of 11 PM)
- Fare benchmarks compared more aggressively against local rates

**Auto-share with trusted contacts:**
- Daily "Hita is at [city]" message to selected contacts
- Real-time location share if user opts in
- "Reached safely" message when trip ends

**Visual indicator:**
- A persistent banner at the top of the chat: "Trip mode active — Bangalore"
- Toggle in sidebar shows green dot
- Trip mode card pinned at top of conversation history

**Behavior notes:**
- Auto-disables when trip end date passes (with confirmation)
- User can extend trip by 24 hours from the banner
- Emergency activation while in Trip Mode notifies ALL contacts immediately, not just selected ones

---

## Section 4 — Account

Bottom of sidebar. Visually compact. Less prominence than other sections.

### 4.1 Settings

**Icon:** ⚙️ (gear)
**Label:** "Settings"
**Type:** Navigation item

**What's inside:**

**Group 1: Notifications**
- Push notification preferences
- WhatsApp notification preferences
- Email digests (weekly summary, on/off)
- Quiet hours (Hita won't send notifications between X and Y)

**Group 2: Privacy**
- Location sharing default (always ask, always allow, never)
- Voice recording retention (delete after transcription, keep 7 days, keep forever)
- Conversation history retention
- Data export (download all my data as JSON)
- Delete account (with confirmation flow)

**Group 3: Personalization**
- Language: English, Hindi, Telugu, Tamil, Bengali (v3.0+)
- Theme: Auto, Light, Dark
- Late-night mode trigger time (default 10 PM)
- Hita's tone: Default, More formal, More casual

**Group 4: About**
- Version number
- Terms of service
- Privacy policy
- Help center
- Send feedback

---

### 4.2 Credits & billing

**Icon:** 💳 (card)
**Label:** "Credits" with current balance shown next to it: "Credits · 12 left"
**Type:** Navigation item
**Visual:** Balance shown in accent color when > 5, amber when 1–5, soft red when 0

**What's inside:**

**Top section: Balance**
- Visual: Large number "12 credits"
- Sub-label: "Resets monthly on free plan"
- Or premium: "Unlimited"

**Middle section: How credits work**
- Brief explanation: 1 credit = one Hita conversation thread
- Voice messages = 2 credits
- Family share = free
- Emergency mode = always free, never deducts

**Plans section:**
- **Free** (current if applicable): 10 credits / month
- **Hita Plus** ₹99/month: Unlimited conversations
- **Hita Care** ₹299/month: Unlimited + 24/7 priority + family plan (5 members)

**Transaction history:**
- Last 10 transactions
- Date, amount, type (purchase, free credit, refund)
- Filter and search
- Download invoices for premium subscribers

**Razorpay checkout:**
- Tap "Upgrade to Hita Plus" → Razorpay modal
- One-tap UPI payment
- Auto-renewal toggle (default ON)
- Cancel anytime, prorated refund

---

### 4.3 Profile

**Icon:** User avatar (initials if no photo) or 👤
**Label:** User's first name (e.g., "Nikita")
**Type:** Navigation item / dropdown trigger

**What's inside:**

**Profile section:**
- Profile photo (upload, take photo, or initials default)
- First name, last name
- Phone number (with WhatsApp verification status)
- Email (with verification status)

**Quick info:**
- Member since: April 2026
- Total conversations: 47
- Cities visited via Hita: 5

**Actions:**
- Edit profile
- Change password
- Sign out
- Switch account (if multiple)

**Sign out confirmation:**
- "Sign out of Hita?" — Yes / Cancel
- Note: "Your conversations stay safe. You can sign back in anytime."

---

## Visual Layout

### Desktop (≥ 1024px)

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌──────────────┐ ┌─────────────────────────────────────────────┐ │
│ │              │ │                                             │ │
│ │   SIDEBAR    │ │              CHAT AREA                      │ │
│ │   280px      │ │              (rest of viewport)             │ │
│ │              │ │                                             │ │
│ │              │ │                                             │ │
│ └──────────────┘ └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

- Sidebar fixed at 280px wide
- Always visible on desktop
- User can collapse to icon-only (64px wide) via toggle button

### Tablet (768px – 1023px)

- Sidebar collapses to icon-only by default (64px)
- Tap any icon to expand temporarily, click outside to collapse
- Hover on icon reveals labels in tooltip

### Mobile (< 768px)

- Sidebar hidden by default
- Hamburger menu in top-left of chat opens slide-out drawer
- Drawer takes 85% of screen width
- Backdrop dim overlay on chat area
- Swipe-from-left edge gesture also opens drawer

---

## Mobile Behavior

On mobile, the sidebar coexists with a **bottom tab bar** for primary actions.

### Bottom tab bar (mobile only)

Three tabs, always visible at bottom of screen:

```
┌──────────────────────────────────────────┐
│                                          │
│            CHAT AREA                     │
│                                          │
│ ────────────────────────────────────────  │
│   [💬]         [✈️]         [👤]         │
│   Chat        Trips        Profile        │
└──────────────────────────────────────────┘
```

**Tab 1: Chat** (default) — Opens current conversation or empty chat
**Tab 2: Trips** — Opens active trips list (My trips)
**Tab 3: Profile** — Opens profile + access to all sidebar items

The hamburger menu (top-left) opens the full sidebar as an overlay drawer for less-frequent items: search, settings, credits, trusted contacts, etc.

This pattern matches Atlys and other India-first mobile-first apps. Thumb-reach for the things users do daily.

---

## Trip Mode — Detailed Spec

Trip Mode is Hita's most differentiated feature. It deserves its own deep dive.

### What Trip Mode is

A toggle that activates **active trip awareness** for a defined period. When ON, Hita stops being a passive chat tool and becomes an active travel guardian.

### What changes when Trip Mode is ON

**1. Conversational tone shifts**
- Hita uses present-tense, location-aware language
- "Where are you now?" replaces "Where will you be?"
- Proactive opening: "Good morning, day 2 in Bangalore. How are you?"

**2. Proactive check-ins (timed)**
- Morning: "How was last night?"
- Mid-day: "Settling in well?"
- Evening: "Heading back to the hotel? I can check the route safety."
- Late night: "Just letting you know I'm here if you need me."

**3. Heightened safety vigilance**
- Safety thresholds tighten by 20%
- Late-night warnings start 2 hours earlier
- Solo female mode (if applicable) becomes more proactive

**4. Auto-share with selected contacts**
- Daily "Hita with [User] in [City]" digest
- Trip start/end notifications
- Reached-safely confirmations after major moves

**5. Visual indicators**
- Persistent banner at top: "Trip mode · Bangalore · Day 2 of 5"
- Sidebar item shows green dot
- Notifications badge on Hita logo

### How users activate Trip Mode

**Path A: From sidebar**
- Tap toggle in sidebar
- Modal asks: city, dates, contacts to notify, solo trip?
- Confirm → Trip Mode is ON

**Path B: From chat**
- User says "I'm going to Bangalore next week"
- Hita responds and includes a CTA: "Want me to track this as a trip?"
- One tap → Trip Mode auto-fills with detected info, user confirms

**Path C: Auto-suggest**
- Hita detects a flight booking confirmation forwarded to email
- Suggests: "I see you have a flight to Mumbai on Friday. Activate Trip Mode?"

### When Trip Mode auto-deactivates

- Trip end date passes → 24-hour grace period → auto-OFF with confirmation
- User explicitly toggles OFF
- Long inactivity (7+ days no messages) → Hita asks if trip ended
- User can extend trip by 24h, 48h, or "until I say"

### Privacy & data handling

- Trip Mode location data deleted 30 days after trip ends
- User can export full trip data anytime
- User can delete a trip and all related data with one action
- Trusted contacts only see what user permitted them to see

---

## What NOT to Include

These are tempting but should be excluded from the sidebar:

### ❌ Booking dashboard
Hita is not a booking platform. Resist the pull. If users want to book, Hita can suggest external apps inline in chat.

### ❌ Itinerary planner (as a separate screen)
Itineraries appear inline in chat as cards. A separate "Itinerary" tab implies users navigate to it — they shouldn't need to.

### ❌ Currency converter / Translator
These are utilities, not Hita's core. If a user needs them, Hita can call them inline within a conversation. Don't dilute the sidebar with utility tools.

### ❌ Weather (as standalone item)
Weather appears in chat as context, not as a destination. Hita already injects weather context proactively.

### ❌ Discover / Explore
Hita is reactive (responds to user needs), not proactive content browsing. Skip this.

### ❌ Notifications inbox
A bell icon in the top bar of the chat is enough. No need for a sidebar item.

### ❌ Help / Support (as top-level)
Don't put this in the sidebar. Put it inside Settings.

### ❌ Premium / Upgrade prompt
Don't beg. Show credits balance in the Credits item. Users will upgrade when ready.

### ❌ Social features (friends, share, follow)
Hita is a personal companion, not a social network. No public profiles, no follower lists.

### ❌ Reviews / Ratings
Hita's recommendations are AI-driven, not crowd-sourced. Reviews dilute the trust model.

---

## Version Roadmap

Sidebar evolution by version:

### v1.0 (MVP — ship in first release)

**Must have:**
1. New chat button
2. Recent conversations (last 10)
3. Trusted contacts
4. Emergency
5. Settings
6. Profile

**Total: 6 items.** Deliberately narrow.

### v1.5 (after MVP earns trust)

**Add:**
7. Search conversations (when users have 5+ chats)
8. My places
9. My trips
10. Trip mode toggle

**Total: 10 items.**

### v2.0 (monetization + diaspora expansion)

**Add:**
11. Credits & billing (when paid plan launches)
12. Family plan section in Settings (multi-user accounts)

**Total: 12 items max.**

### v3.0+ (platform stage)

**Possible additions:**
- API & integrations (for B2B users)
- Saved corridors (for relocation use cases)
- Multi-language switcher (top-level)

Don't ship any of these in the first year.

---

## Component States

Every sidebar item must have all four states designed:

### Default state
- Icon and label visible
- Subtle text color (not too dark, not too light)
- No background

### Hover state (desktop only)
- Slight background tint (5% accent color)
- Icon brightens slightly
- Text color darkens

### Active state (currently selected)
- Stronger background tint (15% accent color)
- Icon in accent color
- Text in primary color, bold
- Small accent-colored bar on the left edge (3px wide)

### Disabled state (rare, e.g., feature locked behind premium)
- Icon and text at 40% opacity
- Lock icon overlay on the right
- Tooltip on hover: "Available with Hita Plus"

### Loading state (e.g., conversation list loading)
- Skeleton placeholders (3 rows)
- Shimmer animation
- No layout shift when content loads

### Empty state (e.g., no conversations yet)
- Subtle illustration or icon
- Message: "Your conversations will appear here"
- CTA back to "+ New chat"

---

## One Final Note

The sidebar is permanent real estate. Every item there says "this matters." Resist the urge to add things. Resist the urge to use it as a feature dump. Every quarter, audit each item — does it still earn its place?

The best sidebars feel inevitable. Like there's no other way the product could be organized. Hita's sidebar should feel like that — not designed, just **right**.

---

**Maintained by:** Harshavardhan Arrimalla
**Project:** Hita — AI guardian companion
**Version:** 1.0
**Status:** Ready for design + build
