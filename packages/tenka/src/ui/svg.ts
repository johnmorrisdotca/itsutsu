import type { TenkaMapModel, TenkaView } from "./mapModel.ts";

const SVG = "http://www.w3.org/2000/svg";

function el<K extends keyof SVGElementTagNameMap>(name: K, attributes: Record<string, string | number>): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}

/** The ring drawn round a territory, by kind. */
const RING = { chosen: { stroke: "#111", width: 3 }, target: { stroke: "#fff", width: 3 }, reach: { stroke: "#111", width: 1.5 } } as const;

/**
 * THE WORLD AS AN SVG ELEMENT, drawn from a model (`tenkaMapModel`): the
 * sea, each territory in its owner's colour, the continents' borders and the
 * sea links, the rings of a choice, and a counter of armies on each. Every
 * territory's shape and counter carries `data-territory` with its number, so
 * one listener on the element can tell which was pressed.
 */
export function tenkaMapSvg(model: TenkaMapModel, options: { label?: string; view?: TenkaView; pixels?: number } = {}): SVGSVGElement {
  const [vx, vy, vw, vh] = options.view ?? [0, 0, model.width, model.height];
  // A screen pixel in map units, so counters and rings are drawn one size on the screen whatever is shown:
  // from `pixels`, the drawing's width on the screen, or as though it were a thousand pixels wide.
  const unit = vw / (options.pixels ?? 1000);
  const svg = el("svg", { viewBox: `${vx} ${vy} ${vw} ${vh}`, role: "group", "aria-label": options.label ?? "Map of the world", class: "tk-map" });
  svg.append(el("rect", { x: -model.width, y: -model.height, width: model.width * 3, height: model.height * 3, class: "tk-sea" }));
  for (const land of model.lands) {
    const path = el("path", { d: land.outline, fill: land.fill, class: "tk-land", "data-territory": land.territory, "stroke-linejoin": "round" });
    const title = el("title", {});
    title.textContent = `${land.name}: ${land.armies}`;
    path.append(title);
    svg.append(path);
  }
  svg.append(el("path", { d: model.continentBorders, class: "tk-borders", fill: "none" }));
  for (const [x1, y1, x2, y2] of model.seaLines) svg.append(el("line", { x1: x1!, y1: y1!, x2: x2!, y2: y2!, class: "tk-sea-link" }));
  for (const land of model.lands) {
    if (land.ring === null) continue;
    const ring = RING[land.ring];
    svg.append(el("path", { d: land.outline, fill: "none", stroke: ring.stroke, "stroke-width": ring.width * unit, "pointer-events": "none", "stroke-linejoin": "round" }));
  }
  for (const land of model.lands) {
    const [x, y] = land.at;
    const counter = el("g", { class: "tk-counter", "data-territory": land.territory });
    counter.append(el("circle", { cx: x, cy: y, r: 11 * unit, fill: land.fill, "stroke-width": 1.2 * unit }));
    const text = el("text", { x, y, "text-anchor": "middle", "dominant-baseline": "central", "font-size": 12 * unit, "stroke-width": 2 * unit });
    text.textContent = String(land.armies);
    counter.append(text);
    svg.append(counter);
  }
  return svg;
}
