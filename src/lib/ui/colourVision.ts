/**
 * HOW FAR APART TWO COLOURS ARE FOR A READER WHO SEES COLOUR DIFFERENTLY.
 *
 * A colour is run through Machado, Oliveira and Fernandes's matrix for
 * protanopia, deuteranopia or tritanopia (2009, full severity, on linear sRGB),
 * and two colours' distance is CIE76 in Lab: the straight-line distance, where
 * about 2 is the least a trained eye can see and 30 or more is two colours
 * nobody takes for one. It is the measure John's ticket of 2026-11-02 used, so a
 * number read here is the number the ticket quotes.
 *
 * It is a check, run by tests, and is imported by nothing a page loads.
 */

export const COLOUR_VISIONS = ["protanopia", "deuteranopia", "tritanopia"] as const;
export type ColourVision = (typeof COLOUR_VISIONS)[number];

type Matrix = readonly [readonly [number, number, number], readonly [number, number, number], readonly [number, number, number]];

const MACHADO: Record<ColourVision, Matrix> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

type Triple = readonly [number, number, number];

/** A `#rrggbb` colour as sRGB channels from 0 to 1. */
function channels(hex: string): Triple {
  const digits = /^#([0-9a-f]{6})$/i.exec(hex)?.[1];
  if (digits === undefined) throw new Error(`not a #rrggbb colour: ${hex}`);
  return [0, 2, 4].map((at) => parseInt(digits.slice(at, at + 2), 16) / 255) as unknown as Triple;
}

function linear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function linearRgb(hex: string): Triple {
  const [r, g, b] = channels(hex);
  return [linear(r), linear(g), linear(b)];
}

/** The colour as `vision` sees it, in linear sRGB; `null` is ordinary colour vision. */
function seenAs(hex: string, vision: ColourVision | null): Triple {
  const rgb = linearRgb(hex);
  if (vision === null) return rgb;
  return MACHADO[vision].map((row) => row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2]) as unknown as Triple;
}

function lab([r, g, b]: Triple): Triple {
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  const [lr, lg, lb] = [clamp(r), clamp(g), clamp(b)];
  const x = (0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb) / 0.95047;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb;
  const z = (0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** The distance between two `#rrggbb` colours as `vision` sees them (`null`: ordinary colour vision). */
export function colourDistance(first: string, second: string, vision: ColourVision | null): number {
  const [l1, a1, b1] = lab(seenAs(first, vision));
  const [l2, a2, b2] = lab(seenAs(second, vision));
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/** The least distance between two colours over the three kinds of colour blindness. */
export function leastColourDistance(first: string, second: string): number {
  return Math.min(...COLOUR_VISIONS.map((vision) => colourDistance(first, second, vision)));
}

/** WCAG's contrast ratio of two `#rrggbb` colours, from 1 to 21. */
export function contrastRatio(first: string, second: string): number {
  const luminance = (hex: string) => {
    const [r, g, b] = linearRgb(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [high, low] = [luminance(first), luminance(second)].sort((a, b) => b - a) as [number, number];
  return (high + 0.05) / (low + 0.05);
}
