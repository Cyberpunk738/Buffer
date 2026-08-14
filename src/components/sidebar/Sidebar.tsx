import React, { useState } from 'react';
import { useEditorStore } from '../../store/editor.store';
import { usePipelineStore } from '../../store/pipeline.store';
import { useProjectStore } from '../../store/project.store';
import { useHistoryStore } from '../../store/history.store';
import { getNodesByCategory } from '../../engine/nodes/registry';
import { useResponsive } from '../../hooks/useResponsive';
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
  PanelLeft
} from 'lucide-react';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const isSidebarOpen = useEditorStore((state) => state.isSidebarOpen);
  const toggleSidebar = useEditorStore((state) => state.toggleSidebar);
  const activeTab = useEditorStore((state) => state.activeSidebarTab);
  const setActiveTab = useEditorStore((state) => state.setActiveSidebarTab);

  const { isMobile, isTablet } = useResponsive();

  const appendNodeToPipeline = usePipelineStore((state) => state.appendNodeToPipeline);
  const loadAssetAsInput = usePipelineStore((state) => state.loadAssetAsInput);
  const pushSnapshot = useHistoryStore((state) => state.pushSnapshot);

  const assets = useProjectStore((state) => state.assets);
  const addAsset = useProjectStore((state) => state.addAsset);
  const removeAsset = useProjectStore((state) => state.removeAsset);

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const categories = getNodesByCategory();

  if (!isSidebarOpen) return null;

  const handleAddNode = (type: string) => {
    pushSnapshot();
    appendNodeToPipeline(type);
  };

  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow/nodetype', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const newAsset = {
          id: `asset-${Date.now()}`,
          name: file.name,
          type: file.type,
          size: file.size,
          width: img.width,
          height: img.height,
          dataUrl,
          createdAt: Date.now()
        };
        pushSnapshot();
        addAsset(newAsset);
        loadAssetAsInput(newAsset);
      };
      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <aside
      className={clsx(
        'h-full bg-neutral-900 border-r border-neutral-800 flex flex-col z-30 shrink-0 select-none transition-all duration-200',
        isMobile || isTablet
          ? 'absolute left-0 top-0 bottom-0 w-72 shadow-2xl backdrop-blur-lg bg-neutral-900/95'
          : 'w-64 relative'
      )}
    >
      {/* Sidebar Header */}
      <div className="h-12 px-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 flex-1">
          <button
            onClick={() => setActiveTab('nodes')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-colors',
              activeTab === 'nodes'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            )}
          >
            <Box className="w-3.5 h-3.5" />
            Effects
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-colors',
              activeTab === 'assets'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            )}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Assets
          </button>

          <button
            onClick={() => setActiveTab('profiler')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-colors',
              activeTab === 'profiler'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
            )}
          >
            <Activity className="w-3.5 h-3.5" />
            Stats
          </button>
        </div>

        <button
          onClick={toggleSidebar}
          title="Close Sidebar"
          className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded ml-1"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* NODES TAB */}
      {activeTab === 'nodes' && (
        <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search effects & nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-200 focus:outline-none focus:border-blue-500 placeholder-neutral-500"
            />
          </div>

          {/* Node Categories List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {Object.entries(categories).map(([category, nodeDefs]) => {
              const filteredNodes = nodeDefs.filter(
                (n) =>
                  n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  n.description.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (filteredNodes.length === 0) return null;

              const isCollapsed = collapsedCategories[category];

              return (
                <div key={category} className="space-y-1">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-1 py-1 hover:text-neutral-200"
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
                          onDragStart={(e) => handleDragStart(e, def.type)}
                          onClick={() => handleAddNode(def.type)}
                          className="group flex items-center justify-between p-2 rounded-md bg-neutral-950/70 border border-neutral-800/80 hover:border-blue-500/60 hover:bg-neutral-800/80 cursor-grab active:cursor-grabbing transition-all"
                        >
                          <div>
                            <div className="text-xs font-medium text-neutral-200 group-hover:text-blue-400">
                              {def.name}
                            </div>
                            <div className="text-[10px] text-neutral-500 line-clamp-1">
                              {def.description}
                            </div>
                          </div>
                          <Plus className="w-3.5 h-3.5 text-neutral-500 group-hover:text-blue-400" />
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
      {activeTab === 'assets' && (
        <div className="flex-1 flex flex-col p-3 space-y-3 overflow-hidden">
          {/* Upload Button */}
          <label className="w-full h-9 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
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
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-neutral-500 space-y-2 border border-dashed border-neutral-800 rounded-lg">
                <ImageIcon className="w-8 h-8 text-neutral-600" />
                <p className="text-xs font-semibold text-neutral-400">No images yet</p>
                <p className="text-[10px] text-neutral-500">
                  Upload an image to get started with visual processing.
                </p>
              </div>
            ) : (
              assets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => loadAssetAsInput(asset)}
                  className="group relative p-2 bg-neutral-950 border border-neutral-800 hover:border-blue-500/60 rounded-lg flex items-center gap-3 cursor-pointer transition-all"
                >
                  <img
                    src={asset.dataUrl}
                    alt={asset.name}
                    className="w-10 h-10 object-cover rounded bg-neutral-900 border border-neutral-800"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-neutral-200 truncate group-hover:text-blue-400">
                      {asset.name}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      {asset.width} × {asset.height} px
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAsset(asset.id);
                    }}
                    className="p-1 hover:bg-red-950 text-neutral-500 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
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
      {activeTab === 'profiler' && (
        <div className="flex-1 p-3 flex flex-col justify-between overflow-y-auto text-xs space-y-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-neutral-300 uppercase tracking-wider text-[11px]">
              Pipeline Performance
            </h4>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2 font-mono text-[11px]">
              <div className="flex justify-between text-neutral-400">
                <span>Image Input</span>
                <span className="text-neutral-200">0.8 ms</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Blur Effect</span>
                <span className="text-neutral-200">4.2 ms</span>
              </div>
              <div className="border-t border-neutral-800 pt-1.5 flex justify-between font-bold text-emerald-400">
                <span>Total Pipeline</span>
                <span>5.0 ms</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded text-[11px] text-neutral-400 space-y-1">
            <div className="font-semibold text-neutral-300">Run statistics</div>
            <div>Run your pipeline to see live execution benchmarks.</div>
          </div>
        </div>
      )}
    </aside>
  );
};
