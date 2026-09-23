import { MOSAIC_LONGEST_SIDE } from "./mosaic.constants";

/*
 * The browser's half of a mosaic: how big to make it, and turning the SVG
 * `mosaicSvg` wrote into a PNG somebody can keep. Called from handlers only —
 * the server has no screen and no canvas, and nothing here ever runs there.
 */

/** Lets the page paint "Drawing…" before the work starts, so a press is answered at once. */
export function nextPaint(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

/**
 * The picture's size: this screen, in its own pixels, no bigger on its longer
 * side than `MOSAIC_LONGEST_SIDE`. Read in the handler, never while rendering —
 * the server has no screen, and a size worked out there would be a guess.
 */
export function screenPixels(): { width: number; height: number } {
  const ratio = window.devicePixelRatio || 1;
  let width = Math.round((window.screen.width || 1920) * ratio);
  let height = Math.round((window.screen.height || 1080) * ratio);
  const scale = Math.min(1, MOSAIC_LONGEST_SIDE / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);
  return { width, height };
}

/** Rasterises an SVG string to a PNG blob, in the browser. */
export async function pngOf(svg: string, width: number, height: number): Promise<Blob> {
  const source = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.src = source;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (context === null) throw new Error("no 2d context");
    context.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob === null ? reject(new Error("no blob")) : resolve(blob)), "image/png"),
    );
  } finally {
    URL.revokeObjectURL(source);
  }
}

