import React, { useCallback, useMemo } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  BackgroundVariant, 
  Node, 
  Edge,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BaseNode } from '../nodes/BaseNode';
import { usePipelineStore } from '../../store/pipeline.store';
import { useEditorStore } from '../../store/editor.store';
import { useHistoryStore } from '../../store/history.store';
import { NodeStateData } from '../../engine/core/types';

const GraphCanvasContent: React.FC = () => {
  const nodes = usePipelineStore((state) => state.nodes);
  const edges = usePipelineStore((state) => state.edges);
  const onNodesChange = usePipelineStore((state) => state.onNodesChange);
  const onEdgesChange = usePipelineStore((state) => state.onEdgesChange);
  const onConnect = usePipelineStore((state) => state.onConnect);
  const addNode = usePipelineStore((state) => state.addNode);

  const setSelectedNodeId = useEditorStore((state) => state.setSelectedNodeId);
  const pushSnapshot = useHistoryStore((state) => state.pushSnapshot);

  const { screenToFlowPosition } = useReactFlow();

  const nodeTypes = useMemo(() => ({
    processingNode: BaseNode
  }), []);

  const handleSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    if (nodes.length > 0) {
      setSelectedNodeId(nodes[0].id);
    } else {
      setSelectedNodeId(null);
    }
  }, [setSelectedNodeId]);

  const handleConnect = useCallback((params: any) => {
    pushSnapshot();
    onConnect(params);
  }, [onConnect, pushSnapshot]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/nodetype');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });

      pushSnapshot();
      const newId = addNode(type, position);
      if (newId) {
        setSelectedNodeId(newId);
      }
    },
    [screenToFlowPosition, addNode, pushSnapshot, setSelectedNodeId]
  );

  return (
    <div 
      className="w-full h-full bg-neutral-950 relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onSelectionChange={handleSelectionChange}
        fitView
        colorMode="dark"
        minZoom={0.2}
        maxZoom={3.0}
        defaultEdgeOptions={{
          animated: true,
          style: { strokeWidth: 2, stroke: '#3b82f6' }
        }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1.5} 
          color="#27272a" 
        />
        <Controls 
          showInteractive={false} 
          className="!bottom-4 !left-4" 
        />
      </ReactFlow>
    </div>
  );
};

export const GraphCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <GraphCanvasContent />
    </ReactFlowProvider>
  );
};
