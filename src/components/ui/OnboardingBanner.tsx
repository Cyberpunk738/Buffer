import { useEditorStore } from "../../store/editor.store";
import { X, Sparkles } from "lucide-react";
export function OnboardingBanner() {
  const dismissed = useEditorStore((s) => s.isOnboardingDismissed),
    set = useEditorStore((s) => s.setOnboardingDismissed);
  if (dismissed) return null;
  return (
    <div className="onboarding">
      <span>
        <Sparkles size={14} />
        <strong>Your creative routine</strong>
        <span>Upload an image → Make it yours → Export your edit</span>
      </span>
      <button aria-label="Dismiss guide" onClick={() => set(true)}>
        <X size={15} />
      </button>
    </div>
  );
}
