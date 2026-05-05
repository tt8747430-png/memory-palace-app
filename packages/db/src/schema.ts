import {
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
    /** Zero-based ordering of rooms within a palace. */
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('rooms_palace_id_idx').on(t.palaceId)],
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
