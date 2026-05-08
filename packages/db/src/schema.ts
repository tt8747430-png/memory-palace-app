import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// ─── Enums ───────────────────────────────────────────────────────────────────

export const nodeTypeEnum = pgEnum('node_type', ['text', 'image', 'link']);

export const practiceModeEnum = pgEnum('practice_mode', [
  'multiple-choice',
  'typed-recall',
  'flashcard',
]);

/**
 * Palace presentation mode.
 *  - `bible` (default): rooms read as chapters and nodes as verses; verse-
 *    hint and reference fields surface in the node editor and journey.
 *  - `simple`: plain rooms + nodes; verse-specific UI is hidden.
 */
export const palaceModeEnum = pgEnum('palace_mode', ['bible', 'simple']);

// ─── Tables ──────────────────────────────────────────────────────────────────

/**
 * Mirror of Supabase auth.users — profile data only.
 * id comes from Supabase Auth; we never generate it ourselves.
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const palaces = pgTable(
  'palaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    color: text('color'),
    icon: text('icon'),
    /** Presentation mode — see {@link palaceModeEnum}. Default `bible`. */
    mode: palaceModeEnum('mode').notNull().default('bible'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('palaces_user_id_idx').on(t.userId)],
);

export const rooms = pgTable(
  'rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    palaceId: uuid('palace_id')
      .notNull()
      .references(() => palaces.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    /** Zero-based ordering of rooms within a palace (canonical sort key). */
    position: integer('position').notNull().default(0),
    /**
     * Doubly-linked-list pointers — auxiliary to `position`. Maintained by
     * `setRoomOrder` so traversal UIs (journey/practice navigation) can walk
     * a stable order without recomputing from `position` every time.
     * Self-referential FK is added at runtime via raw SQL in the migration
     * to avoid Drizzle's circular-reference issue.
     */
    prevRoomId: uuid('prev_room_id'),
    nextRoomId: uuid('next_room_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('rooms_palace_id_idx').on(t.palaceId),
    index('rooms_prev_room_idx').on(t.prevRoomId),
    index('rooms_next_room_idx').on(t.nextRoomId),
  ],
);

export const nodes = pgTable(
  'nodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    /** Denormalised for fast RLS checks — avoids room→palace→user join. */
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content'),
    nodeType: nodeTypeEnum('node_type').notNull().default('text'),
    /** Canvas X coordinate (float4 — sub-pixel precision is unnecessary). */
    positionX: real('position_x').notNull().default(0),
    positionY: real('position_y').notNull().default(0),
    color: text('color'),
    /**
     * Optional hint text revealed during practice/flashcards/journey when
     * the parent palace is in Bible mode. Plain text, ≤ 2,000 chars.
     */
    verseHint: text('verse_hint'),
    /**
     * Optional Bible reference label (e.g. "John 3:16"). ≤ 120 chars,
     * surfaced as a chip in the journey/flashcard UI when Bible mode is on.
     */
    bibleRef: text('bible_ref'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('nodes_room_id_idx').on(t.roomId), index('nodes_user_id_idx').on(t.userId)],
);

/**
 * Directed graph edges between nodes.
 * No soft delete — edges are cheap to recreate; we don't need an audit trail.
 * A unique constraint prevents duplicate edges between the same pair of nodes.
 */
export const edges = pgTable(
  'edges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceNodeId: uuid('source_node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    targetNodeId: uuid('target_node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    label: text('label'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('edges_source_node_id_idx').on(t.sourceNodeId),
    index('edges_target_node_id_idx').on(t.targetNodeId),
    unique('edges_source_target_uniq').on(t.sourceNodeId, t.targetNodeId),
  ],
);

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('tags_user_id_idx').on(t.userId),
    unique('tags_user_name_uniq').on(t.userId, t.name),
  ],
);

/** Junction table — many-to-many nodes ↔ tags. */
export const nodeTags = pgTable(
  'node_tags',
  {
    nodeId: uuid('node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.nodeId, t.tagId] }), index('node_tags_tag_id_idx').on(t.tagId)],
);

/**
 * Append-only log of practice attempts. One row per question answered.
 * Drives history/analytics; the SR algorithm itself reads from `nodeReviewState`.
 */
export const practiceSessions = pgTable(
  'practice_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    nodeId: uuid('node_id')
      .notNull()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    /** 0–100 — caller-clamped on input. */
    score: integer('score').notNull(),
    correct: boolean('correct').notNull(),
    mode: practiceModeEnum('mode').notNull(),
    practicedAt: timestamp('practiced_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('practice_sessions_user_practiced_idx').on(t.userId, t.practicedAt),
    index('practice_sessions_node_idx').on(t.nodeId),
  ],
);

/**
 * Per-node SM-2 state. One row per (node, user) — but `userId` is denormalised
 * for fast RLS checks (mirrors the `nodes` table convention).
 * Lazy-initialised: a row only exists once the user has practiced the node at
 * least once. `getDueNodes` LEFT JOINs to find never-practiced nodes too.
 */
export const nodeReviewState = pgTable(
  'node_review_state',
  {
    nodeId: uuid('node_id')
      .primaryKey()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Total practice attempts (sum across modes). */
    practiceCount: integer('practice_count').notNull().default(0),
    /** Consecutive correct answers — resets to 0 on any miss. */
    streak: integer('streak').notNull().default(0),
    /** Exponentially-weighted mastery 0–100. */
    mastery: real('mastery').notNull().default(0),
    /** SM-2 ease factor (default 2.5, floor 1.3). */
    easeFactor: real('ease_factor').notNull().default(2.5),
    /** Current interval in days (0 means new). */
    intervalDays: integer('interval_days').notNull().default(0),
    lastPracticed: timestamp('last_practiced', { withTimezone: true }),
    /** Next review date — drives the due queue; never NULL once initialised. */
    nextReview: timestamp('next_review', { withTimezone: true }),
  },
  (t) => [
    index('node_review_state_user_next_review_idx').on(t.userId, t.nextReview),
    index('node_review_state_user_idx').on(t.userId),
  ],
);
