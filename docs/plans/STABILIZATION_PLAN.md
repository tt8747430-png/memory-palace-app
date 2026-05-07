# Stabilization Plan — Route Race, Ghost Dialogs, Page Transitions, Loading States

**Status:** DRAFT — awaiting approval before any application code is modified.

---

## Executive Summary

Targeted audit of keyboard shortcuts, dialog state, page transitions, Suspense boundaries, and canvas snap-to-grid. **Four distinct root causes** were identified. Snap-to-grid is **correct as-is** (ADR 11 fixes are in place — `displayNodes` is memoized, React Flow `snapToGrid`/`snapGrid` props are correctly wired). No snap regression in the source; that symptom was already remediated.

---

## Bug 1 — c+p Route Race Condition

### Root Cause

`apps/web/src/shared/lib/commandActions.ts`, `create-palace.run`:

```ts
run: ({ router, openDialog }) => {
  openDialog('create-palace');  // ← sets AppDialogContext.pending BEFORE page is mounted
  router.push('/palaces');      // ← navigation starts after
},
```

`AppDialogContext.pending` is set synchronously to `'create-palace'` while the current page does **not** contain a `<CreatePalaceDialog>`. The dialog component only exists on `/palaces/page.tsx`. During the 200 ms `AnimatePresence` exit animation the old page plays, `pending` sits hot with no consumer. When the new page mounts, `CreatePalaceDialog` reads `isOpen = pending === 'create-palace'` → `true` → dialog opens.

**Why "appear → disappear → appear" in dev:**  
React 19 Strict Mode performs mount → unmount → remount on every new component. Each mount cycle sees `pending === 'create-palace'` and opens the dialog. The unmount between cycles causes it to close. The final remount shows it "normally". This is a dev-only symptom but exposes the design flaw.

**Same pattern exists** in `create-room.run` (also calls `openDialog` + `router.push` together, though `scope: 'on-palace'` reduces exposure).

**Same trigger from `CommandPalette.tsx`:** The palette calls `action.run(...)` with the same `openDialog` reference, so it has the identical race when triggering `create-palace` from a non-palace page.

### Files to touch

| File                                                              | Change                                                                                                                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/shared/lib/commandActions.ts`                       | Split `create-palace.run`: navigate with `?action=create-palace` when not on `/palaces`; call `openDialog` directly when already on it. Same fix for `create-room`. |
| `apps/web/src/features/palaces/components/CreatePalaceDialog.tsx` | Read `?action=create-palace` on mount, call `openDialog`, strip param with `window.history.replaceState` (never `router.replace`).                                  |
| `apps/web/src/features/rooms/components/CreateRoomDialog.tsx`     | Same pattern for `?action=create-room`.                                                                                                                             |

### Fix Detail

**`commandActions.ts` — `create-palace`:**

```ts
run: ({ router, pathname, openDialog }) => {
  if (pathname === '/palaces') {
    // Already on the page — open via context with no navigation side-effect.
    openDialog('create-palace');
  } else {
    // Cross-page: encode intent in URL; CreatePalaceDialog reads it on mount.
    // Using window.history.replaceState inside the dialog avoids RSC re-fetch
    // (the bug described in ADR 11 with the old router.replace approach).
    router.push('/palaces?action=create-palace');
  }
},
```

**`commandActions.ts` — `create-room`:** The `router.push` call is actually dead code because `scope: 'on-palace'` already restricts this action to palace pages — `palaceIdFromPath(pathname)` can only return a value when the user is already on `/palaces/[id]`. Remove the `router.push` entirely:

```ts
run: ({ pathname, openDialog }) => {
  const id = palaceIdFromPath(pathname);
  if (id) openDialog('create-room');
},
```

**`CreatePalaceDialog.tsx` — auto-open from URL param:**

```tsx
const searchParams = useSearchParams();
const initRef = useRef(false);

useEffect(() => {
  if (initRef.current) return; // Strict Mode guard: run only once
  initRef.current = true;
  if (searchParams.get('action') === 'create-palace') {
    openDialog('create-palace');
    // window.history.replaceState does NOT trigger an RSC re-fetch.
    // router.replace WOULD trigger one, which was the ADR-11 ghost-dialog bug.
    window.history.replaceState(null, '', '/palaces');
  }
}, []); // empty deps: intentional single-fire on mount
```

**`CreateRoomDialog.tsx` — same pattern** for `?action=create-room` (strip to current palace path).

---

## Bug 2 — Ghost Dialogs (general)

The `AppDialogContext` approach is architecturally sound and immune to Strict Mode double-mounting (context state survives the remount cycle). Ghost dialogs occur **only** when `pending` is pre-set before the dialog component mounts — i.e., exclusively the cross-page case from Bug 1.

**No independent fix needed.** Resolving Bug 1 eliminates all reported ghost-dialog symptoms.

Verification: the standalone trigger `<Button>` in `CreatePalaceDialog` calls `openDialog('create-palace')` while the dialog is already mounted. The `EmptyStateCreateButton` also calls `openDialog` while the dialog is on the page. Neither of these can produce a ghost.

---

## Bug 3 — PageTransition Animation Failures

### Root Cause

`apps/web/src/shared/components/PageTransition.tsx`:

```tsx
<AnimatePresence mode="wait" initial={false}>
  <m.div
    key={pathname}
    variants={variants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    {children}
  </m.div>
</AnimatePresence>
```

**Three compounding problems:**

1. **`AnimatePresence mode="wait"` vs. concurrent rendering.** `mode="wait"` requires the exiting element to finish its animation before the entering element mounts. In Next.js App Router with `startTransition`, `usePathname()` updates optimistically (before the RSC payload resolves). This means `key` changes and `AnimatePresence` tries to start exit/enter — but `children` may still be the old page content. When RSC resolves, `children` swaps inside the already-entered `m.div`, making the enter animation play against wrong content.

2. **Strict Mode double-effect.** `AnimatePresence` uses `useEffect`-based subscriptions internally. React 19 Strict Mode fires effects twice (mount → cleanup → remount), causing exit/enter animation callbacks to fire twice in rapid succession → visible stutter.

3. **No `loading.tsx` fallbacks.** Without Suspense boundaries at the route level, Next.js cannot show a loading skeleton while the RSC loads. The `usePathname()` optimistic update and the actual `children` swap are de-coupled in time, amplifying problem 1.

### Fix Detail

**Remove `AnimatePresence` from `PageTransition`.** App Router controls the unmount of old content — you cannot reliably animate exits. Only animate the **enter** of new content. Simpler, always correct:

```tsx
// apps/web/src/shared/components/PageTransition.tsx
'use client';
import { usePathname } from 'next/navigation';
import { m } from 'framer-motion';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <m.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      {children}
    </m.div>
  );
}
```

- `AnimatePresence` and its variants object are deleted.
- `useReducedMotion()` is deleted — `MotionProvider` already sets `<MotionConfig reducedMotion="user">` globally; framer-motion will zero-out the transition automatically for users who prefer reduced motion.
- `motion-reduce:` CSS utility classes are deleted (duplicating what `MotionConfig` already handles).

This aligns with the `isExiting`-state pattern described in the Phase 7 ADR (never use `AnimatePresence` where you cannot control unmount timing).

---

## Bug 4 — Missing Loading States

### Root Cause

Zero `loading.tsx` files in the app. Consequence:

- Next.js App Router cannot display an instant loading skeleton when navigating to a page that requires a server round-trip.
- `usePathname()` updates optimistically while `children` waits for RSC → amplifies Bug 3.
- Users on slow connections see the old page frozen for multiple seconds.

### Fix Detail

Add three minimal loading files using existing `CardSkeleton` and `Skeleton` primitives:

**`apps/web/src/app/(dashboard)/palaces/loading.tsx`**

```tsx
import { CardSkeleton } from '@/shared/components/CardSkeleton';
export default function PalacesLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded bg-muted animate-pulse" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton count={3} />
      </div>
    </div>
  );
}
```

**`apps/web/src/app/(dashboard)/palaces/[palaceId]/loading.tsx`**

```tsx
import { CardSkeleton } from '@/shared/components/CardSkeleton';
export default function PalaceLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded bg-muted animate-pulse" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton count={4} />
      </div>
    </div>
  );
}
```

**`apps/web/src/app/(dashboard)/loading.tsx`** (dashboard home)

```tsx
import { Skeleton } from '@memory-palace/ui';
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  );
}
```

---

## Performance & Dead Code Cleanup

| Item                                                    | Location             | Action                                                                                 |
| ------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------- |
| Redundant `useReducedMotion()` in `PageTransition`      | `PageTransition.tsx` | Delete — `MotionConfig reducedMotion="user"` in `MotionProvider` handles this globally |
| `motion-reduce:` Tailwind utilities in `PageTransition` | `PageTransition.tsx` | Delete — duplicates `MotionConfig` behavior                                            |
| Dead `router.push` in `create-room` action              | `commandActions.ts`  | Delete — `scope: 'on-palace'` guarantees we are already on the palace page             |
| `AnimatePresence` import in `PageTransition`            | `PageTransition.tsx` | Delete after removing `AnimatePresence`                                                |
| `variants` object in `PageTransition`                   | `PageTransition.tsx` | Delete — no longer needed without `AnimatePresence`                                    |

---

## Snap-to-Grid — No Change Required

After auditing `RoomCanvas.tsx`, `canvasStore.ts`, and `canvasUtils.ts`:

- `displayNodes` is correctly wrapped in `useMemo([nodes, canvasSearchQuery])` — ADR 11's B3 fix is in place.
- `snapToGrid={snapEnabled}` and `snapGrid={SNAP_GRID}` are correctly wired to React Flow.
- `snapEnabled` is read reactively (not in a stale closure) for the `ReactFlow` prop.
- `onNodeDragStop` receives `node.position` which React Flow has already snapped; saving it is correct.
- The `G` key capture-phase listener correctly calls `e.stopPropagation()` to prevent the global bubble-phase shortcut handler from arming the `g→h/p/s` prefix.
- `canvasStoreApi.getState()` is used imperatively in event handlers to avoid stale closures.

**No changes to canvas snap logic.**

---

## File Change Summary

| File                                                              | Type                                                              |
| ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| `apps/web/src/shared/lib/commandActions.ts`                       | Modify — split `create-palace.run`; simplify `create-room.run`    |
| `apps/web/src/features/palaces/components/CreatePalaceDialog.tsx` | Modify — add URL param auto-open with `initRef` Strict Mode guard |
| `apps/web/src/features/rooms/components/CreateRoomDialog.tsx`     | Modify — same pattern                                             |
| `apps/web/src/shared/components/PageTransition.tsx`               | Rewrite — remove `AnimatePresence`, enter-only animation          |
| `apps/web/src/app/(dashboard)/loading.tsx`                        | Create — dashboard loading skeleton                               |
| `apps/web/src/app/(dashboard)/palaces/loading.tsx`                | Create — palaces loading skeleton                                 |
| `apps/web/src/app/(dashboard)/palaces/[palaceId]/loading.tsx`     | Create — palace detail loading skeleton                           |

---

## Test Impact

- Existing `useGlobalShortcuts.test.tsx` (18 tests): `create-palace` chord test will need to assert `router.push('/palaces?action=create-palace')` instead of `openDialog('create-palace')` when pathname ≠ `/palaces`.
- `PageTransition` has no dedicated tests; removing `AnimatePresence` requires no test updates.
- No `loading.tsx` tests needed (they render static skeleton markup).

---

**STOP. No application code has been modified. Awaiting approval.**
