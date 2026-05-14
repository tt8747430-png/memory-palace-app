type CursorPayload = { createdAt: string; id: string };

export function encodeCursor(cursor: { createdAt: Date; id: string }): string {
  const payload: CursorPayload = { createdAt: cursor.createdAt.toISOString(), id: cursor.id };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function decodeCursor(encoded: string): { createdAt: Date; id: string } | null {
  try {
    const raw = Buffer.from(encoded, 'base64url').toString('utf-8');
    const payload: unknown = JSON.parse(raw);
    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof (payload as CursorPayload).createdAt !== 'string' ||
      typeof (payload as CursorPayload).id !== 'string'
    ) {
      return null;
    }
    const { createdAt, id } = payload as CursorPayload;
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return null;
    return { createdAt: date, id };
  } catch {
    return null;
  }
}
