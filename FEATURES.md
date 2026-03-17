# Features — Memory Palace App

This document defines all features of the Memory Palace App, including core functionality and engagement features inspired by [TalantulApp.com](https://talantulapp.com). For technical implementation details, refer to [ARCHITECTURE.md](./ARCHITECTURE.md). For UI and component patterns, refer to [UI_STYLE_GUIDE.md](./UI_STYLE_GUIDE.md).

> **Mobile-first priority:** Every feature must be fully functional and ergonomic on mobile devices before optimising for desktop. See [UI_STYLE_GUIDE.md §1](./UI_STYLE_GUIDE.md#1-mobile-first-design-strategy) for the mobile-first strategy.

---

## Table of Contents

1. [Dashboard Home Page](#1-dashboard-home-page)
2. [Daily Memory Review](#2-daily-memory-review)
3. [Memory Games](#3-memory-games)
4. [Progress & Gamification](#4-progress--gamification)
5. [Study Mode](#5-study-mode)
6. [Review Generator](#6-review-generator)
7. [Public Pages](#7-public-pages)
8. [Canvas Features](#8-canvas-features-react-flow)
9. [Spaced Repetition Engine](#9-spaced-repetition-engine)
10. [Retention & Activity Visualization](#10-retention--activity-visualization)
11. [Onboarding & Progressive Disclosure](#11-onboarding--progressive-disclosure)
12. [Backlinks & Node Connections](#12-backlinks--node-connections)

---

## 1. Dashboard Home Page

The dashboard is the first screen authenticated users see. It provides a quick overview of their memory practice activity and easy access to all major features.

### Components

#### Welcome Banner

- Personalised greeting: "Good morning, {displayName} 👋"
- Current daily streak counter with flame icon (e.g. "🔥 7-day streak")
- Prompt to start or continue today's review if not yet completed

#### Quick Stats Row

- Horizontal scrollable row of stat chips on mobile, inline row on desktop
- Stats displayed: **Points**, **Palaces count**, **Streak (days)**, **Accuracy %**
- Each chip: icon + value + label, minimum `48px` height

```tsx
// Stats row — horizontal scroll on mobile
<div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 md:overflow-x-visible md:mx-0 md:px-0">
  <StatChip icon={<Zap />} value={user.points} label="Points" />
  <StatChip icon={<Map />} value={user.palaceCount} label="Palaces" />
  <StatChip icon={<Flame />} value={user.streak} label="Day Streak" />
  <StatChip icon={<Target />} value={`${user.accuracy}%`} label="Accuracy" />
</div>
```

#### Daily Review CTA

- Prominent card with "Start Today's Review" button — `w-full` on mobile
- Shows nodes due for review today (count) and estimated time
- If already completed: shows score, streak maintained badge

#### Recent Activity

- Last 5 user interactions (node created, review completed, game played)
- Compact list items with icon, description, and relative timestamp
- Skeleton loading state while fetching

#### Achievements Grid

- 2-column grid on mobile, 4-column on desktop
- Each badge: icon (emoji or SVG), name, locked/unlocked state
- Locked badges are greyed out with a lock overlay
- Tapping a badge shows a bottom sheet with description and unlock criteria

#### Palace Card Grid

- All user palaces displayed as cards
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Each card: thumbnail, name, room count, node count, last accessed
- Loading state: Skeleton cards
- Empty state: Illustration + "Create your first palace" CTA

### Mobile Behaviour

- All sections scroll vertically as a single page
- Sticky section headers are not used (avoids competing with the browser's own sticky elements)
- Pull-to-refresh triggers a full dashboard data refetch

---

## 2. Daily Memory Review

Inspired by TalantulApp's Daily Quiz. Encourages a consistent daily practice habit.

### Rules

- One attempt per day per user
- 10 nodes randomly selected from all user's palaces for recall
- Timed session (configurable default: 5 minutes total, ~30 seconds per node)
- Results are saved and contribute to streak tracking

### Flow

1. **Pre-session screen** — "Today's Review: 10 nodes" + time estimate + "Start" button
2. **Review session** — Full-screen takeover (navigation hidden)
   - Node prompt displayed (title or image)
   - User types or selects the recalled content
   - Timer displayed prominently
   - Progress indicator: `3 / 10`
3. **Results screen** — Score out of 10, time taken, accuracy %, comparison to personal best
4. **Completion animation** — Podium / confetti animation on screen; streak badge awarded if maintained

### Streak Tracking

- Streak increments when the daily review is completed on consecutive days
- If a day is missed, streak resets to 0
- Streak freeze items (bonus rewards) can prevent a reset once per 7 days

### Mobile Behaviour

- Full-screen mode during the session (hides bottom nav and top bar)
- Large touch-friendly answer inputs (min `48px` height)
- Timer displayed in the top bar area of the full-screen view

---

## 3. Memory Games

Inspired by TalantulApp's Games section. Multiple distinct game modes keep the review experience varied and engaging. All games operate in **full-screen takeover mode** — navigation is hidden during gameplay.

### 3.1 Matching Game

- Grid of cards showing either node title or content (face-down)
- User flips two cards at a time trying to match title ↔ content
- Incorrect matches flip back; correct matches stay revealed
- Score: pairs matched / total pairs, time taken
- Grid sizes: 4×4 (easy), 5×4 (medium), 6×4 (hard)

### 3.2 Fill in the Blank

- Node content displayed with one or more key terms blanked out
- User types the missing term(s) from memory
- Case-insensitive matching; minor typo tolerance (Levenshtein distance ≤ 1)
- 10 questions per session, timed

### 3.3 Flashcard Stack

- Full-screen swipeable flashcard interface
- Front: node title / prompt
- Back: node content
- Swipe right → "I knew it" (correct)
- Swipe left → "Still learning" (incorrect / repeat)
- Keyboard support: `Space` to flip, `→` for correct, `←` for learning
- Session ends when all cards have been reviewed at least once

### 3.4 Association Challenge

- User is shown an edge/connection label and must recall both nodes it connects
- Multiple choice (4 options) or free-form typing mode
- 10 questions per session

### 3.5 Typing Practice

- Node title displayed; user types the complete content from memory
- Real-time diff highlighting as the user types
- Accuracy percentage calculated on submission
- Useful for deepening memorisation of specific content

### Mobile Behaviour for All Games

- Full-screen takeover — navigation hidden
- Large touch targets for all interactive elements (`min-h-[48px]`)
- Swipe gestures where applicable (flashcards, matching grid)
- An "Exit Game" button fixed in the top-right corner at all times

---

## 4. Progress & Gamification

Inspired by TalantulApp's leaderboard and gamification system. Motivates consistent usage through visual feedback and rewards.

### Points System

| Action                            | Points Awarded |
| --------------------------------- | -------------- |
| Create a new node                 | +5 pts         |
| Complete daily review (any score) | +20 pts        |
| Perfect daily review (10/10)      | +50 pts bonus  |
| Complete a memory game            | +10 pts        |
| 7-day streak maintained           | +100 pts bonus |
| Create a new palace               | +10 pts        |

### Achievement Badges

| Badge            | Unlock Criteria                            |
| ---------------- | ------------------------------------------ |
| 🏛️ First Palace  | Create your first palace                   |
| 🔗 Connected     | Create your first edge                     |
| 💯 Century       | Create 100 nodes total                     |
| 🔥 Week Warrior  | Maintain a 7-day streak                    |
| 🎯 Perfect       | Complete a daily review with 100% accuracy |
| 🧠 Memory Master | Complete 30 daily reviews                  |
| 🚀 Explorer      | Create palaces in 5 different topics       |
| 📚 Scholar       | Study 500 unique nodes                     |

### Progress Rings

Each palace shows a circular progress ring representing the retention rate (percentage of nodes recalled correctly in the last review cycle):

- Green ring: ≥ 80% retention
- Amber ring: 50–79% retention
- Red ring: < 50% retention

### Activity History

- Line/bar chart showing daily review completions and points earned
- Toggle between: Daily (last 30 days), Weekly (last 12 weeks), Monthly (last 12 months)
- Built with a lightweight chart library (e.g. `recharts` or `chart.js`)

### Personal Best Tracking

- Best score, best time, and highest streak are stored per user
- Displayed on the results screen after each daily review

### Mobile Behaviour

- Stats page: scrollable single column with charts that are horizontally scrollable if wide
- Achievement grid: 2 columns on mobile
- Progress rings: inline with palace cards

---

## 5. Study Mode

Inspired by TalantulApp's Study Mode. A browsable, filterable library of all the user's nodes for passive review.

### Features

- **Hierarchy navigation:** Palace → Room → Node
- **Filter panel:** Filter by node type, tags, difficulty level (if set), palace, room
- **Search bar:** Full-text search across all node titles and content (uses Supabase `tsvector` GIN index — see [ARCHITECTURE.md §3](./ARCHITECTURE.md#3-relational-database-schema))
- **Expandable node cards:** Collapsed by default; tap/click to expand full content
- **Tag-based browsing:** Click a tag to filter all nodes with that tag

### Mobile Behaviour

- Filter panel opens as a bottom sheet on mobile
- Nodes displayed as stacked accordion cards
- Sticky search bar at the top of the list

---

## 6. Review Generator

Inspired by TalantulApp's Test Generator. Lets users build a custom review session and optionally export it for offline use.

### Configuration Options

| Setting        | Options                                        |
| -------------- | ---------------------------------------------- |
| Source palaces | Multi-select; all palaces or specific ones     |
| Source rooms   | Multi-select; all rooms or specific ones       |
| Node types     | Text, image, link, or all                      |
| Tags           | Filter to specific tags                        |
| Question count | 5, 10, 20, or custom (max 50)                  |
| Review mode    | Flashcards, Fill in the Blank, Typing Practice |

### Session Flow

1. **Configure** — Select options via a step-by-step form (stepper UI)
2. **Preview** — Shows node count available matching criteria before starting
3. **Review session** — Launches selected game mode with filtered nodes (full-screen takeover)
4. **Results** — Score, time, list of missed nodes

### Save Configuration

- Named review configurations can be saved for reuse (stored per user in the database)
- Saved configurations are listed on the Review Generator page for quick access

### Export to PDF

- Users can export a generated review as a formatted PDF for offline study
- PDF includes node titles and content, organised by palace/room
- Generated server-side (e.g. using `@react-pdf/renderer` or a server action calling a PDF generation service)

---

## 7. Public Pages

Inspired by TalantulApp's marketing and onboarding pages. These are publicly accessible (no auth required).

### 7.1 Landing Page (`/`)

- **Hero section**: Bold headline, one-line value proposition, primary CTA ("Get Started Free") + secondary CTA ("See How It Works")
  - Full-width hero on mobile; background illustration visible on `md`+
  - CTA buttons: `w-full` on mobile, `w-auto` on `md`+
- **Stats bar**: Key metrics (e.g. "10,000+ nodes created", "500+ active users", "30% better recall") displayed as a horizontal row
- **Feature highlights**: 3–4 feature cards explaining core concepts (Canvas, Daily Review, Games, Progress)
  - `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` layout
- **How it Works**: Numbered step flow (Create Palace → Add Nodes → Review Daily → Track Progress)
- **Final CTA section**: Repeated sign-up prompt at the bottom of the page

### 7.2 About Page (`/about`)

- How the Memory Palace technique works (the Method of Loci)
- Feature overview with more detail than the landing page
- Team / project background
- Link to GitHub repository

### 7.3 Join / Onboarding Wizard (`/join`)

Step-by-step onboarding using a **stepper UI component**:

1. **Create account** — Email + password or OAuth (Google)
2. **Name your first palace** — Text input with suggestions
3. **Choose a theme** — Visual style for the palace (colour, icon)
4. **Add your first node** — Guided canvas interaction
5. **Complete!** — Redirect to dashboard with celebration animation

**Mobile behaviour:**

- Each step occupies the full viewport height (`100dvh`)
- Step indicator at the top (dots or numbered bar)
- "Next" button is `w-full` and fixed at the bottom above the safe area
- Back button in the top-left

---

## 8. Canvas Features (React Flow)

The canvas is the core differentiator of the Memory Palace App. All canvas features are covered in detail in [ARCHITECTURE.md §5](./ARCHITECTURE.md#5-critical-implementation-details) and [UI_STYLE_GUIDE.md §2](./UI_STYLE_GUIDE.md#2-canvas-on-mobile-react-flow).

### Feature Summary

| Feature          | Mobile                                          | Desktop                               |
| ---------------- | ----------------------------------------------- | ------------------------------------- |
| Pan canvas       | Touch drag (one finger)                         | Mouse drag                            |
| Zoom             | Pinch to zoom                                   | Scroll or trackpad                    |
| Create node      | FAB → tap empty canvas area                     | Double-click canvas or toolbar button |
| Edit node        | Bottom sheet slides up                          | Side panel                            |
| Create edge      | Long-press source node → drag to target         | Drag from node handle                 |
| Delete node/edge | Select → trash button in bottom sheet / toolbar | Select → `Delete` key or toolbar      |
| Mini-map         | Hidden (`hidden md:block`)                      | Visible (bottom-right corner)         |
| Zoom controls    | Shown (`md:hidden`)                             | Hidden (use scroll/trackpad)          |
| Toolbar          | FAB + radial menu                               | Fixed toolbar panel                   |
| Node size        | `min-w-[60px] min-h-[60px]`                     | `min-w-[120px] min-h-[60px]`          |

### React Flow Configuration

See [UI_STYLE_GUIDE.md §2](./UI_STYLE_GUIDE.md#2-canvas-on-mobile-react-flow) for the required React Flow props for mobile.

### Full-Screen Canvas Mode

When editing a palace room, the canvas takes over the full viewport:

- Bottom nav and top bar are hidden
- An "Exit Canvas" button is fixed in the top-right corner
- Node count and room name displayed in a minimal top bar

---

## 9. Spaced Repetition Engine

**Inspired by: Anki, RemNote** — ⭐⭐⭐ HIGH PRIORITY

Go beyond the daily review with a proper spaced repetition system built on the SM-2 algorithm. See [ARCHITECTURE.md §1](./ARCHITECTURE.md#1-technology-stack) for the supporting tech stack.

### SM-2 Algorithm

After reviewing a node, the user rates their recall:

| Rating           | Action                   | Next Interval                      |
| ---------------- | ------------------------ | ---------------------------------- |
| **Again** (fail) | Failed to recall         | Review tomorrow (interval = 1 day) |
| **Hard**         | Recalled with difficulty | Current interval × 1.2             |
| **Good**         | Recalled correctly       | Current interval × 2.5             |
| **Easy**         | Recalled instantly       | Current interval × 3.5             |

### Node Maturity Levels

Based on the current interval, each node has a maturity badge:

| Badge | Level        | Interval           |
| ----- | ------------ | ------------------ |
| 🔴    | **New**      | Never reviewed     |
| 🟡    | **Learning** | Interval < 7 days  |
| 🟢    | **Known**    | Interval 7–30 days |
| 💎    | **Mastered** | Interval > 30 days |

Maturity badges are displayed on each node in canvas view and in study mode.

### Review Queue

- Dashboard widget: "You have **X nodes** due today" with estimated time
- Clicking the widget navigates directly to the daily review session
- Nodes are sorted by urgency: overdue first, then due today, then upcoming

### Leech Detection

Nodes failed more than 5 times are automatically flagged as **"Difficult"**:

- A ⚠️ badge is shown on the node in canvas and study mode
- Dashboard widget: "You have N difficult nodes — suggested for focused review"
- Clicking navigates to a filtered review session with only leech nodes

### Mobile Behaviour

Rating buttons (Again / Hard / Good / Easy) are displayed as a full-width horizontal row at the bottom of the review card, with minimum `48px` height per button. On very narrow screens (< 360px), labels are abbreviated: "A / H / G / E".

---

## 10. Retention & Activity Visualization

**Inspired by: Anki heatmap, GitHub contribution graph** — ⭐⭐ MEDIUM PRIORITY

See [ARCHITECTURE.md §1](./ARCHITECTURE.md#1-technology-stack) for the `recharts` library used for charts.

### Retention Heatmap

A GitHub-style calendar grid (7 rows × 52 columns) showing daily review activity:

- Each cell represents one day; color intensity scales with nodes reviewed
- Scale: 0 nodes → lightest shade, 20+ nodes → darkest shade
- Tooltip on hover: "15 nodes reviewed on March 12, 2026"
- Streak visualization: consecutive colored cells stand out visually
- Implementation: CSS Grid with dynamic `bg-green-100` through `bg-green-500` classes

```tsx
// Heatmap cell color utility
function getHeatmapColor(count: number): string {
  if (count === 0) return 'bg-muted';
  if (count < 5) return 'bg-green-100 dark:bg-green-900';
  if (count < 10) return 'bg-green-200 dark:bg-green-800';
  if (count < 20) return 'bg-green-400 dark:bg-green-600';
  return 'bg-green-500 dark:bg-green-500';
}
```

### Review Forecast Chart

A bar chart showing predicted review workload for the next 7 days:

- "Tomorrow: 12 nodes due · Thursday: 28 nodes due"
- Helps users plan their study time
- Implementation: `recharts` `AreaChart`

### Palace Mastery Overview

For each palace, a donut chart showing the distribution of node maturity:

- Segments: % New, % Learning, % Known, % Mastered
- Summary label: "Genesis: 72% mastered"
- Clicking a palace card navigates to that palace

### Mobile Behaviour

Heatmap: horizontally scrollable on mobile (most recent weeks visible without scrolling). Charts: full-width, horizontally scrollable if they exceed the viewport. Donut charts: inline with palace cards, scaled to `48px` diameter on mobile.

---

## 11. Onboarding & Progressive Disclosure

**Inspired by: Superhuman, Todoist, Duolingo** — ⭐⭐ MEDIUM PRIORITY

First-time users need guided hand-holding without overwhelming them with all features at once.

### Interactive Tutorial (First Login)

A 5-step guided flow triggered automatically on first login:

1. **"Welcome! Let's create your first Memory Palace"** → guided palace creation form
2. **"Now add a room"** → guided room creation with highlighted input
3. **"Great! Open the canvas and place your first node"** → canvas interaction with highlighted empty area and animated pointer
4. **"Perfect! Come back tomorrow to review"** → show daily review CTA with explanation of streaks
5. **"You're all set!"** → confetti celebration animation → redirect to dashboard

Each step occupies the full viewport on mobile (`100dvh`), with a "Next" CTA fixed at the bottom.

### Contextual Tooltips

Show-once tooltips that appear the first time a user encounters a feature, then are dismissed permanently:

- First time opening canvas: "Drag to create connections between nodes"
- First time on progress page: "Complete daily reviews to build your streak"
- First time viewing a node: "Long-press a node to open the context menu"

Tooltip state stored in `localStorage` (or user profile for cross-device sync).

### Progressive Feature Unlocking

Optional gating to prevent overwhelming new users:

| Feature                                     | Unlocks After                |
| ------------------------------------------- | ---------------------------- |
| Games                                       | 10 nodes created             |
| Review Generator                            | First daily review completed |
| Advanced canvas tools (lasso, snap-to-grid) | 20 nodes created             |

Locked features show a subtle lock badge and a short tooltip explaining how to unlock them.

### Shortcut Coaching

During the first week, show shortcut hints after repeated manual actions:

- After clicking "New Palace" button 3 times: "Tip: Press `C` then `P` to create a palace faster!"
- After opening settings manually 3 times: "Tip: Press `G` then `S` to open Settings instantly"

### Mobile Behaviour

Tutorial steps are full-screen on mobile. Contextual tooltips appear as bottom-anchored banners (not floating tooltips) to avoid being obscured by the keyboard. Progressive unlocking lock badges are visible on both the bottom nav tab icons and the feature cards.

---

## 12. Backlinks & Node Connections

**Inspired by: Obsidian, RemNote** — ⭐⭐ MEDIUM PRIORITY

Enhance the canvas with knowledge-graph features that surface implicit connections between memories.

### Backlinks Panel

When viewing or editing a node, a **"What links here?"** panel is shown:

- Lists all nodes that have an edge pointing **to** this node
- Each backlink entry shows: source node title, palace/room breadcrumb, and a navigation arrow
- Clicking any backlink navigates to that node on its canvas
- Empty state: "No other nodes link to this one yet"

### Node Reference Syntax

In node content, typing `[[` opens an autocomplete dropdown to link to another node:

```
This relates to [[Genesis 1:1]]
```

- Autocomplete searches all node titles across all palaces
- Selecting a suggestion inserts the reference and creates an edge in the graph automatically
- Referenced nodes render as clickable chips within the content
- Clicking a chip navigates to the referenced node

### Bi-Directional Edges

Creating a `[[reference]]` in content automatically creates a directed edge in React Flow. The reverse direction (backlink) is surfaced in the backlinks panel without creating a second visible edge.

### Orphan Node Detection

Nodes with zero edges are highlighted with a subtle indicator:

- Canvas view: faint dashed border on orphan nodes
- Dashboard widget: "You have 5 unconnected nodes — connect them to strengthen your memory palace"
- Clicking the widget opens the canvas filtered to show only orphan nodes

### Connection Strength

Edges become visually more prominent (thicker stroke, higher opacity) as both connected nodes are reviewed together more frequently. This visualises which connections are well-established vs. recently formed.

### Mobile Behaviour

Backlinks panel opens as a bottom sheet (`Sheet` with `side="bottom"`) on mobile. Node reference autocomplete is triggered by a toolbar button (since typing `[[` on mobile soft keyboards may not reliably fire). Orphan node indicators are visible on canvas nodes on mobile.
