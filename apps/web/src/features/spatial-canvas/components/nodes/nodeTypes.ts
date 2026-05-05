import { MemoryNode } from './MemoryNode';

/** Stable nodeTypes reference — defined at module scope so React Flow never
 * detects a new object reference and avoids unnecessary re-initialisation. */
export const nodeTypes = {
  memoryNode: MemoryNode,
} as const;
