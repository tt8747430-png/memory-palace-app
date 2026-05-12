'use client';

import { useEffect } from 'react';

/**
 * Disables iOS Safari browser gestures that leak into installed PWAs:
 *
 * - Edge-swipe-back / forward (touchstart within 20px of either screen edge)
 * - Pinch-zoom (`gesturestart` / `gesturechange` / `gestureend` — these are
 *   non-standard webkit events that the viewport `maximumScale: 1` does NOT
 *   reliably block in iOS 16+).
 * - Double-tap zoom (already handled in CSS via `touch-action: pan-x pan-y`).
 *
 * Only activates when the page is launched in standalone display mode,
 * so users browsing in a normal tab get standard browser behavior.
 */
export function StandaloneGestureGuard(): null {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(display-mode: standalone)');
    // Safari also exposes a legacy `navigator.standalone` flag for home-screen PWAs.
    const isStandalone =
      mql.matches ||
      (typeof navigator !== 'undefined' &&
        (navigator as Navigator & { standalone?: boolean }).standalone === true);
    if (!isStandalone) return;

    const EDGE_PX = 20;

    function onTouchStart(event: TouchEvent): void {
      // Only block when the gesture would originate from the screen edge.
      // Use the first touch point; multi-touch lands here too for pinch.
      const touch = event.touches[0];
      if (!touch) return;
      const { clientX } = touch;
      const width = window.innerWidth;
      if (clientX < EDGE_PX || clientX > width - EDGE_PX) {
        event.preventDefault();
      }
    }

    function preventDefault(event: Event): void {
      event.preventDefault();
    }

    // `passive: false` is required on iOS Safari for `preventDefault()` to actually work.
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    // Block pinch-zoom — these are webkit-only events.
    document.addEventListener('gesturestart', preventDefault as EventListener);
    document.addEventListener('gesturechange', preventDefault as EventListener);
    document.addEventListener('gestureend', preventDefault as EventListener);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('gesturestart', preventDefault as EventListener);
      document.removeEventListener('gesturechange', preventDefault as EventListener);
      document.removeEventListener('gestureend', preventDefault as EventListener);
    };
  }, []);

  return null;
}
