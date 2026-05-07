import { useRef, useCallback } from 'react';

/**
 * CanvasDragAnnouncer — screen reader live region for canvas drag operations.
 *
 * Renders a visually hidden `aria-live="polite"` region that announces drag
 * start/stop to screen readers. Text content is updated imperatively (via a
 * ref) to avoid React re-renders on every drag frame.
 *
 * Usage: mount inside `InnerCanvas` and spread the returned `dragHandlers`
 * onto the `onNodeDragStart` / `onNodeDragStop` callbacks.
 */
export function useCanvasDragAnnouncer() {
  const announcerRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string) => {
    if (announcerRef.current) {
      // Clear first to re-trigger the live region even for repeated announcements.
      announcerRef.current.textContent = '';
      // Use a microtask delay so the DOM mutation is visible to AT.
      requestAnimationFrame(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message;
        }
      });
    }
  }, []);

  return { announcerRef, announce };
}

interface CanvasDragAnnouncerProps {
  announcerRef: React.RefObject<HTMLDivElement | null>;
}

/** Invisible live region element — render once inside the canvas container. */
export function CanvasDragAnnouncer({ announcerRef }: CanvasDragAnnouncerProps) {
  return (
    <div
      ref={announcerRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      data-testid="canvas-drag-announcer"
    />
  );
}
