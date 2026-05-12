

DO $$ BEGIN
  CREATE TYPE "public"."palace_mode" AS ENUM ('bible', 'simple');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "palaces"
  ADD COLUMN IF NOT EXISTS "mode" "palace_mode" NOT NULL DEFAULT 'bible';

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

ALTER TABLE "nodes"
  ADD COLUMN IF NOT EXISTS "verse_hint" text,
  ADD COLUMN IF NOT EXISTS "bible_ref" text;
