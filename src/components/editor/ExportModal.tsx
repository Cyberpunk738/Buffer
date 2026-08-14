import React, { useState } from 'react';
import { useEditorStore } from '../../store/editor.store';
import { useProjectStore } from '../../store/project.store';
import { usePipelineStore } from '../../store/pipeline.store';
import { Download, X, FileImage, Check } from 'lucide-react';

export const ExportModal: React.FC = () => {
  const isOpen = useEditorStore((state) => state.isExportModalOpen);
  const setOpen = useEditorStore((state) => state.setExportModalOpen);

  const assets = useProjectStore((state) => state.assets);
  const currentProject = useProjectStore((state) => state.currentProject);
  const getImageInputNode = usePipelineStore((state) => state.getImageInputNode);

  const [filename, setFilename] = useState('buffer-processed-image');
  const [format, setFormat] = useState<'image/webp' | 'image/png' | 'image/jpeg'>('image/webp');
  const [quality, setQuality] = useState(90);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const inputNode = getImageInputNode();
  const activeAsset = assets.find((a) => a.id === inputNode?.data?.assetId) || assets[0];

  const handleDownload = () => {
    setIsExporting(true);

    // Get current preview canvas
    const previewCanvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!previewCanvas) {
      alert('No active canvas available for export.');
      setIsExporting(false);
      return;
    }

    try {
      const dataUrl = previewCanvas.toDataURL(format, quality / 100);
      const ext = format === 'image/webp' ? '.webp' : format === 'image/jpeg' ? '.jpg' : '.png';

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${filename || 'processed-image'}${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => {
        setIsExporting(false);
        setOpen(false);
      }, 300);
    } catch (err) {
      console.error(err);
      alert('Export failed.');
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col select-none">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wide">
              Export Processed Image
            </h3>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5">
          {/* Filename Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">Filename</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full h-9 bg-neutral-950 border border-neutral-800 rounded px-3 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Format Radio Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">Format</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'WebP (Recommended)', value: 'image/webp' },
                { label: 'PNG (Lossless)', value: 'image/png' },
                { label: 'JPEG (Compact)', value: 'image/jpeg' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormat(opt.value as any)}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all ${
                    format === opt.value
                      ? 'bg-blue-950/80 border-blue-500 text-blue-300 shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span>{opt.label.split(' ')[0]}</span>
                  <span className="text-[9px] opacity-75">{opt.label.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider (for JPEG / WebP) */}
          {format !== 'image/png' && (
            <div className="space-y-1.5 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-neutral-300">Quality</span>
                <span className="font-mono text-blue-400">{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer"
              />
            </div>
          )}

          {/* Dimensions Preview */}
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-400 flex items-center justify-between">
            <span className="text-neutral-500">Output Dimensions</span>
            <span className="text-neutral-200">
              {activeAsset ? `${activeAsset.width} × ${activeAsset.height} px` : 'Canvas Resolution'}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded text-xs font-medium text-neutral-400 hover:text-neutral-200"
          >
            Cancel
          </button>

          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-emerald-900/30 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? 'Exporting...' : 'Export Image'}
          </button>
        </div>
      </div>
    </div>
  );
};
