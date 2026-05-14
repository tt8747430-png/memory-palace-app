'use client';

import { useReactFlow } from '@xyflow/react';
import { useCanvasStore } from '@/features/spatial-canvas';
import { useRoomNodeMutations } from './useRoomNodeMutations';
import { getCanvasCenterFlowPos, snapPosition } from '../lib/canvasUtils';

export function useCanvasToolActions(roomId: string) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const snapEnabled = useCanvasStore((s) => s.snapEnabled);
  const toggleSnap = useCanvasStore((s) => s.toggleSnap);
  const { addNode } = useRoomNodeMutations(roomId);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const handleAddNode = () => {
    const position = getCanvasCenterFlowPos(screenToFlowPosition);
    addNode.mutate({
      roomId,
      title: 'New Node',
      nodeType: 'text',
      positionX: snapPosition(position.x, 20, snapEnabled),
      positionY: snapPosition(position.y, 20, snapEnabled),
    });
  };

  return { activeTool, setActiveTool, snapEnabled, toggleSnap, addNode, handleAddNode, fitView };
}
