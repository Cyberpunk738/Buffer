export type NodeCategory = 'input' | 'transform' | 'filter' | 'color' | 'composite' | 'output';

export type PortType = 'image' | 'number' | 'color' | 'mask';

export interface NodePort {
  id: string;
  name: string;
  type: PortType;
  description?: string;
}

export type ParameterType = 'number' | 'select' | 'boolean' | 'color' | 'image' | 'text';

export interface ParameterOption {
  label: string;
  value: string | number | boolean;
}

export interface NodeParameter {
  id: string;
  name: string;
  type: ParameterType;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: ParameterOption[];
  unit?: string;
  description?: string;
}

export type NodeStatus = 'idle' | 'processing' | 'success' | 'cached' | 'error';

export interface NodeInputData {
  images: Record<string, ImageData>;
  parameters: Record<string, any>;
}

export interface NodeOutputData {
  image?: ImageData;
  metadata?: Record<string, any>;
}

export interface ProcessingNodeDefinition {
  type: string;
  name: string;
  category: NodeCategory;
  description: string;
  inputs: NodePort[];
  outputs: NodePort[];
  parameters: NodeParameter[];
}

export interface NodeStateData extends Record<string, unknown> {
  definitionType: string;
  label: string;
  category: NodeCategory;
  parameters: Record<string, any>;
  status: NodeStatus;
  errorMessage?: string;
  executionTimeMs?: number;
  assetId?: string;
  isCached?: boolean;
}

export interface AssetItem {
  id: string;
  name: string;
  type: string;
  size: number;
  width: number;
  height: number;
  dataUrl: string;
  blob?: Blob;
  createdAt: number;
}

export interface ProjectData {
  version: number;
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  nodes: any[];
  edges: any[];
  assets: AssetItem[];
  settings: Record<string, any>;
}
