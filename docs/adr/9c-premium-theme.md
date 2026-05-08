# ADR 9C — Premium theme tokens & marketing visual upgrade

**Status:** Accepted
**Date:** 2026-05
**Phase:** Slice C (post-9B)

## Context

The TalantulApp reference site (`docs/exampe_app/.../example_website/`)
ships a warm-gold accent palette, glassmorphic surfaces, ambient
floating orbs, scroll-reveal animations, and a 6-card feature grid that
makes the marketing landing feel premium. Our existing landing
(`apps/web/src/app/(marketing)/`) was functional but visually flat — a
single primary colour, four small cards, no decorative depth. Slice C
ports those visual ideas into our Tailwind v4 + semantic-token system
**without** breaking the product surfaces' calm, neutral aesthetic.

Constraints carried in from `.project_memory.md`:

- No `tailwind.config.ts` (ADR-003 — Tailwind v4 `@theme inline` only).
- No `max-*:` breakpoints (mobile-first).
- `cn` from `@memory-palace/ui` only.
- Touch targets ≥ 48 px (`h-touch`).
- No raw hex at call sites — semantic tokens only.

## Decision

### 1. Accent palette as opt-in semantic tokens

Add five new tokens to `globals.css` under `:root` and `.dark`:

```
--gold:    hsl(38 60% 58%)   /* light */ → hsl(38 70% 65%)   /* dark */
--emerald: hsl(160 84% 39%)              → hsl(160 70% 50%)
--rose:    hsl(347 91% 61%)              → hsl(347 85% 67%)
--cyan:    hsl(189 95% 53%)              → hsl(189 90% 50%)
--amber:   hsl(38 92% 50%)               → hsl(38 90% 60%)
```

These are exposed to Tailwind via `@theme inline` as
`--color-gold`/`emerald`/`rose`/`cyan`/`amber`, which generates
`text-gold`, `bg-gold`, `from-gold`, `border-gold`, `bg-gold/20` etc.

**Crucial:** these tokens are **opt-in**. Product surfaces continue to
use `--primary`, `--accent`, `--success`, `--warning`. Only marketing
(under `app/(marketing)/` and `features/marketing/`) is allowed to
reach for the accent palette.

This is enforced with an ESLint `no-restricted-syntax` rule in
`apps/web/eslint.config.mjs`:

```js
files: ['src/**/*.{ts,tsx}'],
ignores: ['src/app/(marketing)/**', 'src/features/marketing/**', …],
rules: {
  'no-restricted-syntax': ['error', {
    selector: "Literal[value=/\\b(?:text|bg|border|from|to|via|ring|fill|stroke)-(?:gold|emerald|rose|cyan|amber)(?!-)(?:\\/[0-9]+)?\\b/]",
    message: 'Accent palette tokens are marketing-only…',
  }],
},
```

The negative lookahead `(?!-)` is critical — it lets product code
continue using Tailwind's built-in numeric shades like `emerald-500`
or `rose-400` (often used for status indicators in
`StreakCounter`, `QuizSession`, `StatisticsPanel`). Only the bare
token reference (`bg-emerald`, `text-gold/40`) is rejected.

### 2. Display font (Space Grotesk)

Loaded once at the app root via `next/font/google`, exposed as
`--font-space-grotesk`, and consumed by a new `--font-display`
Tailwind theme variable. The marketing layout sets `font-display` on
its root container; product surfaces remain on `var(--font-sans)`
(Geist).

`preload: false` keeps it off the critical path — it's only used for
heroes/headings, not body copy.

### 3. AmbientOrbs (decorative backdrop)

`apps/web/src/app/(marketing)/_components/AmbientOrbs.tsx` — a
zero-JavaScript component that renders three blurred, large-radius
spans (`gold/20`, `cyan/15`, `rose/15`) pinned `fixed inset-0 -z-10`.
A keyframe animation in `globals.css` (`@keyframes ambient-orb-float`)
gently floats them every 14 s. The keyframe is suppressed under
`prefers-reduced-motion: reduce`.

The container is `aria-hidden="true"`, `pointer-events: none`. No LCP
impact — paints lazily, no layout shift.

### 4. `useReveal` + `<Reveal>` wrapper

`shared/hooks/useReveal.ts` exposes a typed hook that adds
`data-revealed="true"` to its element when it scrolls into view via
`IntersectionObserver` (with a graceful fallback for SSR/older
browsers — sets the attribute immediately so content is always
visible).

The CSS class `.reveal-up` (in `globals.css`) starts the element
faded + translated and transitions to neutral once revealed. The
reduced-motion media query short-circuits the transition.

`shared/components/Reveal.tsx` is a tiny client wrapper that pairs
the hook with the class, plus an optional `delayMs` prop for
staggered reveals. Marketing pages stay RSCs — only the wrapper
opts into the client boundary.

### 5. New 6-card feature grid

`features/marketing/components/FeatureCards.tsx` is rebuilt around
six lucide icons (replacing the four emoji cards), each with:

- A **gradient header strip** (1.5 px tall, `bg-gradient-to-r
from-{accent} to-{accent}`) using the new accent tokens.
- A glassmorphic card (`bg-card/70 backdrop-blur-md`).
- A semantic icon container (`bg-muted/50`).
- Display-font heading.
- 80 ms staggered `<Reveal>` so the row fades in left-to-right.

Card titles map TalantulApp's "Study & Quiz / Memorization Tools /
…" structure onto our domain (Study & Quiz, Memorization Tools,
Spatial Canvas, Daily Streaks, Track Progress, Rich Content) — never
reusing TalantulApp's biblical study copy.

## Consequences

### Positive

- The marketing surface now has visual identity (warm gold accents,
  ambient depth, scroll reveal) without affecting product surfaces.
- Product code is **architecturally protected** from accidental accent
  drift via the ESLint rule; new contributors can't reach for
  `bg-gold` from inside the dashboard.
- All animations respect `prefers-reduced-motion`. AmbientOrbs is
  zero-JS so SSR streams are unaffected.
- The existing semantic token system (`primary`, `accent`, …) is
  unchanged. ADR-003 still holds — no `tailwind.config.ts` needed.

### Negative / trade-offs

- The ESLint regex matches arbitrary string literals; it's possible a
  user-supplied string in tests would coincidentally trigger the
  rule. Mitigation: the rule scopes to `src/**/*.{ts,tsx}` outside
  marketing, and the message names ADR 9C so contributors can
  evaluate quickly.
- Adding three blurred orbs increases paint work on weak GPUs; we
  pinned them to `transform: translate3d(...)` keyframes so the
  browser composites on the GPU. If this regresses on low-end
  hardware, the orbs can be hidden with a single class swap.
- Space Grotesk costs an additional font fetch on the marketing
  surface (~25 kB woff2). Acceptable trade for landing identity;
  `preload: false` keeps it off the LCP path.

## Files touched

**New**

- `apps/web/src/app/(marketing)/_components/AmbientOrbs.tsx`
- `apps/web/src/shared/hooks/useReveal.ts`
- `apps/web/src/shared/components/Reveal.tsx`

**Modified**

- `apps/web/src/app/globals.css` — accent tokens (light + dark),
  `--font-display`, `.reveal-up`, `@keyframes ambient-orb-float`,
  `.ambient-orb`.
- `apps/web/src/app/layout.tsx` — load Space Grotesk; pass
  `${spaceGrotesk.variable}` into the body `className`.
- `apps/web/src/app/(marketing)/layout.tsx` — mount `<AmbientOrbs />`,
  apply `font-display` to the root container.
- `apps/web/src/features/marketing/components/FeatureCards.tsx` —
  6-card gradient grid with staggered `<Reveal>`.
- `apps/web/src/features/marketing/components/LandingHero.tsx` —
  `font-display` on the hero `h1`.
- `apps/web/eslint.config.mjs` — `no-restricted-syntax` guard against
  accent tokens outside marketing.

## Follow-ups (deferred)

- Apply `font-display` and `<Reveal>` to `HowItWorks` and
  `LandingCta`.
- Visual regression smoke test (Playwright screenshot) on the
  marketing landing — currently only product surfaces have
  E2E coverage.
- Optional: extend the accent palette to dashboard brand artefacts
  (favicon, OG image) — the ESLint rule already excludes those
  files.
