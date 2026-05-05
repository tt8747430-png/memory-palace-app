import { describe, it, expect } from 'vitest';
import { createPalaceSchema, updatePalaceSchema } from '../schemas/palace';

describe('createPalaceSchema', () => {
  it('accepts a title-only input', () => {
    const result = createPalaceSchema.safeParse({ title: 'My Palace' });
    expect(result.success).toBe(true);
  });

  it('accepts title + description', () => {
    const result = createPalaceSchema.safeParse({
      title: 'My Palace',
      description: 'A place for memories.',
    });
    expect(result.success).toBe(true);
  });

  it('accepts description: undefined (optional)', () => {
    const result = createPalaceSchema.safeParse({ title: 'T' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.description).toBeUndefined();
  });

  it('rejects empty title', () => {
    const result = createPalaceSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Title is required');
  });

  it('rejects title longer than 100 characters', () => {
    const result = createPalaceSchema.safeParse({ title: 'a'.repeat(101) });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toMatch(/100 characters or less/);
  });

  it('accepts title exactly 100 characters', () => {
    const result = createPalaceSchema.safeParse({ title: 'a'.repeat(100) });
    expect(result.success).toBe(true);
  });

  it('rejects description longer than 500 characters', () => {
    const result = createPalaceSchema.safeParse({
      title: 'T',
      description: 'd'.repeat(501),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toMatch(/500 characters or less/);
  });

  it('accepts description exactly 500 characters', () => {
    const result = createPalaceSchema.safeParse({ title: 'T', description: 'd'.repeat(500) });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = createPalaceSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('updatePalaceSchema', () => {
  const validId = '123e4567-e89b-12d3-a456-426614174000';

  it('accepts id only (no-op patch)', () => {
    const result = updatePalaceSchema.safeParse({ id: validId });
    expect(result.success).toBe(true);
  });

  it('accepts id + title', () => {
    const result = updatePalaceSchema.safeParse({ id: validId, title: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('accepts id + null description (clears description)', () => {
    const result = updatePalaceSchema.safeParse({ id: validId, description: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.description).toBeNull();
  });

  it('rejects non-uuid id', () => {
    const result = updatePalaceSchema.safeParse({ id: 'not-a-uuid' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Invalid palace ID');
  });

  it('rejects missing id', () => {
    const result = updatePalaceSchema.safeParse({ title: 'Updated' });
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const result = updatePalaceSchema.safeParse({ id: validId, title: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Title cannot be empty');
  });

  it('rejects title longer than 100 characters', () => {
    const result = updatePalaceSchema.safeParse({ id: validId, title: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });
});
