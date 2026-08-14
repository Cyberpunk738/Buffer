import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '../../store/editor.store';
import { usePipelineStore } from '../../store/pipeline.store';
import { useProjectStore } from '../../store/project.store';
import { useHistoryStore } from '../../store/history.store';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Grid, 
  Upload, 
  Layers, 
  Eye, 
  Sparkles,
  ArrowRight,
  SplitSquareVertical
} from 'lucide-react';
import { clsx } from 'clsx';

export const PreviewCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const viewport = useEditorStore((state) => state.viewport);
  const updateViewport = useEditorStore((state) => state.updateViewport);
  const resetViewport = useEditorStore((state) => state.resetViewport);
  
  const beforeAfterMode = useEditorStore((state) => state.beforeAfterMode);
  const setBeforeAfterMode = useEditorStore((state) => state.setBeforeAfterMode);
  const setSelectedNodeId = useEditorStore((state) => state.setSelectedNodeId);

  const assets = useProjectStore((state) => state.assets);
  const addAsset = useProjectStore((state) => state.addAsset);

  const nodes = usePipelineStore((state) => state.nodes);
  const loadAssetAsInput = usePipelineStore((state) => state.loadAssetAsInput);
  const getImageInputNode = usePipelineStore((state) => state.getImageInputNode);
  const pushSnapshot = useHistoryStore((state) => state.pushSnapshot);

  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [activeImage, setActiveImage] = useState<HTMLImageElement | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Get active asset
  const inputNode = getImageInputNode();
  const activeAssetId = inputNode?.data?.assetId || (assets.length > 0 ? assets[0].id : null);
  const currentAsset = assets.find((a) => a.id === activeAssetId);

  // Load asset image element when changed
  useEffect(() => {
    if (!currentAsset) {
      setActiveImage(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentAsset.dataUrl;
    img.onload = () => {
      setActiveImage(img);
    };
  }, [currentAsset]);

  // Process and draw Canvas Image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = activeImage.width;
    canvas.height = activeImage.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If "Before" mode is selected, draw raw original image
    if (beforeAfterMode === 'before') {
      ctx.drawImage(activeImage, 0, 0);
      return;
    }

    // In "After" mode, simulate combined active filter parameters for instant visual feedback
    let brightness = 0;
    let contrast = 0;
    let saturation = 0;
    let blur = 0;
    let grayscale = false;
    let invert = false;
    let hue = 0;

    nodes.forEach((node) => {
      const type = node.data.definitionType;
      const params = node.data.parameters || {};

      if (type === 'filter-brightness') brightness += params.brightness || 0;
      if (type === 'filter-contrast') contrast += params.contrast || 0;
      if (type === 'filter-saturation') saturation += params.saturation || 0;
      if (type === 'filter-blur') blur += params.radius || 0;
      if (type === 'filter-grayscale') grayscale = true;
      if (type === 'filter-invert') invert = true;
      if (type === 'color-hue') hue += params.hue || 0;
    });

    ctx.save();
    
    // Apply CSS Filter pipeline on canvas context
    const filters: string[] = [];
    if (blur > 0) filters.push(`blur(${blur}px)`);
    if (brightness !== 0) filters.push(`brightness(${100 + brightness}%)`);
    if (contrast !== 0) filters.push(`contrast(${100 + contrast}%)`);
    if (saturation !== 0) filters.push(`saturate(${100 + saturation}%)`);
    if (grayscale) filters.push('grayscale(100%)');
    if (invert) filters.push('invert(100%)');
    if (hue !== 0) filters.push(`hue-rotate(${hue}deg)`);

    if (filters.length > 0) {
      ctx.filter = filters.join(' ');
    }

    ctx.drawImage(activeImage, 0, 0);
    ctx.restore();
  }, [activeImage, nodes, beforeAfterMode]);

  // File Upload Logic
  const handleProcessFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

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
        const nodeId = loadAssetAsInput(newAsset);
        setSelectedNodeId(nodeId);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  // Drag and Drop Handling
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Wheel Zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 0.1), 5.0);
      updateViewport({ zoom: newZoom });
    },
    [viewport.zoom, updateViewport]
  );

  // Pan Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!currentAsset) return;
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - viewport.panX, y: e.clientY - viewport.panY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    updateViewport({
      panX: e.clientX - startPan.x,
      panY: e.clientY - startPan.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={clsx(
        'relative w-full h-full overflow-hidden flex items-center justify-center select-none transition-colors',
        viewport.showCheckerboard ? 'checkerboard-bg' : 'bg-neutral-950',
        isDraggingFile ? 'border-2 border-blue-500 bg-blue-950/20' : ''
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* EMPTY STATE - Shown when no image is loaded */}
      {!currentAsset ? (
        <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-5 z-10">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-950/50">
            <Layers className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-neutral-100 tracking-tight">
              Process Images Visually
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Buffer lets you construct non-destructive image pipelines. Start with an image, then add effects.
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Upload className="w-4 h-4" />
            Upload an Image
          </button>

          <p className="text-[11px] text-neutral-500">
            or drag and drop an image anywhere onto the canvas
          </p>
        </div>
      ) : (
        /* CANVAS VIEWPORT */
        <div
          style={{
            transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
          }}
          className="shadow-2xl rounded border border-neutral-800"
        >
          <canvas ref={canvasRef} className="block max-w-[85vw] max-h-[70vh] object-contain" />
        </div>
      )}

      {/* CANVAS FLOATING TOOLBAR */}
      {currentAsset && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 p-1 bg-neutral-900/90 border border-neutral-800 rounded-lg backdrop-blur shadow-lg z-10 text-xs">
          <button
            onClick={() => updateViewport({ zoom: Math.max(viewport.zoom - 0.15, 0.1) })}
            title="Zoom Out"
            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-[11px] text-neutral-300 px-2 min-w-[45px] text-center">
            {Math.round(viewport.zoom * 100)}%
          </span>

          <button
            onClick={() => updateViewport({ zoom: Math.min(viewport.zoom + 0.15, 5.0) })}
            title="Zoom In"
            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-neutral-800 mx-0.5" />

          <button
            onClick={resetViewport}
            title="Reset Zoom & Pan"
            className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => updateViewport({ showCheckerboard: !viewport.showCheckerboard })}
            title="Toggle Transparency Checkerboard"
            className={clsx(
              'p-1.5 rounded transition-colors',
              viewport.showCheckerboard
                ? 'bg-blue-950/80 text-blue-400 border border-blue-800/40'
                : 'hover:bg-neutral-800 text-neutral-400'
            )}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* BEFORE / AFTER COMPARISON TOGGLE */}
      {currentAsset && (
        <div className="absolute top-3 right-3 flex items-center bg-neutral-900/90 border border-neutral-800 rounded-lg p-0.5 shadow-lg z-10 backdrop-blur">
          <button
            onClick={() => setBeforeAfterMode('before')}
            className={clsx(
              'px-2.5 py-1 rounded text-xs font-semibold transition-colors',
              beforeAfterMode === 'before'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                : 'text-neutral-400 hover:text-neutral-200'
            )}
          >
            Original
          </button>

          <button
            onClick={() => setBeforeAfterMode('after')}
            className={clsx(
              'px-2.5 py-1 rounded text-xs font-semibold transition-colors',
              beforeAfterMode === 'after'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            )}
          >
            Processed Output
          </button>
        </div>
      )}

      {/* CANVAS STATUS BADGE */}
      {currentAsset && (
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-neutral-900/80 border border-neutral-800 rounded text-[10px] font-mono text-neutral-300 flex items-center gap-2 backdrop-blur">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {beforeAfterMode === 'before' ? 'Original Preview' : 'Processed Result'}
          </span>
          <span className="text-neutral-500">|</span>
          <span>
            {currentAsset.width} × {currentAsset.height} px
          </span>
        </div>
      )}
    </div>
  );
};
