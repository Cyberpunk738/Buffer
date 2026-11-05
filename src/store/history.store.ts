import { create } from "zustand";
import { Node, Edge } from "@xyflow/react";
import { AssetItem, NodeStateData } from "../engine/core/types";
import { usePipelineStore } from "./pipeline.store";
import { useProjectStore } from "./project.store";

interface HistorySnapshot {
  assets: AssetItem[];
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
      assets: [...useProjectStore.getState().assets],
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    };

    set((state) => {
      const past = [...state.past, snapshot];
      if (past.length > MAX_HISTORY_STEPS) {
        past.shift();
      }
      return {
        past,
        future: [], // Clear redo stack on new change
      };
    });
  },

  undo: () => {
    const { past } = get();
    if (past.length === 0) return;

    const currentSnapshot: HistorySnapshot = {
      assets: [...useProjectStore.getState().assets],
      nodes: JSON.parse(JSON.stringify(usePipelineStore.getState().nodes)),
      edges: JSON.parse(JSON.stringify(usePipelineStore.getState().edges)),
    };

    const previousSnapshot = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    set((state) => ({
      isTracking: true,
      past: newPast,
      future: [currentSnapshot, ...state.future],
    }));

    useProjectStore.getState().setAssets(previousSnapshot.assets);
    usePipelineStore
      .getState()
      .setGraph(previousSnapshot.nodes, previousSnapshot.edges);
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return;

    const currentSnapshot: HistorySnapshot = {
      assets: [...useProjectStore.getState().assets],
      nodes: JSON.parse(JSON.stringify(usePipelineStore.getState().nodes)),
      edges: JSON.parse(JSON.stringify(usePipelineStore.getState().edges)),
    };

    const nextSnapshot = future[0];
    const newFuture = future.slice(1);

    set((state) => ({
      isTracking: true,
      past: [...state.past, currentSnapshot],
      future: newFuture,
    }));

    useProjectStore.getState().setAssets(nextSnapshot.assets);
    usePipelineStore
      .getState()
      .setGraph(nextSnapshot.nodes, nextSnapshot.edges);
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
  clearHistory: () => set({ past: [], future: [] }),
}));
