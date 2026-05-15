'use client';

import { useEffect } from 'react';

export function StandaloneGestureGuard(): null {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    function preventDefault(event: Event): void {
      event.preventDefault();
    }

    document.addEventListener('gesturestart', preventDefault as EventListener);
    document.addEventListener('gesturechange', preventDefault as EventListener);
    document.addEventListener('gestureend', preventDefault as EventListener);

    return () => {
      document.removeEventListener('gesturestart', preventDefault as EventListener);
      document.removeEventListener('gesturechange', preventDefault as EventListener);
      document.removeEventListener('gestureend', preventDefault as EventListener);
    };
  }, []);

  return null;
}
