/**
 * The arithmetic of telling two colours apart, for the piece palette
 * (`pieceColours.ts`) and its tests. Pure, and only over `#rrggbb`.
 *
 * - CONTRAST is WCAG's ratio of relative luminance, 1 to 21: how well a
 *   number reads on a piece (4.5 and up is readable text), and how well an
 *   edge stands off a board.
 * - DISTANCE is CIE76 ΔE in Lab: how different two colours look regardless of
 *   how light they are. About 2 is the least a person can see; under 25 two
 *   pieces side by side on a board read as the same colour at a glance.
 */

function channels(hex: string): [number, number, number] {
  const value = /^#([0-9a-f]{6})$/i.exec(hex)?.[1];
  if (value === undefined) throw new Error(`Not a #rrggbb colour: ${hex}`);
  return [0, 2, 4].map((at) => parseInt(value.slice(at, at + 2), 16) / 255) as [number, number, number];
}

function linear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map(linear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours, 1 to 21. */
export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

function lab(hex: string): [number, number, number] {
  const [r, g, b] = channels(hex).map(linear) as [number, number, number];
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** CIE76 colour distance between two colours. */
export function distance(a: string, b: string): number {
  const [p, q] = [lab(a), lab(b)];
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

/** `over` laid on `under` at `alpha` (0 to 1): the colour a translucent edge comes out as. */
export function blend(over: string, under: string, alpha: number): string {
  const [a, b] = [channels(over), channels(under)];
  const mixed = a.map((channel, at) => Math.round((channel * alpha + b[at]! * (1 - alpha)) * 255));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/** A colour made lighter (towards white) or darker (towards black) by `amount`, 0 to 1. */
export function shade(hex: string, amount: number): string {
  return amount >= 0 ? blend("#ffffff", hex, amount) : blend("#000000", hex, -amount);
}
