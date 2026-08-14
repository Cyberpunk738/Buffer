import { create } from 'zustand';
import { AssetItem, ProjectData } from '../engine/core/types';

interface ProjectStoreState {
  currentProject: ProjectData;
  assets: AssetItem[];
  isSaving: boolean;
  lastSavedAt: number | null;

  // Actions
  setProjectName: (name: string) => void;
  addAsset: (asset: AssetItem) => void;
  removeAsset: (assetId: string) => void;
  setAssets: (assets: AssetItem[]) => void;
  setIsSaving: (isSaving: boolean) => void;
  setLastSavedAt: (time: number) => void;
}

const DEFAULT_PROJECT: ProjectData = {
  version: 1,
  id: 'project-default',
  name: 'Untitled Pipeline',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  nodes: [],
  edges: [],
  assets: [],
  settings: {}
};

export const useProjectStore = create<ProjectStoreState>((set) => ({
  currentProject: DEFAULT_PROJECT,
  assets: [],
  isSaving: false,
  lastSavedAt: null,

  setProjectName: (name) =>
    set((state) => ({
      currentProject: {
        ...state.currentProject,
        name,
        updatedAt: Date.now()
      }
    })),

  addAsset: (asset) =>
    set((state) => ({
      assets: [...state.assets, asset]
    })),

  removeAsset: (assetId) =>
    set((state) => ({
      assets: state.assets.filter((a) => a.id !== assetId)
    })),

  setAssets: (assets) => set({ assets }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setLastSavedAt: (time) => set({ lastSavedAt: time })
}));
