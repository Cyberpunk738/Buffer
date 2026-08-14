import React, { useEffect } from 'react';
import { Toolbar } from '../components/toolbar/Toolbar';
import { Sidebar } from '../components/sidebar/Sidebar';
import { PreviewCanvas } from '../components/canvas/PreviewCanvas';
import { GraphCanvas } from '../components/editor/GraphCanvas';
import { Inspector } from '../components/inspector/Inspector';
import { NodeSearchModal } from '../components/editor/NodeSearchModal';
import { CommandPalette } from '../components/editor/CommandPalette';
import { useEditorStore } from '../store/editor.store';
import { usePipelineStore } from '../store/pipeline.store';
import { useHistoryStore } from '../store/history.store';

export const App: React.FC = () => {
  const setCommandPaletteOpen = useEditorStore((state) => state.setCommandPaletteOpen);
  const setNodeSearchOpen = useEditorStore((state) => state.setNodeSearchOpen);
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
      // Ignore if user is typing inside an input or textarea
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

      // Command Palette: Ctrl+K or Cmd+K
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

      // Delete Node: Delete key
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
      {/* Top Application Header / Toolbar */}
      <Toolbar />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left Assets / Nodes Sidebar */}
        <Sidebar />

        {/* Center Split View (Top Canvas Preview, Bottom Node Graph) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-950">
          {/* Top Half: Interactive Preview Canvas (40% height) */}
          <div className="h-[40%] min-h-[180px] border-b border-neutral-800 relative">
            <PreviewCanvas />
          </div>

          {/* Bottom Half: React Flow Node Graph (60% height) */}
          <div className="flex-1 h-[60%] relative">
            <GraphCanvas />
          </div>
        </div>

        {/* Right Inspector Panel */}
        <Inspector />
      </div>

      {/* Modals & Dialogs */}
      <NodeSearchModal />
      <CommandPalette />
    </div>
  );
};
