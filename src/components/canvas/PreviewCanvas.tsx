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
  Crop as CropIcon,
  Scaling,
  Check,
  RotateCcw as ResetIcon
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

  const isCropEditing = useEditorStore((state) => state.isCropEditing);
  const setCropEditing = useEditorStore((state) => state.setCropEditing);

  const assets = useProjectStore((state) => state.assets);
  const addAsset = useProjectStore((state) => state.addAsset);

  const nodes = usePipelineStore((state) => state.nodes);
  const updateNodeParameter = usePipelineStore((state) => state.updateNodeParameter);
  const loadAssetAsInput = usePipelineStore((state) => state.loadAssetAsInput);
  const getImageInputNode = usePipelineStore((state) => state.getImageInputNode);
  const pushSnapshot = useHistoryStore((state) => state.pushSnapshot);

  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [activeImage, setActiveImage] = useState<HTMLImageElement | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // DOM Canvas Size Tracking for exact coordinate mapping
  const [canvasDomSize, setCanvasDomSize] = useState({ width: 1, height: 1 });

  // Drag handle states for Crop & Resize
  const [activeDragHandle, setActiveDragHandle] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'crop' | 'resize' | null>(null);
  const [dragStart, setDragStart] = useState<{
    x: number;
    y: number;
    cropX: number;
    cropY: number;
    cropW: number;
    cropH: number;
    resizeW: number;
    resizeH: number;
  } | null>(null);

  // Active transform nodes
  const cropNode = nodes.find((n) => n.data.definitionType === 'transform-crop');
  const resizeNode = nodes.find((n) => n.data.definitionType === 'transform-resize');

  const isCropActive = Boolean(cropNode) && isCropEditing && beforeAfterMode !== 'before';
  const isResizeActive = Boolean(resizeNode) && !isCropActive && beforeAfterMode !== 'before';

  // Active Asset
  const inputNode = getImageInputNode();
  const activeAssetId = inputNode?.data?.assetId || (assets.length > 0 ? assets[0].id : null);
  const currentAsset = assets.find((a) => a.id === activeAssetId);

  // Load asset image element
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

  // Image Dimensions
  const imageW = activeImage?.width || 1000;
  const imageH = activeImage?.height || 1000;

  // Crop values
  const hasCropNode = Boolean(cropNode);
  const rawCropX = Number(cropNode?.data?.parameters?.x ?? 0);
  const rawCropY = Number(cropNode?.data?.parameters?.y ?? 0);
  const rawCropW = Number(cropNode?.data?.parameters?.width ?? imageW);
  const rawCropH = Number(cropNode?.data?.parameters?.height ?? imageH);

  const cropX = Math.max(0, Math.min(rawCropX, imageW - 20));
  const cropY = Math.max(0, Math.min(rawCropY, imageH - 20));
  const cropW = Math.max(20, Math.min(rawCropW, imageW - cropX));
  const cropH = Math.max(20, Math.min(rawCropH, imageH - cropY));

  // Resize values
  const resizeW = Math.max(20, Number(resizeNode?.data?.parameters?.width ?? (hasCropNode ? cropW : imageW)));
  const resizeH = Math.max(20, Number(resizeNode?.data?.parameters?.height ?? (hasCropNode ? cropH : imageH)));
  const keepAspect = resizeNode?.data?.parameters?.maintainAspectRatio ?? true;

  // Measure Canvas DOM element size after draw
  const updateCanvasDomSize = useCallback(() => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      // Calculate un-scaled width & height (divide by zoom)
      const w = rect.width / (viewport.zoom || 1);
      const h = rect.height / (viewport.zoom || 1);
      if (w > 0 && h > 0) {
        setCanvasDomSize({ width: w, height: h });
      }
    }
  }, [viewport.zoom]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rotateAngle = 0;
    let flipH = false;
    let flipV = false;

    let brightness = 0;
    let contrast = 0;
    let saturation = 0;
    let blur = 0;
    let grayscale = false;
    let invert = false;
    let hue = 0;
    let exposure = 0;
    let temperature = 0;
    let sharpen = 0;

    nodes.forEach((node) => {
      const type = node.data.definitionType;
      const params = node.data.parameters || {};

      if (type === 'transform-rotate') rotateAngle += Number(params.angle || 0);
      if (type === 'transform-flip') {
        if (params.horizontal) flipH = !flipH;
        if (params.vertical) flipV = !flipV;
      }

      if (type === 'filter-brightness') brightness += Number(params.brightness || 0);
      if (type === 'filter-contrast') contrast += Number(params.contrast || 0);
      if (type === 'filter-saturation') saturation += Number(params.saturation || 0);
      if (type === 'filter-blur') blur += Number(params.radius || 0);
      if (type === 'filter-sharpen') sharpen += Number(params.strength || 0);
      if (type === 'filter-grayscale') grayscale = true;
      if (type === 'filter-invert') invert = true;
      if (type === 'color-hue') hue += Number(params.hue || 0);
      if (type === 'color-exposure') exposure += Number(params.exposure || 0);
      if (type === 'color-temperature') temperature += Number(params.temperature || 0);
    });

    const baseW = isCropActive ? activeImage.width : (resizeNode ? resizeW : cropW);
    const baseH = isCropActive ? activeImage.height : (resizeNode ? resizeH : cropH);

    const rad = (rotateAngle * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));

    const rotatedWidth = Math.round(baseW * cos + baseH * sin);
    const rotatedHeight = Math.round(baseW * sin + baseH * cos);

    canvas.width = rotatedWidth;
    canvas.height = rotatedHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Before Mode: draw original un-cropped image
    if (beforeAfterMode === 'before') {
      canvas.width = activeImage.width;
      canvas.height = activeImage.height;
      ctx.drawImage(activeImage, 0, 0);
      updateCanvasDomSize();
      return;
    }

    ctx.save();

    if (rotateAngle !== 0 || flipH || flipV) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      if (rotateAngle !== 0) ctx.rotate(rad);
      if (flipH || flipV) ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    }

    // Apply CSS Filters
    const filters: string[] = [];
    if (blur > 0) filters.push(`blur(${blur}px)`);

    const effectiveBrightness = 100 + brightness + exposure * 25;
    if (effectiveBrightness !== 100) filters.push(`brightness(${Math.max(0, effectiveBrightness)}%)`);

    const effectiveContrast = 100 + contrast + (sharpen > 0 ? sharpen * 0.3 : 0);
    if (effectiveContrast !== 100) filters.push(`contrast(${Math.max(0, effectiveContrast)}%)`);

    if (saturation !== 0) filters.push(`saturate(${Math.max(0, 100 + saturation)}%)`);
    if (grayscale) filters.push('grayscale(100%)');
    if (invert) filters.push('invert(100%)');

    const effectiveHue = hue + (temperature > 0 ? temperature * 0.3 : temperature < 0 ? temperature * 0.3 : 0);
    if (effectiveHue !== 0) filters.push(`hue-rotate(${effectiveHue}deg)`);
    if (temperature > 0) filters.push(`sepia(${temperature * 0.4}%)`);

    if (filters.length > 0) ctx.filter = filters.join(' ');

    if (isCropActive) {
      // In Crop Editing Mode: Draw full image from top-left (0,0) so overlay coordinates align 1-to-1!
      ctx.drawImage(activeImage, 0, 0, activeImage.width, activeImage.height);
    } else {
      // Clean Crop Output Mode: Draw ONLY the cropped section (cropX, cropY, cropW, cropH) onto canvas!
      ctx.drawImage(
        activeImage,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        baseW,
        baseH
      );
    }

    ctx.restore();
    updateCanvasDomSize();
  }, [activeImage, nodes, beforeAfterMode, isCropActive, cropX, cropY, cropW, cropH, resizeW, resizeH, resizeNode, updateCanvasDomSize]);

  // Screen-to-Image Scale factors
  const scaleX = activeImage ? canvasDomSize.width / activeImage.width : 1;
  const scaleY = activeImage ? canvasDomSize.height / activeImage.height : 1;

  // Pointer Drag Handlers for Crop & Resize
  const handlePointerDown = (mode: 'crop' | 'resize', handle: string, e: React.PointerEvent) => {
    e.stopPropagation();
    pushSnapshot();
    setActiveDragHandle(handle);
    setDragMode(mode);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      cropX,
      cropY,
      cropW,
      cropH,
      resizeW,
      resizeH
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDragHandle || !dragStart || !dragMode || !activeImage) return;

    // Convert mouse screen pixels delta to actual image resolution pixels
    const dx = ((e.clientX - dragStart.x) / viewport.zoom) / (scaleX || 1);
    const dy = ((e.clientY - dragStart.y) / viewport.zoom) / (scaleY || 1);

    if (dragMode === 'crop' && cropNode) {
      let newX = dragStart.cropX;
      let newY = dragStart.cropY;
      let newW = dragStart.cropW;
      let newH = dragStart.cropH;

      if (activeDragHandle === 'move') {
        newX = Math.max(0, Math.min(dragStart.cropX + dx, imageW - dragStart.cropW));
        newY = Math.max(0, Math.min(dragStart.cropY + dy, imageH - dragStart.cropH));
      } else {
        if (activeDragHandle.includes('l')) {
          const potX = Math.max(0, Math.min(dragStart.cropX + dx, dragStart.cropX + dragStart.cropW - 30));
          newW = dragStart.cropW + (dragStart.cropX - potX);
          newX = potX;
        }
        if (activeDragHandle.includes('r')) {
          newW = Math.max(30, Math.min(dragStart.cropW + dx, imageW - dragStart.cropX));
        }
        if (activeDragHandle.includes('t')) {
          const potY = Math.max(0, Math.min(dragStart.cropY + dy, dragStart.cropY + dragStart.cropH - 30));
          newH = dragStart.cropH + (dragStart.cropY - potY);
          newY = potY;
        }
        if (activeDragHandle.includes('b')) {
          newH = Math.max(30, Math.min(dragStart.cropH + dy, imageH - dragStart.cropY));
        }
      }

      updateNodeParameter(cropNode.id, 'x', Math.round(newX));
      updateNodeParameter(cropNode.id, 'y', Math.round(newY));
      updateNodeParameter(cropNode.id, 'width', Math.round(newW));
      updateNodeParameter(cropNode.id, 'height', Math.round(newH));
    }

    if (dragMode === 'resize' && resizeNode) {
      let newW = dragStart.resizeW;
      let newH = dragStart.resizeH;

      if (activeDragHandle.includes('r')) newW = Math.max(50, dragStart.resizeW + dx);
      if (activeDragHandle.includes('l')) newW = Math.max(50, dragStart.resizeW - dx);
      if (activeDragHandle.includes('b')) newH = Math.max(50, dragStart.resizeH + dy);
      if (activeDragHandle.includes('t')) newH = Math.max(50, dragStart.resizeH - dy);

      if (keepAspect) {
        const aspect = dragStart.resizeW / dragStart.resizeH;
        newH = Math.round(newW / aspect);
      }

      updateNodeParameter(resizeNode.id, 'width', Math.round(newW));
      updateNodeParameter(resizeNode.id, 'height', Math.round(newH));
    }
  };

  const handlePointerUp = () => {
    setActiveDragHandle(null);
    setDragMode(null);
    setDragStart(null);
  };

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
    if (files && files.length > 0) handleProcessFile(files[0]);
  };

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
    if (!currentAsset || activeDragHandle) return;
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

  const displayW = isCropActive ? cropW : (resizeNode ? resizeW : cropW);
  const displayH = isCropActive ? cropH : (resizeNode ? resizeH : cropH);

  // Exact Scaled Overlay Coordinates matching DOM Canvas size
  const domCropX = cropX * scaleX;
  const domCropY = cropY * scaleY;
  const domCropW = cropW * scaleX;
  const domCropH = cropH * scaleY;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={clsx(
        'relative w-full h-full overflow-hidden flex items-center justify-center select-none transition-colors touch-none',
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

      {/* EMPTY STATE */}
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
        /* CANVAS VIEWPORT CONTAINER */
        <div
          style={{
            transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
            transformOrigin: 'center center',
            transition: isPanning || activeDragHandle ? 'none' : 'transform 0.1s ease-out'
          }}
          className="relative shadow-2xl rounded border border-neutral-800"
        >
          <canvas ref={canvasRef} className="block max-w-[85vw] max-h-[70vh] object-contain" />

          {/* CROP INTERACTIVE OVERLAY WITH EXACT DOM COORDINATE MAPPING */}
          {isCropActive && activeImage && (
            <div 
              className="absolute inset-0 pointer-events-auto"
              style={{
                width: `${canvasDomSize.width}px`,
                height: `${canvasDomSize.height}px`
              }}
            >
              {/* Outer Dark Mask Vignette */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <mask id="crop-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x={domCropX}
                      y={domCropY}
                      width={domCropW}
                      height={domCropH}
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  fill="rgba(0,0,0,0.65)"
                  mask="url(#crop-mask)"
                />
              </svg>

              {/* Crop Box Area */}
              <div
                style={{
                  left: `${domCropX}px`,
                  top: `${domCropY}px`,
                  width: `${domCropW}px`,
                  height: `${domCropH}px`
                }}
                onPointerDown={(e) => handlePointerDown('crop', 'move', e)}
                className="absolute border-2 border-white shadow-2xl cursor-move group/crop font-sans"
              >
                {/* 3x3 Rule of Thirds Grid Lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/20">
                  <div className="border-r border-b border-white/30" />
                  <div className="border-r border-b border-white/30" />
                  <div className="border-b border-white/30" />
                  <div className="border-r border-b border-white/30" />
                  <div className="border-r border-b border-white/30" />
                  <div className="border-b border-white/30" />
                  <div className="border-r border-white/30" />
                  <div className="border-r border-white/30" />
                  <div />
                </div>

                {/* Corner Handles */}
                <div
                  onPointerDown={(e) => handlePointerDown('crop', 'tl', e)}
                  className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-4 border-l-4 border-white bg-blue-600 rounded-tl cursor-nwse-resize hover:scale-125 transition-transform"
                />
                <div
                  onPointerDown={(e) => handlePointerDown('crop', 'tr', e)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-4 border-r-4 border-white bg-blue-600 rounded-tr cursor-nesw-resize hover:scale-125 transition-transform"
                />
                <div
                  onPointerDown={(e) => handlePointerDown('crop', 'bl', e)}
                  className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-4 border-l-4 border-white bg-blue-600 rounded-bl cursor-nesw-resize hover:scale-125 transition-transform"
                />
                <div
                  onPointerDown={(e) => handlePointerDown('crop', 'br', e)}
                  className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-4 border-r-4 border-white bg-blue-600 rounded-br cursor-nwse-resize hover:scale-125 transition-transform"
                />

                {/* Side Handles */}
                <div
                  onPointerDown={(e) => handlePointerDown('crop', 't', e)}
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2 border-t-4 border-white bg-blue-600 rounded-full cursor-ns-resize"
                />
                <div
                  onPointerDown={(e) => handlePointerDown('crop', 'b', e)}
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-2 border-b-4 border-white bg-blue-600 rounded-full cursor-ns-resize"
                />
                <div
                  onPointerDown={(e) => handlePointerDown('crop', 'l', e)}
                  className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-8 border-l-4 border-white bg-blue-600 rounded-full cursor-ew-resize"
                />
                <div
                  onPointerDown={(e) => handlePointerDown('crop', 'r', e)}
                  className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-8 border-r-4 border-white bg-blue-600 rounded-full cursor-ew-resize"
                />

                <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 text-[10px] font-mono text-white border border-white/20 whitespace-nowrap shadow-lg">
                  {cropW} × {cropH} px
                </div>
              </div>
            </div>
          )}

          {/* RESIZE INTERACTIVE OVERLAY */}
          {isResizeActive && (
            <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none shadow-2xl">
              {/* Resize Corner Handles */}
              <div
                onPointerDown={(e) => handlePointerDown('resize', 'tl', e)}
                className="pointer-events-auto absolute -top-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-neutral-900 rounded-sm cursor-nwse-resize hover:scale-125 transition-transform"
              />
              <div
                onPointerDown={(e) => handlePointerDown('resize', 'tr', e)}
                className="pointer-events-auto absolute -top-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-neutral-900 rounded-sm cursor-nesw-resize hover:scale-125 transition-transform"
              />
              <div
                onPointerDown={(e) => handlePointerDown('resize', 'bl', e)}
                className="pointer-events-auto absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 border-2 border-neutral-900 rounded-sm cursor-nesw-resize hover:scale-125 transition-transform"
              />
              <div
                onPointerDown={(e) => handlePointerDown('resize', 'br', e)}
                className="pointer-events-auto absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border-2 border-neutral-900 rounded-sm cursor-nwse-resize hover:scale-125 transition-transform"
              />

              {/* Resize Side Handles */}
              <div
                onPointerDown={(e) => handlePointerDown('resize', 't', e)}
                className="pointer-events-auto absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2 bg-blue-500 border border-neutral-900 rounded-full cursor-ns-resize"
              />
              <div
                onPointerDown={(e) => handlePointerDown('resize', 'b', e)}
                className="pointer-events-auto absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-2 bg-blue-500 border border-neutral-900 rounded-full cursor-ns-resize"
              />
              <div
                onPointerDown={(e) => handlePointerDown('resize', 'l', e)}
                className="pointer-events-auto absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-8 bg-blue-500 border border-neutral-900 rounded-full cursor-ew-resize"
              />
              <div
                onPointerDown={(e) => handlePointerDown('resize', 'r', e)}
                className="pointer-events-auto absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-8 bg-blue-500 border border-neutral-900 rounded-full cursor-ew-resize"
              />

              <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 text-[10px] font-mono text-blue-300 border border-blue-500/40 whitespace-nowrap shadow-lg">
                Resizing: {resizeW} × {resizeH} px
              </div>
            </div>
          )}
        </div>
      )}

      {/* CROP CONTROL TOOLBAR OVERLAY WITH DONE BUTTON */}
      {isCropActive && currentAsset && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-neutral-900/95 border border-neutral-700 rounded-xl backdrop-blur-md shadow-2xl z-20 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-1.5 font-bold text-neutral-200 px-2 border-r border-neutral-800">
            <CropIcon className="w-4 h-4 text-amber-400" />
            <span>Crop Mode</span>
          </div>

          <div className="flex items-center gap-1">
            {[
              { label: 'Free', w: activeImage?.width, h: activeImage?.height },
              { label: '1:1', ratio: 1 },
              { label: '4:3', ratio: 4 / 3 },
              { label: '16:9', ratio: 16 / 9 },
              { label: '9:16', ratio: 9 / 16 },
              { label: '3:2', ratio: 3 / 2 }
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  if (!cropNode || !activeImage) return;
                  pushSnapshot();
                  if (preset.label === 'Free') {
                    updateNodeParameter(cropNode.id, 'x', 0);
                    updateNodeParameter(cropNode.id, 'y', 0);
                    updateNodeParameter(cropNode.id, 'width', activeImage.width);
                    updateNodeParameter(cropNode.id, 'height', activeImage.height);
                  } else if (preset.ratio) {
                    let w = cropW;
                    let h = Math.round(w / preset.ratio);
                    if (h > activeImage.height) {
                      h = activeImage.height;
                      w = Math.round(h * preset.ratio);
                    }
                    updateNodeParameter(cropNode.id, 'width', w);
                    updateNodeParameter(cropNode.id, 'height', h);
                  }
                }}
                className="px-2 py-1 rounded bg-neutral-950 border border-neutral-800 hover:border-blue-500 text-[11px] font-medium text-neutral-300 hover:text-white transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-4 bg-neutral-800" />

          {/* Reset Crop Button */}
          <button
            onClick={() => {
              if (!cropNode || !activeImage) return;
              pushSnapshot();
              updateNodeParameter(cropNode.id, 'x', 0);
              updateNodeParameter(cropNode.id, 'y', 0);
              updateNodeParameter(cropNode.id, 'width', activeImage.width);
              updateNodeParameter(cropNode.id, 'height', activeImage.height);
            }}
            className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium flex items-center gap-1"
          >
            <ResetIcon className="w-3 h-3" />
            Reset
          </button>

          {/* Apply & Done Button */}
          <button
            onClick={() => setCropEditing(false)}
            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all transform hover:scale-105"
          >
            <Check className="w-3.5 h-3.5" />
            Apply & Done
          </button>
        </div>
      )}

      {/* RESIZE CONTROL TOOLBAR OVERLAY */}
      {isResizeActive && currentAsset && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-neutral-900/95 border border-neutral-700 rounded-xl backdrop-blur-md shadow-2xl z-20 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-neutral-200 px-2 border-r border-neutral-800">
            <Scaling className="w-4 h-4 text-blue-400" />
            <span>Resize Mode</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-300">
            <span>Width: {resizeW}px</span>
            <span>×</span>
            <span>Height: {resizeH}px</span>
          </div>

          <div className="w-[1px] h-4 bg-neutral-800" />

          <button
            onClick={() => {
              if (!resizeNode || !activeImage) return;
              pushSnapshot();
              updateNodeParameter(resizeNode.id, 'width', activeImage.width);
              updateNodeParameter(resizeNode.id, 'height', activeImage.height);
            }}
            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1"
          >
            <ResetIcon className="w-3 h-3" />
            Reset Original Size
          </button>
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
            {displayW} × {displayH} px
          </span>
        </div>
      )}
    </div>
  );
};
