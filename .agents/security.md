# Security guidelines for agents

## Principle of Least Privilege

Default to the smallest permission, narrowest field set, and shortest scope that still works.

- **Default deny.** Start from no access and add what's required, rather than opening things up and trimming back.
- **Scope every Drizzle query.** Always filter by `userId` (sourced from the server-side session, never from client input) so a request can only touch its own data. RLS is the second line of defence, not the first.
- **Separate read and write checks.** "Can see" and "can modify" are different questions; don't let one imply the other.
- **Lock down ownership fields.** `userId`, `createdAt`, and similar fields must be set server-side inside server actions — never trust values submitted by the client.
- **Expose the minimum in server actions.** Return only the fields the caller needs; do not forward raw DB rows.
- **Tokens and credentials: narrowest scope, shortest lifetime.** Never log secrets, never commit them. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is safe to expose; `DATABASE_URL` and service-role keys are not.
- **Remove access in the same change as the feature.** When a route, action, or capability goes away, remove its RLS policy and rate-limit entry at the same time.

