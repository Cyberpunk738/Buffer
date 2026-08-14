import React, { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '../../store/editor.store';
import { usePipelineStore } from '../../store/pipeline.store';
import { useHistoryStore } from '../../store/history.store';
import { NODE_REGISTRY } from '../../engine/nodes/registry';
import { Search, Plus, X } from 'lucide-react';

export const NodeSearchModal: React.FC = () => {
  const isOpen = useEditorStore((state) => state.isNodeSearchOpen);
  const setOpen = useEditorStore((state) => state.setNodeSearchOpen);

  const appendNodeToPipeline = usePipelineStore((state) => state.appendNodeToPipeline);
  const pushSnapshot = useHistoryStore((state) => state.pushSnapshot);
  const setSelectedNodeId = useEditorStore((state) => state.setSelectedNodeId);

  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const nodeDefs = Object.values(NODE_REGISTRY).filter((def) =>
    def.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    def.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    def.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectNode = (type: string) => {
    pushSnapshot();
    const newId = appendNodeToPipeline(type);
    if (newId) setSelectedNodeId(newId);
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 p-4">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col select-none">
        {/* Header Search Input */}
        <div className="p-3.5 border-b border-neutral-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-blue-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search effect or node (e.g. Blur, Brightness, Crop, Sharpen)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
              if (e.key === 'Enter' && nodeDefs.length > 0) {
                handleSelectNode(nodeDefs[0].type);
              }
            }}
            className="flex-1 bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none"
          />
          <button
            onClick={() => setOpen(false)}
            className="p-1 hover:bg-neutral-800 rounded text-neutral-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Node Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {nodeDefs.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-500">
              No matching node types found.
            </div>
          ) : (
            nodeDefs.map((def) => (
              <button
                key={def.type}
                onClick={() => handleSelectNode(def.type)}
                className="w-full p-2.5 rounded-lg bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800/80 flex items-center justify-between text-left transition-colors group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-200 group-hover:text-blue-400">
                      {def.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 uppercase font-mono">
                      {def.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {def.description}
                  </div>
                </div>
                <Plus className="w-4 h-4 text-neutral-500 group-hover:text-blue-400" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
