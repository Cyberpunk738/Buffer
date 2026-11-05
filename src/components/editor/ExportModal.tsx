import { useState, useCallback } from "react";
import { Download, X, Image as ImageIcon, Check } from "lucide-react";
import { useEditorStore } from "../../store/editor.store";
import { useProjectStore } from "../../store/project.store";
import { usePipelineStore } from "../../store/pipeline.store";
import { useDialog } from "../../hooks/useDialog";
import { getRenderPlan, renderImage } from "../../engine/core/render";
import { loadImage } from "../../lib/image-file";
import { exportFilename, type ImageFormat } from "../../lib/export";
export function ExportModal() {
  const open = useEditorStore((s) => s.isExportModalOpen),
    setOpen = useEditorStore((s) => s.setExportModalOpen);
  const assets = useProjectStore((s) => s.assets),
    nodes = usePipelineStore((s) => s.nodes);
  const [filename, setFilename] = useState("buffer-image"),
    [format, setFormat] = useState<ImageFormat>("image/png"),
    [quality, setQuality] = useState(90),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const close = () => {
    if (!busy) setOpen(false);
  };
  // Store action is stable so focus is not reset when an option changes.
  const dismiss = useCallback(() => {
    if (!busy) setOpen(false);
  }, [busy, setOpen]);
  const ref = useDialog(open, dismiss);
  if (!open) return null;
  const input = nodes.find((n) => n.data.definitionType === "input-image");
  const asset = assets.find((a) => a.id === input?.data.assetId);
  const plan = asset ? getRenderPlan(asset.width, asset.height, nodes) : null;
  const download = async () => {
    if (!asset) return;
    setBusy(true);
    setError("");
    try {
      const image = await loadImage(asset.dataUrl),
        canvas = document.createElement("canvas");
      renderImage(canvas, image, nodes, {
        background: format === "image/jpeg" ? "#ffffff" : undefined,
      });
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value
              ? resolve(value)
              : reject(
                  new Error(
                    "Your browser could not encode this image. Try PNG or a smaller size.",
                  ),
                ),
          format,
          quality / 100,
        ),
      );
      const url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download = exportFilename(filename, blob.type);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      setOpen(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Export failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-heading"
        tabIndex={-1}
        className="export-dialog"
      >
        <header>
          <div>
            <span className="eyebrow">OUT INTO THE WORLD</span>
            <h2 id="export-heading">Make it yours to keep.</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close export"
            onClick={close}
            disabled={busy}
          >
            <X size={20} />
          </button>
        </header>
        <div className="export-body">
          <div className="export-summary">
            <ImageIcon size={24} />
            <div>
              <strong>Your edited image</strong>
              <span>
                {plan
                  ? `${plan.width} × ${plan.height} px`
                  : "Upload an image to get started"}
              </span>
            </div>
            <span className="export-check">
              <Check size={16} />
            </span>
          </div>
          <label className="field-label" htmlFor="export-name">
            File name
          </label>
          <input
            id="export-name"
            className="text-field"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            maxLength={120}
          />
          <fieldset>
            <legend className="field-label">Choose a format</legend>
            <div className="format-options">
              {[
                ["image/png", "PNG", "Lossless"],
                ["image/jpeg", "JPEG", "Smaller file"],
                ["image/webp", "WebP", "Web friendly"],
              ].map(([value, label, detail]) => (
                <button
                  key={value}
                  onClick={() => setFormat(value as ImageFormat)}
                  aria-pressed={format === value}
                  className={format === value ? "selected" : ""}
                >
                  <strong>{label}</strong>
                  <span>{detail}</span>
                </button>
              ))}
            </div>
          </fieldset>
          {format !== "image/png" && (
            <div className="quality-field">
              <label className="field-label" htmlFor="export-quality">
                Image quality <span>{quality}%</span>
              </label>
              <input
                id="export-quality"
                type="range"
                min={10}
                max={100}
                step={5}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
              />
            </div>
          )}
          <p className="export-note">
            {format === "image/jpeg"
              ? "Transparent areas are exported on a white background."
              : "Transparency is preserved."}{" "}
            Export always saves your edit, even while viewing the original.
          </p>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
        </div>
        <footer>
          <button
            className="button button-quiet"
            onClick={close}
            disabled={busy}
          >
            Keep editing
          </button>
          <button
            className="button button-mint"
            disabled={busy || !asset}
            onClick={() => void download()}
          >
            <Download size={16} />
            {busy ? "Preparing image…" : "Download image"}
          </button>
        </footer>
      </div>
    </div>
  );
}
