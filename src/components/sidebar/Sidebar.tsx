import { readImageFile } from "../../lib/image-file";
import React, { useState } from "react";
import { useEditorStore } from "../../store/editor.store";
import { usePipelineStore } from "../../store/pipeline.store";
import { useProjectStore } from "../../store/project.store";
import { useHistoryStore } from "../../store/history.store";
import { getNodesByCategory } from "../../engine/nodes/registry";
import { useResponsive } from "../../hooks/useResponsive";
import {
  Box,
  FolderOpen,
  Activity,
  Search,
  Plus,
  Upload,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { clsx } from "clsx";

export const Sidebar: React.FC = () => {
  const isSidebarOpen = useEditorStore((state) => state.isSidebarOpen);
  const toggleSidebar = useEditorStore((state) => state.toggleSidebar);
  const activeTab = useEditorStore((state) => state.activeSidebarTab);
  const setActiveTab = useEditorStore((state) => state.setActiveSidebarTab);

  const { isMobile, isTablet } = useResponsive();

  const appendNodeToPipeline = usePipelineStore(
    (state) => state.appendNodeToPipeline,
  );
  const loadAssetAsInput = usePipelineStore((state) => state.loadAssetAsInput);
  const pushSnapshot = useHistoryStore((state) => state.pushSnapshot);

  const assets = useProjectStore((state) => state.assets);
  const addAsset = useProjectStore((state) => state.addAsset);
  const removeAsset = useProjectStore((state) => state.removeAsset);

  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >({});

  const categories = getNodesByCategory();
  const effectCount = usePipelineStore(
    (state) => state.nodes.filter((n) => n.data.category !== "input").length,
  );

  const setSelectedNodeId = useEditorStore((state) => state.setSelectedNodeId);
  const setCropEditing = useEditorStore((state) => state.setCropEditing);
  const [uploadError, setUploadError] = useState("");
  if (!isSidebarOpen) return null;

  const handleAddNode = (type: string) => {
    pushSnapshot();
    const newId = appendNodeToPipeline(type);
    if (newId) {
      setSelectedNodeId(newId);
    }
    if (type === "transform-crop") {
      setCropEditing(true);
    }
  };

  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow/nodetype", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const asset = await readImageFile(file);
      pushSnapshot();
      addAsset(asset);
      const id = loadAssetAsInput(asset);
      setSelectedNodeId(id);
      useEditorStore.getState().resetViewport();
      setUploadError("");
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "The image could not be opened.",
      );
    }
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <aside
      className={clsx(
        "effects-sidebar h-full bg-white border-r border-line flex flex-col z-30 shrink-0 select-none transition-all duration-200",
        isMobile || isTablet
          ? "absolute left-0 top-0 bottom-0 w-72 shadow-2xl backdrop-blur-lg bg-white/95"
          : "w-64 relative",
      )}
    >
      {uploadError && (
        <p role="alert" className="p-3 text-xs text-red-600">
          {uploadError}
        </p>
      )}
      {/* Sidebar Header */}
      <div className="h-12 px-3 border-b border-line flex items-center justify-between bg-white/90">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 flex-1">
          <button
            onClick={() => setActiveTab("nodes")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-colors",
              activeTab === "nodes"
                ? "bg-soft text-ink shadow-sm"
                : "text-muted hover:text-ink hover:bg-soft/50",
            )}
          >
            <Box className="w-3.5 h-3.5" />
            Effects
          </button>

          <button
            onClick={() => setActiveTab("assets")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-colors",
              activeTab === "assets"
                ? "bg-soft text-ink shadow-sm"
                : "text-muted hover:text-ink hover:bg-soft/50",
            )}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Assets
          </button>

          <button
            onClick={() => setActiveTab("profiler")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-colors",
              activeTab === "profiler"
                ? "bg-soft text-ink shadow-sm"
                : "text-muted hover:text-ink hover:bg-soft/50",
            )}
          >
            <Activity className="w-3.5 h-3.5" />
            Stats
          </button>
        </div>

        <button
          onClick={toggleSidebar}
          title="Close Sidebar"
          className="p-1.5 hover:bg-soft text-muted hover:text-ink rounded ml-1"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* NODES TAB */}
      {activeTab === "nodes" && (
        <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted" />
            <input
              type="text"
              placeholder="Search effects & nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-surface border border-line rounded text-xs text-ink focus:outline-none focus:border-green placeholder-muted"
            />
          </div>

          {/* Node Categories List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {Object.entries(categories).map(([category, nodeDefs]) => {
              const filteredNodes = nodeDefs.filter(
                (n) =>
                  n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  n.description
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
              );

              if (filteredNodes.length === 0) return null;

              const isCollapsed = collapsedCategories[category];

              return (
                <div key={category} className="space-y-1">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-muted uppercase tracking-wider px-1 py-1 hover:text-ink"
                  >
                    <span className="capitalize">{category}</span>
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Category Node Items */}
                  {!isCollapsed && (
                    <div className="space-y-1 pl-1">
                      {filteredNodes.map((def) => (
                        <div
                          key={def.type}
                          draggable
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleAddNode(def.type);
                            }
                          }}
                          onDragStart={(e) => handleDragStart(e, def.type)}
                          onClick={() => handleAddNode(def.type)}
                          className="group flex items-center justify-between p-2 rounded-md bg-surface/70 border border-line/80 hover:border-green/60 hover:bg-soft/80 cursor-grab active:cursor-grabbing transition-all"
                        >
                          <div>
                            <div className="text-xs font-medium text-ink group-hover:text-green">
                              {def.name}
                            </div>
                            <div className="text-[10px] text-muted line-clamp-1">
                              {def.description}
                            </div>
                          </div>
                          <Plus className="w-3.5 h-3.5 text-muted group-hover:text-green" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ASSETS TAB */}
      {activeTab === "assets" && (
        <div className="flex-1 flex flex-col p-3 space-y-3 overflow-hidden">
          {/* Upload Button */}
          <label className="w-full h-9 bg-mint hover:bg-mint-hover text-ink rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
            <Upload className="w-3.5 h-3.5" />
            Upload Image Asset
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Assets Grid */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {assets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted space-y-2 border border-dashed border-line rounded-lg">
                <ImageIcon className="w-8 h-8 text-faint" />
                <p className="text-xs font-semibold text-muted">
                  No images yet
                </p>
                <p className="text-[10px] text-muted">
                  Upload an image to get started with visual processing.
                </p>
              </div>
            ) : (
              assets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => loadAssetAsInput(asset)}
                  className="group relative p-2 bg-surface border border-line hover:border-green/60 rounded-lg flex items-center gap-3 cursor-pointer transition-all"
                >
                  <img
                    src={asset.dataUrl}
                    alt={asset.name}
                    className="w-10 h-10 object-cover rounded bg-white border border-line"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink truncate group-hover:text-green">
                      {asset.name}
                    </p>
                    <p className="text-[10px] text-muted font-mono">
                      {asset.width} × {asset.height} px
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      pushSnapshot();
                      const input = usePipelineStore
                        .getState()
                        .getImageInputNode();
                      if (input?.data.assetId === asset.id)
                        usePipelineStore.getState().removeNode(input.id);
                      removeAsset(asset.id);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    aria-label={`Remove ${asset.name}`}
                    className="p-1 hover:bg-red-950 text-muted hover:text-red-400 rounded opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PROFILER TAB */}
      {activeTab === "profiler" && (
        <div className="flex-1 p-3 flex flex-col justify-between overflow-y-auto text-xs space-y-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-ink uppercase tracking-wider text-[11px]">
              Workspace overview
            </h4>

            <div className="p-3 bg-surface border border-line rounded-lg space-y-2 font-mono text-[11px]">
              <div className="flex justify-between text-muted">
                <span>Image Input</span>
                <span className="text-ink">{assets.length} loaded</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Active Effects</span>
                <span className="text-ink">{effectCount} effects</span>
              </div>
              <div className="border-t border-line pt-1.5 flex justify-between font-bold text-green">
                <span>Processing</span>
                <span>In your browser</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-surface/60 border border-line rounded text-[11px] text-muted space-y-1">
            <div className="font-semibold text-ink">Session information</div>
            <div>
              Images and edits stay in this browser session. Refreshing clears
              your workspace.
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
