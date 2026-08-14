import React from 'react';
import { useEditorStore } from '../../store/editor.store';
import { usePipelineStore } from '../../store/pipeline.store';
import { useHistoryStore } from '../../store/history.store';
import { useProjectStore } from '../../store/project.store';
import { 
  Undo2, 
  Redo2, 
  Plus, 
  Download, 
  Save, 
  Sliders, 
  Command, 
  Layers,
  Sparkles,
  GitBranch,
  Wand2
} from 'lucide-react';
import { clsx } from 'clsx';

export const Toolbar: React.FC = () => {
  const viewMode = useEditorStore((state) => state.viewMode);
  const setViewMode = useEditorStore((state) => state.setViewMode);
  const isInspectorOpen = useEditorStore((state) => state.isInspectorOpen);
  const toggleInspector = useEditorStore((state) => state.toggleInspector);
  const setNodeSearchOpen = useEditorStore((state) => state.setNodeSearchOpen);
  const setCommandPaletteOpen = useEditorStore((state) => state.setCommandPaletteOpen);
  const setExportModalOpen = useEditorStore((state) => state.setExportModalOpen);

  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const canUndo = useHistoryStore((state) => state.canUndo());
  const canRedo = useHistoryStore((state) => state.canRedo());

  const currentProject = useProjectStore((state) => state.currentProject);
  const setProjectName = useProjectStore((state) => state.setProjectName);

  return (
    <header className="h-12 w-full bg-neutral-900 border-b border-neutral-800 px-4 flex items-center justify-between shrink-0 select-none z-20">
      {/* Brand & Mode Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-900/40">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-wider text-neutral-100 font-mono">
            BUFFER
          </span>
        </div>

        <div className="h-4 w-[1px] bg-neutral-800" />

        {/* View Mode Toggle: Quick Edit vs Node Graph */}
        <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800">
          <button
            onClick={() => setViewMode('quick')}
            className={clsx(
              'px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all',
              viewMode === 'quick'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            )}
          >
            <Wand2 className="w-3.5 h-3.5" />
            Quick Edit
          </button>

          <button
            onClick={() => setViewMode('graph')}
            className={clsx(
              'px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all',
              viewMode === 'graph'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            )}
          >
            <GitBranch className="w-3.5 h-3.5" />
            Node Graph
          </button>
        </div>
      </div>

      {/* Center Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setNodeSearchOpen(true)}
          className="h-8 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Effect
        </button>

        <div className="h-4 w-[1px] bg-neutral-800 mx-1" />

        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={clsx(
            'p-2 rounded text-xs transition-colors',
            canUndo
              ? 'hover:bg-neutral-800 text-neutral-300'
              : 'text-neutral-600 cursor-not-allowed'
          )}
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          className={clsx(
            'p-2 rounded text-xs transition-colors',
            canRedo
              ? 'hover:bg-neutral-800 text-neutral-300'
              : 'text-neutral-600 cursor-not-allowed'
          )}
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-neutral-800 mx-1" />

        <button
          onClick={() => setCommandPaletteOpen(true)}
          title="Command Palette (Ctrl+K)"
          className="h-8 px-2.5 rounded bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-xs font-medium flex items-center gap-2 transition-colors"
        >
          <Command className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-mono text-[10px] text-neutral-500">Ctrl+K</span>
        </button>
      </div>

      {/* Right Toolbar Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExportModalOpen(true)}
          className="h-8 px-3.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export Image
        </button>

        {viewMode === 'graph' && (
          <>
            <div className="h-4 w-[1px] bg-neutral-800 mx-1" />
            <button
              onClick={toggleInspector}
              title="Toggle Inspector"
              className={clsx(
                'p-2 rounded text-xs transition-colors',
                isInspectorOpen
                  ? 'bg-blue-950 text-blue-400 border border-blue-800/40'
                  : 'hover:bg-neutral-800 text-neutral-400'
              )}
            >
              <Sliders className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
};
