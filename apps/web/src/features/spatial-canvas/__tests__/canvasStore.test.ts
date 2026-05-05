import { describe, it, expect, beforeEach } from 'vitest';
import { createCanvasStore } from '../store/canvasStore';

describe('canvasStore', () => {
  let store: ReturnType<typeof createCanvasStore>;

  beforeEach(() => {
    store = createCanvasStore();
  });

  // ── Factory isolation ────────────────────────────────────────────────────

  it('creates independent instances — mutations on one do not affect another', () => {
    const storeA = createCanvasStore();
    const storeB = createCanvasStore();
    storeA.getState().setPosition('n1', 100, 200);
    expect(storeB.getState().positions['n1']).toBeUndefined();
  });

  // ── Initial state ─────────────────────────────────────────────────────────

  it('starts with empty positions', () => {
    expect(store.getState().positions).toEqual({});
  });

  it('starts with pointer as active tool', () => {
    expect(store.getState().activeTool).toBe('pointer');
  });

  it('starts with no selected nodes', () => {
    expect(store.getState().selectedNodeIds.size).toBe(0);
  });

  // ── setPosition ──────────────────────────────────────────────────────────

  it('setPosition stores the coordinate under the node id', () => {
    store.getState().setPosition('n1', 50, 75);
    const pos = store.getState().positions['n1'];
    expect(pos).toEqual({ x: 50, y: 75 });
  });

  it('setPosition updates an existing entry immutably', () => {
    store.getState().setPosition('n1', 50, 75);
    const before = store.getState().positions;
    store.getState().setPosition('n1', 99, 88);
    const after = store.getState().positions;
    expect(before).not.toBe(after); // new object reference
    expect(after['n1']).toEqual({ x: 99, y: 88 });
  });

  it('setPosition preserves unrelated positions', () => {
    store.getState().setPosition('n1', 10, 20);
    store.getState().setPosition('n2', 30, 40);
    store.getState().setPosition('n1', 99, 88);
    expect(store.getState().positions['n2']).toEqual({ x: 30, y: 40 });
  });

  it('setPosition accepts negative coordinates', () => {
    store.getState().setPosition('n1', -100, -200);
    expect(store.getState().positions['n1']).toEqual({ x: -100, y: -200 });
  });

  it('setPosition accepts fractional coordinates', () => {
    store.getState().setPosition('n1', 12.5, 33.75);
    expect(store.getState().positions['n1']).toEqual({ x: 12.5, y: 33.75 });
  });

  // ── hydratePositions ─────────────────────────────────────────────────────

  it('hydratePositions bulk-inserts all entries', () => {
    store.getState().hydratePositions([
      { id: 'n1', x: 10, y: 20 },
      { id: 'n2', x: 30, y: 40 },
    ]);
    expect(store.getState().positions).toEqual({
      n1: { x: 10, y: 20 },
      n2: { x: 30, y: 40 },
    });
  });

  it('hydratePositions replaces any previous positions', () => {
    store.getState().setPosition('old', 1, 2);
    store.getState().hydratePositions([{ id: 'n1', x: 5, y: 5 }]);
    expect(store.getState().positions['old']).toBeUndefined();
  });

  it('hydratePositions with empty array clears positions', () => {
    store.getState().setPosition('n1', 1, 2);
    store.getState().hydratePositions([]);
    expect(store.getState().positions).toEqual({});
  });

  // ── activeTool ───────────────────────────────────────────────────────────

  it('setActiveTool switches to pan', () => {
    store.getState().setActiveTool('pan');
    expect(store.getState().activeTool).toBe('pan');
  });

  it('setActiveTool switches back to pointer', () => {
    store.getState().setActiveTool('pan');
    store.getState().setActiveTool('pointer');
    expect(store.getState().activeTool).toBe('pointer');
  });

  // ── selectedNodeIds ──────────────────────────────────────────────────────

  it('setSelectedNodeIds stores the provided set', () => {
    store.getState().setSelectedNodeIds(new Set(['n1', 'n2']));
    expect(store.getState().selectedNodeIds).toEqual(new Set(['n1', 'n2']));
  });

  it('setSelectedNodeIds replaces the previous selection', () => {
    store.getState().setSelectedNodeIds(new Set(['n1']));
    store.getState().setSelectedNodeIds(new Set(['n2', 'n3']));
    expect(store.getState().selectedNodeIds.has('n1')).toBe(false);
    expect(store.getState().selectedNodeIds).toEqual(new Set(['n2', 'n3']));
  });

  it('setSelectedNodeIds accepts an empty set (deselect all)', () => {
    store.getState().setSelectedNodeIds(new Set(['n1']));
    store.getState().setSelectedNodeIds(new Set());
    expect(store.getState().selectedNodeIds.size).toBe(0);
  });
});
