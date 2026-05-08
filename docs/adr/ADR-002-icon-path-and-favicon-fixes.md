# ADR-002 — Fix PWA Manifest Icon Paths and Add favicon.ico Fallback

**Date:** 2026-05-08  
**Status:** Accepted  
**Branch:** main (commits after a69bcc1)

---

## Context

Two icon asset bugs were identified during a post-deployment audit:

1. The `manifest.ts` PWA manifest referenced icon URLs in query-parameter format (`/icon?id=sm`) that do not resolve to any actual Next.js route.
2. No `favicon.ico` existed in the `public/` directory (the directory itself was absent).

---

## Root Causes

### Bug 1 — Wrong manifest icon URL format

Next.js App Router's `generateImageMetadata` mechanism creates dynamic icon routes using the internal path-parameter convention `[__metadata_id__]`. The actual accessible URLs follow the pattern `/icon/<id>` (path segment), **not** `/icon?id=<id>` (query parameter). Evidence:

```js
// next/dist/lib/metadata/get-metadata-route.js
const mapped = isDynamic ? `${routePagePath}/[__metadata_id__]` : ...

// next/dist/build/webpack/loaders/next-metadata-route-loader.js
staticParams.push({ __metadata_id__: item.id.toString() })
return item.id.toString() === __metadata_id__
```

The manifest referenced `/icon?id=sm`, `/icon?id=md`, `/icon?id=lg` — all 404s at runtime.

### Bug 2 — Missing favicon.ico

The `apps/web/public/` directory did not exist. While `icon.tsx` correctly injects `<link rel="icon">` tags via the Next.js Metadata API, browsers, crawlers, and social-media unfurlers make a direct `GET /favicon.ico` request independently of the HTML `<head>`. Without this file, those requests return 404 and the browser may fall back to no icon.

---

## Decision

### Fix 1 — Correct manifest icon paths

Changed `apps/web/src/app/manifest.ts` to use path-segment format:

```ts
// Before
{ src: '/icon?id=sm', ... }
{ src: '/icon?id=md', ... }
{ src: '/icon?id=lg', ... }

// After
{ src: '/icon/sm', ... }
{ src: '/icon/md', ... }
{ src: '/icon/lg', ... }
```

### Fix 2 — Add favicon.ico

Created `apps/web/public/favicon.ico`: a valid 32×32 ICO (BMP format, 32bpp, brand dark-navy `#0f172a` background). Generated via Node.js built-in `Buffer` — no external tooling dependency.

---

## Consequences

- PWA "Add to Home Screen" will now correctly resolve all three manifest icons.
- The `/favicon.ico` 404 is eliminated; tab icon renders reliably across all browsers and link-unfurl services.
- The `public/` directory is now established and can hold additional static assets.
- Unrelated to this: `icon.tsx` size-lookup fix (commit `a69bcc1`) must be deployed to Vercel to fully resolve the dynamic icon generation.

---

## Alternatives Considered

- **SVG favicon** (`public/favicon.svg`): supported by modern browsers but not Safari < 15 or any IE; ICO provides broader compatibility as a fallback.
- **Explicit `icons` field in `layout.tsx` metadata**: not needed — Next.js auto-discovers `icon.tsx`.
