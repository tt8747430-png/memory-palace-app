# Security Hardening Plan — Memory Palace App

This document defines the complete security posture of the Memory Palace application. Every security control, rationale, and implementation detail is documented here.

---

## Table of Contents

1. [Content Security Policy (CSP)](#1-content-security-policy-csp)
2. [CORS Policy](#2-cors-policy)
3. [Input Sanitization](#3-input-sanitization)
4. [File Upload Validation](#4-file-upload-validation)
5. [Supabase Service Role Key Policy](#5-supabase-service-role-key-policy)
6. [Dependency Auditing](#6-dependency-auditing)
7. [Rate Limiting Layers](#7-rate-limiting-layers)

---

## 1. Content Security Policy (CSP)

React Flow renders to `<canvas>`. Without a CSP header, the app is vulnerable to XSS injection via malicious scripts injected into the DOM or into canvas node content.

### Required Configuration

Add the following security headers to `next.config.mjs`:

```js
// next.config.mjs
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval'", // Required for React Flow canvas
      "style-src 'self' 'unsafe-inline'", // Required for Tailwind
      "img-src 'self' blob: data: *.supabase.co",
      "connect-src 'self' *.supabase.co *.upstash.io",
      "font-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];
```

Apply the headers via the `headers()` export in `next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

### Why `unsafe-eval`?

React Flow internally uses `new Function()` or similar dynamic evaluation for canvas rendering. This is a known requirement and is acceptable because all other directives are strict. Monitor React Flow release notes for an eval-free alternative in future versions.

### Why `unsafe-inline` for styles?

Tailwind CSS injects utility classes at runtime. Until Tailwind v4's compile-time extraction is stable across all configurations, `unsafe-inline` for `style-src` is required.

---

## 2. CORS Policy

### Supabase Client (Browser)

Supabase client calls made from the browser (`@supabase/ssr` with the anon key) are subject to CORS rules enforced by Supabase's servers.

**Configuration:** Set the allowed origins in the Supabase project dashboard:

1. Go to **Project Settings → API → Allowed Origins**
2. Add your production domain: `https://your-app.vercel.app`
3. Add `http://localhost:3000` for local development

Supabase automatically blocks cross-origin requests from unlisted origins. Do **not** use a wildcard (`*`) in production.

### Server Actions

Next.js Server Actions are same-origin by default — they are invoked via `POST` to the Next.js server and are not directly accessible from other origins. No additional CORS configuration is needed for Server Actions.

### Supabase Storage

If room background images or node attachments are served from Supabase Storage, configure the bucket's CORS policy via the Supabase CLI:

```json
[
  {
    "origin": ["https://your-app.vercel.app"],
    "allowedHeaders": ["*"],
    "allowedMethods": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

---

## 3. Input Sanitization

### Zod vs. DOMPurify

Zod validates **shape** (types, required fields, string lengths) but does **not** sanitize **content**. A string field that passes Zod validation may still contain malicious HTML or script content.

Any user-generated content rendered inside React Flow nodes (titles, rich-text body, labels) must be sanitized before rendering to prevent stored XSS.

### Install DOMPurify

```bash
pnpm add isomorphic-dompurify
pnpm add -D @types/dompurify
```

`isomorphic-dompurify` works in both browser and Node.js (Server Actions, SSR) environments.

### Implementation

```typescript
import DOMPurify from 'isomorphic-dompurify';

function sanitizeNodeContent(content: string): string {
  return DOMPurify.sanitize(content, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br'] });
}
```

Use this function:

- In the Server Action that writes node content to the database (sanitize before persisting)
- In any component that renders node content as HTML (sanitize before `dangerouslySetInnerHTML`)

### Where to Apply

| Location                          | Rationale                                                     |
| --------------------------------- | ------------------------------------------------------------- |
| `updateNodeContent` Server Action | Sanitize before writing to the database                       |
| `createNode` Server Action        | Sanitize title and content on creation                        |
| React Flow node renderer          | Last line of defence if data came from a pre-sanitization era |

---

## 4. File Upload Validation

Room background images and node attachments must be validated **server-side** before being stored in Supabase Storage. Client-side validation (file extension, MIME type sniffing in the browser) is not sufficient — it can be bypassed by a malicious actor.

### Rules

- **Validate MIME type server-side** — not just the file extension
- **Limit file size** to 5MB maximum
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`

### Example Validation Server Action

```typescript
import { z } from 'zod';
import { checkRateLimit } from '@/shared/lib/rate-limit';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const FileUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().max(MAX_FILE_SIZE_BYTES, 'File must be 5MB or smaller'),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  roomId: z.string().uuid(),
});

export async function uploadRoomBackground(formData: FormData) {
  await checkRateLimit();

  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

  // Server-side MIME type validation using the file's magic bytes
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const detectedMime = detectMimeType(bytes);

  const parsed = FileUploadSchema.parse({
    fileName: file.name,
    fileSize: file.size,
    mimeType: detectedMime, // Use detected MIME type, not the client-provided type
    roomId: formData.get('roomId'),
  });

  // Upload to Supabase Storage
  // ...
}

function detectMimeType(bytes: Uint8Array): string {
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    return 'image/png';
  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38)
    return 'image/gif';
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
    return 'image/webp';
  return 'application/octet-stream'; // Unknown type — will fail Zod validation
}
```

### Supabase Storage Bucket Policy

In addition to server-side validation, configure the Supabase Storage bucket with:

- **Max file size:** 5MB
- **Allowed MIME types:** `image/jpeg,image/png,image/webp,image/gif`
- **Public access:** Disabled by default — generate signed URLs for access

---

## 5. Supabase Service Role Key Policy

### ⚠️ Critical Security Rule

The `SUPABASE_SECRET_KEY` bypasses **ALL** Row Level Security (RLS) policies. Any query made with this key can read, write, or delete any row in any table, regardless of the RLS policies in place.

### Where It MUST NOT Be Used

- ❌ Client-side code (browser bundles, `'use client'` components)
- ❌ Regular Server Actions (any action callable from the browser)
- ❌ Any code path that handles user requests
- ❌ `NEXT_PUBLIC_` environment variables (these are exposed to the browser)

### Where It MAY Be Used

- ✅ Database migration scripts (`migrate.yml` GitHub Action only)
- ✅ Admin-only maintenance scripts run from a secure CI environment
- ✅ Seed scripts for development (on local database only)

### Key Usage Reference Table

| Location                            | Key to Use                               | Reason                                                  |
| ----------------------------------- | ---------------------------------------- | ------------------------------------------------------- |
| Client-side Supabase init           | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`   | Public key, RLS enforced                                |
| Server-side Supabase (SSR, cookies) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`   | RLS enforced, user context preserved                    |
| Server Actions (via Drizzle)        | `DATABASE_URL` (pooled, no Supabase key) | Drizzle + RLS, no service role needed                   |
| `migrate.yml` workflow              | `SUPABASE_SECRET_KEY`                    | Migration runner needs unrestricted access              |
| Seed scripts (local dev only)       | `SUPABASE_SECRET_KEY`                    | Only on local database, never production                |
| Admin maintenance scripts           | `SUPABASE_SECRET_KEY`                    | Restricted to GitHub Actions secrets, never in app code |

### Environment Variable Security

Store `SUPABASE_SECRET_KEY` **only** in:

- GitHub Actions Secrets (for `migrate.yml` and seed workflows)
- Local `.env.local` (never committed)

**Never** add it to Vercel environment variables for Preview or Production deployments.

---

## 6. Dependency Auditing

### Automated Audit on Every PR

Add the following job to the CI pipeline (`.github/workflows/ci.yml`) to automatically audit dependencies for known vulnerabilities on every pull request:

```yaml
dependency-audit:
  name: Dependency Security Audit
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'pnpm'
    - run: pnpm install --frozen-lockfile
    - run: pnpm audit --audit-level=high
```

This job:

- Installs dependencies from the lockfile (no version drift)
- Fails the CI pipeline if any **high** or **critical** severity vulnerability is found
- Allows **low** and **moderate** findings to pass (adjust `--audit-level` as needed)

### Manual Audit

Run locally before committing new dependencies:

```bash
pnpm audit
pnpm audit --audit-level=high  # fail only on high/critical
```

### Dependency Update Strategy

- Use Dependabot or Renovate Bot for automated dependency update PRs
- All dependency updates go through the same CI pipeline (including the audit job)
- Pin exact versions for security-critical packages (e.g., auth libraries)

---

## 7. Rate Limiting Layers

The application uses a **defense-in-depth** rate limiting strategy. Currently Layer 2 is implemented; Layers 1 and 3 are configured by the infrastructure but have no custom application logic yet.

### Layer 1: Vercel Edge — auth redirect only (rate limiting planned)

**Current state:** `src/proxy.ts` runs at the Vercel Edge and redirects unauthenticated requests to the login page. Per-IP request rate limiting at the edge (Upstash from middleware) is **not yet implemented**.

### Layer 2: Upstash Redis in Server Actions ✅ Implemented

**Purpose:** Per-user rate limiting inside every Server Action before any database operation.

**Implementation:** `apps/web/src/shared/lib/ratelimit.ts` — `checkRateLimit(userId, 'write' | 'search')` — uses Upstash sliding window.

- `write` tier: 10 requests / 5 seconds per user
- `search` tier: 20 requests / 10 seconds per user
- Keyed by authenticated user ID (not IP — accounts for shared IPs like corporate NAT)
- No-op without `UPSTASH_REDIS_REST_URL`/`TOKEN` env vars (safe for local dev)
- Returns `{ success: false, error: { code: 'RATE_LIMITED', message, retryAfter } }` when exceeded

### Layer 3: Supabase Connection Pooling Limits

**Purpose:** Database-level protection. Supabase Supavisor limits total concurrent database connections regardless of application logic.

- Configure pool size in Supabase project settings
- Monitor pool utilization in the Supabase dashboard
- Alert at >80% pool usage (see `DEVELOPMENT.md` monitoring rules)

### Summary

| Layer   | Tool                           | Status            | Scope                  |
| ------- | ------------------------------ | ----------------- | ---------------------- |
| Layer 1 | Vercel Edge / Upstash          | ⬜ Planned        | Per IP / per route     |
| Layer 2 | Upstash Redis sliding window   | ✅ Implemented    | Per authenticated user |
| Layer 3 | Supabase Supavisor pool limits | ✅ Infrastructure | Global database tier   |
