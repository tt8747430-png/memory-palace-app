import { describe, it, expect } from 'vitest';
import { createRoomSchema, updateRoomSchema, roomIdSchema, getRoomsSchema } from '../schemas/room';

// Valid v4 UUIDs (version bit = 4, variant bits = 8/9/a/b as required by RFC 4122).
const PALACE_ID = '550e8400-e29b-41d4-a716-446655440000';
const ROOM_ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';

describe('createRoomSchema', () => {
  it('accepts a valid palace ID and title', () => {
    const result = createRoomSchema.safeParse({ palaceId: PALACE_ID, title: 'The Library' });
    expect(result.success).toBe(true);
  });

  it('defaults position to 0 when omitted', () => {
    const result = createRoomSchema.safeParse({ palaceId: PALACE_ID, title: 'The Hall' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.position).toBe(0);
  });

  it('rejects an empty title', () => {
    const result = createRoomSchema.safeParse({ palaceId: PALACE_ID, title: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Title is required');
  });

  it('rejects title longer than 100 characters', () => {
    const result = createRoomSchema.safeParse({ palaceId: PALACE_ID, title: 'a'.repeat(101) });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toMatch(/100 characters or less/);
  });

  it('rejects an invalid palace ID', () => {
    const result = createRoomSchema.safeParse({ palaceId: 'not-a-uuid', title: 'Room' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Invalid palace ID');
  });
});

describe('updateRoomSchema', () => {
  it('accepts partial updates', () => {
    const result = updateRoomSchema.safeParse({
      id: ROOM_ID,
      palaceId: PALACE_ID,
      title: 'Renamed Room',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = updateRoomSchema.safeParse({ id: ROOM_ID, palaceId: PALACE_ID, title: '' });
    expect(result.success).toBe(false);
  });
});

describe('roomIdSchema', () => {
  it('accepts valid UUIDs', () => {
    const result = roomIdSchema.safeParse({ id: ROOM_ID, palaceId: PALACE_ID });
    expect(result.success).toBe(true);
  });

  it('rejects missing palaceId', () => {
    expect(roomIdSchema.safeParse({ id: ROOM_ID }).success).toBe(false);
  });
});

describe('getRoomsSchema', () => {
  it('accepts a valid palace ID', () => {
    const result = getRoomsSchema.safeParse({ palaceId: PALACE_ID });
    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID palace ID', () => {
    const result = getRoomsSchema.safeParse({ palaceId: 'bad-id' });
    expect(result.success).toBe(false);
  });
});
