'use client';

import { useEffect } from 'react';

export function StandaloneGestureGuard(): null {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(display-mode: standalone)');
    const isStandalone =
      mql.matches ||
      (typeof navigator !== 'undefined' &&
        (navigator as Navigator & { standalone?: boolean }).standalone === true);
    if (!isStandalone) return;

    const EDGE_PX = 20;

    function onTouchStart(event: TouchEvent): void {
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
