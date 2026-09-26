import type { MosaicShape } from "./mosaic.constants";

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
 * The shape that suits this screen: portrait for a screen taller than it is
 * wide, a phone held upright, and landscape for everything else. Read in the
 * browser only — the server has no screen, and a shape guessed there would be
 * a guess.
 */
export function shapeForScreen(): MosaicShape {
  if (typeof window === "undefined") return "landscape";
  return window.innerHeight > window.innerWidth ? "portrait" : "landscape";
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

