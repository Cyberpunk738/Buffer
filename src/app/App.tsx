import React, { useEffect } from 'react';
import { Toolbar } from '../components/toolbar/Toolbar';
import { Sidebar } from '../components/sidebar/Sidebar';
import { PreviewCanvas } from '../components/canvas/PreviewCanvas';
import { QuickEditPanel } from '../components/editor/QuickEditPanel';
import { NodeSearchModal } from '../components/editor/NodeSearchModal';
import { CommandPalette } from '../components/editor/CommandPalette';
import { ExportModal } from '../components/editor/ExportModal';
import { OnboardingBanner } from '../components/ui/OnboardingBanner';
import { MobileNoticeModal } from '../components/ui/MobileNoticeModal';
import { useEditorStore } from '../store/editor.store';
import { usePipelineStore } from '../store/pipeline.store';
import { useHistoryStore } from '../store/history.store';

export const App: React.FC = () => {
  const setCommandPaletteOpen = useEditorStore((state) => state.setCommandPaletteOpen);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useEditorStore((state) => state.setSelectedNodeId);

  const removeNode = usePipelineStore((state) => state.removeNode);

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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setCommandPaletteOpen,
    selectedNodeId,
    removeNode,
    setSelectedNodeId,
    undo,
    redo,
    pushSnapshot
  ]);

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none relative">
      {/* Mobile Notice Overlay for screen widths < 768px */}
      <MobileNoticeModal />

      {/* Onboarding Guide Banner */}
      <OnboardingBanner />

      {/* Header Toolbar */}
      <Toolbar />

      {/* Main Layout Grid */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Assets / Effects Sidebar */}
        <Sidebar />

        {/* Center: Full-Screen Interactive Image Canvas */}
        <div className="flex-1 h-full relative overflow-hidden bg-neutral-950">
          <PreviewCanvas />
        </div>

        {/* Right Side Panel: Sleek Image Adjustments & Effect Controls */}
        <QuickEditPanel />
      </div>

      {/* Global Modals */}
      <NodeSearchModal />
      <CommandPalette />
      <ExportModal />
    </div>
  );
};
