# ADR 13 — Phase 8C/8D/8E: Public Pages, Security Hardening, Launch Checklist

**Date:** 2026-05-07  
**Status:** Accepted  
**Phase:** 8C · 8D · 8E

---

## Context

Phase 8 completes the production readiness story. 8A/8B covered observability and accessibility. 8C adds the public-facing marketing layer, 8D hardens security, and 8E is the verified launch checklist.

---

## Decision 1 — `(marketing)` route group instead of a hybrid `/` route

**Problem:** `(dashboard)/page.tsx` owned the `/` route for authenticated dashboard users. Adding a public landing page at `/` would conflict directly in the App Router.

**Decision:** Delete `(dashboard)/page.tsx`. Move the dashboard entry point to `/palaces` (already exists). Create a `(marketing)` route group with its own layout shell (nav + footer) for the three public pages: `/`, `/about`, `/join`.

**Consequences:**

- Root `/` is always the landing page (no auth required)
- `proxy.ts` redirects authenticated users away from `/` and `/join` to `/palaces`
- `signIn.ts` and `signUp.ts` now redirect to `/palaces` on success
- The `(marketing)` layout exports `robots: { index: true }` to override the root default of `index: false`

---

## Decision 2 — Nonce-based CSP generated in `proxy.ts`, not `next.config.ts`

**Problem:** Next.js App Router injects per-request inline `<script>` tags for RSC payloads. A static hash-based CSP would need to be re-computed after every build and break on any change. A permissive `'unsafe-inline'` CSP is worse than no CSP.

**Decision:** Generate a cryptographic nonce per request in `proxy.ts` using `crypto.randomUUID()` → base64. Forward it to the RSC layer via an `x-nonce` request header (via `NextResponse.next({ request: { headers } })`). Root `layout.tsx` reads it with `headers()` and passes it to `<html nonce>` and any `<Script>` components. The CSP string uses `'nonce-{nonce}'` + `'strict-dynamic'` in `script-src`.

**Why not `next.config.ts` headers?** Static response headers cannot carry a per-request nonce. `proxy.ts` (the middleware equivalent) runs on every request and can generate a fresh nonce and set it on both the request (forwarded to RSC) and the response (seen by the browser).

**Consequences:**

- Every page render calls `await headers()` in the root layout (async RSC)
- The `RootLayout` function signature changes from sync to async
- `'unsafe-inline'` retained in `script-src` as a fallback for browsers without nonce support (ignored by nonce-aware browsers)
- `'unsafe-inline'` in `style-src` is necessary because Next.js injects critical CSS inline and hashing all rules is impractical

---

## Decision 3 — Onboarding wizard step state in URL params, not sessionStorage

**Problem:** A 5-step wizard needs to persist which step the user is on across renders. Options: local state only, URL params, or sessionStorage.

**Decision:** Step index in URL params (`/join?step=N`). Accumulated data (palaceId, roomId from server actions) in `useReducer` local state.

**Why URL params:**

- Survives page refresh — user can reload without losing their step position
- Browser back/forward navigation works naturally
- SSR-compatible: `useSearchParams()` reads the initial step on mount
- No storage permissions or quota issues

**Why not URL params for accumulated data (palaceId etc.):**

- UUIDs in the URL are opaque to the user but potentially sensitive
- `useReducer` is sufficient — if the user navigates away mid-wizard, they restart step 2 (palace creation) which is acceptable

---

## Decision 4 — `createWizardSetup` creates palace + default room in one action

**Problem:** The wizard's node creation step (step 4) needs a `roomId`. Nodes belong to rooms; rooms belong to palaces. The wizard cannot defer room creation to the canvas onboarding step.

**Decision:** `createWizardSetup` (step 2) creates both the palace and a default room (`title: 'Main Room', position: 0`) in a single Drizzle transaction and returns `{ palaceId, roomId }`. The `roomId` is stored in the wizard's `useReducer` state and passed to `createWizardNode` in step 4.

---

## Decision 5 — Magic-byte MIME detection without an external package

**Problem:** Client-supplied `Content-Type` headers are untrusted. An attacker could upload a `.exe` with `Content-Type: image/png`.

**Decision:** Read the first 12 bytes of the upload buffer and check against a hardcoded table of magic byte signatures (JPEG, PNG, GIF, WebP). SVG is explicitly excluded because inline SVG can carry arbitrary JavaScript.

**Why no `file-type` package:** `file-type` is ESM-only which adds bundler configuration complexity. The four signatures we need are trivially implemented in 25 lines of plain TypeScript and have no runtime overhead.

---

## Alternatives Considered

| Alternative                                                           | Rejected because                                                                                   |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Static CSP hash in `next.config`                                      | Breaks on every build; cannot cover dynamic inline scripts                                         |
| Middleware nonce via `x-nonce` cookie instead of header               | Cookies are readable by JS; headers are not (better security boundary)                             |
| Wizard step state in `sessionStorage`                                 | Not SSR-compatible; requires `useEffect` to read; localStorage permission prompts in some contexts |
| `file-type` npm package for MIME detection                            | ESM-only; adds complexity for minimal gain given our limited allowlist                             |
| Keeping `(dashboard)/page.tsx` and adding a separate `/landing` route | Poor UX; unauthenticated users should land on `/` not a custom path                                |
