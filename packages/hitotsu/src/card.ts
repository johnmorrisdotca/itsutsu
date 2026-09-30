import { HITOTSU_COLOURS } from "./constants.ts";
import { colourOf, faceOf, isWild } from "./deck.ts";
import type { HitotsuCard, HitotsuColour } from "./types.ts";

/**
 * THE DECK'S OWN DESIGN, as shapes in a box 100 wide and 140 tall: the one
 * place a Hitotsu card's look is decided. `hitotsuCardSvg` writes it as an SVG
 * string for any page, and the React component (`HitotsuCardDrawing` in
 * `./react.tsx`) draws the same shapes as elements.
 *
 * A face is its colour inside a white edge, a white diamond in the middle
 * holding the number or symbol, the same in two corners, and the colour's
 * element in the other two (火 土 木 水), so no card is told by colour alone.
 * A wild is ink black with the four colours quartered in its middle. The back
 * is ink with 一つ in a ring of the four colours.
 */

/** Each colour's fill, the ink written on it, its element and its name; `W` is the wilds' and the back's. */
export const HITOTSU_COLOUR_LOOK: Record<HitotsuColour | "W", { fill: string; ink: string; element: string; name: string }> = {
  R: { fill: "#c8372d", ink: "#ffffff", element: "火", name: "Red" },
  Y: { fill: "#dfa11b", ink: "#1f1a12", element: "土", name: "Yellow" },
  G: { fill: "#2f8a4f", ink: "#ffffff", element: "木", name: "Green" },
  B: { fill: "#2a5ea8", ink: "#ffffff", element: "水", name: "Blue" },
  W: { fill: "#24201d", ink: "#ffffff", element: "五", name: "Wild" },
};

/** What each face shows in the middle of a card and in its corners; a number shows itself. */
export const HITOTSU_FACE_MARK: Record<string, string> = { S: "⊘", R: "⇄", D: "+2", W: "", F: "+4" };

/** The card's paper, round every card and under the diamond. */
export const HITOTSU_PAPER = "#fffdf6";

/** The card's width and height in the design's units. */
export const HITOTSU_CARD_BOX = { width: 100, height: 140 } as const;

/** One shape of the design. Text is centred on its `x`, and its `y` is the baseline. */
export type HitotsuShape =
  | { kind: "rect"; x: number; y: number; width: number; height: number; rx: number; fill: string; stroke?: string; strokeWidth?: number; transform?: string }
  | { kind: "path"; d: string; fill: string }
  | { kind: "circle"; cx: number; cy: number; r: number; fill: string; stroke?: string; strokeWidth?: number }
  | { kind: "text"; x: number; y: number; text: string; fontSize: number; fontWeight?: string; fill: string; stroke?: string; strokeWidth?: number; fontFamily: string; transform?: string };

/** How far below its middle a line of text puts its baseline, as a share of its size: the same in every browser, where `dominant-baseline` is not. */
const TEXT_DROP = 0.35;
const middled = (middle: number, fontSize: number) => middle + fontSize * TEXT_DROP;

const SANS = "system-ui, sans-serif";

/** The four colours in a ring's quarters: a wild's middle, and the back's. */
function quarters(cx: number, cy: number, r: number): HitotsuShape[] {
  return HITOTSU_COLOURS.map((colour, at) => {
    const from = (at * Math.PI) / 2 - Math.PI / 2;
    const to = from + Math.PI / 2;
    const d = `M ${cx} ${cy} L ${cx + r * Math.cos(from)} ${cy + r * Math.sin(from)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(to)} ${cy + r * Math.sin(to)} Z`;
    return { kind: "path", d, fill: HITOTSU_COLOUR_LOOK[colour].fill };
  });
}

/**
 * The shapes of one card, in drawing order: a face, or the back for `null`.
 * `called` marks a wild on the pile with the colour it called.
 */
export function hitotsuCardShapes(card: HitotsuCard | null, called?: HitotsuColour): HitotsuShape[] {
  const ink = HITOTSU_COLOUR_LOOK.W.fill;
  if (card === null) {
    return [
      { kind: "rect", x: 0, y: 0, width: 100, height: 140, rx: 9, fill: HITOTSU_PAPER },
      { kind: "rect", x: 5, y: 5, width: 90, height: 130, rx: 6, fill: ink },
      { kind: "circle", cx: 50, cy: 70, r: 31, fill: HITOTSU_PAPER },
      ...quarters(50, 70, 28),
      { kind: "circle", cx: 50, cy: 70, r: 19, fill: ink },
      { kind: "text", x: 50, y: middled(71, 15), text: "一つ", fontSize: 15, fontWeight: "700", fill: HITOTSU_PAPER, fontFamily: "serif" },
    ];
  }
  const look = HITOTSU_COLOUR_LOOK[colourOf(card) ?? "W"];
  const face = faceOf(card);
  const mark = HITOTSU_FACE_MARK[face] ?? face;
  const corner = mark === "" ? "★" : mark;
  const wild = isWild(card);
  const middle = mark.length > 1 ? 26 : 38;
  return [
    { kind: "rect", x: 0, y: 0, width: 100, height: 140, rx: 9, fill: HITOTSU_PAPER },
    { kind: "rect", x: 5, y: 5, width: 90, height: 130, rx: 6, fill: look.fill },
    { kind: "rect", x: -27, y: -27, width: 54, height: 54, rx: 6, fill: wild ? ink : HITOTSU_PAPER, stroke: HITOTSU_PAPER, strokeWidth: 3, transform: "translate(50 70) rotate(45)" },
    ...(wild ? quarters(50, 70, face === "F" ? 20 : 26) : []),
    ...(mark === ""
      ? []
      : [{ kind: "text", x: 50, y: middled(70, middle), text: mark, fontSize: middle, fontWeight: "800", fill: wild ? HITOTSU_PAPER : look.fill, stroke: wild ? ink : "none", strokeWidth: wild ? 1.5 : 0, fontFamily: SANS } as HitotsuShape]),
    { kind: "text", x: 15, y: 22, text: corner, fontSize: 17, fontWeight: "800", fill: look.ink, fontFamily: SANS },
    { kind: "text", x: 85, y: 130, text: corner, fontSize: 17, fontWeight: "800", fill: look.ink, fontFamily: SANS, transform: "rotate(180 85 124)" },
    { kind: "text", x: 85, y: 22, text: look.element, fontSize: 14, fill: look.ink, fontFamily: "serif" },
    { kind: "text", x: 15, y: 130, text: look.element, fontSize: 14, fill: look.ink, fontFamily: "serif", transform: "rotate(180 15 124)" },
    ...(called === undefined ? [] : [{ kind: "circle", cx: 50, cy: 118, r: 7, fill: HITOTSU_COLOUR_LOOK[called].fill, stroke: HITOTSU_PAPER, strokeWidth: 2.5 } as HitotsuShape]),
  ];
}

const escaped = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function attributes(values: Record<string, string | number | undefined>): string {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => ` ${name}="${escaped(String(value))}"`)
    .join("");
}

/** One shape as SVG markup. */
export function hitotsuShapeSvg(shape: HitotsuShape): string {
  switch (shape.kind) {
    case "rect":
      return `<rect${attributes({ x: shape.x, y: shape.y, width: shape.width, height: shape.height, rx: shape.rx, fill: shape.fill, stroke: shape.stroke, "stroke-width": shape.strokeWidth, transform: shape.transform })}/>`;
    case "path":
      return `<path${attributes({ d: shape.d, fill: shape.fill })}/>`;
    case "circle":
      return `<circle${attributes({ cx: shape.cx, cy: shape.cy, r: shape.r, fill: shape.fill, stroke: shape.stroke, "stroke-width": shape.strokeWidth })}/>`;
    case "text":
      return `<text${attributes({ x: shape.x, y: shape.y, "text-anchor": "middle", "font-size": shape.fontSize, "font-weight": shape.fontWeight, fill: shape.fill, stroke: shape.stroke, "stroke-width": shape.strokeWidth, "font-family": shape.fontFamily, transform: shape.transform })}>${escaped(shape.text)}</text>`;
  }
}

/** A whole card as an SVG document, `width` pixels wide (140/100 of it tall): a face, or the back for `null`. */
export function hitotsuCardSvg(card: HitotsuCard | null, { width = 100, called, title }: { width?: number; called?: HitotsuColour; title?: string } = {}): string {
  const height = Math.round((width * HITOTSU_CARD_BOX.height) / HITOTSU_CARD_BOX.width);
  const label = title === undefined ? ` aria-hidden="true"` : ` role="img" aria-label="${escaped(title)}"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140" width="${width}" height="${height}"${label}>${hitotsuCardShapes(card, called).map(hitotsuShapeSvg).join("")}</svg>`;
}
