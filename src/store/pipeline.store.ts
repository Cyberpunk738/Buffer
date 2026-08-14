import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';
import { NodeStateData, NodeStatus } from '../engine/core/types';
import { getNodeDefinition } from '../engine/nodes/registry';

interface PipelineStoreState {
  nodes: Node<NodeStateData>[];
  edges: Edge[];
  
  // Node management
  addNode: (definitionType: string, position?: { x: number; y: number }) => string | null;
  removeNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => string | null;
  updateNodeParameter: (nodeId: string, paramId: string, value: any) => void;
  updateNodeStatus: (nodeId: string, status: NodeStatus, errorMessage?: string, executionTimeMs?: number) => void;
  
  // React Flow handlers
  onNodesChange: (changes: NodeChange<Node<NodeStateData>>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // Operations
  clearPipeline: () => void;
  setGraph: (nodes: Node<NodeStateData>[], edges: Edge[]) => void;
}

const INITIAL_NODES: Node<NodeStateData>[] = [
  {
    id: 'node-image-1',
    type: 'processingNode',
    position: { x: 100, y: 150 },
    data: {
      definitionType: 'input-image',
      label: 'Image Input',
      category: 'input',
      parameters: { assetId: '' },
      status: 'idle'
    }
  },
  {
    id: 'node-blur-1',
    type: 'processingNode',
    position: { x: 420, y: 150 },
    data: {
      definitionType: 'filter-blur',
      label: 'Blur',
      category: 'filter',
      parameters: { radius: 8 },
      status: 'idle'
    }
  },
  {
    id: 'node-output-1',
    type: 'processingNode',
    position: { x: 740, y: 150 },
    data: {
      definitionType: 'output-preview',
      label: 'Preview',
      category: 'output',
      parameters: {},
      status: 'idle'
    }
  }
];

const INITIAL_EDGES: Edge[] = [
  {
    id: 'e1-2',
    source: 'node-image-1',
    sourceHandle: 'output',
    target: 'node-blur-1',
    targetHandle: 'input',
    animated: true
  },
  {
    id: 'e2-3',
    source: 'node-blur-1',
    sourceHandle: 'output',
    target: 'node-output-1',
    targetHandle: 'input',
    animated: true
  }
];

export const usePipelineStore = create<PipelineStoreState>((set, get) => ({
  nodes: INITIAL_NODES,
  edges: INITIAL_EDGES,

  addNode: (definitionType, position = { x: 250, y: 250 }) => {
    const def = getNodeDefinition(definitionType);
    if (!def) return null;

    const defaultParameters: Record<string, any> = {};
    def.parameters.forEach((param) => {
      defaultParameters[param.id] = param.defaultValue;
    });

    const newId = `node-${def.category}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;

    const newNode: Node<NodeStateData> = {
      id: newId,
      type: 'processingNode',
      position,
      data: {
        definitionType,
        label: def.name,
        category: def.category,
        parameters: defaultParameters,
        status: 'idle'
      }
    };

    set((state) => ({
      nodes: [...state.nodes, newNode]
    }));

    return newId;
  },

  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
    }));
  },

  duplicateNode: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    const newId = `node-${node.data.category}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    const duplicatedNode: Node<NodeStateData> = {
      ...node,
      id: newId,
      position: {
        x: node.position.x + 30,
        y: node.position.y + 30
      },
      data: {
        ...node.data,
        parameters: { ...node.data.parameters },
        status: 'idle'
      }
    };

    set((state) => ({
      nodes: [...state.nodes, duplicatedNode]
    }));

    return newId;
  },

  updateNodeParameter: (nodeId, paramId, value) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        return {
          ...node,
          data: {
            ...node.data,
            parameters: {
              ...node.data.parameters,
              [paramId]: value
            }
          }
        };
      })
    }));
  },

  updateNodeStatus: (nodeId, status, errorMessage, executionTimeMs) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        return {
          ...node,
          data: {
            ...node.data,
            status,
            errorMessage,
            executionTimeMs: executionTimeMs ?? node.data.executionTimeMs
          }
        };
      })
    }));
  },

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as Node<NodeStateData>[]
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges)
    }));
  },

  onConnect: (connection) => {
    set((state) => ({
      edges: addEdge({ ...connection, animated: true }, state.edges)
    }));
  },

  clearPipeline: () => {
    set({ nodes: [], edges: [] });
  },

  setGraph: (nodes, edges) => {
    set({ nodes, edges });
  }
}));
