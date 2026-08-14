import React, { useEffect } from 'react';
import { Toolbar } from '../components/toolbar/Toolbar';
import { Sidebar } from '../components/sidebar/Sidebar';
import { PreviewCanvas } from '../components/canvas/PreviewCanvas';
import { GraphCanvas } from '../components/editor/GraphCanvas';
import { Inspector } from '../components/inspector/Inspector';
import { QuickEditPanel } from '../components/editor/QuickEditPanel';
import { NodeSearchModal } from '../components/editor/NodeSearchModal';
import { CommandPalette } from '../components/editor/CommandPalette';
import { ExportModal } from '../components/editor/ExportModal';
import { OnboardingBanner } from '../components/ui/OnboardingBanner';
import { useEditorStore } from '../store/editor.store';
import { usePipelineStore } from '../store/pipeline.store';
import { useHistoryStore } from '../store/history.store';

export const App: React.FC = () => {
  const viewMode = useEditorStore((state) => state.viewMode);
  const setCommandPaletteOpen = useEditorStore((state) => state.setCommandPaletteOpen);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useEditorStore((state) => state.setSelectedNodeId);

  const removeNode = usePipelineStore((state) => state.removeNode);
  const duplicateNode = usePipelineStore((state) => state.duplicateNode);

  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const pushSnapshot = useHistoryStore((state) => state.pushSnapshot);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Command Palette: Ctrl+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      // Delete Node
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault();
          pushSnapshot();
          removeNode(selectedNodeId);
          setSelectedNodeId(null);
        }
        return;
      }

      // Duplicate Node: Ctrl+D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedNodeId) {
          e.preventDefault();
          pushSnapshot();
          const newId = duplicateNode(selectedNodeId);
          if (newId) setSelectedNodeId(newId);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setCommandPaletteOpen,
    selectedNodeId,
    removeNode,
    duplicateNode,
    setSelectedNodeId,
    undo,
    redo,
    pushSnapshot
  ]);

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none">
      {/* Onboarding Guide Banner */}
      <OnboardingBanner />

      {/* Header Toolbar */}
      <Toolbar />

      {/* Main Layout Grid */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left Assets / Effects Sidebar */}
        <Sidebar />

        {/* Center Canvas & Node Graph Split View */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-950 relative">
          {viewMode === 'quick' ? (
            /* QUICK EDIT MODE: Canvas takes full center view */
            <div className="flex-1 h-full relative">
              <PreviewCanvas />
            </div>
          ) : (
            /* NODE GRAPH MODE: Split view (Top Canvas Preview, Bottom Node Graph) */
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="h-[40%] min-h-[180px] border-b border-neutral-800 relative">
                <PreviewCanvas />
              </div>
              <div className="flex-1 h-[60%] relative">
                <GraphCanvas />
              </div>
            </div>
          )}
        </div>

        {/* Right Side Panel: Quick Edit vs Node Inspector */}
        {viewMode === 'quick' ? <QuickEditPanel /> : <Inspector />}
      </div>

      {/* Global Modals */}
      <NodeSearchModal />
      <CommandPalette />
      <ExportModal />
    </div>
  );
};
