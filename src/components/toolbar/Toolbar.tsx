import { useEditorStore } from "../../store/editor.store";
import { useHistoryStore } from "../../store/history.store";
import { useProjectStore } from "../../store/project.store";
import { usePipelineStore } from "../../store/pipeline.store";
import { Brand } from "../shared/Brand";
import {
  Undo2,
  Redo2,
  Plus,
  Download,
  Command,
  PanelLeft,
  Sliders,
  ShieldCheck,
} from "lucide-react";
export function Toolbar() {
  const editor = useEditorStore(),
    history = useHistoryStore();
  const name = useProjectStore((s) => s.currentProject.name),
    setName = useProjectStore((s) => s.setProjectName);
  const hasImage = usePipelineStore((s) =>
    s.nodes.some((n) => n.data.definitionType === "input-image"),
  );
  return (
    <header className="editor-toolbar">
      <div className="editor-brand">
        <a href="#home" aria-label="Buffer home">
          <Brand />
        </a>
        <span className="toolbar-divider" />
        <input
          aria-label="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name your creation"
        />
      </div>
      <div className="toolbar-tools">
        <button
          className={"tool-button " + (editor.isSidebarOpen ? "active" : "")}
          onClick={editor.toggleSidebar}
          aria-label="Toggle effects library"
          aria-pressed={editor.isSidebarOpen}
        >
          <PanelLeft size={17} />
        </button>
        <button
          className="tool-button"
          onClick={history.undo}
          disabled={!history.past.length}
          aria-label="Undo"
          title="Undo (Ctrl/Cmd + Z)"
        >
          <Undo2 size={17} />
        </button>
        <button
          className="tool-button"
          onClick={history.redo}
          disabled={!history.future.length}
          aria-label="Redo"
          title="Redo (Ctrl/Cmd + Shift + Z)"
        >
          <Redo2 size={17} />
        </button>
        <span className="toolbar-divider" />
        <button
          className="button button-quiet add-effect"
          disabled={!hasImage}
          onClick={() => editor.setNodeSearchOpen(true)}
        >
          <Plus size={15} />
          Add effect
        </button>
        <button
          className="tool-button command-button"
          onClick={() => editor.setCommandPaletteOpen(true)}
          aria-label="Open commands"
          title="Commands (Ctrl/Cmd + K)"
        >
          <Command size={17} />
        </button>
        <button
          className={"tool-button " + (editor.isInspectorOpen ? "active" : "")}
          onClick={editor.toggleInspector}
          aria-label="Toggle image controls"
          aria-pressed={editor.isInspectorOpen}
        >
          <Sliders size={17} />
        </button>
      </div>
      <div className="toolbar-export">
        <span>
          <ShieldCheck size={13} />
          Local workspace
        </span>
        <button
          className="button button-mint"
          disabled={!hasImage}
          onClick={() => editor.setExportModalOpen(true)}
        >
          <Download size={15} />
          Export image
        </button>
      </div>
    </header>
  );
}
