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

export const nodeTypeEnum = pgEnum('node_type', ['text', 'image', 'link']);

export const practiceModeEnum = pgEnum('practice_mode', [
  'multiple-choice',
  'typed-recall',
  'flashcard',
]);

export const palaceModeEnum = pgEnum('palace_mode', ['bible', 'simple']);

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

    position: integer('position').notNull().default(0),

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

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content'),
    nodeType: nodeTypeEnum('node_type').notNull().default('text'),

    positionX: real('position_x').notNull().default(0),
    positionY: real('position_y').notNull().default(0),
    color: text('color'),

    verseHint: text('verse_hint'),

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

export const nodeReviewState = pgTable(
  'node_review_state',
  {
    nodeId: uuid('node_id')
      .primaryKey()
      .references(() => nodes.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    practiceCount: integer('practice_count').notNull().default(0),

    streak: integer('streak').notNull().default(0),

    mastery: real('mastery').notNull().default(0),

    easeFactor: real('ease_factor').notNull().default(2.5),

    intervalDays: integer('interval_days').notNull().default(0),
    lastPracticed: timestamp('last_practiced', { withTimezone: true }),

    nextReview: timestamp('next_review', { withTimezone: true }),
  },
  (t) => [
    index('node_review_state_user_next_review_idx').on(t.userId, t.nextReview),
    index('node_review_state_user_idx').on(t.userId),
  ],
);
