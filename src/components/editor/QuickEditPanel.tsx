import React from "react";
import { usePipelineStore } from "../../store/pipeline.store";
import { useEditorStore } from "../../store/editor.store";
import { useHistoryStore } from "../../store/history.store";
import { useProjectStore } from "../../store/project.store";
import { getNodeDefinition } from "../../engine/nodes/registry";
import { useResponsive } from "../../hooks/useResponsive";
import {
  Sliders,
  Sparkles,
  Sun,
  RotateCcw,
  Plus,
  Trash2,
  Image as ImageIcon,
  Layers,
  Crop as CropIcon,
  Check,
} from "lucide-react";
import { clsx } from "clsx";

export const QuickEditPanel: React.FC = () => {
  const nodes = usePipelineStore((state) => state.nodes);
  const appendNodeToPipeline = usePipelineStore(
    (state) => state.appendNodeToPipeline,
  );
  const updateNodeParameter = usePipelineStore(
    (state) => state.updateNodeParameter,
  );
  const removeNode = usePipelineStore((state) => state.removeNode);
  const getImageInputNode = usePipelineStore(
    (state) => state.getImageInputNode,
  );

  const isInspectorOpen = useEditorStore((state) => state.isInspectorOpen);
  const isCropEditing = useEditorStore((state) => state.isCropEditing);
  const setCropEditing = useEditorStore((state) => state.setCropEditing);

  const pushSnapshot = useHistoryStore((state) => state.pushSnapshot);
  const setNodeSearchOpen = useEditorStore((state) => state.setNodeSearchOpen);

  const { isMobile, isTablet } = useResponsive();

  const assets = useProjectStore((state) => state.assets);
  const hasImage = Boolean(getImageInputNode());

  const getOrCreateNode = (type: string) => {
    let node = nodes.find((n) => n.data.definitionType === type);
    if (!node) {
      const newId = appendNodeToPipeline(type);
      node = usePipelineStore.getState().nodes.find((n) => n.id === newId);
    }
    return node;
  };

  const brightnessNode = nodes.find(
    (n) => n.data.definitionType === "filter-brightness",
  );
  const contrastNode = nodes.find(
    (n) => n.data.definitionType === "filter-contrast",
  );
  const saturationNode = nodes.find(
    (n) => n.data.definitionType === "filter-saturation",
  );
  const blurNode = nodes.find((n) => n.data.definitionType === "filter-blur");

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

  const hasEffect = (type: string) =>
    nodes.some((n) => n.data.definitionType === type);

  const toggleEffectNode = (type: string) => {
    pushSnapshot();
    const existing = nodes.find((n) => n.data.definitionType === type);
    if (existing) {
      removeNode(existing.id);
      if (type === "transform-crop") setCropEditing(false);
    } else {
      appendNodeToPipeline(type);
      if (type === "transform-crop") setCropEditing(true);
    }
  };

  const effectNodes = nodes.filter(
    (n) => n.data.definitionType !== "input-image",
  );

  if (!isInspectorOpen) return null;

  if (!hasImage) {
    return (
      <div
        className={clsx(
          "adjustments-panel bg-white border-l border-line flex flex-col items-center justify-center p-6 text-center text-muted space-y-3 shrink-0 select-none",
          isMobile || isTablet
            ? "w-full h-auto border-t border-l-0 border-line p-4"
            : "w-80 h-full",
        )}
      >
        <ImageIcon className="w-8 h-8 text-faint" />
        <p className="text-xs font-semibold text-muted">
          Upload an Image First
        </p>
        <p className="text-[11px] text-muted max-w-xs">
          Once you upload an image, effect controls and active adjustments will
          appear here.
        </p>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "adjustments-panel bg-white border-l border-line flex flex-col z-10 shrink-0 select-none overflow-y-auto p-4 space-y-6",
        isMobile || isTablet
          ? "w-full h-auto max-h-[50vh] border-t border-l-0"
          : "w-80 h-full",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-green" />
          <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
            Image Controls
          </h3>
        </div>
      </div>

      {/* ACTIVE PIPELINE EFFECTS SECTION */}
      {effectNodes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-green" />
              Active Effects ({effectNodes.length})
            </h4>
          </div>

          <div className="space-y-2.5">
            {effectNodes.map((node) => {
              const def = getNodeDefinition(node.data.definitionType);
              if (!def) return null;

              const isCrop = node.data.definitionType === "transform-crop";

              return (
                <div
                  key={node.id}
                  className={clsx(
                    "bg-surface/80 border rounded-lg p-3 space-y-3 shadow-sm transition-all",
                    isCrop && isCropEditing
                      ? "border-amber-500/80 ring-1 ring-amber-500/30"
                      : "border-line hover:border-line-strong",
                  )}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink">
                        {node.data.label || def.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-white border border-line text-muted uppercase font-mono">
                        {def.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isCrop && (
                        <button
                          onClick={() => setCropEditing(!isCropEditing)}
                          className={clsx(
                            "px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors",
                            isCropEditing
                              ? "bg-amber-500 text-neutral-950 font-bold"
                              : "bg-soft text-ink hover:bg-soft",
                          )}
                        >
                          <CropIcon className="w-3 h-3" />
                          {isCropEditing ? "Done Handles" : "Edit Crop Handles"}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          pushSnapshot();
                          removeNode(node.id);
                          if (isCrop) setCropEditing(false);
                        }}
                        title="Remove Effect"
                        className="p-1 text-muted hover:text-red-400 hover:bg-red-950/50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Parameters */}
                  {def.parameters.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-line/60">
                      {def.parameters.map((param) => {
                        const val =
                          node.data.parameters?.[param.id] ??
                          param.defaultValue;

                        return (
                          <div key={param.id} className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-muted">{param.name}</span>
                              {param.type === "number" && (
                                <span className="font-mono text-green">
                                  {val} {param.unit || ""}
                                </span>
                              )}
                            </div>

                            {param.type === "number" && (
                              <input
                                aria-label={param.name}
                                type="range"
                                min={param.min ?? 0}
                                max={param.max ?? 100}
                                step={param.step ?? 1}
                                value={val}
                                onPointerDown={pushSnapshot}
                                onKeyDown={(e) => {
                                  if (
                                    [
                                      "ArrowLeft",
                                      "ArrowRight",
                                      "ArrowUp",
                                      "ArrowDown",
                                      "Home",
                                      "End",
                                      "PageUp",
                                      "PageDown",
                                    ].includes(e.key)
                                  )
                                    pushSnapshot();
                                }}
                                onChange={(e) =>
                                  updateNodeParameter(
                                    node.id,
                                    param.id,
                                    parseFloat(e.target.value),
                                  )
                                }
                                className="w-full accent-green h-1.5 bg-soft rounded appearance-none cursor-pointer"
                              />
                            )}

                            {param.type === "select" && (
                              <select
                                aria-label={param.name}
                                value={val}
                                onChange={(e) => {
                                  pushSnapshot();
                                  updateNodeParameter(
                                    node.id,
                                    param.id,
                                    e.target.value,
                                  );
                                }}
                                className="w-full h-7 bg-white border border-line rounded px-2 text-xs text-ink focus:outline-none focus:border-green"
                              >
                                {param.options?.map((opt) => (
                                  <option
                                    key={String(opt.value)}
                                    value={String(opt.value)}
                                  >
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            )}

                            {param.type === "boolean" && (
                              <button
                                onClick={() => {
                                  pushSnapshot();
                                  updateNodeParameter(node.id, param.id, !val);
                                }}
                                className={clsx(
                                  "w-full h-7 rounded border px-2.5 text-xs font-medium flex items-center justify-between transition-colors",
                                  val
                                    ? "bg-mint-soft/80 border-green text-green"
                                    : "bg-white border-line text-muted",
                                )}
                              >
                                <span>{val ? "Enabled" : "Disabled"}</span>
                                <div
                                  className={clsx(
                                    "w-2.5 h-2.5 rounded-full transition-colors",
                                    val ? "bg-green" : "bg-neutral-600",
                                  )}
                                />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QUICK ADJUSTMENTS SECTION */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Sun className="w-3.5 h-3.5 text-green" />
          Quick Adjustments
        </h4>

        {/* Brightness Slider */}
        <div className="space-y-1.5 bg-surface/60 p-3 rounded-lg border border-line">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-ink">Brightness</span>
            <span className="font-mono text-muted">{brightnessVal}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            aria-label="Brightness"
            value={brightnessVal}
            onPointerDown={pushSnapshot}
            onKeyDown={(e) => {
              if (
                [
                  "ArrowLeft",
                  "ArrowRight",
                  "ArrowUp",
                  "ArrowDown",
                  "Home",
                  "End",
                  "PageUp",
                  "PageDown",
                ].includes(e.key)
              )
                pushSnapshot();
            }}
            onChange={(e) =>
              handleSliderChange(
                "filter-brightness",
                "brightness",
                parseFloat(e.target.value),
              )
            }
            className="w-full accent-green h-1.5 bg-soft rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Contrast Slider */}
        <div className="space-y-1.5 bg-surface/60 p-3 rounded-lg border border-line">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-ink">Contrast</span>
            <span className="font-mono text-muted">{contrastVal}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            aria-label="Contrast"
            value={contrastVal}
            onPointerDown={pushSnapshot}
            onKeyDown={(e) => {
              if (
                [
                  "ArrowLeft",
                  "ArrowRight",
                  "ArrowUp",
                  "ArrowDown",
                  "Home",
                  "End",
                  "PageUp",
                  "PageDown",
                ].includes(e.key)
              )
                pushSnapshot();
            }}
            onChange={(e) =>
              handleSliderChange(
                "filter-contrast",
                "contrast",
                parseFloat(e.target.value),
              )
            }
            className="w-full accent-green h-1.5 bg-soft rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Saturation Slider */}
        <div className="space-y-1.5 bg-surface/60 p-3 rounded-lg border border-line">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-ink">Saturation</span>
            <span className="font-mono text-muted">{saturationVal}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            aria-label="Saturation"
            value={saturationVal}
            onPointerDown={pushSnapshot}
            onKeyDown={(e) => {
              if (
                [
                  "ArrowLeft",
                  "ArrowRight",
                  "ArrowUp",
                  "ArrowDown",
                  "Home",
                  "End",
                  "PageUp",
                  "PageDown",
                ].includes(e.key)
              )
                pushSnapshot();
            }}
            onChange={(e) =>
              handleSliderChange(
                "filter-saturation",
                "saturation",
                parseFloat(e.target.value),
              )
            }
            className="w-full accent-green h-1.5 bg-soft rounded appearance-none cursor-pointer"
          />
        </div>

        {/* Blur Slider */}
        <div className="space-y-1.5 bg-surface/60 p-3 rounded-lg border border-line">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-ink">Blur Radius</span>
            <span className="font-mono text-muted">{blurVal} px</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            aria-label="Blur radius"
            value={blurVal}
            onPointerDown={pushSnapshot}
            onKeyDown={(e) => {
              if (
                [
                  "ArrowLeft",
                  "ArrowRight",
                  "ArrowUp",
                  "ArrowDown",
                  "Home",
                  "End",
                  "PageUp",
                  "PageDown",
                ].includes(e.key)
              )
                pushSnapshot();
            }}
            onChange={(e) =>
              handleSliderChange(
                "filter-blur",
                "radius",
                parseFloat(e.target.value),
              )
            }
            className="w-full accent-green h-1.5 bg-soft rounded appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* QUICK EFFECTS BUTTONS GRID */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-green" />
          Quick Filters & Presets
        </h4>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => toggleEffectNode("transform-crop")}
            className={clsx(
              "p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
              hasEffect("transform-crop")
                ? "bg-amber-600 text-ink border-amber-500 shadow-sm"
                : "bg-surface border-line text-ink hover:border-line-strong",
            )}
          >
            <CropIcon className="w-3.5 h-3.5" />
            Crop Tool
          </button>

          <button
            onClick={() => toggleEffectNode("filter-grayscale")}
            className={clsx(
              "p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
              hasEffect("filter-grayscale")
                ? "bg-mint text-ink border-green shadow-sm"
                : "bg-surface border-line text-ink hover:border-line-strong",
            )}
          >
            Grayscale
          </button>

          <button
            onClick={() => toggleEffectNode("filter-invert")}
            className={clsx(
              "p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
              hasEffect("filter-invert")
                ? "bg-mint text-ink border-green shadow-sm"
                : "bg-surface border-line text-ink hover:border-line-strong",
            )}
          >
            Invert Colors
          </button>

          <button
            onClick={() => toggleEffectNode("filter-sharpen")}
            className={clsx(
              "p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
              hasEffect("filter-sharpen")
                ? "bg-mint text-ink border-green shadow-sm"
                : "bg-surface border-line text-ink hover:border-line-strong",
            )}
          >
            Sharpen
          </button>

          <button
            onClick={() => toggleEffectNode("color-hue")}
            className={clsx(
              "p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
              hasEffect("color-hue")
                ? "bg-mint text-ink border-green shadow-sm"
                : "bg-surface border-line text-ink hover:border-line-strong",
            )}
          >
            Hue Shift
          </button>

          <button
            onClick={() => toggleEffectNode("transform-rotate")}
            className={clsx(
              "p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
              hasEffect("transform-rotate")
                ? "bg-mint text-ink border-green shadow-sm"
                : "bg-surface border-line text-ink hover:border-line-strong",
            )}
          >
            Rotate
          </button>
        </div>

        <button
          onClick={() => setNodeSearchOpen(true)}
          className="w-full py-2.5 px-3 rounded-lg border border-dashed border-green/50 hover:border-blue-400 bg-mint-soft/20 text-green hover:text-ink text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 text-green" />
          More Effects & Transforms...
        </button>
      </div>
    </div>
  );
};
