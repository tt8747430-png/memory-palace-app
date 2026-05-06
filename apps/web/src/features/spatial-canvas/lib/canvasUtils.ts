import type { XYPosition } from '@xyflow/react';

/**
 * Returns the visual centre of the browser viewport in React Flow flow
 * coordinates. Used by CanvasToolbar and CanvasFab to place new nodes at the
 * centre of whatever the user currently sees.
 *
 * Uses window.innerWidth/innerHeight rather than querying the canvas container
 * element: screenToFlowPosition from useReactFlow() accepts window-space screen
 * coordinates, so the window centre is the correct and minimal origin. No DOM
 * query, no test-attribute coupling, no magic number fallbacks.
 */
export function getCanvasCenterFlowPos(
  screenToFlowPosition: (point: XYPosition) => XYPosition,
): XYPosition {
  return screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
}
