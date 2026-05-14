/**
 * Context-aware primary action for the mobile FAB.
 *
 * - Inside a room        → New Memory
 * - Inside a palace      → New Room
 * - Anywhere else        → New Palace
 *
 * Returns a label and an `?action=...` URL the caller can route to. The
 * dialog mounting strategy (URL params, not global shortcuts) is
 * documented at /memories/repo/global-shortcuts-dialog-pattern.md.
 */
export function useFABAction(pathname: string): { label: string; href: string } {
  if (pathname.startsWith('/palaces/') && pathname.includes('/rooms/')) {
    return { label: 'New Memory', href: `${pathname}?action=new-memory` };
  }
  if (pathname.startsWith('/palaces/') && !pathname.includes('/rooms')) {
    return { label: 'New Room', href: `${pathname}?action=new-room` };
  }
  return { label: 'New Palace', href: '/palaces?action=new' };
}
