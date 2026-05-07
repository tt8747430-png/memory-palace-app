/** Matches /palaces/[palaceId] — palace detail page only (not room sub-pages). */
export const PALACE_PAGE_RE = /^\/palaces\/([^/]+)$/;
/** Matches /palaces/[palaceId]/rooms/[roomId] and any sub-paths. */
export const ROOM_ROUTE_RE = /^\/palaces\/[^/]+\/rooms\/[^/]+/;

export function isOnRoomPage(pathname: string): boolean {
  return ROOM_ROUTE_RE.test(pathname);
}

export function palaceIdFromPath(pathname: string): string | null {
  return PALACE_PAGE_RE.exec(pathname)?.[1] ?? null;
}
