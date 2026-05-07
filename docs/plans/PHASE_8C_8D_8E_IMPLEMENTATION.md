# Phase 8C · 8D · 8E Implementation Plan

> **Status:** AWAITING APPROVAL — no application code written yet.
> **Stack:** Next.js 16.2.4 App Router, React 19.2.5, Turborepo + pnpm
> **Phases covered:** 8C Public Pages · 8D Security Hardening · 8E Launch Checklist

---

## Context & Starting State

| Already done                                                                   | Notes                                                             |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy   | In `next.config.ts`; CSP intentionally deferred (comment in file) |
| `about`, `login`, `signup`, `callback`, `forgot-password` in `PUBLIC_SEGMENTS` | `proxy.ts` — but no `/about` page exists yet                      |
| PostHog observability (OTel logs), Sentry removed                              | `instrumentation.ts`                                              |
| `(dashboard)/page.tsx` serves `/` for authenticated users                      | **Must be resolved before landing page can live at `/`**          |
| `signIn.ts` → `redirect('/')`, `signUp.ts` → `redirect('/')`                   | Must change to `/palaces`                                         |

---

## Phase 8C: Public Pages

### Route Conflict Resolution

`(dashboard)/page.tsx` currently owns the `/` route. We cannot have two route groups both defining a page at `/`. The fix:

- **Delete** `apps/web/src/app/(dashboard)/page.tsx` and `apps/web/src/app/(dashboard)/loading.tsx`
- `/` becomes the marketing landing page (public, unauthenticated)
- `/palaces` becomes the authenticated entry point (already exists)
- All auth redirects updated from `/` → `/palaces`

### Proxy Changes (`apps/web/src/proxy.ts`)

```diff
-const PUBLIC_SEGMENTS = new Set(['login', 'signup', 'about', 'callback', 'forgot-password']);
+const PUBLIC_SEGMENTS = new Set(['login', 'signup', 'about', 'join', 'callback', 'forgot-password']);
+const PUBLIC_ROOTS = new Set(['']); // the '/' route itself

 function isPublicPath(pathname: string): boolean {
-  return PUBLIC_SEGMENTS.has(firstSegment(pathname));
+  const seg = firstSegment(pathname);
+  return PUBLIC_SEGMENTS.has(seg) || PUBLIC_ROOTS.has(seg);
 }

-if (user && (seg === 'login' || seg === 'signup')) {
-  return redirectTo(request, response, '/');
+// Authenticated users bounced away from auth-only and marketing-only pages
+if (user && (seg === 'login' || seg === 'signup' || seg === '' || seg === 'join')) {
+  return redirectTo(request, response, '/palaces');
 }
```

### Auth Action Redirect Changes

| File                                              | Change                                   |
| ------------------------------------------------- | ---------------------------------------- |
| `apps/web/src/features/auth/actions/signIn.ts:23` | `redirect('/')` → `redirect('/palaces')` |
| `apps/web/src/features/auth/actions/signUp.ts:25` | `redirect('/')` → `redirect('/palaces')` |

### Marketing Route Group Structure

```
apps/web/src/app/(marketing)/
├── layout.tsx          ← marketing shell (MarketingNav + MarketingFooter)
├── page.tsx            ← / — Landing page (RSC, SSG)
├── about/
│   └── page.tsx        ← /about — About page (RSC, SSG)
├── join/
│   └── page.tsx        ← /join — Onboarding wizard (client component tree)
└── sitemap.ts          ← /sitemap.xml — Next.js Sitemap
```

### Files to Create

#### `apps/web/src/app/(marketing)/layout.tsx`

- RSC, no `'use client'`
- Exports per-page metadata override: `robots: { index: true, follow: true }` (overrides root default of `index: false`)
- Renders `<MarketingNav />` above `{children}` and `<MarketingFooter />` below

#### `apps/web/src/app/(marketing)/page.tsx`

```ts
export const metadata: Metadata = {
  title: 'Memory Palace — Spatial Learning',
  robots: { index: true },
};
```

Sections (all Server Components):

1. `<LandingHero />` — headline, value prop, two CTAs
2. `<StatsBar />` — 3 hardcoded stats ("10 000+ nodes", "500+ users", "30% better recall")
3. `<FeatureCards />` — 4 cards (Canvas, Daily Review, Games, Progress) — `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
4. `<HowItWorks />` — numbered 4-step flow
5. `<LandingCta />` — bottom sign-up prompt

**Data fetching:** None. All content is static/hardcoded. Page is eligible for `export const dynamic = 'force-static'`.

#### `apps/web/src/app/(marketing)/about/page.tsx`

```ts
export const metadata: Metadata = { title: 'About — Memory Palace', robots: { index: true } };
```

Sections:

1. Method of Loci explainer (prose + illustration placeholder)
2. Feature overview (more detailed than landing)
3. Project background + GitHub link
4. Stack credits

**Data fetching:** None. Static.

#### `apps/web/src/app/(marketing)/join/page.tsx`

```ts
export const metadata: Metadata = { title: 'Join — Memory Palace', robots: { index: true } };
```

- Thin RSC shell: renders `<OnboardingWizard />` (client boundary)
- No Suspense needed since the wizard is fully client-side

#### `apps/web/src/app/(marketing)/sitemap.ts`

Standard Next.js `MetadataRoute.Sitemap`. Three static entries: `/`, `/about`, `/join`.

### Feature Components

#### `apps/web/src/features/marketing/`

```
components/
  MarketingNav.tsx       ← logo + "Log In" + "Get Started" links; no auth state
  MarketingFooter.tsx    ← links, copyright
  LandingHero.tsx
  StatsBar.tsx
  FeatureCards.tsx
  HowItWorks.tsx
  LandingCta.tsx
index.ts                 ← named re-exports only
```

All are Server Components. No `'use client'` unless a component needs hover/click state that cannot be done with CSS.

#### `apps/web/src/features/onboarding/`

```
components/
  OnboardingWizard.tsx           ← 'use client'; useReducer + useSearchParams for step state
  StepIndicator.tsx              ← dot/numbered progress bar
  steps/
    StepCreateAccount.tsx        ← SignupForm re-used; useActionState
    StepNamePalace.tsx           ← text input + suggestions; useActionState → createPalaceAction
    StepChooseTheme.tsx          ← colour/icon picker; local state only
    StepAddNode.tsx              ← title + content form (NO canvas); useActionState → createNodeAction
    StepComplete.tsx             ← confetti (useConfetti hook) + redirect to /palaces
index.ts
```

#### Wizard State Strategy (React 19 / Next.js 16)

- **Step index** tracked in URL: `/join?step=1`, `/join?step=2`, … via `useRouter` + `useSearchParams`
  - Enables browser back/forward, link-shareable step restoration
- **Accumulated data** (palaceId, nodeId from server actions) stored in `useReducer` local state
- **Form submission** via `useActionState` (React 19 hook, replaces `useFormState`)
- **No server state** in the wizard itself — each step calls a server action and advances on success
- **Step 1 exception:** if user is already authenticated when they reach `/join`, the proxy redirects to `/palaces` before the page renders

#### Mobile Behaviour

- Each step: `min-h-[100dvh] flex flex-col`
- Step indicator: fixed top bar
- "Next" button: `w-full` + `fixed bottom-0` above safe-area inset (`pb-[env(safe-area-inset-bottom)]`)
- Back: `<button>` top-left; calls `router.back()`

### Edge Cases

| Scenario                            | Handling                                                                                                                                              |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unauthenticated user hits `/`       | Proxy allows → landing page renders                                                                                                                   |
| Authenticated user hits `/`         | Proxy redirects → `/palaces`                                                                                                                          |
| Authenticated user hits `/join`     | Proxy redirects → `/palaces`                                                                                                                          |
| Step 1 server action fails          | `useActionState` exposes error; user stays on step 1                                                                                                  |
| OAuth signup via Google (step 1)    | Supabase callback at `/callback` → proxy redirects authenticated user to `/palaces` (wizard state lost — acceptable for OAuth path)                   |
| User refreshes mid-wizard (step 2+) | URL preserves step number; accumulated data in state is lost → user restarts from step 2 with just the step pre-selected (palace creation re-entered) |
| Missing `NEXT_PUBLIC_SITE_URL`      | `siteUrl` in layout falls back to `VERCEL_URL` or `localhost:3000`                                                                                    |

---

## Phase 8D: Security Hardening

### 8.D.1 — Content Security Policy (nonce-based)

**Why nonce-based:** Next.js App Router injects inline `<script>` tags for RSC payloads. Static CSP hashes are not feasible; a per-request nonce is the only correct approach.

#### `apps/web/src/shared/lib/csp.ts` (new)

```ts
export function generateNonce(): string; // crypto.randomUUID() → base64
export function buildCsp(nonce: string): string; // returns full CSP header value
```

CSP policy (draft — to be tuned post-implementation with actual PostHog/Supabase origins):

```
default-src 'self';
script-src 'self' 'nonce-{nonce}' 'strict-dynamic';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self' data:;
connect-src 'self'
  https://*.supabase.co wss://*.supabase.co
  https://us.i.posthog.com https://eu.i.posthog.com https://us.posthog.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

**`unsafe-inline` for styles:** Next.js injects critical CSS as inline styles. A nonce-based `style-src` with `'strict-dynamic'` is not yet fully supported for CSS; `'unsafe-inline'` is the pragmatic choice for now and is lower risk than for scripts.

#### `apps/web/src/proxy.ts` (modify)

Add to the top of `proxy()`:

```ts
const nonce = generateNonce();
// Forward nonce to RSC renderer via request header
const requestHeaders = new Headers(request.headers);
requestHeaders.set('x-nonce', nonce);
// ... existing session logic using modified request
// Attach CSP to every response
response.headers.set('Content-Security-Policy', buildCsp(nonce));
```

The `createSupabaseForProxy` call and `NextResponse` construction must use the updated `requestHeaders`.

#### `apps/web/src/app/layout.tsx` (modify)

```ts
import { headers } from 'next/headers';
// In RootLayout (async):
const nonce = (await headers()).get('x-nonce') ?? '';
```

Pass `nonce` to any `<Script>` components (PostHog snippet, if ever added as inline script). For `next/font` and CSS, no nonce is needed.

### 8.D.2 — CORS for API Routes

**Scope:** The existing `/api/export` route and the new `/api/upload` route. Supabase CORS is configured in the Supabase dashboard (out of scope for code); we secure the Next.js API layer.

#### `apps/web/next.config.ts` (modify)

Add a `headers()` entry for `/api/(.*)`:

```ts
{
  source: '/api/(.*)',
  headers: [
    { key: 'Access-Control-Allow-Origin', value: env.NEXT_PUBLIC_SITE_URL ?? 'https://localhost:3000' },
    { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
    { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
  ],
}
```

**No wildcard `*` in production.** `NEXT_PUBLIC_SITE_URL` is the canonical origin.

Also add `Access-Control-Allow-Origin` in the route handlers themselves via a shared `corsHeaders()` helper in `shared/lib/cors.ts` for `OPTIONS` pre-flight handling.

### 8.D.3 — File Upload Validation

#### `apps/web/src/app/api/upload/route.ts` (new)

Endpoint: `POST /api/upload`

Server-side validation chain:

1. **Auth check** — call `getUser()` from Supabase; return 401 if unauthenticated
2. **Rate limiting** — call `checkRateLimit` (existing util) at `5 req/min` per user
3. **Size check** — `Content-Length` header and actual byte count ≤ 5 MB
4. **MIME detection** — read the first 12 bytes of the buffer and compare magic bytes against an allowlist (avoids reliance on the `Content-Type` header which is user-controlled)
5. **Upload** — write to Supabase Storage (bucket: `node-attachments`)

Allowed types (magic byte allowlist, no third-party package needed):
| MIME | Magic bytes |
|---|---|
| `image/jpeg` | `FF D8 FF` |
| `image/png` | `89 50 4E 47` |
| `image/gif` | `47 49 46 38` |
| `image/webp` | `52 49 46 46 … 57 45 42 50` |

SVG is rejected server-side (XSS risk in SVG markup).

Return: `{ url: string }` on success, structured error on failure.

**No Supabase Storage SDK wrapper yet exists — this route will be the first pattern.** CORS pre-flight (`OPTIONS`) handled inline.

### Edge Cases (8D)

| Scenario                                                         | Handling                                                                                     |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Nonce missing from request headers (e.g. static export)          | `?? ''` fallback; CSP omits the nonce directive gracefully                                   |
| PostHog client-side script blocked by CSP                        | PostHog uses `next/script` which respects the `nonce` prop; connect-src covers the API calls |
| Upload with spoofed `Content-Type: image/png` but `.exe` payload | Magic byte check rejects it before touching storage                                          |
| Upload exceeds 5 MB                                              | Rejected before buffering; returns 413                                                       |
| OPTIONS pre-flight for `/api/upload`                             | Explicit `OPTIONS` handler returns 204 with CORS headers                                     |
| CSP breaks inline styles from shadcn/ui or Tailwind              | `'unsafe-inline'` in `style-src` covers this                                                 |

---

## Phase 8E: Launch Checklist

Phase 8E is a verification and documentation task, not a code-writing task. The deliverable is:

1. **`docs/LAUNCH_CHECKLIST.md`** — itemised checklist with status per item, linking to evidence (CI logs, Lighthouse report, securityheaders.com scan)
2. **`.env.example` audit** — add any new vars introduced in 8C/8D
3. **`apps/web/src/app/robots.ts`** — Next.js Robots file (allow public pages, disallow dashboard routes)

The checklist from the roadmap is reproduced and extended:

```markdown
- [ ] All CI checks pass on main
- [ ] Sentry configured (or PostHog error tracking confirmed active)
- [ ] Lighthouse: Performance ≥ 85, A11y ≥ 90, Best Practices ≥ 90, SEO ≥ 80
- [ ] CSP header present and non-permissive (securityheaders.com grade ≥ A)
- [ ] RLS verified: cross-user data isolation tested
- [ ] Rate limiting verified: 429 returned after abuse threshold
- [ ] CORS: no wildcard in production API routes
- [ ] .env.example up to date
- [ ] Public pages live: /, /about, /join
- [ ] sitemap.xml accessible at /sitemap.xml
- [ ] robots.txt correctly allows public, disallows /palaces etc.
- [ ] E2E tests green: auth, CRUD, canvas, offline, search
- [ ] Monitoring alerts configured (PostHog error alert)
```

---

## File Change Summary

### Created (new files)

| File                                                                      | Phase |
| ------------------------------------------------------------------------- | ----- |
| `apps/web/src/app/(marketing)/layout.tsx`                                 | 8C    |
| `apps/web/src/app/(marketing)/page.tsx`                                   | 8C    |
| `apps/web/src/app/(marketing)/about/page.tsx`                             | 8C    |
| `apps/web/src/app/(marketing)/join/page.tsx`                              | 8C    |
| `apps/web/src/app/(marketing)/sitemap.ts`                                 | 8C/8E |
| `apps/web/src/app/robots.ts`                                              | 8C/8E |
| `apps/web/src/features/marketing/components/MarketingNav.tsx`             | 8C    |
| `apps/web/src/features/marketing/components/MarketingFooter.tsx`          | 8C    |
| `apps/web/src/features/marketing/components/LandingHero.tsx`              | 8C    |
| `apps/web/src/features/marketing/components/StatsBar.tsx`                 | 8C    |
| `apps/web/src/features/marketing/components/FeatureCards.tsx`             | 8C    |
| `apps/web/src/features/marketing/components/HowItWorks.tsx`               | 8C    |
| `apps/web/src/features/marketing/components/LandingCta.tsx`               | 8C    |
| `apps/web/src/features/marketing/index.ts`                                | 8C    |
| `apps/web/src/features/onboarding/components/OnboardingWizard.tsx`        | 8C    |
| `apps/web/src/features/onboarding/components/StepIndicator.tsx`           | 8C    |
| `apps/web/src/features/onboarding/components/steps/StepCreateAccount.tsx` | 8C    |
| `apps/web/src/features/onboarding/components/steps/StepNamePalace.tsx`    | 8C    |
| `apps/web/src/features/onboarding/components/steps/StepChooseTheme.tsx`   | 8C    |
| `apps/web/src/features/onboarding/components/steps/StepAddNode.tsx`       | 8C    |
| `apps/web/src/features/onboarding/components/steps/StepComplete.tsx`      | 8C    |
| `apps/web/src/features/onboarding/index.ts`                               | 8C    |
| `apps/web/src/shared/lib/csp.ts`                                          | 8D    |
| `apps/web/src/app/api/upload/route.ts`                                    | 8D    |
| `docs/LAUNCH_CHECKLIST.md`                                                | 8E    |

### Modified (existing files)

| File                                           | Change                                                                      | Phase   |
| ---------------------------------------------- | --------------------------------------------------------------------------- | ------- |
| `apps/web/src/proxy.ts`                        | PUBLIC_SEGMENTS + root/join public + auth redirect → `/palaces` + CSP nonce | 8C + 8D |
| `apps/web/src/features/auth/actions/signIn.ts` | `redirect('/')` → `redirect('/palaces')`                                    | 8C      |
| `apps/web/src/features/auth/actions/signUp.ts` | `redirect('/')` → `redirect('/palaces')`                                    | 8C      |
| `apps/web/next.config.ts`                      | CORS headers for `/api/(.*)`                                                | 8D      |
| `apps/web/src/app/layout.tsx`                  | Read nonce from headers; pass to `<Script>`                                 | 8D      |
| `.env.example`                                 | Audit + any new vars                                                        | 8E      |

### Deleted

| File                                       | Reason                                         |
| ------------------------------------------ | ---------------------------------------------- |
| `apps/web/src/app/(dashboard)/page.tsx`    | Dashboard root moved; `/` becomes landing page |
| `apps/web/src/app/(dashboard)/loading.tsx` | No longer needed at `/`                        |

---

## Ordering Within Execution

```
1. Proxy: update PUBLIC_SEGMENTS + auth redirects + nonce/CSP  (touches both 8C and 8D)
2. Auth actions: update redirect targets
3. Delete (dashboard)/page.tsx and loading.tsx
4. Marketing layout + marketing feature components
5. Landing page, About page
6. Onboarding wizard (feature components + join page)
7. sitemap.ts + robots.ts
8. csp.ts library + layout nonce wiring
9. next.config.ts CORS headers
10. /api/upload route
11. LAUNCH_CHECKLIST.md + .env.example audit
```

---

## Architectural Decisions to Record (ADR)

1. **Root `/` conflict resolution:** Deleting `(dashboard)/page.tsx`; making `/` the marketing landing; `/palaces` as the authenticated entry point. Post-login redirect updated from `/` → `/palaces` in both server actions and proxy.
2. **Wizard step state in URL params, not sessionStorage:** Browser back/forward, no storage permission issues, SSR-compatible.
3. **CSP via proxy nonce (not next.config headers):** Static CSP headers cannot include a nonce. Nonce generated in `proxy.ts`, forwarded via `x-nonce` request header, read in root layout via `headers()`.
4. **Magic-byte MIME detection in upload route, no external package:** Five-byte prefix check in plain TypeScript avoids a dependency on `file-type` (ESM-only, adds complexity).
5. **`(marketing)` route group:** Separates public/SEO routes from `(auth)` and `(dashboard)` groups; gives marketing its own layout shell without polluting the dashboard shell.

---

_Awaiting approval before any application code is written._
