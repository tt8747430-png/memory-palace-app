import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CanvasDragAnnouncer, useCanvasDragAnnouncer } from '../CanvasDragAnnouncer';

function AnnouncerHarness({ onReady }: { onReady: (announce: (msg: string) => void) => void }) {
  const { announcerRef, announce } = useCanvasDragAnnouncer();
  onReady(announce);
  return <CanvasDragAnnouncer announcerRef={announcerRef} />;
}

describe('CanvasDragAnnouncer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a visually hidden live region', () => {
    render(<CanvasDragAnnouncer announcerRef={{ current: null }} />);
    const region = screen.getByTestId('canvas-drag-announcer');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
    expect(region.className).toMatch(/sr-only/);
  });

  it('updates textContent on drag start announcement', async () => {
    let announceFn!: (msg: string) => void;
    render(
      <AnnouncerHarness
        onReady={(fn) => {
          announceFn = fn;
        }}
      />,
    );

    const region = screen.getByTestId('canvas-drag-announcer');

    await act(async () => {
      announceFn('Moving My Node');
      vi.runAllTimers();
    });

    expect(region.textContent).toBe('Moving My Node');
  });

  it('updates textContent on drag stop announcement', async () => {
    let announceFn!: (msg: string) => void;
    render(
      <AnnouncerHarness
        onReady={(fn) => {
          announceFn = fn;
        }}
      />,
    );

    const region = screen.getByTestId('canvas-drag-announcer');

    await act(async () => {
      announceFn('My Node placed');
      vi.runAllTimers();
    });

    expect(region.textContent).toBe('My Node placed');
  });
});
