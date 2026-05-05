import { describe, it, expect } from 'vitest';
import { getNodesByRoomSchema, searchNodesSchema } from '../schemas/node';

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
