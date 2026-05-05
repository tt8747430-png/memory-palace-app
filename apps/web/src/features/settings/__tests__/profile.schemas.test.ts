import { describe, it, expect } from 'vitest';
import { updateProfileSchema } from '../schemas/profile';

describe('updateProfileSchema', () => {
  it('accepts a valid display name', () => {
    const result = updateProfileSchema.safeParse({ displayName: 'Alice' });
    expect(result.success).toBe(true);
  });

  it('trims whitespace from display name', () => {
    const result = updateProfileSchema.safeParse({ displayName: '  Alice  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.displayName).toBe('Alice');
  });

  it('rejects empty display name', () => {
    const result = updateProfileSchema.safeParse({ displayName: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe('Display name is required');
  });

  it('rejects display name longer than 60 characters', () => {
    const result = updateProfileSchema.safeParse({ displayName: 'a'.repeat(61) });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toMatch(/60 characters or less/);
  });

  it('accepts exactly 60 character display name', () => {
    const result = updateProfileSchema.safeParse({ displayName: 'a'.repeat(60) });
    expect(result.success).toBe(true);
  });

  it('accepts a valid avatar URL', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'Alice',
      avatarUrl: 'https://example.com/avatar.png',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid avatar URL', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'Alice',
      avatarUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0]?.message).toBe('Avatar URL must be a valid URL');
  });

  it('accepts empty string for avatar URL (clears it)', () => {
    const result = updateProfileSchema.safeParse({ displayName: 'Alice', avatarUrl: '' });
    expect(result.success).toBe(true);
  });

  it('accepts omitted avatar URL', () => {
    const result = updateProfileSchema.safeParse({ displayName: 'Alice' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.avatarUrl).toBeUndefined();
  });
});
