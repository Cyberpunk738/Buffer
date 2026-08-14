import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, ArrowRight, X } from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';

export const MobileNoticeModal: React.FC = () => {
  const { isMobile } = useResponsive();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Reset dismissal on resize back from mobile to desktop
    if (!isMobile) {
      setDismissed(false);
    }
  }, [isMobile]);

  if (!isMobile || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Animated Display Icon */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-950">
          <Monitor className="w-8 h-8" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-amber-950 border border-amber-500/50 flex items-center justify-center text-amber-400">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-neutral-100 tracking-tight">
            Desktop Optimized Workspace
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Buffer is a node-based image processing workspace designed for desktop and laptop displays.
          </p>
          <div className="p-3 bg-neutral-950 border border-neutral-800/80 rounded-xl text-[11px] text-neutral-400 space-y-1">
            <div className="font-semibold text-neutral-300">For the best experience:</div>
            <div>Please open Buffer on a screen width of <span className="font-mono text-blue-400">1024px</span> or larger.</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => setDismissed(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950 transition-all"
          >
            <span>Continue in Mobile View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <p className="text-[10px] text-neutral-500 font-mono">
            Some node controls may require scrolling on smaller screens.
          </p>
        </div>
      </div>
    </div>
  );
};
