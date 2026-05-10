'use client';

import { useEffect, useRef } from 'react';

/**
 * Subtle canvas-rendered starfield. 200 sub-pixel stars with random
 * twinkle (opacity drift) and slow downward drift; when a star scrolls
 * off the bottom, it re-spawns at the top. Layers cleanly under the
 * existing aurora/nebula orbs in `<CinematicBackground />`.
 *
 * Mounts as `pointer-events: none` and `aria-hidden`. Honours
 * `prefers-reduced-motion` by skipping the animation loop entirely
 * (stars render once and stay static).
 */
export function Starfield({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const STAR_COUNT = 200;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 1.2 + 0.2,
      opacity: Math.random(),
      speed: Math.random() * 0.5 + 0.1,
    }));

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        if (!reduced) {
          s.opacity += (Math.random() - 0.5) * 0.02;
          s.opacity = Math.max(0.1, Math.min(1, s.opacity));
          s.y += s.speed * 0.1;
          if (s.y > h) {
            s.y = 0;
            s.x = Math.random() * w;
          }
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.fill();
      }
    };

    let raf = 0;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    if (reduced) {
      draw();
    } else {
      loop();
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className ?? 'pointer-events-none absolute inset-0 h-full w-full opacity-40'}
    />
  );
}
