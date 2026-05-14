import { useRef, useCallback } from 'react';

export function useCanvasDragAnnouncer() {
  const announcerRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string) => {
    if (announcerRef.current) {
      announcerRef.current.textContent = '';

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
