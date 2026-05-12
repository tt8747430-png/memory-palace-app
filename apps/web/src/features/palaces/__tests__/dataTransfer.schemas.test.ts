import { describe, it, expect } from 'vitest';
import { exportDataSchemaV1, importInputSchema } from '../schemas/dataTransfer';

const validNode = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  title: 'Test Node',
  content: 'Some memory content',
  nodeType: 'text' as const,
  positionX: 100,
  positionY: 200,
  color: null,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const validRoom = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  title: 'Test Room',
  position: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  nodes: [validNode],
};

const validPalace = {
  id: '550e8400-e29b-41d4-a716-446655440003',
  title: 'Test Palace',
  description: 'A test palace',
  createdAt: '2024-01-01T00:00:00.000Z',
  rooms: [validRoom],
};

const validExport = {
  version: '1' as const,
  exportedAt: '2024-06-01T12:00:00.000Z',
  palaces: [validPalace],
};

describe('exportDataSchemaV1', () => {
  it('accepts a complete valid export payload', () => {
    const result = exportDataSchemaV1.safeParse(validExport);
    expect(result.success).toBe(true);
  });

  it('accepts empty palaces array', () => {
    const result = exportDataSchemaV1.safeParse({ ...validExport, palaces: [] });
    expect(result.success).toBe(true);
  });

  it('accepts a palace with empty rooms array', () => {
    const result = exportDataSchemaV1.safeParse({
      ...validExport,
      palaces: [{ ...validPalace, rooms: [] }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a room with empty nodes array', () => {
    const result = exportDataSchemaV1.safeParse({
      ...validExport,
      palaces: [{ ...validPalace, rooms: [{ ...validRoom, nodes: [] }] }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing version field', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { version: _, ...noVersion } = validExport;
    const result = exportDataSchemaV1.safeParse(noVersion);
    expect(result.success).toBe(false);
  });

  it('rejects an unknown version value', () => {
    const result = exportDataSchemaV1.safeParse({ ...validExport, version: '2' });
    expect(result.success).toBe(false);
  });

  it('rejects a palace with an empty title', () => {
    const result = exportDataSchemaV1.safeParse({
      ...validExport,
      palaces: [{ ...validPalace, title: '' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a palace title longer than 100 characters', () => {
    const result = exportDataSchemaV1.safeParse({
      ...validExport,
      palaces: [{ ...validPalace, title: 'a'.repeat(101) }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a palace with an invalid id (not a UUID)', () => {
    const result = exportDataSchemaV1.safeParse({
      ...validExport,
      palaces: [{ ...validPalace, id: 'not-a-uuid' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a palace with null description', () => {
    const result = exportDataSchemaV1.safeParse({
      ...validExport,
      palaces: [{ ...validPalace, description: null }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a node with an invalid nodeType', () => {
    const result = exportDataSchemaV1.safeParse({
      ...validExport,
      palaces: [
        {
          ...validPalace,
          rooms: [{ ...validRoom, nodes: [{ ...validNode, nodeType: 'video' }] }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid nodeType values', () => {
    for (const nodeType of ['text', 'image', 'link'] as const) {
      const result = exportDataSchemaV1.safeParse({
        ...validExport,
        palaces: [
          {
            ...validPalace,
            rooms: [{ ...validRoom, nodes: [{ ...validNode, nodeType }] }],
          },
        ],
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects a node with a non-finite positionX', () => {
    const result = exportDataSchemaV1.safeParse({
      ...validExport,
      palaces: [
        {
          ...validPalace,
          rooms: [{ ...validRoom, nodes: [{ ...validNode, positionX: Infinity }] }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a node with a non-finite positionY', () => {
    const result = exportDataSchemaV1.safeParse({
      ...validExport,
      palaces: [
        {
          ...validPalace,
          rooms: [{ ...validRoom, nodes: [{ ...validNode, positionY: NaN }] }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an exportedAt that is not a valid ISO datetime', () => {
    const result = exportDataSchemaV1.safeParse({ ...validExport, exportedAt: 'not-a-date' });
    expect(result.success).toBe(false);
  });

  it('rejects a room with a negative position', () => {
    const result = exportDataSchemaV1.safeParse({
      ...validExport,
      palaces: [{ ...validPalace, rooms: [{ ...validRoom, position: -1 }] }],
    });
    expect(result.success).toBe(false);
  });
});

describe('importInputSchema', () => {
  it('accepts a valid JSON string', () => {
    const result = importInputSchema.safeParse({ jsonContent: JSON.stringify(validExport) });
    expect(result.success).toBe(true);
  });

  it('rejects an empty string', () => {
    const result = importInputSchema.safeParse({ jsonContent: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('File content is required');
  });

  it('rejects a string that exceeds the 10 MB limit', () => {
    const oversized = 'x'.repeat(10 * 1024 * 1024 + 1);
    const result = importInputSchema.safeParse({ jsonContent: oversized });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toMatch(/10 MB or smaller/);
  });

  it('accepts a string exactly at the 10 MB boundary', () => {
    const boundary = 'x'.repeat(10 * 1024 * 1024);
    const result = importInputSchema.safeParse({ jsonContent: boundary });
    expect(result.success).toBe(true);
  });
});
