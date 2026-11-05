import React, { useState, useEffect, useRef } from "react";
import { useDialog } from "../../hooks/useDialog";
import { useEditorStore } from "../../store/editor.store";
import { usePipelineStore } from "../../store/pipeline.store";
import { useHistoryStore } from "../../store/history.store";
import {
  Command,
  Search,
  Sparkles,
  Sliders,
  Save,
  Download,
  RotateCcw,
  X,
} from "lucide-react";

export const CommandPalette: React.FC = () => {
  const isOpen = useEditorStore((state) => state.isCommandPaletteOpen);
  const setOpen = useEditorStore((state) => state.setCommandPaletteOpen);

  const toggleInspector = useEditorStore((state) => state.toggleInspector);
  const setActiveSidebarTab = useEditorStore(
    (state) => state.setActiveSidebarTab,
  );
  const resetViewport = useEditorStore((state) => state.resetViewport);

  const addNode = usePipelineStore((state) => state.appendNodeToPipeline);
  const pushSnapshot = useHistoryStore((state) => state.pushSnapshot);

  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  const dialogRef = useDialog(
    isOpen,
    React.useCallback(() => setOpen(false), [setOpen]),
  );
  if (!isOpen) return null;

  const commands = [
    {
      id: "add-blur",
      name: "Add Blur Node",
      icon: <Sparkles className="w-4 h-4 text-green" />,
      action: () => {
        pushSnapshot();
        addNode("filter-blur");
      },
    },
    {
      id: "add-resize",
      name: "Add Resize Node",
      icon: <Sparkles className="w-4 h-4 text-green" />,
      action: () => {
        pushSnapshot();
        addNode("transform-resize");
      },
    },
    {
      id: "reset-canvas",
      name: "Fit Canvas / Reset Viewport",
      icon: <RotateCcw className="w-4 h-4 text-green" />,
      action: () => resetViewport(),
    },
    {
      id: "toggle-inspector",
      name: "Toggle Inspector Panel",
      icon: <Sliders className="w-4 h-4 text-purple-400" />,
      action: () => toggleInspector(),
    },
    {
      id: "show-profiler",
      name: "Show Performance Profiler",
      icon: <Sparkles className="w-4 h-4 text-teal-400" />,
      action: () => {
        useEditorStore.getState().setSidebarOpen(true);
        setActiveSidebarTab("profiler");
      },
    },
    {
      id: "show-effects",
      name: "Open Effects Library",
      icon: <Save className="w-4 h-4 text-indigo-400" />,
      action: () => {
        useEditorStore.getState().setSidebarOpen(true);
        setActiveSidebarTab("nodes");
      },
    },
    {
      id: "export-image",
      name: "Export Final Rendered Image",
      icon: <Download className="w-4 h-4 text-cyan-400" />,
      action: () => useEditorStore.getState().setExportModalOpen(true),
    },
  ];

  const filteredCommands = commands.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );

  const handleRunCommand = (cmd: (typeof commands)[0]) => {
    cmd.action();
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Workspace commands"
        tabIndex={-1}
        className="w-full max-w-lg bg-white border border-line rounded-xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Input */}
        <div className="p-3 border-b border-line flex items-center gap-3">
          <Command className="w-4 h-4 text-muted" />
          <input
            ref={inputRef}
            type="text"
            aria-label="Search commands"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter" && filteredCommands.length > 0) {
                handleRunCommand(filteredCommands[0]);
              }
            }}
            className="flex-1 bg-transparent text-sm text-ink placeholder-muted focus:outline-none"
          />
          <button
            aria-label="Close commands"
            onClick={() => setOpen(false)}
            className="p-1 hover:bg-soft rounded text-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted">
              No matching commands.
            </div>
          ) : (
            filteredCommands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => handleRunCommand(cmd)}
                className="w-full p-2.5 rounded-lg bg-surface/60 hover:bg-soft border border-line/80 flex items-center justify-between text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  {cmd.icon}
                  <span className="text-xs font-semibold text-ink group-hover:text-ink">
                    {cmd.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted">Run</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
