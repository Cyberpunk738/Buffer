export type ImageFormat = "image/png" | "image/jpeg" | "image/webp";
export function exportFilename(name: string, format: string) {
  const base =
    name
      .trim()
      .replace(/\.(png|jpe?g|webp)$/i, "")
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
      .slice(0, 120) || "buffer-image";
  return (
    base +
    (format === "image/jpeg"
      ? ".jpg"
      : format === "image/webp"
        ? ".webp"
        : ".png")
  );
}
