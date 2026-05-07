# ADR 12 — Route Race Fix, PageTransition Simplification, Loading States

**Status:** Accepted  
**Date:** 2026-05-07  
**Phase:** Post-11 (STABILIZATION_PLAN.md execution)

## Context

Three distinct bugs were identified and remediated after the Phase 11 UX consolidation:

1. **c+p shortcut route race** — pressing c→p from any page other than `/palaces` caused the "Create Palace" dialog to flicker (appear → disappear → appear).
2. **PageTransition animation failures** — `AnimatePresence mode="wait"` produced stuttering and stale-content flickers on route change.
3. **No loading states** — zero `loading.tsx` files meant every navigation froze the old UI while waiting for RSC.

## Root Causes

### Bug 1 — c+p Route Race

`commandActions.ts` called `openDialog('create-palace')` **then** `router.push('/palaces')`. This set `AppDialogContext.pending` while `CreatePalaceDialog` was not yet in the tree (still on the old page). When the new page mounted, React 19 Strict Mode's mount → unmount → remount cycle saw `pending === 'create-palace'` on each mount, causing the dialog to flash open on the first mount, close on unmount, then open again on the final remount.

The identical `useEffect`-strips-URL-then-remounts pattern that caused the original ADR-11 ghost dialog was NOT reintroduced. The fix deliberately avoids `router.replace` (which triggers an RSC re-fetch) in favour of `window.history.replaceState`.

### Bug 2 — PageTransition Flickering

`AnimatePresence mode="wait"` requires the exiting element to complete its animation before the entering element mounts. In Next.js App Router, `usePathname()` updates optimistically (before the RSC payload resolves), so the `key` changes and `AnimatePresence` begins its exit/enter cycle while `children` still holds the old page content. When RSC eventually resolves, the content swaps inside the already-entered `m.div`, causing transitions to play against wrong content.

Additionally, React 19 Strict Mode fires effects twice (mount → cleanup → remount), which caused `AnimatePresence`'s internal effect-based subscriptions to fire twice in rapid succession, producing visible stuttering in development.

### Bug 3 — Missing Loading States

No `loading.tsx` files existed in the dashboard routes. Without route-level Suspense boundaries, Next.js cannot display an instant skeleton during navigation. This amplified Bug 2 by extending the window during which `usePathname()` and `children` were de-synced.

## Decisions

### Fix 1 — Encode cross-page dialog intent in the URL

`commandActions.ts` `create-palace.run` now branches on `pathname`:

- **Already on `/palaces`:** call `openDialog('create-palace')` directly. The dialog component is mounted, so context state is consumed immediately.
- **Anywhere else:** call `router.push('/palaces?action=create-palace')`. No `openDialog` call is made until the dialog is mounted.

`CreatePalaceDialog` reads `window.location.search` in a one-shot `useEffect` guarded by an `initRef` (prevents Strict Mode double-invocation). On match, it calls `openDialog('create-palace')` and strips the param with `window.history.replaceState(null, '', '/palaces')`.

`create-room.run` had a dead `router.push` call (scope `'on-palace'` already guaranteed the user was on the palace page). It is removed. `CreateRoomDialog` gains the same `window.location.search` pattern for completeness and future resilience.

The `useGlobalShortcuts` test wrapper was also missing `AppDialogProvider`; this is corrected.

### Fix 2 — Enter-only PageTransition

`AnimatePresence` is removed from `PageTransition`. Only the **enter** transition is animated (opacity fade-in + 8 px lift). Exit animations are dropped — App Router controls unmount timing, making exit animations unreliable regardless of implementation.

`useReducedMotion()` and `motion-reduce:` CSS utilities are removed. `MotionProvider` already applies `<MotionConfig reducedMotion="user">` globally, which zeroes all framer-motion durations for users who prefer reduced motion. The local check was redundant.

### Fix 3 — Route-level loading skeletons

Three `loading.tsx` files are added using existing `CardSkeleton` and `Skeleton` primitives:

- `app/(dashboard)/loading.tsx` — dashboard home
- `app/(dashboard)/palaces/loading.tsx` — palaces list
- `app/(dashboard)/palaces/[palaceId]/loading.tsx` — palace detail (room list)

These are server components that render instantly, giving Next.js a Suspense boundary to stream content into.

## Consequences

- The `c+p` shortcut now works correctly from any page with no ghost dialogs.
- Page transitions are stable in both production and React 19 Strict Mode development.
- Route navigations show an instant skeleton instead of a frozen old page.
- `commandActions.ts` `create-room.run` signature no longer needs `router` — cleaner.
- No backward-compat code was introduced; the old `AnimatePresence` approach is fully deleted.
