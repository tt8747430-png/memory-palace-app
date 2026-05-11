# IMPLEMENTATION_APP_PLAN_FIGMA.md

> **Phase 1 — Plan only. No application code is changed by this document.**
> Author: Principal Systems Architect pass over the 15 Figma reference folders the user provided.
> Status: **AWAITING APPROVAL.** No file under `apps/web/src/` is to be touched until the user replies `APPROVED`.

---

## 0. Sources audited

The 15 Figma folders were rasterized to `/tmp/figma-png/*.png` (`qlmanage -t -s 1400`). The following exports were inspected directly:

| Folder                                        | Representative frames inspected                                 | Dominant pattern                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Design_2026/`                                | Home — Populated, Home — Empty, Modal 1                         | Light-mode app shell: hashed workspace badge, `Quick actions ⌘K`, pill-selected nav item, soft "New" badge, applicant list with status pills, empty-state with bordered placeholder + "Start" CTA, foreground popover with search + quick-add grid + "Create Template" footer button.                                                                                                                                                                                         |
| `DashboardUI/`                                | Home (LinkGuard)                                                | Dark-mode app: `PLATFORM` / `ORGANIZATION` sidebar sections, "Total Clicks" KPI with bright green line chart, copy-link list with green check rail, footer with "My Account / Settings / Sign Out".                                                                                                                                                                                                                                                                           |
| `VibeCodedSaas/`                              | Home (Kangaroo Inc.) + Chart Hover                              | Dark sidebar with brand-icon "Link Integrations" row, badges on nav items (`6`, `New`), promo card "Partners affiliate program" + Try CTA, smooth purple area chart with tooltip pill `16 +21%↑`, range tabs `1d / 1w / 1m / 6m`.                                                                                                                                                                                                                                             |
| `FintechDesign/` (Kole's Redesign)            | Whole frame                                                     | Cream financial dashboard: collapsible left rail with `<< Collapse`, "Start searching here…" search, profile + avatar stack + `+ Add Widget`, tasks tile with `Urgent` / `Non-urgent` pills, activity manager sub-cards (Fraud Alert, Bankloan Approved with progress stages, Wallet Verification with "Enable" CTA), concentric profit rings (Revenue / Gross Profit / Operating Income / Net Income each with YoY %), partial-arc donut "Line of Credit / Amount Borrowed". |
| `UI_Elements/`                                | UI Cards, Charts & Data, Mobile Navbars, Signup Modals, Pricing | Reusable primitives: glass-pill nav, segmented control, soft-shadow cards, donut + area + sparkline + radar set, mobile tab bar with active green circular indicator, multi-step signup modal, three-tier pricing card row.                                                                                                                                                                                                                                                   |
| `SoftwareColors/`                             | Theming Light Mode, Theming Dark Mode, Linear Colors            | Tokenized neutral ramp (10 stops), Linear-style flat accent palette (purple / orange / red / yellow / green).                                                                                                                                                                                                                                                                                                                                                                 |
| `Micro_Dashboad/`                             | Component 1–3                                                   | Floating mini-dashboard cards (single KPI + sparkline + delta chip).                                                                                                                                                                                                                                                                                                                                                                                                          |
| `Software_Sections/`                          | Frame 1411067447, 1411067450, 1411067454                        | Marketing section snippets: solo white card floating over warm gradient with breadcrumb chip nav top-right and pill CTA `Show me more →`; minimalist hero with massive headline + "explore the interface »" affordance overlapping a screenshot.                                                                                                                                                                                                                              |
| `Sidebar_Tutorial/`                           | Base-1, Base-15                                                 | Workspace switcher (`#` logo + name + email + chevron) → `Quick actions ⌘K` row → nav with selected pill + colored "New" pill → expandable integrations row with tooltip.                                                                                                                                                                                                                                                                                                     |
| `MobileUI/`                                   | Dashboard, Home — Create, Note, Home — Empty State              | Mobile cards stacked vertically with bold count text + caption, FAB-driven Create flow, simple text-note view, charming empty illustration + primary CTA.                                                                                                                                                                                                                                                                                                                     |
| `Beginner/ColorsThatRuin/`                    | Open Cloud (cream + multi-color)                                | Single screen, two color treatments; teaches "noisy palettes break hierarchy" — useful as a _negative_ example for the OLED upgrade.                                                                                                                                                                                                                                                                                                                                          |
| `EveryUIConcept/`                             | Desktop, Intro, iPhone                                          | Tour-style sectioned design system poster.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `SwipeAnimation_Mobile/`                      | Screen 24, 70, 100                                              | Slide-to-buy primary action, swipe-to-next-token gesture, drag-to-dismiss bottom sheet with grabber.                                                                                                                                                                                                                                                                                                                                                                          |
| `VibeCoding_Results/` (Project Dashboard)     | Frame 1411067653                                                | Active-project stepper across the top: `Select Project ✓ → Planning ✓ → Design phase (active)` with branching connectors and timestamped tooltips.                                                                                                                                                                                                                                                                                                                            |
| `Linear-style theming` (under SoftwareColors) | —                                                               | Flat accent palette + 10-stop neutral ramp; reinforces our current `gold/emerald/rose/cyan/amber` direction.                                                                                                                                                                                                                                                                                                                                                                  |

**Filename collision note.** `DashboardUI/Home.svg` and `VibeCodedSaas/Home.svg` collided to a single `Home.svg.png` during rasterization; both originals were still inspected, but if we re-export we must prefix-flatten paths (`echo "$s" | tr '/ ' '__'`).

---

## 1. Executive synthesis — what Figma reveals

Across all 15 folders the recurring, **implementable** patterns are:

1. **Workspace-switcher header in the sidebar.** Avatar/logo + name + secondary line (email/role) + chevron. We have `Sidebar` but no switcher. This is where multi-palace context belongs.
2. **`Quick actions ⌘K` row pinned at the top of the sidebar.** A persistent, discoverable affordance — not just a hidden shortcut. Today our `⌘K` is only in the desktop sidebar footer pill and mobile header search icon. Promote it.
3. **Selected nav as a pill, not a side-stripe.** Soft surface background + bold weight + matching icon tint. Our current state is OK but can be tightened.
4. **Badges on nav items** (`New`, `6`). We already use one in `CinematicNav` for active-section dot; reuse the badge primitive in the dashboard sidebar.
5. **KPI tile = number + caption + sparkline + delta chip.** We shipped `Sparkline.tsx` and a 7-day activity sparkline; standardize the _tile shape_.
6. **Smooth area chart with hover tooltip pill.** Replace the simple sparkline on the dashboard activity tile with an area variant that surfaces a tooltip on hover (still pure-SVG, no Recharts).
7. **Concentric rings + partial-arc donuts (Kole's).** Perfect mapping for "mastery by node type" or "retention by room" stats. Pure SVG, scale-invariant, currentColor — no chart library.
8. **Stepper / journey progress across the top.** Maps 1:1 to our `RoomJourney` walk order (`positionY, positionX`). Today the journey is a vertical card stack; the Figma `VibeCoding_Results` stepper is a horizontal alternative for desktop-wide journey view.
9. **Modal / popover with search + quick-add grid + "Create X" footer button.** This is exactly the shape our `CommandPalette` + `CreatePalaceDialog` could converge to — a unified "Choose / Create" pattern.
10. **Mobile FAB + bottom tab bar with active circular indicator.** We have `MobileCreateFab` and a bottom nav; Figma `Tasty!` and `MobileUI` confirm the active-tab treatment should be a filled circle behind the icon, not an underline.
11. **Slide-to-buy / swipe-to-confirm primitive.** Useful for destructive confirms (`Slide to delete palace`) and an Anki-style "Slide for Easy" alt input on `FlashcardDeck`.
12. **Soft warm hero card floating over a tinted gradient** (Flourish, Software_Sections Frame 1411067447). Stronger marketing pattern than the current "everything in cinematic plate" — alternate gradient + plain-card sections create rhythm.
13. **`>> explore the interface` overlap affordance** (Frame 1411067454). A subtle "scroll to see the product" pull, with the next section's screenshot already poking above the fold.
14. **Empty states with bordered dashed placeholder + single primary CTA** (`Design_2026/Home — Empty`, `MobileUI/Home — Empty State`). Our `EmptyState` exists; align the visual to this pattern (dashed border + centered icon + single CTA).
15. **Color discipline.** `SoftwareColors/Theming Light Mode` shows a strict 10-stop neutral ramp + a small accent set. Reconfirms the **marketing-only** accent gating (ESLint rule already in place) and pushes product surfaces to a tighter neutral ramp.
16. **Negative example: `ColorsThatRuin`.** Validates our OLED-noise + restrained palette direction. Documented as anti-pattern.

---

## 2. Mapping table — Figma pattern → Memory Palace surface

| #   | Figma pattern                                              | Memory Palace target surface                     | Existing file(s) to modify                                                                                                                                                                   | New file(s)                                             |
| --- | ---------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| M1  | Workspace switcher in sidebar header                       | Dashboard sidebar                                | `apps/web/src/shared/components/Sidebar.tsx`                                                                                                                                                 | `shared/components/WorkspaceSwitcher.tsx`               |
| M2  | `Quick actions ⌘K` pinned row                              | Dashboard sidebar, top of nav                    | `apps/web/src/shared/components/Sidebar.tsx`, `shared/components/AppCommand/*`                                                                                                               | `shared/components/QuickActionsRow.tsx`                 |
| M3  | Pill-selected nav + badges                                 | Dashboard sidebar nav items                      | `shared/components/Sidebar.tsx` (nav item component, classnames only)                                                                                                                        | —                                                       |
| M4  | KPI tile shape (number + caption + sparkline + delta chip) | Dashboard bento                                  | `app/(dashboard)/dashboard/_components/DashboardBento.tsx`                                                                                                                                   | `shared/components/KpiTile.tsx`                         |
| M5  | Smooth area chart + hover tooltip                          | Dashboard activity tile                          | `shared/components/Sparkline.tsx` (extend with `variant="area"` + `tooltip` slot) or new component                                                                                           | `shared/components/AreaChart.tsx`                       |
| M6  | Concentric profit rings                                    | New "Mastery" tile in practice / stats           | —                                                                                                                                                                                            | `features/practice/components/MasteryRings.tsx`         |
| M7  | Partial-arc donut                                          | Practice stats — "due today / total"             | —                                                                                                                                                                                            | `shared/components/ArcDonut.tsx`                        |
| M8  | Horizontal stepper across journey top                      | Journey viewer (desktop ≥ md)                    | `app/(dashboard)/palaces/[palaceId]/rooms/[roomId]/journey/page.tsx`, `features/rooms/components/RoomJourney.tsx`                                                                            | `features/rooms/components/JourneyStepper.tsx`          |
| M9  | Search + quick-add grid + Create-X footer popover          | Convergence of `CommandPalette` + create dialogs | `shared/components/AppCommand/CommandPalette.tsx`, `features/palaces/components/CreatePalaceDialog.tsx`, `features/rooms/components/CreateRoomDialog.tsx` (no code change; design alignment) | —                                                       |
| M10 | Bottom-tab active circular indicator                       | Mobile bottom nav                                | `shared/components/BottomNav.tsx` (classnames)                                                                                                                                               | —                                                       |
| M11 | Slide-to-confirm primitive                                 | Destructive confirms + Easy answer on flashcards | —                                                                                                                                                                                            | `shared/components/SlideToConfirm.tsx`                  |
| M12 | Tinted hero card over warm gradient (rhythm)               | Marketing                                        | `app/(marketing)/page.tsx` + the section ordering; one new section component                                                                                                                 | `features/marketing/components/SoftCardSection.tsx`     |
| M13 | `explore the interface »` overlap affordance               | Marketing hero → next section                    | `features/marketing/components/CinematicHero.tsx`, sibling section                                                                                                                           | `features/marketing/components/ExploreInterfaceCue.tsx` |
| M14 | Dashed-border empty state                                  | All empty surfaces                               | `shared/components/EmptyState.tsx` (visual tweak)                                                                                                                                            | —                                                       |
| M15 | 10-stop neutral ramp + tightened accent use                | `globals.css` neutral tokens                     | `apps/web/src/app/globals.css` (token review only — already on this trajectory)                                                                                                              | —                                                       |
| M16 | `ColorsThatRuin` anti-pattern callout                      | Style guide doc                                  | `docs/archive/UI_STYLE_GUIDE-aspirational.md` (append a note)                                                                                                                                | —                                                       |

---

## 3. Per-file change blueprint

> Each entry lists: **target file → exact change → React 19 / Next 16 / Tailwind v4 idioms used → regressions to guard against**. No code is written yet.

### 3.1 Dashboard sidebar — `apps/web/src/shared/components/Sidebar.tsx`

Reads: workspace switcher + quick-actions row + pill nav + badges.

- Insert `<WorkspaceSwitcher />` at the top of the sidebar above the existing nav block.
- Insert `<QuickActionsRow />` directly below the switcher; it dispatches `openCommandPalette()` from `AppCommandProvider` (no new prop drill — context exists).
- Nav `<a>` items: replace any left-stripe with a full-width `rounded-xl` pill, `bg-muted/60 text-foreground font-semibold` when active. Icons inherit `currentColor`.
- Optional badge slot per nav item via `children?: { badge?: ReactNode }` — render a `Badge` from `@memory-palace/ui` with `variant="success"` for `New`, `variant="secondary"` for counts.
- React 19: no class components, keep this server-friendly. Active state is derived from `usePathname()` (already there).
- Tailwind v4: use `inset-shadow-*` for the pill on hover, `bg-linear-to-r` if a soft accent is needed.

**Regression guards.** No new global state. Pill classnames must keep WCAG AA contrast in both themes (verify in dark + light). Keep `aria-current="page"` on the active nav item.

### 3.2 Workspace switcher — `shared/components/WorkspaceSwitcher.tsx` (new)

- Server component shell + client island for the dropdown (`'use client'` only on the popover).
- Reads the user's display name + email from the session via the existing `getUserProfile()` action, passed in as a prop from the layout — **no new server round-trip**.
- Hash-icon avatar (Figma `linkd` pattern): generate a deterministic 4-char hash from the user id, render in a `rounded-lg bg-foreground text-background` tile. Fallback when display name is missing.
- Chevron opens a `<DropdownMenu>` (already in `@memory-palace/ui`) listing palaces. Items navigate via `<Link>` to `/palaces/[id]`.
- Future: when "multi-workspace" lands, this is the natural mount point.

**Regression guards.** Don't fetch palaces twice — pass the palace list down from the layout (it already loads `getPalaces` for the bento). Memoize.

### 3.3 Quick actions row — `shared/components/QuickActionsRow.tsx` (new)

- Pure client component.
- Two-line affordance: label `Quick actions` left, `⌘K` keycap right, full-width clickable surface.
- `onClick` calls `useCommandPalette().open()` from the existing `AppCommandProvider`.
- Keyboard: also a focusable element that responds to `Enter` / `Space`.

**Regression guards.** Must not register its own `⌘K` listener — the global one in `useGlobalShortcuts` already handles it. Only the click handler is new.

### 3.4 KPI tile — `shared/components/KpiTile.tsx` (new) + bento — `app/(dashboard)/dashboard/_components/DashboardBento.tsx`

- Props: `label: string`, `value: ReactNode`, `delta?: { value: number; direction: 'up' | 'down' | 'flat' }`, `spark?: ReactNode`, `tone?: 'neutral' | 'success' | 'warning'`.
- Composition only — wraps `Card` from `@memory-palace/ui`. No new global tokens.
- The activity tile, the streak tile, the palaces/rooms/nodes tiles all become `<KpiTile />`.
- Delta chip: rounded pill with up/down/flat glyph; color comes from `tone`. Uses product semantic tokens (`success`, `warning`), **not** marketing accents — the ESLint rule must continue to pass.

**Regression guards.** No behavior change to the queries. The bento grid layout (6-col) stays. Verify a11y: `value` must announce as text (no SVG-only numbers).

### 3.5 Area chart with hover tooltip — `shared/components/AreaChart.tsx` (new)

- Pure SVG. `viewBox="0 0 100 32"`, `preserveAspectRatio="none"`, points scaled via min/max. Uses `currentColor` for stroke + a `<linearGradient>` keyed off `currentColor` with `stop-opacity` for fill.
- Hover: a `<rect>` with `pointerEvents="all"` per bucket, hover state stored in `useState<number | null>`. On hover, render a small `<g>` with a circle marker + a foreignObject-free SVG pill (`<rect rx>` + `<text>`).
- Touch support: `onTouchStart` + `onTouchMove` using `event.touches[0].clientX` mapped to the bucket index.
- Reduced motion: stroke length transitions only run when CSS media `(prefers-reduced-motion: no-preference)` matches — done in CSS via `@media`, **not** a JS `useReducedMotion()` (per AGENTS.md global `MotionConfig`).

**Regression guards.** No Recharts. No `framer-motion` inside the chart (would inflate bundle for a one-off animation). Falls back gracefully with `data.length === 0`.

### 3.6 Mastery rings — `features/practice/components/MasteryRings.tsx` (new)

- Concentric SVG rings: 4 rings at radii e.g. `r = 45, 36, 27, 18`, each with `stroke-dasharray = circumference` + `stroke-dashoffset = circumference * (1 - progress)`.
- Each ring gets a label in a column to the right (matches Kole's "Revenue / Gross Profit / Operating Income / Net Income" pattern). For us: "Mastered / Familiar / Learning / New".
- Source data: `getPracticeStats()` already returns `weeklyActivity` + counts; extend the action result with a `mastery: { mastered: number; familiar: number; learning: number; new: number }` derived from `node_review_state.ease`. **Action signature change is additive**, so no caller breaks.

**Regression guards.** SR engine purity preserved — derivation happens in `getPracticeStats`, not in the component. Add a unit test for the bucket boundaries.

### 3.7 Arc donut — `shared/components/ArcDonut.tsx` (new)

- Single SVG arc with `stroke-dasharray` math. Renders "X due / Y total" with the arc representing `X/Y`.
- Drop into the practice/stats panel as a small companion to `MasteryRings`.

**Regression guards.** Pure component, no I/O.

### 3.8 Journey stepper — `features/rooms/components/JourneyStepper.tsx` (new) + journey page

- Horizontal stepper for `md:` and up; the existing vertical card stack stays for mobile (don't break `min-h-[420px]` + `h-[calc(100dvh-…)]` rules).
- Active step = the currently-focused node (uses `useScrollSpy` against the existing `RoomJourney` sections; new tiny hook, ≤ 30 LOC).
- Connectors between steps render as a 2-px `currentColor` line; the active connector animates from 0 → 100% length using a CSS `@keyframes` (no JS, no framer-motion).
- Reduced motion: keyframe is suppressed under `prefers-reduced-motion: reduce`.

**Regression guards.** Stepper renders **only** as a `<header>` inside the existing journey route; does not change the walk order (`positionY, positionX`). The `RoomJourney` server projection contract is unchanged.

### 3.9 Mobile bottom nav active indicator — `shared/components/BottomNav.tsx`

- Wrap each active-tab icon in a `rounded-full w-10 h-10 grid place-items-center` element with a soft surface background. Inactive icons get no surface.
- Classnames only. No prop signature changes.

**Regression guards.** Tap target stays ≥ 44 × 44 px. The existing safe-area inset math (`pb-[env(safe-area-inset-bottom)]`) is unchanged.

### 3.10 Slide-to-confirm — `shared/components/SlideToConfirm.tsx` (new)

- Built on framer-motion `m.button` with `drag="x"` + `dragConstraints` + `onDragEnd` (consistent with `useSwipeNavigation` per AGENTS.md — no `react-swipeable`, no `@use-gesture/react`).
- Resolves on threshold (e.g. 80 % of track) → calls `onConfirm`. Spring-snaps back otherwise.
- Two use sites in Phase 1 scope: replace the "Confirm delete palace" button with a slide-to-delete (destructive), and add it to `FlashcardDeck` as an alternative input for the **Easy** answer (swipe right hard = Easy).

**Regression guards.** Keep the existing keyboard / button paths unchanged — slide is an _additional_ affordance, not a replacement. Honor `prefers-reduced-motion`: under reduced motion render a plain button.

### 3.11 Marketing — soft-card section + explore-cue

- `features/marketing/components/SoftCardSection.tsx` (new): single white/raised card on a tinted background, used between two "cinematic plate" sections to create rhythm. Accent gating still applies; tints use `from-emerald/10 to-rose/10` only in marketing.
- `features/marketing/components/ExploreInterfaceCue.tsx` (new): a small `m.span` pill that links to the next section anchor, paired with the screenshot of the next section peeking from the bottom.
- Wire both into `apps/web/src/app/(marketing)/page.tsx` — insert `SoftCardSection` between `Capabilities` and `PalacePreviewRow`; mount `ExploreInterfaceCue` at the end of `CinematicHero`.

**Regression guards.** ESLint accent gating must continue to pass. No marketing accent class may leak outside `(marketing)/` / `features/marketing/`. Run `pnpm turbo lint` after the change.

### 3.12 Dashed empty state — `shared/components/EmptyState.tsx`

- Switch the container to `border border-dashed border-border/60 rounded-2xl p-8 grid place-items-center gap-4`.
- Keep the existing icon + heading + description + CTA composition.

**Regression guards.** All current callers continue to work — no prop change.

### 3.13 Neutral ramp + accent token review — `apps/web/src/app/globals.css`

- Audit the 10 neutral stops against `SoftwareColors/Theming Light Mode` and `Theming Dark Mode`.
- Do **not** add new tokens in this phase; only adjust 1–2 stops if contrast measurements show drift. Document the audit result in an ADR (see § 7).

**Regression guards.** Any token tweak runs through Lighthouse contrast and the existing visual regressions before merge.

### 3.14 ColorsThatRuin anti-pattern note

- Append a short subsection to `docs/archive/UI_STYLE_GUIDE-aspirational.md` documenting the negative example.
- No code change.

---

## 4. React 19 / Next 16 / Tailwind v4 features leveraged

| Feature                                                              | Where it appears in this plan                                                                                      |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **React 19 — state derived during render**                           | KPI tile delta chip computes direction from `value`; no `useEffect`.                                               |
| **React 19 — `useActionState`**                                      | Slide-to-confirm wraps existing server actions (e.g. `deletePalace`) without changing them; action stays the same. |
| **React 19 — `'use client'` boundary minimization**                  | `WorkspaceSwitcher` is split into a server outer + client dropdown — only the popover is client.                   |
| **React 19 — `react-hooks/refs` rule**                               | The journey scroll-spy hook updates refs inside `useEffect`, never during render.                                  |
| **Next 16 — App Router server components by default**                | All new dashboard sections (`JourneyStepper` host, KPI host) stay RSC; client islands only where required.         |
| **Next 16 — `proxy.ts` (not `middleware.ts`)**                       | Untouched; the guardrail script continues to enforce.                                                              |
| **Next 16 — `metadata` + RSC streaming**                             | Journey stepper renders on the server with `Suspense` around the (small) client island; no UI flash.               |
| **Tailwind v4 — `@theme inline`**                                    | Reuse existing tokens; no new `@theme` entries unless the neutral-ramp audit demands it.                           |
| **Tailwind v4 — `bg-linear-to-*`, `min-h-dvh`, `inset-shadow-*`**    | Sidebar pill, soft-card section background, mobile nav active circle.                                              |
| **framer-motion `m.*` + global `MotionConfig reducedMotion="user"`** | `SlideToConfirm`, journey connector animation (CSS-only fallback). No local `useReducedMotion()` JS checks.        |
| **`cmdk`**                                                           | Existing `CommandPalette`; we only re-shape it visually toward the Figma popover.                                  |
| **`@xyflow/react` v12**                                              | Untouched in this phase.                                                                                           |
| **Sentry / Supabase / Drizzle**                                      | Untouched in this phase.                                                                                           |

---

## 5. Edge cases & regression-prevention strategy

1. **Marketing accent leakage.** Every new product file is checked against the ESLint `no-restricted-syntax` rule before commit. CI gate: `pnpm turbo lint`. The two new marketing components (`SoftCardSection`, `ExploreInterfaceCue`) are the only places `gold|emerald|rose|cyan|amber` token classes may appear.
2. **Feature boundary violations.** `MasteryRings` lives in `features/practice/components/` (precedent: `StreakCounter`, `StatisticsPanel`). The dashboard mounts it through a thin RSC wrapper in `app/(dashboard)/dashboard/_components/`, never importing across features. `eslint-plugin-boundaries` enforces.
3. **Reduced motion.** All new animations gate via CSS `@media (prefers-reduced-motion: reduce)` or framer-motion's global `MotionConfig`. No new JS `useReducedMotion()` checks. Verified by adding one Vitest assertion per new animated component that the reduced-motion path is reachable.
4. **A11y.**
   - Workspace switcher: `aria-haspopup="menu"` + `aria-expanded`.
   - Quick-actions row: `role="button" tabIndex={0}` + visible keycap is `aria-hidden`, real action exposed in `aria-label`.
   - Stepper: `role="list"` with `aria-current="step"` on the active item.
   - KPI tile: `aria-label` includes the delta in plain English.
   - Slide-to-confirm: parallel native `<button>` fallback exposed to screen readers, with the slider marked `aria-hidden="true"`.
5. **RLS / data ownership.** No server-action signatures change other than the additive `mastery` field on `getPracticeStats()`. Existing per-table RLS chain (`room → palace → user_id`) untouched.
6. **Toast surface.** No new toast surface; continue importing `toast` from `@memory-palace/ui`.
7. **Route races / loading skeletons** (per ADR 12). New tiles render server-side from existing `Promise.all` fetch in `dashboard/page.tsx`. No new client-side fetch waterfalls.
8. **Mobile viewport.** All new full-viewport surfaces use `h-[calc(100dvh-…)]` not fixed pixel heights (per AGENTS.md).
9. **Bundle size.** No new runtime dependency. The chart additions are pure SVG. Slide-to-confirm reuses already-installed framer-motion.
10. **Visual regression.** Add Playwright snapshot tests for `DashboardBento` (light + dark) and the journey stepper on `md` and `sm` breakpoints. Snapshots gate the merge.
11. **Dual-write safety.** Practice / SR engine purity preserved — derivation in `getPracticeStats`, never in the new components.
12. **i18n / copy.** All new strings live alongside their components; American English (AGENTS.md). No new translation keys.

---

## 6. Aspirational doc updates (this phase)

These are **documentation-only** edits — explicitly permitted by the user's Phase-1 directive (no application code). To be applied in the same PR as this plan:

- **`docs/archive/UI_STYLE_GUIDE-aspirational.md`** — append two short subsections:
  - "Figma 2026 patterns we are adopting" — bullet list of M1–M14 with one-line rationale.
  - "Anti-patterns observed (`ColorsThatRuin`)" — the negative example.
- **`docs/archive/ROADMAP-aspirational.md`** — add a single bullet under the post-v1 backlog: "Figma 2026 Polish — workspace switcher, KPI tile system, area chart with tooltip, mastery rings, arc donut, journey stepper, slide-to-confirm, marketing rhythm (soft-card + explore cue), dashed empty state."
- **`docs/archive/FEATURES-aspirational.md`** — append "Mastery rings" and "Slide-to-confirm primitive" to the relevant feature buckets.
- **`docs/archive/ARCHITECTURE-aspirational.md`** — no change required; new components fit existing layering (`shared/components/`, `features/<domain>/components/`, `(marketing)/` group).
- **`docs/archive/PERFORMANCE-aspirational.md`** — append: "Pure-SVG chart primitives (sparkline, area, donut, rings) keep the dashboard JS budget flat; no Recharts."

The current-state `ARCHITECTURE.md` and `ROADMAP.md` are **not** modified in Phase 1 — they describe shipped reality and will only change in Phase 2 (after approval) when components actually land.

---

## 7. Proposed ADR (write at Phase-2 kickoff, not now)

`docs/adr/15-figma-2026-polish.md` — covers:

- Pure-SVG chart family (rationale for not introducing Recharts).
- Slide-to-confirm being framer-motion-only (consistent with AGENTS.md `useSwipeNavigation`).
- Workspace switcher lift point (sets up future multi-workspace work).
- `getPracticeStats` additive mastery field (no breaking change).

---

## 8. Sequencing (proposed — for the user to validate or reorder)

1. **Slice A — Dashboard polish** (M3, M4, M5, M10, M14): pill nav + KPI tile system + area chart + bottom-nav indicator + dashed empty states. Smallest surface, highest visual lift.
2. **Slice B — Sidebar lift** (M1, M2): workspace switcher + quick-actions row.
3. **Slice C — Practice / stats** (M6, M7, additive `getPracticeStats`): mastery rings + arc donut.
4. **Slice D — Journey** (M8): stepper for `md:` and up.
5. **Slice E — Marketing rhythm** (M12, M13): soft-card + explore cue.
6. **Slice F — Slide-to-confirm** (M11): destructive confirms + flashcards Easy gesture.
7. **Slice G — Neutral ramp audit** (M15) + style guide notes (M16).

Each slice is one PR, gated by `pnpm turbo lint && pnpm turbo typecheck && pnpm turbo build` + Playwright snapshots where listed.

---

## 9. What is **not** in scope for Phase 1 execution

- No new runtime dependency. No Recharts, no `react-swipeable`, no `@use-gesture/react`, no Lottie.
- No changes to `proxy.ts`, RLS policies, server-action signatures (except the additive `mastery` field on `getPracticeStats`).
- No changes to `@xyflow/react` canvas internals.
- No changes to Supabase Realtime subscriptions.
- No changes to the `MotionProvider` setup or global `MotionConfig`.
- No new toast surface, dialog system, or command-palette library.

---

## 10. Approval gate

> **PAUSE.** No application code under `apps/web/src/` is modified by this document. Only the plan file itself and the aspirational-doc append-only edits listed in § 6 are written in Phase 1.
>
> **Is this refactoring plan approved for execution?**
>
> Reply `APPROVED` to proceed to Phase 2 (Slice A first). Reply with edits and I will re-issue the plan.
