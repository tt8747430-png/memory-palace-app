import { describe, it, expect } from 'vitest';
import { encodeCursor, decodeCursor } from '../cursor';

describe('cursor encode/decode', () => {
  const sample = { createdAt: new Date('2025-01-01T00:00:00.000Z'), id: 'abc-123' };

  it('round-trips correctly', () => {
    const encoded = encodeCursor(sample);
    const decoded = decodeCursor(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.id).toBe(sample.id);
    expect(decoded!.createdAt.toISOString()).toBe(sample.createdAt.toISOString());
  });

  it('produces a base64url string (no +, /, = chars)', () => {
    const encoded = encodeCursor(sample);
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('returns null for empty string', () => {
    expect(decodeCursor('')).toBeNull();
  });

  it('returns null for random garbage', () => {
    expect(decodeCursor('not-valid-base64url-json!!!')).toBeNull();
  });

  it('returns null for valid base64url that is not JSON', () => {
    const notJson = Buffer.from('hello world').toString('base64url');
    expect(decodeCursor(notJson)).toBeNull();
  });

  it('returns null for JSON missing the id field', () => {
    const bad = Buffer.from(JSON.stringify({ createdAt: '2025-01-01T00:00:00.000Z' })).toString(
      'base64url',
    );
    expect(decodeCursor(bad)).toBeNull();
  });

  it('returns null for JSON missing the createdAt field', () => {
    const bad = Buffer.from(JSON.stringify({ id: 'abc' })).toString('base64url');
    expect(decodeCursor(bad)).toBeNull();
  });

  it('returns null when createdAt is an invalid date string', () => {
    const bad = Buffer.from(JSON.stringify({ createdAt: 'not-a-date', id: 'abc' })).toString(
      'base64url',
    );
    expect(decodeCursor(bad)).toBeNull();
  });

  it('two different cursors produce distinct encoded strings', () => {
    const a = encodeCursor({ createdAt: new Date('2025-01-01T00:00:00.000Z'), id: 'id-a' });
    const b = encodeCursor({ createdAt: new Date('2025-01-02T00:00:00.000Z'), id: 'id-b' });
    expect(a).not.toBe(b);
  });
});
