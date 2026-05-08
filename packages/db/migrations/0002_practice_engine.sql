-- Phase 9A: Spaced-repetition engine.
-- Additive — two new tables and one enum. No destructive changes.
-- Re-run `pnpm --filter @memory-palace/db generate` to regenerate the
-- snapshot/journal if drizzle-kit produces a competing migration.

CREATE TYPE "practice_mode" AS ENUM ('multiple-choice', 'typed-recall', 'flashcard');
--> statement-breakpoint

CREATE TABLE "practice_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "node_id" uuid NOT NULL REFERENCES "nodes"("id") ON DELETE CASCADE,
  "score" integer NOT NULL,
  "correct" boolean NOT NULL,
  "mode" "practice_mode" NOT NULL,
  "practiced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE INDEX "practice_sessions_user_practiced_idx"
  ON "practice_sessions" ("user_id", "practiced_at");
--> statement-breakpoint
CREATE INDEX "practice_sessions_node_idx"
  ON "practice_sessions" ("node_id");
--> statement-breakpoint

CREATE TABLE "node_review_state" (
  "node_id" uuid PRIMARY KEY REFERENCES "nodes"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "practice_count" integer DEFAULT 0 NOT NULL,
  "streak" integer DEFAULT 0 NOT NULL,
  "mastery" real DEFAULT 0 NOT NULL,
  "ease_factor" real DEFAULT 2.5 NOT NULL,
  "interval_days" integer DEFAULT 0 NOT NULL,
  "last_practiced" timestamp with time zone,
  "next_review" timestamp with time zone
);
--> statement-breakpoint

CREATE INDEX "node_review_state_user_next_review_idx"
  ON "node_review_state" ("user_id", "next_review");
--> statement-breakpoint
CREATE INDEX "node_review_state_user_idx"
  ON "node_review_state" ("user_id");
