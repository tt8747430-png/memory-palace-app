'use client';

import { useEffect, useRef, type RefObject } from 'react';

interface UseRevealOptions {
  rootMargin?: string;

  threshold?: number;

  once?: boolean;
}

export function useReveal<T extends HTMLElement = HTMLElement>(
  options: UseRevealOptions = {},
): RefObject<T | null> {
  const { rootMargin = '0px 0px -10% 0px', threshold = 0.1, once = true } = options;
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      node.setAttribute('data-revealed', 'true');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).setAttribute('data-revealed', 'true');
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            (entry.target as HTMLElement).removeAttribute('data-revealed');
          }
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return ref;
}
