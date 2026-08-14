import { create } from 'zustand';

interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  showCheckerboard: boolean;
}

interface EditorStoreState {
  selectedNodeId: string | null;
  activeSidebarTab: 'nodes' | 'assets' | 'profiler';
  isInspectorOpen: boolean;
  isCommandPaletteOpen: boolean;
  isNodeSearchOpen: boolean;
  viewport: ViewportState;

  // Actions
  setSelectedNodeId: (id: string | null) => void;
  setActiveSidebarTab: (tab: 'nodes' | 'assets' | 'profiler') => void;
  toggleInspector: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setNodeSearchOpen: (open: boolean) => void;
  updateViewport: (updates: Partial<ViewportState>) => void;
  resetViewport: () => void;
}

const DEFAULT_VIEWPORT: ViewportState = {
  zoom: 1.0,
  panX: 0,
  panY: 0,
  showGrid: true,
  showCheckerboard: true,
};

export const useEditorStore = create<EditorStoreState>((set) => ({
  selectedNodeId: null,
  activeSidebarTab: 'nodes',
  isInspectorOpen: true,
  isCommandPaletteOpen: false,
  isNodeSearchOpen: false,
  viewport: DEFAULT_VIEWPORT,

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  toggleInspector: () => set((state) => ({ isInspectorOpen: !state.isInspectorOpen })),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setNodeSearchOpen: (open) => set({ isNodeSearchOpen: open }),
  updateViewport: (updates) =>
    set((state) => ({ viewport: { ...state.viewport, ...updates } })),
  resetViewport: () => set({ viewport: DEFAULT_VIEWPORT }),
}));
