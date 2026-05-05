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
    storeA.getState().setActiveTool('pan');
    expect(storeB.getState().activeTool).toBe('pointer');
  });

  // ── Initial state ─────────────────────────────────────────────────────────

  it('starts with pointer as active tool', () => {
    expect(store.getState().activeTool).toBe('pointer');
  });

  it('starts with no selected nodes', () => {
    expect(store.getState().selectedNodeIds.size).toBe(0);
  });

  it('starts with no editing node', () => {
    expect(store.getState().editingNodeId).toBeNull();
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

  // ── editingNodeId ────────────────────────────────────────────────────────

  it('setEditingNodeId stores the given id', () => {
    store.getState().setEditingNodeId('node-abc');
    expect(store.getState().editingNodeId).toBe('node-abc');
  });

  it('setEditingNodeId clears the id when passed null', () => {
    store.getState().setEditingNodeId('node-abc');
    store.getState().setEditingNodeId(null);
    expect(store.getState().editingNodeId).toBeNull();
  });
});
