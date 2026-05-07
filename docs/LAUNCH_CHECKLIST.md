# Phase 8E — Launch Checklist

Track pre-launch verification for Memory Palace v1.0.0.

> Status legend: ✅ Verified · ⏳ Pending · ❌ Blocked

---

## CI & Build

| Item                                       | Status | Notes                                  |
| ------------------------------------------ | ------ | -------------------------------------- |
| All CI checks pass on `main`               | ⏳     | Run after merging Phase 8C/8D/8E       |
| TypeScript build (`tsc --noEmit`) succeeds | ⏳     |                                        |
| ESLint: no errors in `apps/web/src`        | ⏳     |                                        |
| Lighthouse CI workflow passes              | ⏳     | See `.github/workflows/lighthouse.yml` |

## Observability

| Item                                                  | Status | Notes                                    |
| ----------------------------------------------------- | ------ | ---------------------------------------- |
| PostHog initialises in production (check Network tab) | ⏳     | Key: `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` |
| OTel log pipeline active (PostHog → Logs)             | ⏳     | Check `instrumentation.ts`               |
| Error events captured in PostHog                      | ⏳     | Trigger a deliberate error in staging    |

## Performance (Lighthouse)

| Metric         | Target | Status |
| -------------- | ------ | ------ |
| Performance    | ≥ 85   | ⏳     |
| Accessibility  | ≥ 90   | ⏳     |
| Best Practices | ≥ 90   | ⏳     |
| SEO            | ≥ 80   | ⏳     |

Run against: `/` (landing), `/about`, `/palaces` (auth required — use staging session cookie).

## Security

| Item                                                                | Status | Notes                                       |
| ------------------------------------------------------------------- | ------ | ------------------------------------------- |
| CSP header present on all responses                                 | ⏳     | Check via `curl -I https://your-domain.com` |
| CSP grade ≥ A on [securityheaders.com](https://securityheaders.com) | ⏳     |                                             |
| X-Frame-Options: DENY                                               | ✅     | Set in `next.config.ts`                     |
| X-Content-Type-Options: nosniff                                     | ✅     | Set in `next.config.ts`                     |
| Referrer-Policy: strict-origin-when-cross-origin                    | ✅     | Set in `next.config.ts`                     |
| Permissions-Policy configured                                       | ✅     | Set in `next.config.ts`                     |
| CORS: no wildcard `*` on `/api/*`                                   | ✅     | `NEXT_PUBLIC_SITE_URL` origin only          |
| File upload: magic-byte MIME validation                             | ✅     | `src/app/api/upload/route.ts`               |
| File upload: max 5 MB enforced                                      | ✅     | `src/app/api/upload/route.ts`               |
| RLS verified: cross-user data isolation                             | ⏳     | Test with two separate accounts             |
| Rate limiting verified: 429 on abuse                                | ⏳     | Hit `write` bucket > 30 req/10s             |

## Public Pages

| Item                                                  | Status | Notes                           |
| ----------------------------------------------------- | ------ | ------------------------------- |
| Landing page live at `/`                              | ✅     | `(marketing)/page.tsx`          |
| About page live at `/about`                           | ✅     | `(marketing)/about/page.tsx`    |
| Join wizard live at `/join`                           | ✅     | `(marketing)/join/page.tsx`     |
| sitemap.xml accessible at `/sitemap.xml`              | ✅     | `(marketing)/sitemap.ts`        |
| robots.txt allows `/`, `/about`, `/join`              | ✅     | `src/app/robots.ts`             |
| robots.txt disallows `/palaces`, `/settings`, `/api/` | ✅     | `src/app/robots.ts`             |
| `<meta robots>` index=true on public pages            | ✅     | Set in `(marketing)/layout.tsx` |

## Auth & Onboarding

| Item                                                    | Status | Notes                             |
| ------------------------------------------------------- | ------ | --------------------------------- |
| Unauthenticated `/` → landing page (not login redirect) | ✅     | proxy.ts: `''` in PUBLIC_SEGMENTS |
| Authenticated `/` → `/palaces` redirect                 | ✅     | proxy.ts: `seg === ''` guard      |
| Authenticated `/join` → `/palaces` redirect             | ✅     | proxy.ts: `seg === 'join'` guard  |
| Post-login redirect lands on `/palaces`                 | ✅     | `signIn.ts` + `signUp.ts` updated |
| Onboarding wizard: all 5 steps reachable                | ⏳     | Manual walkthrough                |
| Onboarding wizard: back navigation works                | ⏳     |                                   |
| Onboarding wizard: URL step param survives refresh      | ⏳     |                                   |

## Environment Variables

| Variable                               | Required in prod | Present in `.env.example` |
| -------------------------------------- | ---------------- | ------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | ✅               | ✅                        |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅               | ✅                        |
| `NEXT_PUBLIC_SITE_URL`                 | ✅               | ✅                        |
| `UPSTASH_REDIS_REST_URL`               | ✅               | ✅                        |
| `UPSTASH_REDIS_REST_TOKEN`             | ✅               | ✅                        |
| `DATABASE_URL`                         | ✅               | ✅                        |
| `DIRECT_DATABASE_URL`                  | ✅               | ✅                        |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`    | optional         | ✅                        |
| `NEXT_PUBLIC_POSTHOG_HOST`             | optional         | ✅                        |

## Data & Infrastructure

| Item                                              | Status | Notes                             |
| ------------------------------------------------- | ------ | --------------------------------- |
| Supabase Storage bucket `node-attachments` exists | ⏳     | Create via Supabase dashboard     |
| Storage bucket RLS: users can only read own files | ⏳     |                                   |
| Backup strategy active on Supabase project        | ⏳     | Enable PITR in Supabase dashboard |
| PostHog error alert configured                    | ⏳     |                                   |

## E2E Tests

| Flow                                                      | Status |
| --------------------------------------------------------- | ------ |
| Auth: sign up → email confirm → sign in → sign out        | ⏳     |
| CRUD: create palace → room → node → edit → delete         | ⏳     |
| Canvas: drag node, create edge, save                      | ⏳     |
| Search: FTS query returns correct results                 | ⏳     |
| Offline: app loads from cache, graceful error on mutation | ⏳     |

---

## Release command

When all items are ✅:

```bash
git tag -a v1.0.0 -m "v1.0.0: Production-ready Memory Palace"
git push origin v1.0.0
```
