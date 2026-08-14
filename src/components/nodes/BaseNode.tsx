import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeStateData, NodeCategory } from '../../engine/core/types';
import { getNodeDefinition } from '../../engine/nodes/registry';
import { useEditorStore } from '../../store/editor.store';
import { usePipelineStore } from '../../store/pipeline.store';
import { useHistoryStore } from '../../store/history.store';
import { 
  Sliders, 
  Image as ImageIcon, 
  Crop as CropIcon, 
  Sparkles, 
  Palette, 
  Layers, 
  Eye, 
  Trash2, 
  Copy, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { clsx } from 'clsx';

const CATEGORY_COLORS: Record<NodeCategory, { border: string; bg: string; text: string; icon: React.ReactNode }> = {
  input: {
    border: 'border-emerald-500/50 hover:border-emerald-400',
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-400',
    icon: <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
  },
  transform: {
    border: 'border-amber-500/50 hover:border-amber-400',
    bg: 'bg-amber-950/40',
    text: 'text-amber-400',
    icon: <CropIcon className="w-3.5 h-3.5 text-amber-400" />
  },
  filter: {
    border: 'border-blue-500/50 hover:border-blue-400',
    bg: 'bg-blue-950/40',
    text: 'text-blue-400',
    icon: <Sparkles className="w-3.5 h-3.5 text-blue-400" />
  },
  color: {
    border: 'border-purple-500/50 hover:border-purple-400',
    bg: 'bg-purple-950/40',
    text: 'text-purple-400',
    icon: <Palette className="w-3.5 h-3.5 text-purple-400" />
  },
  composite: {
    border: 'border-rose-500/50 hover:border-rose-400',
    bg: 'bg-rose-950/40',
    text: 'text-rose-400',
    icon: <Layers className="w-3.5 h-3.5 text-rose-400" />
  },
  output: {
    border: 'border-cyan-500/50 hover:border-cyan-400',
    bg: 'bg-cyan-950/40',
    text: 'text-cyan-400',
    icon: <Eye className="w-3.5 h-3.5 text-cyan-400" />
  }
};

export const BaseNode: React.FC<NodeProps> = memo(({ id, selected, data }) => {
  const nodeData = data as unknown as NodeStateData;
  const definition = getNodeDefinition(nodeData.definitionType);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useEditorStore((state) => state.setSelectedNodeId);
  
  const removeNode = usePipelineStore((state) => state.removeNode);
  const duplicateNode = usePipelineStore((state) => state.duplicateNode);
  const pushSnapshot = useHistoryStore((state) => state.pushSnapshot);

  const isNodeSelected = selected || selectedNodeId === id;
  const categoryStyle = CATEGORY_COLORS[nodeData.category] || CATEGORY_COLORS.filter;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    pushSnapshot();
    removeNode(id);
    if (selectedNodeId === id) {
      setSelectedNodeId(null);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    pushSnapshot();
    const newId = duplicateNode(id);
    if (newId) {
      setSelectedNodeId(newId);
    }
  };

  return (
    <div
      onClick={() => setSelectedNodeId(id)}
      className={clsx(
        'group relative min-w-[210px] rounded-lg border bg-neutral-900/95 shadow-xl transition-all duration-150',
        categoryStyle.border,
        isNodeSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-neutral-950 border-blue-500 shadow-blue-900/20' : 'border-neutral-800'
      )}
    >
      {/* Node Header */}
      <div className={clsx('flex items-center justify-between px-3 py-2 border-b border-neutral-800/80 rounded-t-lg', categoryStyle.bg)}>
        <div className="flex items-center gap-2">
          {categoryStyle.icon}
          <span className="text-xs font-semibold text-neutral-100 tracking-wide">
            {nodeData.label || definition?.name || 'Node'}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDuplicate}
            title="Duplicate node"
            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={handleDelete}
            title="Delete node"
            className="p-1 hover:bg-red-950/60 hover:text-red-400 rounded text-neutral-400"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Node Content / Ports */}
      <div className="p-3 text-xs space-y-2">
        {/* Status bar */}
        <div className="flex items-center justify-between text-[10px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            {nodeData.status === 'processing' && (
              <span className="flex items-center gap-1 text-amber-400">
                <RefreshCw className="w-3 h-3 animate-spin" /> Processing
              </span>
            )}
            {nodeData.status === 'success' && (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Done
              </span>
            )}
            {nodeData.status === 'cached' && (
              <span className="flex items-center gap-1 text-teal-400">
                <CheckCircle2 className="w-3 h-3" /> Cached
              </span>
            )}
            {nodeData.status === 'error' && (
              <span className="flex items-center gap-1 text-red-400">
                <AlertCircle className="w-3 h-3" /> Error
              </span>
            )}
            {(!nodeData.status || nodeData.status === 'idle') && (
              <span className="text-neutral-500">Idle</span>
            )}
          </div>

          {nodeData.executionTimeMs !== undefined && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-neutral-400">
              <Clock className="w-2.5 h-2.5" />
              {nodeData.executionTimeMs.toFixed(1)}ms
            </span>
          )}
        </div>

        {/* Input Handles */}
        {definition?.inputs.map((input, index) => (
          <div key={input.id} className="relative flex items-center justify-start py-0.5">
            <Handle
              type="target"
              position={Position.Left}
              id={input.id}
              className="!left-[-17px] !w-3 !h-3 !bg-blue-500 hover:!bg-blue-400"
            />
            <span className="text-[11px] text-neutral-300 font-medium pl-1">
              {input.name}
            </span>
          </div>
        ))}

        {/* Output Handles */}
        {definition?.outputs.map((output, index) => (
          <div key={output.id} className="relative flex items-center justify-end py-0.5">
            <span className="text-[11px] text-neutral-300 font-medium pr-1">
              {output.name}
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id={output.id}
              className="!right-[-17px] !w-3 !h-3 !bg-emerald-500 hover:!bg-emerald-400"
            />
          </div>
        ))}

        {/* Error Details */}
        {nodeData.status === 'error' && nodeData.errorMessage && (
          <div className="p-1.5 rounded bg-red-950/40 border border-red-800/40 text-[10px] text-red-300">
            {nodeData.errorMessage}
          </div>
        )}
      </div>
    </div>
  );
});

BaseNode.displayName = 'BaseNode';
