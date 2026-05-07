/** Matches /palaces/[palaceId] — palace detail page only (not room sub-pages). */
export const PALACE_PAGE_RE = /^\/palaces\/([^/]+)$/;
/** Matches /palaces/[palaceId]/rooms/[roomId] and any sub-paths. */
export const ROOM_ROUTE_RE = /^\/palaces\/[^/]+\/rooms\/[^/]+/;
