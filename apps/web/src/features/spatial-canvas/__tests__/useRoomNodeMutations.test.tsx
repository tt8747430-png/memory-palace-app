import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { SelectNode } from '@memory-palace/db';
import { roomNodesQueryKey } from '../hooks/useNodesQuery';

const mockUpdateNodePosition = vi.fn();
const mockBatchUpdateNodePositions = vi.fn();
const mockUpdateNode = vi.fn();

vi.mock('@/features/nodes', () => ({
  updateNodePosition: (input: unknown) => mockUpdateNodePosition(input),
  batchUpdateNodePositions: (input: unknown) => mockBatchUpdateNodePositions(input),
  updateNode: (input: unknown) => mockUpdateNode(input),
}));

import { useRoomNodeMutations } from '../hooks/useRoomNodeMutations';

const ROOM_ID = '11111111-1111-1111-1111-111111111111';
const NODE_A = '22222222-2222-2222-2222-222222222222';
const NODE_B = '33333333-3333-3333-3333-333333333333';

function makeNode(id: string, x = 0, y = 0): SelectNode {
  return {
    id,
    userId: 'user-1',
    roomId: ROOM_ID,
    title: `Node ${id}`,
    content: null,
    nodeType: 'text',
    positionX: x,
    positionY: y,
    color: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
  } as SelectNode;
}

function setup(initial: SelectNode[]) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(roomNodesQueryKey(ROOM_ID), initial);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useRoomNodeMutations(ROOM_ID), { wrapper });
  return { client, result };
}

describe('useRoomNodeMutations', () => {
  beforeEach(() => {
    mockUpdateNodePosition.mockReset();
    mockBatchUpdateNodePositions.mockReset();
    mockUpdateNode.mockReset();
  });

  // ── Optimistic single-node position save ───────────────────────────────────

  it('savePosition optimistically updates the cache before the server responds', async () => {
    let resolveServer: (v: unknown) => void = () => {};
    mockUpdateNodePosition.mockImplementation(() => new Promise((res) => (resolveServer = res)));

    const { client, result } = setup([makeNode(NODE_A, 0, 0), makeNode(NODE_B, 100, 100)]);

    act(() => {
      result.current.savePosition.mutate({ id: NODE_A, positionX: 250, positionY: 400 });
    });

    // Cache reflects the optimistic value before the server has resolved.
    await waitFor(() => {
      const cache = client.getQueryData<SelectNode[]>(roomNodesQueryKey(ROOM_ID));
      expect(cache?.find((n) => n.id === NODE_A)).toMatchObject({
        positionX: 250,
        positionY: 400,
      });
    });
    // Other nodes are untouched.
    expect(
      client.getQueryData<SelectNode[]>(roomNodesQueryKey(ROOM_ID))?.find((n) => n.id === NODE_B),
    ).toMatchObject({ positionX: 100, positionY: 100 });

    resolveServer({ success: true, data: { id: NODE_A, positionX: 250, positionY: 400 } });
    await waitFor(() => expect(result.current.savePosition.isSuccess).toBe(true));
  });

  it('savePosition rolls back the cache on server failure', async () => {
    mockUpdateNodePosition.mockResolvedValue({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'boom' },
    });

    const { client, result } = setup([makeNode(NODE_A, 5, 5)]);

    act(() => {
      result.current.savePosition.mutate({ id: NODE_A, positionX: 999, positionY: 999 });
    });

    await waitFor(() => expect(result.current.savePosition.isError).toBe(true));
    const after = client.getQueryData<SelectNode[]>(roomNodesQueryKey(ROOM_ID));
    expect(after?.find((n) => n.id === NODE_A)).toMatchObject({ positionX: 5, positionY: 5 });
  });

  // ── Batch save (multi-select drag) ─────────────────────────────────────────

  it('saveBatchPositions applies all updates atomically on the optimistic cache', async () => {
    mockBatchUpdateNodePositions.mockResolvedValue({ success: true, data: { updatedCount: 2 } });
    const { client, result } = setup([makeNode(NODE_A, 0, 0), makeNode(NODE_B, 0, 0)]);

    act(() => {
      result.current.saveBatchPositions.mutate([
        { id: NODE_A, positionX: 10, positionY: 20 },
        { id: NODE_B, positionX: 30, positionY: 40 },
      ]);
    });

    await waitFor(() => expect(result.current.saveBatchPositions.isSuccess).toBe(true));
    const data = client.getQueryData<SelectNode[]>(roomNodesQueryKey(ROOM_ID));
    expect(data?.find((n) => n.id === NODE_A)).toMatchObject({ positionX: 10, positionY: 20 });
    expect(data?.find((n) => n.id === NODE_B)).toMatchObject({ positionX: 30, positionY: 40 });
  });

  it('saveBatchPositions rolls back ALL nodes when the server rejects', async () => {
    mockBatchUpdateNodePositions.mockResolvedValue({
      success: false,
      error: { code: 'NOT_FOUND', message: 'gone' },
    });
    const { client, result } = setup([makeNode(NODE_A, 1, 1), makeNode(NODE_B, 2, 2)]);

    act(() => {
      result.current.saveBatchPositions.mutate([
        { id: NODE_A, positionX: 99, positionY: 99 },
        { id: NODE_B, positionX: 88, positionY: 88 },
      ]);
    });

    await waitFor(() => expect(result.current.saveBatchPositions.isError).toBe(true));
    const data = client.getQueryData<SelectNode[]>(roomNodesQueryKey(ROOM_ID));
    expect(data?.find((n) => n.id === NODE_A)).toMatchObject({ positionX: 1, positionY: 1 });
    expect(data?.find((n) => n.id === NODE_B)).toMatchObject({ positionX: 2, positionY: 2 });
  });

  // ── Editor sheet patches ───────────────────────────────────────────────────

  it('patchNode optimistically merges the patch and rolls back on error', async () => {
    mockUpdateNode.mockResolvedValueOnce({
      success: true,
      data: { ...makeNode(NODE_A), title: 'New' },
    });
    const { client, result } = setup([makeNode(NODE_A)]);

    act(() => {
      result.current.patchNode.mutate({ id: NODE_A, title: 'New' });
    });

    await waitFor(() => {
      expect(
        client.getQueryData<SelectNode[]>(roomNodesQueryKey(ROOM_ID))?.find((n) => n.id === NODE_A)
          ?.title,
      ).toBe('New');
    });

    await waitFor(() => expect(result.current.patchNode.isSuccess).toBe(true));

    // Rollback path
    mockUpdateNode.mockResolvedValueOnce({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: 'nope' },
    });

    act(() => {
      result.current.patchNode.mutate({ id: NODE_A, title: 'Bad' });
    });
    await waitFor(() => expect(result.current.patchNode.isError).toBe(true));
    expect(
      client.getQueryData<SelectNode[]>(roomNodesQueryKey(ROOM_ID))?.find((n) => n.id === NODE_A)
        ?.title,
    ).toBe('New');
  });
});
