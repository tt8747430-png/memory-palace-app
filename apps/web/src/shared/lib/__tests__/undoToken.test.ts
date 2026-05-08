import { describe, expect, it, vi } from 'vitest';
import { signUndoToken, verifyUndoToken } from '../undoToken';

describe('undoToken', () => {
  it('round-trips a valid token', () => {
    const token = signUndoToken({ kind: 'palace.delete', id: 'abc', userId: 'u1' });
    const payload = verifyUndoToken(token, 'palace.delete');
    expect(payload).not.toBeNull();
    expect(payload?.id).toBe('abc');
    expect(payload?.userId).toBe('u1');
  });

  it('rejects when kind does not match', () => {
    const token = signUndoToken({ kind: 'palace.delete', id: 'abc', userId: 'u1' });
    expect(verifyUndoToken(token, 'room.delete' as 'palace.delete')).toBeNull();
  });

  it('rejects after the TTL expires', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
      const token = signUndoToken({
        kind: 'palace.delete',
        id: 'abc',
        userId: 'u1',
        ttlMs: 1_000,
      });
      vi.setSystemTime(new Date('2025-01-01T00:00:02Z'));
      expect(verifyUndoToken(token, 'palace.delete')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects tampered payloads', () => {
    const token = signUndoToken({ kind: 'palace.delete', id: 'abc', userId: 'u1' });
    const [, sig] = token.split('.');
    const fakePayload = Buffer.from(
      JSON.stringify({
        kind: 'palace.delete',
        id: 'evil',
        userId: 'u1',
        exp: Date.now() + 30_000,
      }),
      'utf8',
    ).toString('base64url');
    expect(verifyUndoToken(`${fakePayload}.${sig}`, 'palace.delete')).toBeNull();
  });

  it('rejects malformed tokens', () => {
    expect(verifyUndoToken('', 'palace.delete')).toBeNull();
    expect(verifyUndoToken('nodelimiter', 'palace.delete')).toBeNull();
    expect(verifyUndoToken('.empty', 'palace.delete')).toBeNull();
  });
});
