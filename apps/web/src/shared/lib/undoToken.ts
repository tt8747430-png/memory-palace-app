import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * HMAC-signed short-lived tokens for soft-delete undo flows.
 *
 * - Format: `<base64url(payloadJson)>.<base64url(signature)>`
 * - Signature: HMAC-SHA256 over the payload using `UNDO_TOKEN_SECRET`
 *   (falls back to the Supabase publishable key — the secret never leaves
 *   the server, but rotating either key invalidates outstanding tokens,
 *   which is fine for a 30-second TTL).
 * - TTL is encoded inside the payload (`exp`), not in the signature, so we
 *   can verify and reject expired tokens without server-side storage.
 *
 * This is intentionally **not** a JWT library — we don't need full JWS
 * tooling for a 30-second client-held nonce.
 */

const DEFAULT_TTL_MS = 30_000;

interface UndoPayload<TKind extends string> {
  kind: TKind;
  /** Resource identifier (e.g. palace id). */
  id: string;
  /** Owner user id (verified against the request user on restore). */
  userId: string;
  /** Expiry — wall-clock ms since epoch. */
  exp: number;
}

function getSecret(): string {
  return (
    process.env.UNDO_TOKEN_SECRET ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    'memory-palace-dev-undo-secret'
  );
}

function b64encode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function b64decode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function signUndoToken<TKind extends string>(args: {
  kind: TKind;
  id: string;
  userId: string;
  ttlMs?: number;
}): string {
  const payload: UndoPayload<TKind> = {
    kind: args.kind,
    id: args.id,
    userId: args.userId,
    exp: Date.now() + (args.ttlMs ?? DEFAULT_TTL_MS),
  };
  const encoded = b64encode(JSON.stringify(payload));
  const signature = sign(encoded, getSecret());
  return `${encoded}.${signature}`;
}

/**
 * Returns the decoded payload when the token is valid (signature matches and
 * `exp` is in the future), `null` otherwise. Constant-time signature compare.
 */
export function verifyUndoToken<TKind extends string>(
  token: string,
  expectedKind: TKind,
): UndoPayload<TKind> | null {
  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) return null;
  const encoded = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expectedSig = sign(encoded, getSecret());
  const a = Buffer.from(signature, 'base64url');
  const b = Buffer.from(expectedSig, 'base64url');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: UndoPayload<TKind>;
  try {
    payload = JSON.parse(b64decode(encoded)) as UndoPayload<TKind>;
  } catch {
    return null;
  }
  if (payload.kind !== expectedKind) return null;
  if (typeof payload.exp !== 'number' || payload.exp <= Date.now()) return null;
  return payload;
}
