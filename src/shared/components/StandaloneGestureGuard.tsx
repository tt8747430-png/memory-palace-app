'use client';

import { useEffect } from 'react';

export function StandaloneGestureGuard(): null {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    function preventDefault(event: Event): void {
      event.preventDefault();
    }

    function suppressContextMenu(event: MouseEvent): void {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"], [data-allow-context-menu]'))
        return;
      event.preventDefault();
    }

    document.addEventListener('gesturestart', preventDefault as EventListener);
    document.addEventListener('gesturechange', preventDefault as EventListener);
    document.addEventListener('gestureend', preventDefault as EventListener);
    document.addEventListener('contextmenu', suppressContextMenu);

    return () => {
      document.removeEventListener('gesturestart', preventDefault as EventListener);
      document.removeEventListener('gesturechange', preventDefault as EventListener);
      document.removeEventListener('gestureend', preventDefault as EventListener);
      document.removeEventListener('contextmenu', suppressContextMenu);
    };
  }, []);

  return null;
}
