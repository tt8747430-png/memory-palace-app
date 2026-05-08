-- 0003_learning_mode.sql — Bible/Simple palace mode + room linked-list + node verse fields
--
-- Adds:
--   * `palace_mode` enum and `palaces.mode` column (default 'bible').
--   * `rooms.prev_room_id` / `rooms.next_room_id` self-referential FKs (nullable).
--   * `nodes.verse_hint` and `nodes.bible_ref` text columns.
--
-- All additions are nullable / have defaults, so this migration is forward-only
-- and safe to apply to populated tables. Drizzle's generator does not handle
-- self-referential FKs cleanly, so we author this migration by hand.

-- ─── Enums ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "public"."palace_mode" AS ENUM ('bible', 'simple');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── Palaces ─────────────────────────────────────────────────────────────────

ALTER TABLE "palaces"
  ADD COLUMN IF NOT EXISTS "mode" "palace_mode" NOT NULL DEFAULT 'bible';

-- ─── Rooms ───────────────────────────────────────────────────────────────────

ALTER TABLE "rooms"
  ADD COLUMN IF NOT EXISTS "prev_room_id" uuid,
  ADD COLUMN IF NOT EXISTS "next_room_id" uuid;

DO $$ BEGIN
  ALTER TABLE "rooms"
    ADD CONSTRAINT "rooms_prev_room_id_fk"
    FOREIGN KEY ("prev_room_id") REFERENCES "rooms"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "rooms"
    ADD CONSTRAINT "rooms_next_room_id_fk"
    FOREIGN KEY ("next_room_id") REFERENCES "rooms"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "rooms_prev_room_idx" ON "rooms" ("prev_room_id");
CREATE INDEX IF NOT EXISTS "rooms_next_room_idx" ON "rooms" ("next_room_id");

-- ─── Nodes ───────────────────────────────────────────────────────────────────

ALTER TABLE "nodes"
  ADD COLUMN IF NOT EXISTS "verse_hint" text,
  ADD COLUMN IF NOT EXISTS "bible_ref" text;
