import type { XYPosition } from '@xyflow/react';

/**
 * Converts the canvas container's centre point from screen space to React Flow
 * flow coordinates. Used by CanvasToolbar and CanvasFab to place new nodes at
 * the visual centre of the viewport rather than at (0, 0).
 */
export function getCanvasCenterFlowPos(
  screenToFlowPosition: (point: XYPosition) => XYPosition,
): XYPosition {
  const rect = document.querySelector('[data-testid="canvas-container"]')?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : 400;
  const y = rect ? rect.top + rect.height / 2 : 300;
  return screenToFlowPosition({ x, y });
}
