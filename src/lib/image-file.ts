import type { AssetItem } from "../engine/core/types";
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export function validateImageFile(file: Pick<File, "type" | "size">) {
  if (!IMAGE_TYPES.includes(file.type))
    throw new Error("Choose a PNG, JPEG, or WebP image.");
  if (!file.size)
    throw new Error("This file is empty. Please choose another image.");
  if (file.size > 25 * 1024 * 1024)
    throw new Error("Choose an image smaller than 25 MB.");
}
export function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(
        new Error("This image could not be decoded. Try a different file."),
      );
    image.src = source;
  });
}
export async function readImageFile(file: File): Promise<AssetItem> {
  validateImageFile(file);
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error("This file could not be read. Please try again."));
    reader.readAsDataURL(file);
  });
  const image = await loadImage(dataUrl);
  if (image.width * image.height > 36000000)
    throw new Error("Choose an image with fewer than 36 million pixels.");
  return {
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type,
    size: file.size,
    width: image.width,
    height: image.height,
    dataUrl,
    createdAt: Date.now(),
  };
}
export const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><defs><linearGradient id="b" x2="0" y2="1"><stop stop-color="#f7ecd7"/><stop offset="1" stop-color="#dbc4a8"/></linearGradient><linearGradient id="v" x2="1" y2="1"><stop stop-color="#b8d8a1"/><stop offset="1" stop-color="#63895c"/></linearGradient><radialGradient id="o" cx=".3" cy=".3"><stop stop-color="#ffc46a"/><stop offset="1" stop-color="#db641e"/></radialGradient><filter id="s"><feGaussianBlur stdDeviation="20"/></filter></defs><path fill="url(#b)" d="M0 0h1200v900H0z"/><path fill="#eee3cd" d="M0 650h1200v250H0z"/><path fill="#f8f1e3" d="M0 0h230l500 900H500z" opacity=".5"/><ellipse cx="630" cy="766" rx="330" ry="30" fill="#765c40" opacity=".19" filter="url(#s)"/><rect x="350" y="440" width="380" height="300" rx="16" fill="#f8efe0"/><path d="M350 460h380v25H350z" fill="#e6d6bd"/><path d="M500 390v-130q0-30 30-30h130q30 0 30 30v130q50 40 50 130v180q0 40-40 40H490q-40 0-40-40V520q0-90 50-130Z" fill="url(#v)"/><path d="M530 245h130" stroke="#516e47" stroke-width="12" stroke-linecap="round"/><path d="M520 310q20 70-18 140" stroke="#d8ebbe" stroke-width="15" opacity=".5" fill="none"/><circle cx="800" cy="690" r="100" fill="url(#o)"/><path d="M796 590q5-40 53-32-6 33-53 32" fill="#426f44"/><ellipse cx="780" cy="638" rx="27" ry="16" fill="#ffe1a0" opacity=".2"/><text x="80" y="95" font-family="sans-serif" font-size="15" letter-spacing="6" fill="#4e5d46">BUFFER / STILL LIFE NO. 01</text></svg>`;
export async function createSampleAsset(): Promise<AssetItem> {
  const dataUrl =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SAMPLE_SVG);
  const image = await loadImage(dataUrl);
  return {
    id: crypto.randomUUID(),
    name: "Still life · sample",
    type: "image/svg+xml",
    size: SAMPLE_SVG.length,
    width: image.width,
    height: image.height,
    dataUrl,
    createdAt: Date.now(),
  };
}
