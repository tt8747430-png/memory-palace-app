# ICON_FIX_PLAN.md — Favicon & UI Icon RCA

**Status:** COMPLETE  
**Scope:** `apps/web/src/app/` metadata routes, `apps/web/public/`  
**Audited commit:** `a69bcc1` (local HEAD)

---

## Bugs Found

### BUG-1 · CRITICAL — `manifest.ts` has wrong icon URL format

**File:** `apps/web/src/app/manifest.ts`

**Root cause:**  
The PWA manifest hardcodes query-parameter style URLs (`/icon?id=sm`) for its icons array. However, Next.js App Router's `generateImageMetadata` creates **path-segment** routes: `/icon/[__metadata_id__]`. The actual accessible URLs are `/icon/sm`, `/icon/md`, `/icon/lg`.

Evidence from `next/dist/lib/metadata/get-metadata-route.js`:

```js
const mapped = isDynamic ? `${routePagePath}/[__metadata_id__]` : ...
```

And from `next/dist/build/webpack/loaders/next-metadata-route-loader.js`:

```js
staticParams.push({ __metadata_id__: item.id.toString() });
return item.id.toString() === __metadata_id__;
```

**Current (broken):**

```ts
{ src: '/icon?id=sm',  sizes: '32x32',   type: 'image/png' },
{ src: '/icon?id=md',  sizes: '192x192', type: 'image/png', purpose: 'any' },
{ src: '/icon?id=lg',  sizes: '512x512', type: 'image/png', purpose: 'maskable' },
```

**Fixed:**

```ts
{ src: '/icon/sm',  sizes: '32x32',   type: 'image/png' },
{ src: '/icon/md',  sizes: '192x192', type: 'image/png', purpose: 'any' },
{ src: '/icon/lg',  sizes: '512x512', type: 'image/png', purpose: 'maskable' },
```

**Impact:** Every request by a browser or PWA installer to load icons from the manifest gets a 404. PWA "Add to Home Screen" will show a blank/generic icon on all platforms.

---

### BUG-2 · MEDIUM — No `favicon.ico` fallback in `/public`

**File:** `apps/web/public/favicon.ico` (**does not exist** — the entire `/public` directory is absent)

**Root cause:**  
`icon.tsx` correctly generates `<link rel="icon">` tags in the `<head>`, which modern browsers use. However, many browsers, crawlers, Slack/Discord link unfurlers, and CI tools make a direct `GET /favicon.ico` request before parsing HTML. Without this file the request returns a 404, which is logged as a browser error and can cause the browser to show no tab icon in certain caching/race states.

**Fix:**  
Create `apps/web/public/favicon.ico` — a minimal 16×16 ICO file. The simplest approach is to generate it from the same SVG motif used in `icon.tsx` (a 16×16 PNG exported as `.ico`). A one-pixel transparent fallback also works and silences the 404.

**Files to create:**

- `apps/web/public/favicon.ico` — minimal ICO file (32×32 or 16×16)

---

### BUG-3 · INFORMATIONAL — `icon.tsx` fix not yet deployed

**Context:**  
`icon.tsx` had a prior bug (commit `b197b5b` deployed to Vercel): the component tried to use a `size` prop that Next.js does not pass from `generateImageMetadata`. This was fixed locally in commit `a69bcc1` but the remote (`origin/main`) is still on `b197b5b`.

**No code changes needed** — the fix is already in the current local branch. This is resolved by pushing and redeploying.

---

## Files to Touch

| File                           | Change                                       |
| ------------------------------ | -------------------------------------------- |
| `apps/web/src/app/manifest.ts` | Lines 16–22: change `/icon?id=*` → `/icon/*` |
| `apps/web/public/favicon.ico`  | **Create** — new binary file, minimal ICO    |

Zero changes needed to `icon.tsx`, `apple-icon.tsx`, `opengraph-image.tsx`, `layout.tsx`, or any UI component.

---

## Non-Issues (confirmed clean)

- **lucide-react v1.14.0** — every icon imported across all 20+ components was verified against the installed dist (`alert-triangle.mjs`, `brain-circuit.mjs`, `door-open.mjs`, `grid-2x2.mjs`, etc. all export their PascalCase names). Zero missing icons.
- **`layout.tsx` metadata** — no explicit `icons:` field needed; Next.js auto-discovers `icon.tsx`.
- **`apple-icon.tsx`** — correct, already renders as `○ /apple-icon` (static) in build output.
- **`opengraph-image.tsx`** — correct.
- **Avatar / MemoryNode `<img>` tags** — both have `onError` fallback handlers; no broken static paths.
- **Emoji icons** (`🏛️`, `📅`, etc.) in Sidebar and FeatureCards — these are text characters, not asset-backed images; no fix needed.

---

## Execution Checklist (Phase 2)

- [ ] Edit `apps/web/src/app/manifest.ts` — fix 3 icon `src` paths
- [ ] Create `apps/web/public/favicon.ico` — minimal ICO
- [ ] Write ADR in `docs/adr/`
- [ ] Update memory with anti-pattern warning
