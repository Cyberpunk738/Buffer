import React, { useState } from "react";
import { useEditorStore } from "../../store/editor.store";
import { usePipelineStore } from "../../store/pipeline.store";
import { useHistoryStore } from "../../store/history.store";
import { getNodeDefinition } from "../../engine/nodes/registry";
import {
  Sliders,
  X,
  Info,
  Settings2,
  RotateCcw,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { clsx } from "clsx";

export const Inspector: React.FC = () => {
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const isInspectorOpen = useEditorStore((state) => state.isInspectorOpen);
  const toggleInspector = useEditorStore((state) => state.toggleInspector);

  const nodes = usePipelineStore((state) => state.nodes);
  const updateNodeParameter = usePipelineStore(
    (state) => state.updateNodeParameter,
  );
  const pushSnapshot = useHistoryStore((state) => state.pushSnapshot);

  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isInspectorOpen) return null;

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const definition = selectedNode
    ? getNodeDefinition(selectedNode.data.definitionType)
    : null;

  const handleParameterChange = (paramId: string, value: any) => {
    if (!selectedNode) return;
    updateNodeParameter(selectedNode.id, paramId, value);
  };

  const handleResetParameters = () => {
    if (!selectedNode || !definition) return;
    pushSnapshot();
    definition.parameters.forEach((param) => {
      updateNodeParameter(selectedNode.id, param.id, param.defaultValue);
    });
  };

  return (
    <div className="w-80 h-full bg-white border-l border-line flex flex-col z-10 shrink-0 select-none">
      {/* Inspector Header */}
      <div className="h-12 px-4 border-b border-line flex items-center justify-between bg-white/90">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-green" />
          <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
            Effect Controls
          </h3>
        </div>
        <button
          onClick={toggleInspector}
          className="p-1 hover:bg-soft text-muted hover:text-ink rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      {selectedNode && definition ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Selected Node Header Card */}
          <div className="p-3 bg-surface/70 rounded-lg border border-line space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">
                {selectedNode.data.label || definition.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-mint-soft/60 text-green border border-line-strong/40 uppercase font-mono font-medium">
                {selectedNode.data.category}
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {definition.description}
            </p>
          </div>

          {/* Parameters Control List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-1.5">
              <h4 className="text-xs font-semibold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-muted" />
                Parameters
              </h4>
              {definition.parameters.length > 0 && (
                <button
                  onClick={handleResetParameters}
                  className="text-[11px] text-muted hover:text-ink flex items-center gap-1 hover:bg-soft px-1.5 py-0.5 rounded"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>

            {definition.parameters.length === 0 ? (
              <div className="text-xs text-muted italic py-2">
                This effect requires no additional parameters.
              </div>
            ) : (
              definition.parameters.map((param) => {
                const currentValue =
                  selectedNode.data.parameters[param.id] ?? param.defaultValue;

                return (
                  <div
                    key={param.id}
                    className="space-y-1.5 bg-surface/40 p-2.5 rounded-lg border border-line/60"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-medium text-ink">
                        {param.name}
                      </label>
                      {param.type === "number" && (
                        <span className="font-mono text-[11px] text-green bg-surface px-1.5 py-0.5 rounded border border-line">
                          {currentValue} {param.unit || ""}
                        </span>
                      )}
                    </div>

                    {/* Number Range Slider */}
                    {param.type === "number" && (
                      <div className="flex items-center gap-3 pt-1">
                        <input
                          type="range"
                          min={param.min ?? 0}
                          max={param.max ?? 100}
                          step={param.step ?? 1}
                          value={currentValue}
                          onMouseDown={pushSnapshot}
                          onChange={(e) =>
                            handleParameterChange(
                              param.id,
                              parseFloat(e.target.value),
                            )
                          }
                          className="flex-1 accent-green h-1.5 bg-soft rounded appearance-none cursor-pointer"
                        />
                        <input
                          type="number"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={currentValue}
                          onChange={(e) =>
                            handleParameterChange(
                              param.id,
                              parseFloat(e.target.value),
                            )
                          }
                          className="w-16 h-7 bg-surface border border-line rounded text-xs text-right font-mono px-2 text-ink focus:outline-none focus:border-green"
                        />
                      </div>
                    )}

                    {/* Select Dropdown */}
                    {param.type === "select" && (
                      <select
                        value={currentValue}
                        onChange={(e) => {
                          pushSnapshot();
                          handleParameterChange(param.id, e.target.value);
                        }}
                        className="w-full h-8 bg-surface border border-line rounded px-2 text-xs text-ink focus:outline-none focus:border-green mt-1"
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

                    {/* Boolean Switch */}
                    {param.type === "boolean" && (
                      <button
                        onClick={() => {
                          pushSnapshot();
                          handleParameterChange(param.id, !currentValue);
                        }}
                        className={clsx(
                          "w-full h-8 rounded border px-3 text-xs font-medium flex items-center justify-between transition-colors mt-1",
                          currentValue
                            ? "bg-mint-soft/60 border-blue-700 text-green"
                            : "bg-surface border-line text-muted",
                        )}
                      >
                        <span>{currentValue ? "Enabled" : "Disabled"}</span>
                        <div
                          className={clsx(
                            "w-3 h-3 rounded-full transition-colors",
                            currentValue ? "bg-green" : "bg-neutral-600",
                          )}
                        />
                      </button>
                    )}

                    {/* Text Field */}
                    {param.type === "text" && (
                      <input
                        type="text"
                        value={currentValue}
                        onChange={(e) =>
                          handleParameterChange(param.id, e.target.value)
                        }
                        onBlur={pushSnapshot}
                        className="w-full h-8 bg-surface border border-line rounded px-2 text-xs text-ink focus:outline-none focus:border-green mt-1"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ADVANCED TECHNICAL METADATA (HIDDEN BY DEFAULT) */}
          <div className="pt-2 border-t border-line">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-[10px] font-mono text-muted hover:text-ink py-1"
            >
              <span>Advanced Details</span>
              {showAdvanced ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-1 p-2 bg-surface border border-line rounded text-[10px] font-mono text-muted space-y-1">
                <div>Node ID: {selectedNode.id}</div>
                <div>Definition: {selectedNode.data.definitionType}</div>
                <div>Status: {selectedNode.data.status}</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted space-y-3">
          <Info className="w-8 h-8 text-faint" />
          <div>
            <p className="text-xs font-medium text-muted">No node selected</p>
            <p className="text-[11px] text-muted mt-1">
              Select an effect or node in the pipeline to adjust its settings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
