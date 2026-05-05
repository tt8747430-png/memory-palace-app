# Roadmap — current

The aspirational 11-phase plan lives at `docs/archive/ROADMAP-aspirational.md`. It is reference material, not a contract.

## Done

- **Phase 1 — Foundation & DevOps.** Monorepo (Turbo + pnpm), Supabase auth via proxy, callback route, CI/CD, git hooks, Vercel config.
- **Phase 2A — Layout components.** `DashboardShell`, `Sidebar`, `BottomNav`, `MobileDrawer`.
- **Cleanup pass.** Removed empty feature dirs and duplicate `cn`. Consolidated three Supabase SSR factories into one module. Extracted `redirectWithCookies` in the proxy. Added Zod-validated `env` module. Dropped redundant per-navigation auth round-trip in dashboard layout. Made `db` client lazy. Fixed `turbo` `typecheck` dependency. Pinned `lucide-react`. Trimmed docs.
- **Phase 2B — Theme system.** `next-themes` + `ThemeProvider` in root layout. 3-way `ModeToggle` (light → dark → system) in sidebar footer and top bar. Dark-mode CSS token set (`.dark {}`) in `globals.css`; `@custom-variant dark` wired for Tailwind v4.
- **Phase 2C — Base components.** `Input`, `Alert`, `Skeleton`, `Sheet`, `Label`, `Card` (+ `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription`) added to `@memory-palace/ui`. `LoginForm` and `SignupForm` refactored to use them with proper accessible `<label>` associations. `EmptyState` and `CardSkeleton` added to `src/shared/components/`.
- **Phase 3A — DB schema.** Drizzle schema: 7 tables (`users`, `palaces`, `rooms`, `nodes`, `edges`, `tags`, `node_tags`), `pgEnum` for node type, explicit indexes on every FK, `$onUpdate` for `updatedAt`, cascade deletes, Drizzle `relations()` for the relational query API, inferred TypeScript types exported, `drizzle.config.ts` wired for `DIRECT_DATABASE_URL`, seed script with dev fixtures, migration notes for manual GIN FTS index.

- **Phase 3B — RLS + Server Actions.** Per-table RLS policies on all 7 tables. `auth.users → public.users` sync trigger (`handle_new_auth_user`, SECURITY DEFINER) with backfill of pre-existing users. `ActionResponse<T>` + `ErrorCode` shared types in `src/shared/types.ts`. Palace CRUD server actions (`createPalace`, `getPalaces`, `getPalaceById`, `updatePalace`, `deletePalace`) with Zod-validated input, soft delete on palaces, auth guard on every action. Rate-limit ADR written (`docs/adr/3b-rate-limiting.md`) — Upstash Redis, deferred to Phase 3C.

- **Phase 3C — Rate limiting, FTS search, cursor pagination.** Upstash Redis rate limiting wired into all mutating server actions (palace CRUD + FTS search). `nodes` feature created with two server actions: `getNodesByRoom` (cursor-paginated keyset query using Postgres row comparisons) and `searchNodes` (full-text search via `websearch_to_tsquery` + `ts_rank` ordering). GIN `tsvector` index on `nodes` leveraged for FTS. `CursorPage<T>` type added to shared types. Opaque base64url cursor codec in `shared/lib/cursor.ts`. Rate limiter in `shared/lib/ratelimit.ts` — no-ops gracefully when Upstash env vars are absent (safe for local dev). Drizzle query helpers re-exported from `@memory-palace/db` to prevent dual virtual-store resolution with `@upstash/redis` peer dependency.

- **Phase 4 — Dashboard & Core Pages.** Real dashboard home with `WelcomeBanner`, `StatsBar` (palace/room/node counts via `getDashboardStats`), and `RecentPalaces` (4 latest with links). Full palace CRUD pages (`/palaces`, `/palaces/[palaceId]`): `PalaceCard`, `CreatePalaceDialog`, `EditPalaceDialog`, `DeletePalaceButton`. New `rooms` feature: 5 server actions (createRoom, getRooms, getRoomById, updateRoom, deleteRoom — all with palace ownership verification via JOIN), `RoomCard`, `CreateRoomDialog`, `EditRoomDialog`, `DeleteRoomButton`, `/palaces/[palaceId]/rooms/[roomId]` stub page. Settings/profile page (`/settings`) with `ProfileForm` using `useActionState`. `Dialog` + `Textarea` added to `@memory-palace/ui`. Nav updated with `/palaces` and `/settings` links. 127 tests passing.

- **Phase 4C.3 — Data Export/Import.** Versioned JSON export via `GET /api/export` (Route Handler, `Content-Disposition: attachment`, `Cache-Control: no-store`). `importPalaceData` server action with Zod validation, DB transaction, `ON CONFLICT DO NOTHING` for idempotent re-imports, `userId` always sourced from session. `ExportDataCard` + `ImportDataCard` client components in `/settings`. 10 MB guard on client and server. 20 schema tests added; 147 tests passing.

## Next (concrete, in order)

1. **Phase 5 — Spatial Canvas.** ADRs written for all three Phase 5A dependencies:
   - [`docs/adr/5a-react-flow.md`](docs/adr/5a-react-flow.md) — `@xyflow/react` (React Flow v12) as the canvas library
   - [`docs/adr/5a-zustand.md`](docs/adr/5a-zustand.md) — Zustand v5 for 60fps transient canvas state
   - [`docs/adr/5a-tanstack-query.md`](docs/adr/5a-tanstack-query.md) — TanStack Query v5 for server state, caching, and optimistic updates

## Operating rules

- One PR per phase sub-step. Squash to `main`.
- Before any phase that introduces a new dependency (Yjs, kbar, Sentry, etc.), write an ADR in `docs/adr/` and link it from this file.
- Don't grow the documentation faster than the codebase. If a doc is bigger than the code it describes, trim the doc.
