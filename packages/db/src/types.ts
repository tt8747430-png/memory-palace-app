import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { edges, nodeTags, nodeTypeEnum, nodes, palaces, rooms, tags, users } from './schema';

export type SelectUser = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;

export type SelectPalace = InferSelectModel<typeof palaces>;
export type InsertPalace = InferInsertModel<typeof palaces>;

export type SelectRoom = InferSelectModel<typeof rooms>;
export type InsertRoom = InferInsertModel<typeof rooms>;

export type SelectNode = InferSelectModel<typeof nodes>;
export type InsertNode = InferInsertModel<typeof nodes>;

export type SelectEdge = InferSelectModel<typeof edges>;
export type InsertEdge = InferInsertModel<typeof edges>;

export type SelectTag = InferSelectModel<typeof tags>;
export type InsertTag = InferInsertModel<typeof tags>;

export type SelectNodeTag = InferSelectModel<typeof nodeTags>;
export type InsertNodeTag = InferInsertModel<typeof nodeTags>;

export type NodeType = (typeof nodeTypeEnum.enumValues)[number];
