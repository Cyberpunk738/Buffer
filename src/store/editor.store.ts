import { create } from 'zustand';

export type ViewMode = 'quick' | 'graph';
export type BeforeAfterMode = 'after' | 'before';

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
  isSidebarOpen: boolean;
  isInspectorOpen: boolean;
  isCommandPaletteOpen: boolean;
  isNodeSearchOpen: boolean;
  isExportModalOpen: boolean;
  isCropEditing: boolean;
  viewMode: ViewMode;
  beforeAfterMode: BeforeAfterMode;
  isOnboardingDismissed: boolean;
  viewport: ViewportState;

  // Actions
  setSelectedNodeId: (id: string | null) => void;
  setActiveSidebarTab: (tab: 'nodes' | 'assets' | 'profiler') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleInspector: () => void;
  setInspectorOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setNodeSearchOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
  setCropEditing: (editing: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setBeforeAfterMode: (mode: BeforeAfterMode) => void;
  setOnboardingDismissed: (dismissed: boolean) => void;
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
  isSidebarOpen: true,
  isInspectorOpen: true,
  isCommandPaletteOpen: false,
  isNodeSearchOpen: false,
  isExportModalOpen: false,
  isCropEditing: false,
  viewMode: 'quick',
  beforeAfterMode: 'after',
  isOnboardingDismissed: localStorage.getItem('buffer_onboarding_dismissed') === 'true',
  viewport: DEFAULT_VIEWPORT,

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleInspector: () => set((state) => ({ isInspectorOpen: !state.isInspectorOpen })),
  setInspectorOpen: (open) => set({ isInspectorOpen: open }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setNodeSearchOpen: (open) => set({ isNodeSearchOpen: open }),
  setExportModalOpen: (open) => set({ isExportModalOpen: open }),
  setCropEditing: (editing) => set({ isCropEditing: editing }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setBeforeAfterMode: (mode) => set({ beforeAfterMode: mode }),
  setOnboardingDismissed: (dismissed) => {
    localStorage.setItem('buffer_onboarding_dismissed', String(dismissed));
    set({ isOnboardingDismissed: dismissed });
  },
  updateViewport: (updates) =>
    set((state) => ({ viewport: { ...state.viewport, ...updates } })),
  resetViewport: () => set({ viewport: DEFAULT_VIEWPORT }),
}));
