import React from 'react';
import { useEditorStore } from '../../store/editor.store';
import { useHistoryStore } from '../../store/history.store';
import { useProjectStore } from '../../store/project.store';
import { useResponsive } from '../../hooks/useResponsive';
import { 
  Undo2, 
  Redo2, 
  Plus, 
  Download, 
  Command, 
  Layers,
  PanelLeft
} from 'lucide-react';
import { clsx } from 'clsx';

export const Toolbar: React.FC = () => {
  const isSidebarOpen = useEditorStore((state) => state.isSidebarOpen);
  const toggleSidebar = useEditorStore((state) => state.toggleSidebar);
  const setNodeSearchOpen = useEditorStore((state) => state.setNodeSearchOpen);
  const setCommandPaletteOpen = useEditorStore((state) => state.setCommandPaletteOpen);
  const setExportModalOpen = useEditorStore((state) => state.setExportModalOpen);

  const { isMobile } = useResponsive();

  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const canUndo = useHistoryStore((state) => state.canUndo());
  const canRedo = useHistoryStore((state) => state.canRedo());

  const currentProject = useProjectStore((state) => state.currentProject);
  const setProjectName = useProjectStore((state) => state.setProjectName);

  return (
    <header className="h-12 w-full bg-neutral-900 border-b border-neutral-800 px-3 flex items-center justify-between shrink-0 select-none z-20 overflow-x-auto gap-2">
      {/* Brand & Sidebar Toggle */}
      <div className="flex items-center gap-3 shrink-0">
        {!isSidebarOpen && (
          <button
            onClick={toggleSidebar}
            title="Open Sidebar"
            className="p-1.5 hover:bg-neutral-800 text-neutral-300 rounded"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-900/40 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-wider text-neutral-100 font-mono">
            BUFFER
          </span>
        </div>

        <div className="h-4 w-[1px] bg-neutral-800 hidden sm:block" />

        <input
          type="text"
          value={currentProject.name}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-transparent hover:bg-neutral-800/60 focus:bg-neutral-950 px-2 py-1 rounded text-xs font-medium text-neutral-200 focus:outline-none focus:border focus:border-blue-500 transition-colors max-w-[140px] sm:max-w-[200px]"
        />
      </div>

      {/* Center Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setNodeSearchOpen(true)}
          className="h-8 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Effect</span>
        </button>

        <div className="h-4 w-[1px] bg-neutral-800 mx-0.5" />

        <button
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className={clsx(
            'p-1.5 rounded text-xs transition-colors',
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
            'p-1.5 rounded text-xs transition-colors',
            canRedo
              ? 'hover:bg-neutral-800 text-neutral-300'
              : 'text-neutral-600 cursor-not-allowed'
          )}
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {!isMobile && (
          <>
            <div className="h-4 w-[1px] bg-neutral-800 mx-0.5" />
            <button
              onClick={() => setCommandPaletteOpen(true)}
              title="Command Palette (Ctrl+K)"
              className="h-8 px-2 rounded bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Command className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-mono text-[10px] text-neutral-500 hidden md:inline">Ctrl+K</span>
            </button>
          </>
        )}
      </div>

      {/* Right Toolbar Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setExportModalOpen(true)}
          className="h-8 px-3.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Image</span>
        </button>
      </div>
    </header>
  );
};
