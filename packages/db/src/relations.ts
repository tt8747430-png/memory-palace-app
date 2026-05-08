import { relations } from 'drizzle-orm';
import {
  edges,
  nodeReviewState,
  nodeTags,
  nodes,
  palaces,
  practiceSessions,
  rooms,
  tags,
  users,
} from './schema';

export const usersRelations = relations(users, ({ many }) => ({
  palaces: many(palaces),
  nodes: many(nodes),
  tags: many(tags),
  practiceSessions: many(practiceSessions),
  nodeReviewStates: many(nodeReviewState),
}));

export const palacesRelations = relations(palaces, ({ one, many }) => ({
  user: one(users, { fields: [palaces.userId], references: [users.id] }),
  rooms: many(rooms),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  palace: one(palaces, { fields: [rooms.palaceId], references: [palaces.id] }),
  nodes: many(nodes),
}));

export const nodesRelations = relations(nodes, ({ one, many }) => ({
  room: one(rooms, { fields: [nodes.roomId], references: [rooms.id] }),
  user: one(users, { fields: [nodes.userId], references: [users.id] }),
  outgoingEdges: many(edges, { relationName: 'source' }),
  incomingEdges: many(edges, { relationName: 'target' }),
  nodeTags: many(nodeTags),
  practiceSessions: many(practiceSessions),
  reviewState: one(nodeReviewState, {
    fields: [nodes.id],
    references: [nodeReviewState.nodeId],
  }),
}));

export const practiceSessionsRelations = relations(practiceSessions, ({ one }) => ({
  user: one(users, { fields: [practiceSessions.userId], references: [users.id] }),
  node: one(nodes, { fields: [practiceSessions.nodeId], references: [nodes.id] }),
}));

export const nodeReviewStateRelations = relations(nodeReviewState, ({ one }) => ({
  user: one(users, { fields: [nodeReviewState.userId], references: [users.id] }),
  node: one(nodes, { fields: [nodeReviewState.nodeId], references: [nodes.id] }),
}));

export const edgesRelations = relations(edges, ({ one }) => ({
  sourceNode: one(nodes, {
    fields: [edges.sourceNodeId],
    references: [nodes.id],
    relationName: 'source',
  }),
  targetNode: one(nodes, {
    fields: [edges.targetNodeId],
    references: [nodes.id],
    relationName: 'target',
  }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  nodeTags: many(nodeTags),
}));

export const nodeTagsRelations = relations(nodeTags, ({ one }) => ({
  node: one(nodes, { fields: [nodeTags.nodeId], references: [nodes.id] }),
  tag: one(tags, { fields: [nodeTags.tagId], references: [tags.id] }),
}));
