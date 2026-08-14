import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';
import { NodeStateData, NodeStatus, AssetItem } from '../engine/core/types';
import { getNodeDefinition } from '../engine/nodes/registry';

interface PipelineStoreState {
  nodes: Node<NodeStateData>[];
  edges: Edge[];
  
  // Pipeline Operations
  addNode: (definitionType: string, position?: { x: number; y: number }) => string | null;
  appendNodeToPipeline: (definitionType: string) => string | null;
  loadAssetAsInput: (asset: AssetItem) => string;
  removeNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => string | null;
  updateNodeParameter: (nodeId: string, paramId: string, value: any) => void;
  updateNodeStatus: (nodeId: string, status: NodeStatus, errorMessage?: string, executionTimeMs?: number) => void;
  getTailNode: () => Node<NodeStateData> | null;
  getImageInputNode: () => Node<NodeStateData> | null;
  
  // React Flow handlers
  onNodesChange: (changes: NodeChange<Node<NodeStateData>>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // Operations
  clearPipeline: () => void;
  setGraph: (nodes: Node<NodeStateData>[], edges: Edge[]) => void;
}

// Start with empty nodes for clean first-time user upload experience
const INITIAL_NODES: Node<NodeStateData>[] = [];
const INITIAL_EDGES: Edge[] = [];

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

  // Auto-connects the new node to the current tail of the pipeline!
  appendNodeToPipeline: (definitionType) => {
    const def = getNodeDefinition(definitionType);
    if (!def) return null;

    const { nodes, edges } = get();
    const tailNode = get().getTailNode();

    let newPosition = { x: 100, y: 200 };
    if (tailNode) {
      newPosition = {
        x: tailNode.position.x + 280,
        y: tailNode.position.y
      };
    }

    const defaultParameters: Record<string, any> = {};
    def.parameters.forEach((param) => {
      defaultParameters[param.id] = param.defaultValue;
    });

    const newId = `node-${def.category}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;

    const newNode: Node<NodeStateData> = {
      id: newId,
      type: 'processingNode',
      position: newPosition,
      data: {
        definitionType,
        label: def.name,
        category: def.category,
        parameters: defaultParameters,
        status: 'idle'
      }
    };

    const newEdges = [...edges];

    // Automatically connect tail node output to new node input
    if (tailNode) {
      const tailDef = getNodeDefinition(tailNode.data.definitionType);
      const outputPort = tailDef?.outputs[0]?.id || 'output';
      const inputPort = def.inputs[0]?.id || 'input';

      newEdges.push({
        id: `e-${tailNode.id}-${newId}`,
        source: tailNode.id,
        sourceHandle: outputPort,
        target: newId,
        targetHandle: inputPort,
        animated: true
      });
    }

    set({
      nodes: [...nodes, newNode],
      edges: newEdges
    });

    return newId;
  },

  loadAssetAsInput: (asset) => {
    const { nodes } = get();
    const existingInputNode = nodes.find((n) => n.data.definitionType === 'input-image');

    if (existingInputNode) {
      set({
        nodes: nodes.map((n) =>
          n.id === existingInputNode.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  label: asset.name,
                  assetId: asset.id,
                  parameters: { ...n.data.parameters, assetId: asset.id }
                }
              }
            : n
        )
      });
      return existingInputNode.id;
    } else {
      const newId = `node-input-${Date.now().toString(36)}`;
      const newInputNode: Node<NodeStateData> = {
        id: newId,
        type: 'processingNode',
        position: { x: 100, y: 200 },
        data: {
          definitionType: 'input-image',
          label: asset.name,
          category: 'input',
          assetId: asset.id,
          parameters: { assetId: asset.id },
          status: 'idle'
        }
      };
      set({ nodes: [newInputNode, ...nodes] });
      return newId;
    }
  },

  getTailNode: () => {
    const { nodes, edges } = get();
    if (nodes.length === 0) return null;

    // Find nodes that have no outgoing edges (leaf nodes)
    const sourceNodeIds = new Set(edges.map((e) => e.source));
    const leafNodes = nodes.filter((n) => !sourceNodeIds.has(n.id));

    if (leafNodes.length > 0) {
      return leafNodes[leafNodes.length - 1];
    }
    return nodes[nodes.length - 1];
  },

  getImageInputNode: () => {
    const { nodes } = get();
    return nodes.find((n) => n.data.definitionType === 'input-image') || null;
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
