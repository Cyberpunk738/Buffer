import React from 'react';
import { usePipelineStore } from '../../store/pipeline.store';
import { useEditorStore } from '../../store/editor.store';
import { useHistoryStore } from '../../store/history.store';
import { useProjectStore } from '../../store/project.store';
import { useResponsive } from '../../hooks/useResponsive';
import { Sliders, Sparkles, Sun, RotateCcw, Plus, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';

export const QuickEditPanel: React.FC = () => {
  const nodes = usePipelineStore((state) => state.nodes);
  const appendNodeToPipeline = usePipelineStore((state) => state.appendNodeToPipeline);
  const updateNodeParameter = usePipelineStore((state) => state.updateNodeParameter);
  const removeNode = usePipelineStore((state) => state.removeNode);
  const getImageInputNode = usePipelineStore((state) => state.getImageInputNode);

  const pushSnapshot = useHistoryStore((state) => state.pushSnapshot);
  const setNodeSearchOpen = useEditorStore((state) => state.setNodeSearchOpen);

  const { isMobile, isTablet } = useResponsive();

  const assets = useProjectStore((state) => state.assets);
  const hasImage = Boolean(getImageInputNode() || assets.length > 0);

  const getOrCreateNode = (type: string) => {
    let node = nodes.find((n) => n.data.definitionType === type);
    if (!node) {
      pushSnapshot();
      const newId = appendNodeToPipeline(type);
      node = usePipelineStore.getState().nodes.find((n) => n.id === newId);
    }
    return node;
  };

  const brightnessNode = nodes.find((n) => n.data.definitionType === 'filter-brightness');
  const contrastNode = nodes.find((n) => n.data.definitionType === 'filter-contrast');
  const saturationNode = nodes.find((n) => n.data.definitionType === 'filter-saturation');
  const blurNode = nodes.find((n) => n.data.definitionType === 'filter-blur');

  const brightnessVal = brightnessNode?.data.parameters?.brightness ?? 0;
  const contrastVal = contrastNode?.data.parameters?.contrast ?? 0;
  const saturationVal = saturationNode?.data.parameters?.saturation ?? 0;
  const blurVal = blurNode?.data.parameters?.radius ?? 0;

  const handleSliderChange = (type: string, paramId: string, value: number) => {
    const node = getOrCreateNode(type);
    if (node) {
      updateNodeParameter(node.id, paramId, value);
    }
  };

  const hasEffect = (type: string) => nodes.some((n) => n.data.definitionType === type);

  const toggleEffectNode = (type: string) => {
    pushSnapshot();
    const existing = nodes.find((n) => n.data.definitionType === type);
    if (existing) {
      removeNode(existing.id);
    } else {
      appendNodeToPipeline(type);
    }
  };

  if (!hasImage) {
    return (
      <div
        className={clsx(
          'bg-neutral-900 border-l border-neutral-800 flex flex-col items-center justify-center p-6 text-center text-neutral-500 space-y-3 shrink-0 select-none',
          isMobile || isTablet ? 'w-full h-auto border-t border-l-0 border-neutral-800 p-4' : 'w-80 h-full'
        )}
      >
        <ImageIcon className="w-8 h-8 text-neutral-600" />
        <p className="text-xs font-semibold text-neutral-400">Upload an Image First</p>
        <p className="text-[11px] text-neutral-500 max-w-xs">
          Once you upload an image, Quick Edit controls will appear here to adjust brightness, contrast, filters, and effects.
        </p>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'bg-neutral-900 border-l border-neutral-800 flex flex-col z-10 shrink-0 select-none overflow-y-auto p-4 space-y-6',
        isMobile || isTablet ? 'w-full h-auto max-h-[40vh] border-t border-l-0' : 'w-80 h-full'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
            Quick Edit
          </h3>
        </div>
      </div>

      {/* QUICK ADJUSTMENTS SECTION */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          Adjustments
        </h4>

        {/* Brightness Slider */}
        <div className="space-y-1.5 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-neutral-300">Brightness</span>
            <span className="font-mono text-neutral-400">{brightnessVal}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={brightnessVal}
            onMouseDown={pushSnapshot}
            onChange={(e) => handleSliderChange('filter-brightness', 'brightness', parseFloat(e.target.value))}
            className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Contrast Slider */}
        <div className="space-y-1.5 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-neutral-300">Contrast</span>
            <span className="font-mono text-neutral-400">{contrastVal}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={contrastVal}
            onMouseDown={pushSnapshot}
            onChange={(e) => handleSliderChange('filter-contrast', 'contrast', parseFloat(e.target.value))}
            className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Saturation Slider */}
        <div className="space-y-1.5 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-neutral-300">Saturation</span>
            <span className="font-mono text-neutral-400">{saturationVal}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={saturationVal}
            onMouseDown={pushSnapshot}
            onChange={(e) => handleSliderChange('filter-saturation', 'saturation', parseFloat(e.target.value))}
            className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Blur Slider */}
        <div className="space-y-1.5 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-neutral-300">Blur Radius</span>
            <span className="font-mono text-neutral-400">{blurVal} px</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            value={blurVal}
            onMouseDown={pushSnapshot}
            onChange={(e) => handleSliderChange('filter-blur', 'radius', parseFloat(e.target.value))}
            className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* QUICK EFFECTS SECTION */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Quick Effects
        </h4>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => toggleEffectNode('filter-grayscale')}
            className={clsx(
              'p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors',
              hasEffect('filter-grayscale')
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
            )}
          >
            Grayscale
          </button>

          <button
            onClick={() => toggleEffectNode('filter-invert')}
            className={clsx(
              'p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors',
              hasEffect('filter-invert')
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
            )}
          >
            Invert Colors
          </button>

          <button
            onClick={() => toggleEffectNode('filter-sharpen')}
            className={clsx(
              'p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors',
              hasEffect('filter-sharpen')
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
            )}
          >
            Sharpen
          </button>

          <button
            onClick={() => toggleEffectNode('color-hue')}
            className={clsx(
              'p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors',
              hasEffect('color-hue')
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
            )}
          >
            Hue Shift
          </button>
        </div>

        <button
          onClick={() => setNodeSearchOpen(true)}
          className="w-full py-2 px-3 rounded-lg border border-dashed border-neutral-800 hover:border-neutral-700 bg-neutral-950/40 text-neutral-400 hover:text-neutral-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          More Effects & Transforms...
        </button>
      </div>
    </div>
  );
};
