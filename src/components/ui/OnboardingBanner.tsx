import React from 'react';
import { useEditorStore } from '../../store/editor.store';
import { useProjectStore } from '../../store/project.store';
import { usePipelineStore } from '../../store/pipeline.store';
import { Upload, Plus, Sliders, Download, X, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

export const OnboardingBanner: React.FC = () => {
  const isDismissed = useEditorStore((state) => state.isOnboardingDismissed);
  const setDismissed = useEditorStore((state) => state.setOnboardingDismissed);

  const assets = useProjectStore((state) => state.assets);
  const nodes = usePipelineStore((state) => state.nodes);

  if (isDismissed) return null;

  const hasAsset = assets.length > 0;
  const hasEffects = nodes.some((n) => n.data.category !== 'input');

  let currentStep = 1;
  if (hasAsset && !hasEffects) currentStep = 2;
  if (hasAsset && hasEffects) currentStep = 3;

  return (
    <div className="bg-gradient-to-r from-blue-950/90 via-neutral-900 to-indigo-950/90 border-b border-blue-800/40 px-4 py-2 flex items-center justify-between z-20 text-xs shrink-0 select-none backdrop-blur shadow-md">
      <div className="flex items-center gap-6 overflow-x-auto">
        <div className="flex items-center gap-1.5 font-bold text-blue-400">
          <Sparkles className="w-4 h-4" />
          <span>Getting Started:</span>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-4 text-neutral-300">
          <div className={clsx('flex items-center gap-1.5 font-medium', currentStep === 1 ? 'text-blue-300 font-bold' : 'opacity-60')}>
            <span className={clsx('w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono', currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400')}>
              1
            </span>
            <span>Upload Image</span>
          </div>

          <span className="text-neutral-600">→</span>

          <div className={clsx('flex items-center gap-1.5 font-medium', currentStep === 2 ? 'text-blue-300 font-bold' : 'opacity-60')}>
            <span className={clsx('w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono', currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400')}>
              2
            </span>
            <span>Add Effect</span>
          </div>

          <span className="text-neutral-600">→</span>

          <div className={clsx('flex items-center gap-1.5 font-medium', currentStep === 3 ? 'text-blue-300 font-bold' : 'opacity-60')}>
            <span className={clsx('w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono', currentStep === 3 ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400')}>
              3
            </span>
            <span>Adjust Settings</span>
          </div>

          <span className="text-neutral-600">→</span>

          <div className="flex items-center gap-1.5 font-medium opacity-60">
            <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono bg-neutral-800 text-neutral-400">
              4
            </span>
            <span>Export Result</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="text-[11px] text-neutral-400 hover:text-neutral-200 px-2 py-0.5 rounded hover:bg-neutral-800 flex items-center gap-1"
      >
        <span>Skip Guide</span>
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
