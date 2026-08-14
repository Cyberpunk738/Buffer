import React from 'react';
import { useEditorStore } from '../../store/editor.store';
import { usePipelineStore } from '../../store/pipeline.store';
import { useHistoryStore } from '../../store/history.store';
import { getNodeDefinition } from '../../engine/nodes/registry';
import { Sliders, X, Info, Settings2 } from 'lucide-react';
import { clsx } from 'clsx';

export const Inspector: React.FC = () => {
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const isInspectorOpen = useEditorStore((state) => state.isInspectorOpen);
  const toggleInspector = useEditorStore((state) => state.toggleInspector);

  const nodes = usePipelineStore((state) => state.nodes);
  const updateNodeParameter = usePipelineStore((state) => state.updateNodeParameter);
  const pushSnapshot = useHistoryStore((state) => state.pushSnapshot);

  if (!isInspectorOpen) return null;

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const definition = selectedNode ? getNodeDefinition(selectedNode.data.definitionType) : null;

  const handleParameterChange = (paramId: string, value: any) => {
    if (!selectedNode) return;
    updateNodeParameter(selectedNode.id, paramId, value);
  };

  return (
    <div className="w-80 h-full bg-neutral-900 border-l border-neutral-800 flex flex-col z-10 shrink-0">
      {/* Inspector Header */}
      <div className="h-12 px-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
            Inspector
          </h3>
        </div>
        <button
          onClick={toggleInspector}
          className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      {selectedNode && definition ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Selected Node Overview */}
          <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-100">
                {selectedNode.data.label}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40 uppercase font-mono font-medium">
                {selectedNode.data.category}
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {definition.description}
            </p>
            <div className="text-[10px] text-neutral-500 font-mono">
              ID: {selectedNode.id}
            </div>
          </div>

          {/* Parameters List */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-800 pb-1.5">
              <Settings2 className="w-3.5 h-3.5 text-neutral-400" />
              Parameters
            </h4>

            {definition.parameters.length === 0 ? (
              <div className="text-xs text-neutral-500 italic py-2">
                This node has no configurable parameters.
              </div>
            ) : (
              definition.parameters.map((param) => {
                const currentValue =
                  selectedNode.data.parameters[param.id] ?? param.defaultValue;

                return (
                  <div key={param.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-medium text-neutral-300">
                        {param.name}
                      </label>
                      {param.type === 'number' && (
                        <span className="font-mono text-[11px] text-blue-400 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                          {currentValue} {param.unit || ''}
                        </span>
                      )}
                    </div>

                    {/* Render inputs based on param.type */}
                    {param.type === 'number' && (
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={param.min ?? 0}
                          max={param.max ?? 100}
                          step={param.step ?? 1}
                          value={currentValue}
                          onMouseDown={pushSnapshot}
                          onChange={(e) =>
                            handleParameterChange(param.id, parseFloat(e.target.value))
                          }
                          className="flex-1 accent-blue-500 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <input
                          type="number"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={currentValue}
                          onChange={(e) =>
                            handleParameterChange(param.id, parseFloat(e.target.value))
                          }
                          className="w-16 h-7 bg-neutral-950 border border-neutral-800 rounded text-xs text-right font-mono px-2 text-neutral-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    {param.type === 'select' && (
                      <select
                        value={currentValue}
                        onChange={(e) => {
                          pushSnapshot();
                          handleParameterChange(param.id, e.target.value);
                        }}
                        className="w-full h-8 bg-neutral-950 border border-neutral-800 rounded px-2 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
                      >
                        {param.options?.map((opt) => (
                          <option key={String(opt.value)} value={String(opt.value)}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {param.type === 'boolean' && (
                      <button
                        onClick={() => {
                          pushSnapshot();
                          handleParameterChange(param.id, !currentValue);
                        }}
                        className={clsx(
                          'w-full h-8 rounded border px-3 text-xs font-medium flex items-center justify-between transition-colors',
                          currentValue
                            ? 'bg-blue-950/60 border-blue-700 text-blue-300'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        )}
                      >
                        <span>{currentValue ? 'Enabled' : 'Disabled'}</span>
                        <div
                          className={clsx(
                            'w-3 h-3 rounded-full transition-colors',
                            currentValue ? 'bg-blue-400' : 'bg-neutral-600'
                          )}
                        />
                      </button>
                    )}

                    {param.type === 'text' && (
                      <input
                        type="text"
                        value={currentValue}
                        onChange={(e) => handleParameterChange(param.id, e.target.value)}
                        onBlur={pushSnapshot}
                        className="w-full h-8 bg-neutral-950 border border-neutral-800 rounded px-2 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
                      />
                    )}

                    {param.description && (
                      <p className="text-[10px] text-neutral-500">
                        {param.description}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-500 space-y-3">
          <Info className="w-8 h-8 text-neutral-600" />
          <div>
            <p className="text-xs font-medium text-neutral-400">No node selected</p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Select a node in the graph canvas to inspect and modify its parameters.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
