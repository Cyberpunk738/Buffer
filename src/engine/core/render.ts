import type { NodeStateData } from "./types";

type Effect = { data: Pick<NodeStateData, "definitionType" | "parameters"> };
const finite = (value: unknown, fallback = 0) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/** One geometry/filter plan for both the preview and the exported result. */
export function getRenderPlan(
  width: number,
  height: number,
  nodes: Effect[],
  original = false,
  editingCrop = false,
) {
  const find = (type: string) =>
    nodes.find((n) => n.data.definitionType === type)?.data.parameters;
  const crop = original || editingCrop ? undefined : find("transform-crop");
  const x = clamp(finite(crop?.x), 0, width - 1);
  const y = clamp(finite(crop?.y), 0, height - 1);
  const cropW = clamp(finite(crop?.width, width), 1, width - x);
  const cropH = clamp(finite(crop?.height, height), 1, height - y);
  const resize = original || editingCrop ? undefined : find("transform-resize");
  const targetW = resize
    ? Math.round(clamp(finite(resize.width, cropW), 1, 4096))
    : cropW;
  const targetH = resize
    ? Math.round(clamp(finite(resize.height, cropH), 1, 4096))
    : cropH;
  let angle = 0,
    flipH = false,
    flipV = false;
  let brightness = 0,
    contrast = 0,
    saturation = 0,
    blur = 0,
    hue = 0,
    exposure = 0,
    temperature = 0,
    sharpen = 0,
    tint = 0,
    opacity = 1;
  let grayscale = false,
    invert = false;
  if (!original)
    for (const {
      data: { definitionType: type, parameters: p },
    } of nodes) {
      if (type === "transform-rotate" && !editingCrop) angle += finite(p.angle);
      if (type === "transform-flip" && !editingCrop) {
        if (p.horizontal) flipH = !flipH;
        if (p.vertical) flipV = !flipV;
      }
      if (type === "filter-brightness") brightness += finite(p.brightness);
      if (type === "filter-contrast") contrast += finite(p.contrast);
      if (type === "filter-saturation") saturation += finite(p.saturation);
      if (type === "filter-blur") blur += finite(p.radius);
      if (type === "filter-sharpen") sharpen += finite(p.strength);
      if (type === "filter-grayscale") grayscale = true;
      if (type === "filter-invert") invert = !invert;
      if (type === "color-hue") hue += finite(p.hue);
      if (type === "color-exposure") exposure += finite(p.exposure);
      if (type === "color-temperature") temperature += finite(p.temperature);
      if (type === "color-tint") tint += finite(p.tint);
      if (type === "composite-opacity")
        opacity *= clamp(finite(p.opacity, 100) / 100, 0, 1);
    }
  const radians = ((angle % 360) * Math.PI) / 180;
  const filters = [
    `brightness(${Math.max(0, 100 + brightness + exposure * 25)}%)`,
    `contrast(${Math.max(0, 100 + contrast)}%)`,
    `saturate(${Math.max(0, 100 + saturation)}%)`,
  ];
  if (blur > 0) filters.push(`blur(${blur}px)`);
  if (grayscale) filters.push("grayscale(100%)");
  if (invert) filters.push("invert(100%)");
  if (hue || temperature)
    filters.push(`hue-rotate(${hue + temperature * 0.3}deg)`);
  if (temperature > 0) filters.push(`sepia(${temperature * 0.4}%)`);
  return {
    x,
    y,
    cropW,
    cropH,
    targetW,
    targetH,
    radians,
    flipH,
    flipV,
    opacity,
    sharpen: clamp(sharpen / 100, 0, 1),
    tint: clamp(tint, -100, 100),
    filter: filters.join(" "),
    width: Math.max(
      1,
      Math.round(
        Math.abs(targetW * Math.cos(radians)) +
          Math.abs(targetH * Math.sin(radians)),
      ),
    ),
    height: Math.max(
      1,
      Math.round(
        Math.abs(targetW * Math.sin(radians)) +
          Math.abs(targetH * Math.cos(radians)),
      ),
    ),
  };
}

export function renderImage(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  nodes: Effect[],
  options: {
    original?: boolean;
    editingCrop?: boolean;
    background?: string;
  } = {},
) {
  const plan = getRenderPlan(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    nodes,
    options.original,
    options.editingCrop,
  );
  canvas.width = plan.width;
  canvas.height = plan.height;
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error("Your browser could not create an image canvas.");
  context.save();
  context.translate(plan.width / 2, plan.height / 2);
  context.rotate(plan.radians);
  context.scale(plan.flipH ? -1 : 1, plan.flipV ? -1 : 1);
  context.filter = plan.filter;
  context.globalAlpha = plan.opacity;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    plan.x,
    plan.y,
    plan.cropW,
    plan.cropH,
    -plan.targetW / 2,
    -plan.targetH / 2,
    plan.targetW,
    plan.targetH,
  );
  context.restore();
  if (plan.sharpen || plan.tint) {
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const source = new Uint8ClampedArray(pixels.data);
    for (let y = 0; y < canvas.height; y++)
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        for (let channel = 0; channel < 3; channel++) {
          let value = source[i + channel];
          if (
            plan.sharpen &&
            x > 0 &&
            x < canvas.width - 1 &&
            y > 0 &&
            y < canvas.height - 1
          )
            value +=
              plan.sharpen *
              (4 * source[i + channel] -
                source[i - 4 + channel] -
                source[i + 4 + channel] -
                source[i - canvas.width * 4 + channel] -
                source[i + canvas.width * 4 + channel]);
          if (plan.tint)
            value += channel === 1 ? -plan.tint * 0.45 : plan.tint * 0.25;
          pixels.data[i + channel] = value;
        }
      }
    context.putImageData(pixels, 0, 0);
  }
  if (options.background) {
    context.save();
    context.globalCompositeOperation = "destination-over";
    context.fillStyle = options.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();
  }
  return plan;
}
