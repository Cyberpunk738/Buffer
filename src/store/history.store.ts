import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';
import { NodeStateData } from '../engine/core/types';
import { usePipelineStore } from './pipeline.store';

interface HistorySnapshot {
  nodes: Node<NodeStateData>[];
  edges: Edge[];
}

interface HistoryStoreState {
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  isTracking: boolean;

  pushSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

const MAX_HISTORY_STEPS = 50;

export const useHistoryStore = create<HistoryStoreState>((set, get) => ({
  past: [],
  future: [],
  isTracking: true,

  pushSnapshot: () => {
    if (!get().isTracking) return;

    const { nodes, edges } = usePipelineStore.getState();
    const snapshot: HistorySnapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges))
    };

    set((state) => {
      const past = [...state.past, snapshot];
      if (past.length > MAX_HISTORY_STEPS) {
        past.shift();
      }
      return {
        past,
        future: [] // Clear redo stack on new change
      };
    });
  },

  undo: () => {
    const { past } = get();
    if (past.length === 0) return;

    const currentSnapshot: HistorySnapshot = {
      nodes: JSON.parse(JSON.stringify(usePipelineStore.getState().nodes)),
      edges: JSON.parse(JSON.stringify(usePipelineStore.getState().edges))
    };

    const previousSnapshot = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    set((state) => ({
      isTracking: false,
      past: newPast,
      future: [currentSnapshot, ...state.future]
    }));

    usePipelineStore.getState().setGraph(previousSnapshot.nodes, previousSnapshot.edges);

    setTimeout(() => {
      set({ isTracking: true });
    }, 50);
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return;

    const currentSnapshot: HistorySnapshot = {
      nodes: JSON.parse(JSON.stringify(usePipelineStore.getState().nodes)),
      edges: JSON.parse(JSON.stringify(usePipelineStore.getState().edges))
    };

    const nextSnapshot = future[0];
    const newFuture = future.slice(1);

    set((state) => ({
      isTracking: false,
      past: [...state.past, currentSnapshot],
      future: newFuture
    }));

    usePipelineStore.getState().setGraph(nextSnapshot.nodes, nextSnapshot.edges);

    setTimeout(() => {
      set({ isTracking: true });
    }, 50);
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
  clearHistory: () => set({ past: [], future: [] })
}));
