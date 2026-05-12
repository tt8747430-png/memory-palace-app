import { createHmac, timingSafeEqual } from 'node:crypto';

const DEFAULT_TTL_MS = 30_000;

interface UndoPayload<TKind extends string> {
  kind: TKind;

  id: string;

  userId: string;

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
