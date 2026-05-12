import type { XYPosition } from '@xyflow/react';

export function getCanvasCenterFlowPos(
  screenToFlowPosition: (point: XYPosition) => XYPosition,
): XYPosition {
  return screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
}

export function snapPosition(value: number, gridSize: number, enabled: boolean): number {
  return enabled ? Math.round(value / gridSize) * gridSize : Math.round(value);
}
