import { boundsOf, placeOf, type Tiles } from "./grid";

/**
 * HOW THE TABLE IS LOOKED AT: which squares are shown, how big a tile is
 * drawn and where. Pure, and apart from the game (`play.ts`): the tiles are
 * where the player put them whatever the view, and a view is a function of
 * the tiles, the screen and the player's own zooming and panning.
 *
 * John, 2026-09-26: no board — "literally there is no board in the real world
 * game." The table shown is the tiles' own extent plus a margin all round, so
 * there is always room to build outward, and it zooms to fit the crossword:
 * big tiles for a first word, smaller as the grid spreads, never smaller than
 * a thumb can press (`TABLE.tileLeast`). Past that the table pans instead.
 */
export const TABLE = {
  /** Empty squares shown beyond the tiles on every side. */
  margin: 2,
  /** The smallest a tile is drawn, in CSS pixels: a comfortable thumb. */
  tileLeast: 32,
  /** The largest a fitted tile is drawn: a first word does not fill a desk. */
  tileMost: 56,
  /** The largest a player may zoom a tile to by hand. */
  zoomMost: 88,
  /** How near an edge of the table a dragged tile starts it panning, and how fast, in pixels a frame. */
  edge: 36,
  edgeStep: 8,
  /** How long a dragged tile must stay near an edge before the table pans: crossing an edge on the way in is not asking to pan. */
  edgeDwellMs: 350,
} as const;

/** The squares shown: from `top`/`left`, `rows` by `cols`. */
export type Area = { top: number; left: number; rows: number; cols: number };

/** A view: a tile's side in pixels, and where the corner of square (0, 0) is drawn. */
export type View = { tile: number; x: number; y: number };

/** The squares to show: the tiles' extent and the margin, or the margin round square (0, 0) on an empty table. Extra squares (the one a typed letter goes to) are kept in. */
export function tableArea(tiles: Tiles, also: readonly string[] = []): Area {
  const bounds = boundsOf(tiles) ?? { top: 0, left: 0, bottom: 0, right: 0 };
  let { top, left, bottom, right } = bounds;
  for (const square of also) {
    const { row, col } = placeOf(square);
    top = Math.min(top, row);
    left = Math.min(left, col);
    bottom = Math.max(bottom, row);
    right = Math.max(right, col);
  }
  const m = TABLE.margin;
  return { top: top - m, left: left - m, rows: bottom - top + 1 + 2 * m, cols: right - left + 1 + 2 * m };
}

/**
 * The view that shows the whole area, centred, its tiles as big as fit between
 * the least and the most. A picture nobody presses (a finished grid, the
 * set-up preview) passes a smaller least, so a whole grid fits its box.
 */
export function fitView(area: Area, width: number, height: number, least: number = TABLE.tileLeast): View {
  const fits = Math.min(width / area.cols, height / area.rows);
  const tile = Math.max(least, Math.min(TABLE.tileMost, Math.floor(fits)));
  return {
    tile,
    x: Math.round((width - area.cols * tile) / 2 - area.left * tile),
    y: Math.round((height - area.rows * tile) / 2 - area.top * tile),
  };
}

/** Whether the area, at this view's size, is bigger than the screen: then the table pans. */
export function overflows(area: Area, view: View, width: number, height: number): boolean {
  return area.cols * view.tile > width + 0.5 || area.rows * view.tile > height + 0.5;
}

/** Zoomed by `factor` about the point (px, py) on the screen, which stays over the same spot of the table. */
export function zoomView(view: View, factor: number, px: number, py: number): View {
  const tile = Math.max(TABLE.tileLeast, Math.min(TABLE.zoomMost, view.tile * factor));
  const scale = tile / view.tile;
  return { tile, x: px - (px - view.x) * scale, y: py - (py - view.y) * scale };
}

export function panView(view: View, dx: number, dy: number): View {
  return { ...view, x: view.x + dx, y: view.y + dy };
}

/**
 * Kept within reach: some of the area always on the screen, so a pan can
 * never lose the crossword. A quarter of the screen or two tiles, whichever
 * is less, stays in view on every side.
 */
export function keepInReach(view: View, area: Area, width: number, height: number): View {
  const hold = (span: number) => Math.min(span / 4, view.tile * 2);
  const left = view.x + area.left * view.tile;
  const top = view.y + area.top * view.tile;
  const right = left + area.cols * view.tile;
  const bottom = top + area.rows * view.tile;
  let { x, y } = view;
  if (right < hold(width)) x += hold(width) - right;
  if (left > width - hold(width)) x -= left - (width - hold(width));
  if (bottom < hold(height)) y += hold(height) - bottom;
  if (top > height - hold(height)) y -= top - (height - hold(height));
  return { ...view, x, y };
}

/** The square under a point on the screen. */
export function squareUnder(view: View, px: number, py: number): { row: number; col: number } {
  return { row: Math.floor((py - view.y) / view.tile), col: Math.floor((px - view.x) / view.tile) };
}

/** Which way, and how far, the table pans this frame for a tile dragged to (px, py): toward the edge it is near. */
export function edgePan(px: number, py: number, width: number, height: number): { dx: number; dy: number } {
  const step = (near: number) => (near < TABLE.edge ? TABLE.edgeStep * (1 - Math.max(0, near) / TABLE.edge) : 0);
  return { dx: step(px) - step(width - px), dy: step(py) - step(height - py) };
}
