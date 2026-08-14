declare module 'lucide-react' {
  import React from 'react';
  
  export interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }
  
  export type Icon = React.FC<IconProps>;

  export const Sliders: Icon;
  export const Image: Icon;
  export const Crop: Icon;
  export const Sparkles: Icon;
  export const Palette: Icon;
  export const Layers: Icon;
  export const Eye: Icon;
  export const Trash2: Icon;
  export const Copy: Icon;
  export const Clock: Icon;
  export const AlertCircle: Icon;
  export const CheckCircle2: Icon;
  export const RefreshCw: Icon;
  export const ZoomIn: Icon;
  export const ZoomOut: Icon;
  export const Maximize: Icon;
  export const RotateCcw: Icon;
  export const Grid: Icon;
  export const Box: Icon;
  export const FolderOpen: Icon;
  export const Activity: Icon;
  export const Search: Icon;
  export const Plus: Icon;
  export const Upload: Icon;
  export const ChevronRight: Icon;
  export const ChevronDown: Icon;
  export const Undo2: Icon;
  export const Redo2: Icon;
  export const Download: Icon;
  export const Save: Icon;
  export const Command: Icon;
  export const X: Icon;
  export const Info: Icon;
  export const Settings2: Icon;
  export const ArrowRight: Icon;
  export const SplitSquareVertical: Icon;
  export const FileImage: Icon;
  export const Check: Icon;
  export const Sun: Icon;
  export const Contrast: Icon;
  export const GitBranch: Icon;
  export const Wand2: Icon;
  export const PanelLeftClose: Icon;
  export const PanelLeft: Icon;
  export const Monitor: Icon;
  export const Smartphone: Icon;
}
