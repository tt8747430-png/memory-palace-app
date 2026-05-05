import { describe, it, expect } from 'vitest';
import {
  getNodesByRoomSchema,
  searchNodesSchema,
  createNodeSchema,
  updateNodeSchema,
  updateNodePositionSchema,
  deleteNodeSchema,
  getRoomNodesSchema,
} from '../schemas/node';

const validUuid = '123e4567-e89b-12d3-a456-426614174000';

describe('getNodesByRoomSchema', () => {
  it('accepts a valid roomId', () => {
    const result = getNodesByRoomSchema.safeParse({ roomId: validUuid });
    expect(result.success).toBe(true);
  });

  it('defaults limit to 20', () => {
    const result = getNodesByRoomSchema.safeParse({ roomId: validUuid });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(20);
  });

  it('accepts custom limit within bounds', () => {
    const result = getNodesByRoomSchema.safeParse({ roomId: validUuid, limit: 50 });
    expect(result.success).toBe(true);
  });

  it('rejects limit = 0', () => {
    const result = getNodesByRoomSchema.safeParse({ roomId: validUuid, limit: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects limit > 100', () => {
    const result = getNodesByRoomSchema.safeParse({ roomId: validUuid, limit: 101 });
    expect(result.success).toBe(false);
  });

  it('accepts limit = 100 (boundary)', () => {
    const result = getNodesByRoomSchema.safeParse({ roomId: validUuid, limit: 100 });
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid roomId', () => {
    const result = getNodesByRoomSchema.safeParse({ roomId: 'not-a-uuid' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Invalid room ID');
  });

  it('rejects missing roomId', () => {
    const result = getNodesByRoomSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts an optional cursor string', () => {
    const result = getNodesByRoomSchema.safeParse({ roomId: validUuid, cursor: 'some-cursor' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.cursor).toBe('some-cursor');
  });
});

describe('searchNodesSchema', () => {
  it('accepts a minimal query', () => {
    const result = searchNodesSchema.safeParse({ query: 'rome' });
    expect(result.success).toBe(true);
  });

  it('defaults limit to 20', () => {
    const result = searchNodesSchema.safeParse({ query: 'test' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(20);
  });

  it('accepts optional palaceId', () => {
    const result = searchNodesSchema.safeParse({ query: 'test', palaceId: validUuid });
    expect(result.success).toBe(true);
  });

  it('rejects empty query', () => {
    const result = searchNodesSchema.safeParse({ query: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Query cannot be empty');
  });

  it('rejects query longer than 200 characters', () => {
    const result = searchNodesSchema.safeParse({ query: 'q'.repeat(201) });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0]?.message).toBe('Query must be 200 characters or less');
  });

  it('accepts query exactly 200 characters', () => {
    const result = searchNodesSchema.safeParse({ query: 'q'.repeat(200) });
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid palaceId', () => {
    const result = searchNodesSchema.safeParse({ query: 'test', palaceId: 'bad' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Invalid palace ID');
  });

  it('rejects limit > 50', () => {
    const result = searchNodesSchema.safeParse({ query: 'test', limit: 51 });
    expect(result.success).toBe(false);
  });

  it('accepts limit = 50 (boundary)', () => {
    const result = searchNodesSchema.safeParse({ query: 'test', limit: 50 });
    expect(result.success).toBe(true);
  });

  it('rejects missing query', () => {
    const result = searchNodesSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('getRoomNodesSchema', () => {
  it('accepts a valid roomId', () => {
    expect(getRoomNodesSchema.safeParse({ roomId: validUuid }).success).toBe(true);
  });
  it('rejects non-uuid roomId', () => {
    const r = getRoomNodesSchema.safeParse({ roomId: 'bad' });
    expect(r.success).toBe(false);
  });
  it('rejects missing roomId', () => {
    expect(getRoomNodesSchema.safeParse({}).success).toBe(false);
  });
});

describe('createNodeSchema', () => {
  const base = { roomId: validUuid, title: 'Test node' };

  it('accepts minimal input', () => {
    const r = createNodeSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it('defaults nodeType to text', () => {
    const r = createNodeSchema.safeParse(base);
    expect(r.success && r.data.nodeType).toBe('text');
  });

  it('defaults positionX/Y to 0', () => {
    const r = createNodeSchema.safeParse(base);
    expect(r.success && r.data.positionX).toBe(0);
    expect(r.success && r.data.positionY).toBe(0);
  });

  it('accepts all node types', () => {
    for (const nodeType of ['text', 'image', 'link'] as const) {
      expect(createNodeSchema.safeParse({ ...base, nodeType }).success).toBe(true);
    }
  });

  it('rejects unknown node type', () => {
    expect(createNodeSchema.safeParse({ ...base, nodeType: 'video' }).success).toBe(false);
  });

  it('rejects empty title', () => {
    expect(createNodeSchema.safeParse({ ...base, title: '' }).success).toBe(false);
  });

  it('rejects title longer than 200 chars', () => {
    expect(createNodeSchema.safeParse({ ...base, title: 'x'.repeat(201) }).success).toBe(false);
  });

  it('rejects non-finite positionX', () => {
    expect(createNodeSchema.safeParse({ ...base, positionX: Infinity }).success).toBe(false);
  });

  it('rejects non-finite positionY', () => {
    expect(createNodeSchema.safeParse({ ...base, positionY: NaN }).success).toBe(false);
  });

  it('rejects non-uuid roomId', () => {
    expect(createNodeSchema.safeParse({ ...base, roomId: 'not-uuid' }).success).toBe(false);
  });
});

describe('updateNodeSchema', () => {
  const base = { id: validUuid, roomId: validUuid };

  it('accepts base ids with no patch fields', () => {
    expect(updateNodeSchema.safeParse(base).success).toBe(true);
  });

  it('accepts title update', () => {
    expect(updateNodeSchema.safeParse({ ...base, title: 'New' }).success).toBe(true);
  });

  it('accepts null content (clear)', () => {
    expect(updateNodeSchema.safeParse({ ...base, content: null }).success).toBe(true);
  });

  it('rejects empty title', () => {
    expect(updateNodeSchema.safeParse({ ...base, title: '' }).success).toBe(false);
  });

  it('rejects non-uuid id', () => {
    expect(updateNodeSchema.safeParse({ id: 'bad', roomId: validUuid }).success).toBe(false);
  });
});

describe('updateNodePositionSchema', () => {
  const base = { id: validUuid, roomId: validUuid, positionX: 10, positionY: 20 };

  it('accepts valid coordinates', () => {
    expect(updateNodePositionSchema.safeParse(base).success).toBe(true);
  });

  it('accepts negative coordinates', () => {
    expect(
      updateNodePositionSchema.safeParse({ ...base, positionX: -50, positionY: -100 }).success,
    ).toBe(true);
  });

  it('rejects Infinity for positionX', () => {
    expect(updateNodePositionSchema.safeParse({ ...base, positionX: Infinity }).success).toBe(
      false,
    );
  });

  it('rejects NaN for positionY', () => {
    expect(updateNodePositionSchema.safeParse({ ...base, positionY: NaN }).success).toBe(false);
  });

  it('rejects missing positionX', () => {
    expect(
      updateNodePositionSchema.safeParse({ id: validUuid, roomId: validUuid, positionY: 20 })
        .success,
    ).toBe(false);
  });
});

describe('deleteNodeSchema', () => {
  it('accepts valid id + roomId', () => {
    expect(deleteNodeSchema.safeParse({ id: validUuid, roomId: validUuid }).success).toBe(true);
  });

  it('rejects non-uuid id', () => {
    expect(deleteNodeSchema.safeParse({ id: 'bad', roomId: validUuid }).success).toBe(false);
  });

  it('rejects non-uuid roomId', () => {
    expect(deleteNodeSchema.safeParse({ id: validUuid, roomId: 'bad' }).success).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(deleteNodeSchema.safeParse({}).success).toBe(false);
  });
});
