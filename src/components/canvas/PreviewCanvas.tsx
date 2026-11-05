import { getRenderPlan, renderImage } from "../../engine/core/render";
import { readImageFile } from "../../lib/image-file";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { useEditorStore } from "../../store/editor.store";
import { usePipelineStore } from "../../store/pipeline.store";
import { useProjectStore } from "../../store/project.store";
import { useHistoryStore } from "../../store/history.store";
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
  RotateCcw as ResetIcon,
} from "lucide-react";
import { clsx } from "clsx";

export const PreviewCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const viewport = useEditorStore((state) => state.viewport);
  const updateViewport = useEditorStore((state) => state.updateViewport);
  const resetViewport = useEditorStore((state) => state.resetViewport);

  const beforeAfterMode = useEditorStore((state) => state.beforeAfterMode);
  const setBeforeAfterMode = useEditorStore(
    (state) => state.setBeforeAfterMode,
  );
  const setSelectedNodeId = useEditorStore((state) => state.setSelectedNodeId);

  const isCropEditing = useEditorStore((state) => state.isCropEditing);
  const setCropEditing = useEditorStore((state) => state.setCropEditing);

  const assets = useProjectStore((state) => state.assets);
  const addAsset = useProjectStore((state) => state.addAsset);

  const nodes = usePipelineStore((state) => state.nodes);
  const updateNodeParameter = usePipelineStore(
    (state) => state.updateNodeParameter,
  );
  const loadAssetAsInput = usePipelineStore((state) => state.loadAssetAsInput);
  const getImageInputNode = usePipelineStore(
    (state) => state.getImageInputNode,
  );
  const pushSnapshot = useHistoryStore((state) => state.pushSnapshot);

  const [imageError, setImageError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [activeImage, setActiveImage] = useState<HTMLImageElement | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // DOM Canvas Size Tracking for exact coordinate mapping
  const [canvasDomSize, setCanvasDomSize] = useState({ width: 1, height: 1 });

  // Drag handle states for Crop & Resize
  const [activeDragHandle, setActiveDragHandle] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<"crop" | "resize" | null>(null);
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
  const cropNode = nodes.find(
    (n) => n.data.definitionType === "transform-crop",
  );
  const resizeNode = nodes.find(
    (n) => n.data.definitionType === "transform-resize",
  );

  const isCropActive =
    Boolean(cropNode) && isCropEditing && beforeAfterMode !== "before";
  const isResizeActive =
    Boolean(resizeNode) && !isCropActive && beforeAfterMode !== "before";

  // Active Asset
  const inputNode = getImageInputNode();
  const activeAssetId = inputNode?.data?.assetId || null;
  const currentAsset = assets.find((a) => a.id === activeAssetId);

  // Load asset image element
  useEffect(() => {
    if (!currentAsset) {
      setActiveImage(null);
      return;
    }
    let cancelled = false;
    setActiveImage(null);
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setActiveImage(img);
    };
    img.onerror = () => {
      if (!cancelled)
        setImageError(
          "This image could not be loaded. Please choose another file.",
        );
    };
    img.src = currentAsset.dataUrl;
    return () => {
      cancelled = true;
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

  const cropX = Math.max(0, Math.min(rawCropX, imageW - 1));
  const cropY = Math.max(0, Math.min(rawCropY, imageH - 1));
  const cropW = Math.max(1, Math.min(rawCropW, imageW - cropX));
  const cropH = Math.max(1, Math.min(rawCropH, imageH - cropY));

  // Resize values
  const resizeW = Math.max(
    20,
    Number(
      resizeNode?.data?.parameters?.width ?? (hasCropNode ? cropW : imageW),
    ),
  );
  const resizeH = Math.max(
    20,
    Number(
      resizeNode?.data?.parameters?.height ?? (hasCropNode ? cropH : imageH),
    ),
  );
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

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      renderImage(canvas, activeImage, nodes, {
        original: beforeAfterMode === "before",
        editingCrop: isCropActive,
      });
      setImageError("");
    } catch (error) {
      setImageError(
        error instanceof Error
          ? error.message
          : "The image could not be rendered.",
      );
    }
    updateCanvasDomSize();
  }, [
    activeImage,
    nodes,
    beforeAfterMode,
    isCropActive,
    cropX,
    cropY,
    cropW,
    cropH,
    resizeW,
    resizeH,
    resizeNode,
    updateCanvasDomSize,
  ]);

  // Screen-to-Image Scale factors
  const scaleX = activeImage ? canvasDomSize.width / activeImage.width : 1;
  const scaleY = activeImage ? canvasDomSize.height / activeImage.height : 1;

  // Pointer Drag Handlers for Crop & Resize
  const handlePointerDown = (
    mode: "crop" | "resize",
    handle: string,
    e: React.PointerEvent,
  ) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
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
      resizeH,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDragHandle || !dragStart || !dragMode || !activeImage) return;

    // Convert mouse screen pixels delta to actual image resolution pixels
    const dx = (e.clientX - dragStart.x) / viewport.zoom / (scaleX || 1);
    const dy = (e.clientY - dragStart.y) / viewport.zoom / (scaleY || 1);

    if (dragMode === "crop" && cropNode) {
      let newX = dragStart.cropX;
      let newY = dragStart.cropY;
      let newW = dragStart.cropW;
      let newH = dragStart.cropH;

      if (activeDragHandle === "move") {
        newX = Math.max(
          0,
          Math.min(dragStart.cropX + dx, imageW - dragStart.cropW),
        );
        newY = Math.max(
          0,
          Math.min(dragStart.cropY + dy, imageH - dragStart.cropH),
        );
      } else {
        if (activeDragHandle.includes("l")) {
          const potX = Math.max(
            0,
            Math.min(
              dragStart.cropX + dx,
              dragStart.cropX + dragStart.cropW - 30,
            ),
          );
          newW = dragStart.cropW + (dragStart.cropX - potX);
          newX = potX;
        }
        if (activeDragHandle.includes("r")) {
          newW = Math.max(
            30,
            Math.min(dragStart.cropW + dx, imageW - dragStart.cropX),
          );
        }
        if (activeDragHandle.includes("t")) {
          const potY = Math.max(
            0,
            Math.min(
              dragStart.cropY + dy,
              dragStart.cropY + dragStart.cropH - 30,
            ),
          );
          newH = dragStart.cropH + (dragStart.cropY - potY);
          newY = potY;
        }
        if (activeDragHandle.includes("b")) {
          newH = Math.max(
            30,
            Math.min(dragStart.cropH + dy, imageH - dragStart.cropY),
          );
        }
      }

      updateNodeParameter(cropNode.id, "x", Math.round(newX));
      updateNodeParameter(cropNode.id, "y", Math.round(newY));
      updateNodeParameter(cropNode.id, "width", Math.round(newW));
      updateNodeParameter(cropNode.id, "height", Math.round(newH));
    }

    if (dragMode === "resize" && resizeNode) {
      let newW = dragStart.resizeW;
      let newH = dragStart.resizeH;

      if (activeDragHandle.includes("r"))
        newW = Math.max(50, dragStart.resizeW + dx);
      if (activeDragHandle.includes("l"))
        newW = Math.max(50, dragStart.resizeW - dx);
      if (activeDragHandle.includes("b"))
        newH = Math.max(50, dragStart.resizeH + dy);
      if (activeDragHandle.includes("t"))
        newH = Math.max(50, dragStart.resizeH - dy);

      if (keepAspect) {
        const aspect = dragStart.resizeW / dragStart.resizeH;
        newH = Math.round(newW / aspect);
      }

      updateNodeParameter(resizeNode.id, "width", Math.round(newW));
      updateNodeParameter(resizeNode.id, "height", Math.round(newH));
    }
  };

  const handlePointerUp = () => {
    setActiveDragHandle(null);
    setDragMode(null);
    setDragStart(null);
  };

  // File Upload Logic
  const handleProcessFile = async (file: File) => {
    setLoading(true);
    setImageError("");
    try {
      const newAsset = await readImageFile(file);
      pushSnapshot();
      addAsset(newAsset);
      const nodeId = loadAssetAsInput(newAsset);
      setSelectedNodeId(nodeId);
      resetViewport();
      setBeforeAfterMode("after");
      setCropEditing(false);
    } catch (error) {
      setImageError(
        error instanceof Error
          ? error.message
          : "This file could not be opened.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) void handleProcessFile(files[0]);
    e.target.value = "";
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
    [viewport.zoom, updateViewport],
  );

  // Pan Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!currentAsset || activeDragHandle) return;
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      setStartPan({
        x: e.clientX - viewport.panX,
        y: e.clientY - viewport.panY,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    updateViewport({
      panX: e.clientX - startPan.x,
      panY: e.clientY - startPan.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const outputPlan = getRenderPlan(
    imageW,
    imageH,
    nodes,
    beforeAfterMode === "before",
    isCropActive,
  );
  const displayW = outputPlan.width;
  const displayH = outputPlan.height;

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
        "preview-surface relative w-full h-full overflow-hidden flex items-center justify-center select-none transition-colors touch-none",
        viewport.showCheckerboard ? "checkerboard-bg" : "bg-surface",
        isDraggingFile ? "border-2 border-green bg-mint-soft/20" : "",
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {imageError && (
        <div role="alert" className="canvas-error">
          {imageError}
          <button onClick={() => setImageError("")}>Dismiss</button>
        </div>
      )}
      {loading && (
        <div role="status" className="canvas-error">
          Opening your image…
        </div>
      )}
      {/* EMPTY STATE */}
      {!currentAsset ? (
        <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-5 z-10">
          <div className="w-16 h-16 rounded-2xl bg-mint/10 border border-green/30 flex items-center justify-center text-green shadow-xl ">
            <Layers className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-ink tracking-tight">
              A little space to create.
            </h2>
            <p className="text-xs text-muted leading-relaxed">
              Bring an image, try an adjustment, and find a fresh perspective.
              Your original stays intact.
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 px-6 rounded-xl bg-mint hover:bg-mint-hover text-ink font-semibold text-sm shadow-lg  flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Upload className="w-4 h-4" />
            Upload an Image
          </button>

          <p className="text-[11px] text-muted">
            or drop a PNG, JPEG, or WebP here · up to 25 MB
          </p>
        </div>
      ) : (
        /* CANVAS VIEWPORT CONTAINER */
        <div
          style={{
            transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
            transformOrigin: "center center",
            transition:
              isPanning || activeDragHandle
                ? "none"
                : "transform 0.1s ease-out",
          }}
          className="image-wrap relative shadow-lg rounded border border-line"
        >
          <canvas
            aria-label="Image preview"
            data-testid="image-preview"
            ref={canvasRef}
            className="block object-contain"
          />

          {/* CROP INTERACTIVE OVERLAY WITH EXACT DOM COORDINATE MAPPING */}
          {isCropActive && activeImage && (
            <div
              className="absolute inset-0 pointer-events-auto"
              style={{
                width: `${canvasDomSize.width}px`,
                height: `${canvasDomSize.height}px`,
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
                  height: `${domCropH}px`,
                }}
                onPointerDown={(e) => handlePointerDown("crop", "move", e)}
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
                  onPointerDown={(e) => handlePointerDown("crop", "tl", e)}
                  className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-4 border-l-4 border-white bg-mint rounded-tl cursor-nwse-resize hover:scale-125 transition-transform"
                />
                <div
                  onPointerDown={(e) => handlePointerDown("crop", "tr", e)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-4 border-r-4 border-white bg-mint rounded-tr cursor-nesw-resize hover:scale-125 transition-transform"
                />
                <div
                  onPointerDown={(e) => handlePointerDown("crop", "bl", e)}
                  className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-4 border-l-4 border-white bg-mint rounded-bl cursor-nesw-resize hover:scale-125 transition-transform"
                />
                <div
                  onPointerDown={(e) => handlePointerDown("crop", "br", e)}
                  className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-4 border-r-4 border-white bg-mint rounded-br cursor-nwse-resize hover:scale-125 transition-transform"
                />

                {/* Side Handles */}
                <div
                  onPointerDown={(e) => handlePointerDown("crop", "t", e)}
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2 border-t-4 border-white bg-mint rounded-full cursor-ns-resize"
                />
                <div
                  onPointerDown={(e) => handlePointerDown("crop", "b", e)}
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-2 border-b-4 border-white bg-mint rounded-full cursor-ns-resize"
                />
                <div
                  onPointerDown={(e) => handlePointerDown("crop", "l", e)}
                  className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-8 border-l-4 border-white bg-mint rounded-full cursor-ew-resize"
                />
                <div
                  onPointerDown={(e) => handlePointerDown("crop", "r", e)}
                  className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-8 border-r-4 border-white bg-mint rounded-full cursor-ew-resize"
                />

                <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 text-[10px] font-mono text-white border border-white/20 whitespace-nowrap shadow-lg">
                  {cropW} × {cropH} px
                </div>
              </div>
            </div>
          )}

          {/* RESIZE INTERACTIVE OVERLAY */}
          {isResizeActive && (
            <div className="absolute inset-0 border-2 border-green pointer-events-none shadow-2xl">
              {/* Resize Corner Handles */}
              <div
                onPointerDown={(e) => handlePointerDown("resize", "tl", e)}
                className="pointer-events-auto absolute -top-2 -left-2 w-4 h-4 bg-mint-hover border-2 border-line rounded-sm cursor-nwse-resize hover:scale-125 transition-transform"
              />
              <div
                onPointerDown={(e) => handlePointerDown("resize", "tr", e)}
                className="pointer-events-auto absolute -top-2 -right-2 w-4 h-4 bg-mint-hover border-2 border-line rounded-sm cursor-nesw-resize hover:scale-125 transition-transform"
              />
              <div
                onPointerDown={(e) => handlePointerDown("resize", "bl", e)}
                className="pointer-events-auto absolute -bottom-2 -left-2 w-4 h-4 bg-mint-hover border-2 border-line rounded-sm cursor-nesw-resize hover:scale-125 transition-transform"
              />
              <div
                onPointerDown={(e) => handlePointerDown("resize", "br", e)}
                className="pointer-events-auto absolute -bottom-2 -right-2 w-4 h-4 bg-mint-hover border-2 border-line rounded-sm cursor-nwse-resize hover:scale-125 transition-transform"
              />

              {/* Resize Side Handles */}
              <div
                onPointerDown={(e) => handlePointerDown("resize", "t", e)}
                className="pointer-events-auto absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2 bg-mint-hover border border-line rounded-full cursor-ns-resize"
              />
              <div
                onPointerDown={(e) => handlePointerDown("resize", "b", e)}
                className="pointer-events-auto absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-2 bg-mint-hover border border-line rounded-full cursor-ns-resize"
              />
              <div
                onPointerDown={(e) => handlePointerDown("resize", "l", e)}
                className="pointer-events-auto absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-8 bg-mint-hover border border-line rounded-full cursor-ew-resize"
              />
              <div
                onPointerDown={(e) => handlePointerDown("resize", "r", e)}
                className="pointer-events-auto absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-8 bg-mint-hover border border-line rounded-full cursor-ew-resize"
              />

              <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 text-[10px] font-mono text-green border border-green/40 whitespace-nowrap shadow-lg">
                Resizing: {resizeW} × {resizeH} px
              </div>
            </div>
          )}
        </div>
      )}

      {/* CROP CONTROL TOOLBAR OVERLAY WITH DONE BUTTON */}
      {isCropActive && currentAsset && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-white/95 border border-line-strong rounded-xl backdrop-blur-md shadow-2xl z-20 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-1.5 font-bold text-ink px-2 border-r border-line">
            <CropIcon className="w-4 h-4 text-green" />
            <span>Crop Mode</span>
          </div>

          <div className="flex items-center gap-1">
            {[
              { label: "Free", w: activeImage?.width, h: activeImage?.height },
              { label: "1:1", ratio: 1 },
              { label: "4:3", ratio: 4 / 3 },
              { label: "16:9", ratio: 16 / 9 },
              { label: "9:16", ratio: 9 / 16 },
              { label: "3:2", ratio: 3 / 2 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  if (!cropNode || !activeImage) return;
                  pushSnapshot();
                  if (preset.label === "Free") {
                    updateNodeParameter(cropNode.id, "x", 0);
                    updateNodeParameter(cropNode.id, "y", 0);
                    updateNodeParameter(
                      cropNode.id,
                      "width",
                      activeImage.width,
                    );
                    updateNodeParameter(
                      cropNode.id,
                      "height",
                      activeImage.height,
                    );
                  } else if (preset.ratio) {
                    let w = cropW;
                    let h = Math.round(w / preset.ratio);
                    if (h > activeImage.height) {
                      h = activeImage.height;
                      w = Math.round(h * preset.ratio);
                    }
                    updateNodeParameter(cropNode.id, "width", w);
                    updateNodeParameter(cropNode.id, "height", h);
                  }
                }}
                className="px-2 py-1 rounded bg-surface border border-line hover:border-green text-[11px] font-medium text-ink hover:text-ink transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-4 bg-soft" />

          {/* Reset Crop Button */}
          <button
            onClick={() => {
              if (!cropNode || !activeImage) return;
              pushSnapshot();
              updateNodeParameter(cropNode.id, "x", 0);
              updateNodeParameter(cropNode.id, "y", 0);
              updateNodeParameter(cropNode.id, "width", activeImage.width);
              updateNodeParameter(cropNode.id, "height", activeImage.height);
            }}
            className="px-2 py-1 rounded bg-soft hover:bg-soft text-ink text-xs font-medium flex items-center gap-1"
          >
            <ResetIcon className="w-3 h-3" />
            Reset
          </button>

          {/* Apply & Done Button */}
          <button
            onClick={() => setCropEditing(false)}
            className="px-3 py-1 rounded-lg bg-mint hover:bg-mint-hover text-ink font-bold text-xs flex items-center gap-1.5 shadow-md  transition-all transform hover:scale-105"
          >
            <Check className="w-3.5 h-3.5" />
            Apply & Done
          </button>
        </div>
      )}

      {/* RESIZE CONTROL TOOLBAR OVERLAY */}
      {isResizeActive && currentAsset && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-white/95 border border-line-strong rounded-xl backdrop-blur-md shadow-2xl z-20 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-ink px-2 border-r border-line">
            <Scaling className="w-4 h-4 text-green" />
            <span>Resize Mode</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-ink">
            <span>Width: {resizeW}px</span>
            <span>×</span>
            <span>Height: {resizeH}px</span>
          </div>

          <div className="w-[1px] h-4 bg-soft" />

          <button
            onClick={() => {
              if (!resizeNode || !activeImage) return;
              pushSnapshot();
              updateNodeParameter(resizeNode.id, "width", activeImage.width);
              updateNodeParameter(resizeNode.id, "height", activeImage.height);
            }}
            className="px-2.5 py-1 rounded bg-soft hover:bg-soft text-ink text-xs font-semibold flex items-center gap-1"
          >
            <ResetIcon className="w-3 h-3" />
            Reset Original Size
          </button>
        </div>
      )}

      {/* CANVAS FLOATING TOOLBAR */}
      {currentAsset && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 p-1 bg-white/90 border border-line rounded-lg backdrop-blur shadow-lg z-10 text-xs">
          <button
            onClick={() =>
              updateViewport({ zoom: Math.max(viewport.zoom - 0.15, 0.1) })
            }
            title="Zoom Out"
            className="p-1.5 hover:bg-soft text-muted hover:text-ink rounded"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-[11px] text-ink px-2 min-w-[45px] text-center">
            {Math.round(viewport.zoom * 100)}%
          </span>

          <button
            onClick={() =>
              updateViewport({ zoom: Math.min(viewport.zoom + 0.15, 5.0) })
            }
            title="Zoom In"
            className="p-1.5 hover:bg-soft text-muted hover:text-ink rounded"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-soft mx-0.5" />

          <button
            onClick={resetViewport}
            title="Reset Zoom & Pan"
            className="p-1.5 hover:bg-soft text-muted hover:text-ink rounded"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() =>
              updateViewport({ showCheckerboard: !viewport.showCheckerboard })
            }
            title="Toggle Transparency Checkerboard"
            className={clsx(
              "p-1.5 rounded transition-colors",
              viewport.showCheckerboard
                ? "bg-mint-soft/80 text-green border border-line-strong/40"
                : "hover:bg-soft text-muted",
            )}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* BEFORE / AFTER COMPARISON TOGGLE */}
      {currentAsset && (
        <div className="absolute top-3 right-3 flex items-center bg-white/90 border border-line rounded-lg p-0.5 shadow-lg z-10 backdrop-blur">
          <button
            onClick={() => setBeforeAfterMode("before")}
            className={clsx(
              "px-2.5 py-1 rounded text-xs font-semibold transition-colors",
              beforeAfterMode === "before"
                ? "bg-amber-950/80 text-amber-300 border border-amber-800/50"
                : "text-muted hover:text-ink",
            )}
          >
            Original
          </button>

          <button
            onClick={() => setBeforeAfterMode("after")}
            className={clsx(
              "px-2.5 py-1 rounded text-xs font-semibold transition-colors",
              beforeAfterMode === "after"
                ? "bg-mint text-ink shadow-sm"
                : "text-muted hover:text-ink",
            )}
          >
            Your edit
          </button>
        </div>
      )}

      {/* CANVAS STATUS BADGE */}
      {currentAsset && (
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/80 border border-line rounded text-[10px] font-mono text-ink flex items-center gap-2 backdrop-blur">
          <span className="flex items-center gap-1.5 text-green font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {beforeAfterMode === "before"
              ? "Original Preview"
              : "Processed Result"}
          </span>
          <span className="text-muted">|</span>
          <span>
            {displayW} × {displayH} px
          </span>
        </div>
      )}
    </div>
  );
};
