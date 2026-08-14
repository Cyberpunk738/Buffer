import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '../../store/editor.store';
import { ZoomIn, ZoomOut, Maximize, RotateCcw, Grid, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';

export const PreviewCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const viewport = useEditorStore((state) => state.viewport);
  const updateViewport = useEditorStore((state) => state.updateViewport);
  const resetViewport = useEditorStore((state) => state.resetViewport);

  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Handle Wheel Zooming
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 0.1), 5.0);
      updateViewport({ zoom: newZoom });
    },
    [viewport.zoom, updateViewport]
  );

  // Handle Mouse Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) { // Left or middle click
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

  // Render sample canvas contents for Phase 1 preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = 600;
    canvas.height = 400;

    // Draw initial test graphic on canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#312e81');
    grad.addColorStop(1, '#4338ca');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines on canvas
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Centered Badge
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BUFFER CANVAS PREVIEW', canvas.width / 2, canvas.height / 2 - 15);

    ctx.fillStyle = '#a5b4fc';
    ctx.font = '14px JetBrains Mono, monospace';
    ctx.fillText('600 × 400 px • Canvas API Active', canvas.width / 2, canvas.height / 2 + 20);
  }, []);

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={clsx(
        'relative w-full h-full overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none',
        viewport.showCheckerboard ? 'checkerboard-bg' : 'bg-neutral-950'
      )}
    >
      {/* Main Canvas Object with Pan & Zoom transform */}
      <div
        style={{
          transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out'
        }}
        className="shadow-2xl rounded border border-neutral-800"
      >
        <canvas ref={canvasRef} className="block" />
      </div>

      {/* Floating Canvas Controls Overlay */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 p-1 bg-neutral-900/90 border border-neutral-800 rounded-lg backdrop-blur shadow-lg z-10 text-xs">
        <button
          onClick={() => updateViewport({ zoom: Math.max(viewport.zoom - 0.15, 0.1) })}
          title="Zoom Out"
          className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="font-mono text-[11px] text-neutral-300 px-2 min-w-[50px] text-center">
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

      {/* Info indicator */}
      <div className="absolute top-3 left-3 px-2.5 py-1 bg-neutral-900/80 border border-neutral-800 rounded text-[10px] font-mono text-neutral-400 flex items-center gap-2 backdrop-blur">
        <span className="flex items-center gap-1 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Preview
        </span>
        <span>600 × 400</span>
      </div>
    </div>
  );
};
