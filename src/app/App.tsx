import React, { useEffect, useState } from "react";
import { LandingPage } from "../components/landing/LandingPage";
import { createSampleAsset } from "../lib/image-file";
import { useProjectStore } from "../store/project.store";
import { Toolbar } from "../components/toolbar/Toolbar";
import { Sidebar } from "../components/sidebar/Sidebar";
import { PreviewCanvas } from "../components/canvas/PreviewCanvas";
import { QuickEditPanel } from "../components/editor/QuickEditPanel";
import { NodeSearchModal } from "../components/editor/NodeSearchModal";
import { CommandPalette } from "../components/editor/CommandPalette";
import { ExportModal } from "../components/editor/ExportModal";
import { OnboardingBanner } from "../components/ui/OnboardingBanner";
import { useEditorStore } from "../store/editor.store";
import { usePipelineStore } from "../store/pipeline.store";
import { useHistoryStore } from "../store/history.store";

export const App: React.FC = () => {
  const [screen, setScreen] = useState(
    window.location.hash === "#editor" ? "editor" : "home",
  );
  const [demoError, setDemoError] = useState("");
  useEffect(() => {
    const navigate = () =>
      setScreen(window.location.hash === "#editor" ? "editor" : "home");
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  const start = () => {
    window.location.hash = "editor";
  };
  const demo = async () => {
    try {
      const asset = await createSampleAsset();
      useHistoryStore.getState().pushSnapshot();
      useProjectStore.getState().addAsset(asset);
      usePipelineStore.getState().loadAssetAsInput(asset);
      useEditorStore.getState().resetViewport();
      start();
    } catch (error) {
      setDemoError(
        error instanceof Error
          ? error.message
          : "The sample could not be loaded.",
      );
    }
  };
  const setCommandPaletteOpen = useEditorStore(
    (state) => state.setCommandPaletteOpen,
  );
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useEditorStore((state) => state.setSelectedNodeId);

  const removeNode = usePipelineStore((state) => state.removeNode);

  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const pushSnapshot = useHistoryStore((state) => state.pushSnapshot);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== "editor" || document.querySelector("[aria-modal=true]"))
        return;
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Command Palette: Ctrl+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      // Delete Node
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNodeId) {
          e.preventDefault();
          pushSnapshot();
          removeNode(selectedNodeId);
          setSelectedNodeId(null);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    setCommandPaletteOpen,
    selectedNodeId,
    removeNode,
    setSelectedNodeId,
    undo,
    redo,
    pushSnapshot,
    screen,
  ]);

  if (screen === "home")
    return (
      <>
        <LandingPage onStart={start} onDemo={demo} />
        {demoError && (
          <div className="notice" role="alert">
            {demoError}
            <button onClick={() => setDemoError("")}>Dismiss</button>
          </div>
        )}
      </>
    );
  return (
    <div className="editor-shell flex flex-col h-dvh w-full bg-surface text-ink overflow-hidden font-sans relative">
      {/* Onboarding Guide Banner */}
      <OnboardingBanner />

      {/* Header Toolbar */}
      <Toolbar />

      {/* Main Layout Grid */}
      <div className="editor-layout flex-1 flex overflow-hidden relative min-h-0">
        {/* Left Assets / Effects Sidebar */}
        <Sidebar />

        {/* Center: Full-Screen Interactive Image Canvas */}
        <div className="preview-column flex-1 min-w-0 relative overflow-hidden bg-canvas">
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
