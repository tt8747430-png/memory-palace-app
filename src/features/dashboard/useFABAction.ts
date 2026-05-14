export function useFABAction(pathname: string): { label: string; href: string } {
  if (pathname.startsWith('/palaces/') && pathname.includes('/rooms/')) {
    return { label: 'New Memory', href: `${pathname}?action=new-memory` };
  }
  if (pathname.startsWith('/palaces/') && !pathname.includes('/rooms')) {
    return { label: 'New Room', href: `${pathname}?action=new-room` };
  }
  return { label: 'New Palace', href: '/palaces?action=new' };
}
