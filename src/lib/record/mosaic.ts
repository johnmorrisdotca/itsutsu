import { BOARD_GRIDS, HOT, STONES, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { GameState, RuleVariant } from "@/lib/gomoku/gomoku.types";
import { pointName } from "@/lib/gomoku/notation";
import { stonelessWord } from "@/lib/gomoku/rules/stoneless";

import { MOSAIC_ART, MOSAIC_COPY, MOSAIC_MOST_TILES, MOSAIC_PICKS, type MosaicPick } from "./mosaic.constants";
import type { MosaicFrame, MosaicPicture, MosaicTitle } from "./mosaic.types";
import { MOSAIC_WORDMARK } from "./mosaicLogo.constants";
import { centredBaseline } from "@/lib/ui/svgText";

/**
 * A GAME AS ONE PICTURE: every position it passed through, laid out in order
 * as tiles on one full-screen image. John, 2026-09-23: "a screenshot of every
 * move that was made until the end… the more moves there are the smaller the
 * tiles would become."
 *
 * PURE, AND THAT IS THE POINT. It takes positions and returns an SVG as a
 * string — no DOM, no canvas, no request — so the same code draws a player's
 * game in their own browser (`GameMosaic`, which turns the SVG into a PNG to
 * download) and a champion's game on John's machine for the offline gallery.
 * Nothing about it ever runs on the site's servers.
 */

/** Whether a game's board can be drawn as a square grid. The hexagon-lattice games cannot, yet. */
export function mosaicDraws(variant: RuleVariant): boolean {
  const spec = VARIANT_SPECS[variant];
  return !spec.connects && !spec.hexagon && !spec.chineseCheckers;
}

/**
 * One position as a short string, one letter a point: `b`/`w` a stone, `B`/`W`
 * a crowned draughts piece, `h` a hotspot, `x` anything else on the point (a
 * dead square, a wormhole's mouth), `.` empty.
 */
export function frameOf(state: GameState): MosaicFrame {
  const { size } = state.settings;
  const crowned = new Set(state.kings.map((point) => point.row * size + point.col));
  const board = state.board
    .map((cell, index) => {
      if (cell === STONES.black) return crowned.has(index) ? "B" : "b";
      if (cell === STONES.white) return crowned.has(index) ? "W" : "w";
      if (cell === HOT) return "h";
      return cell === null ? "." : "x";
    })
    .join("");
  const last = state.moves[state.moves.length - 1];
  const name = last === undefined ? "" : (stonelessWord(last.kind) ?? pointName(size, last));
  return { board, move: state.moves.length, name };
}

/** Text a person typed, made safe to stand inside SVG. */
function escaped(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** A line cut to what a tile can carry, so a long name does not run off the card. */
function fitted(text: string, most: number): string {
  return text.length <= most ? text : `${text.slice(0, most - 1)}…`;
}

/**
 * The positions worth a tile, from a game's whole timeline: one for each move
 * that changed the board, in order, the empty start left out. A timeline also
 * carries entries that change nothing on the board — an opening's choice of
 * colour, a twist still owed — and a tile of those would be the same picture
 * twice.
 */
export function framesOf(timeline: readonly GameState[]): MosaicFrame[] {
  const frames: MosaicFrame[] = [];
  let last = timeline.length > 0 ? frameOf(timeline[0]).board : "";
  for (const state of timeline.slice(1)) {
    const frame = frameOf(state);
    if (frame.board === last) continue;
    frames.push(frame);
    last = frame.board;
  }
  return frames;
}

/**
 * Which frames a picture shows when there are more than it has room for.
 *
 * - `every`: all of them — only offered when they fit.
 * - `spread`: evenly across the game, always the first and always the last,
 *   so the picture still runs from the opening to the end, jumping every two
 *   or three moves in between.
 * - `ending`: the last ones, counted back from the end — the part of a long
 *   game where it was decided.
 * - `opening`: the first ones, from the empty board on — how the game was
 *   set up (John, 2026-09-26: "maybe we want to see opening moves").
 */
export function pickFrames<T>(frames: readonly T[], pick: MosaicPick, most: number): T[] {
  if (frames.length <= most || pick === MOSAIC_PICKS.every) return [...frames];
  if (pick === MOSAIC_PICKS.opening) return frames.slice(0, most);
  if (most <= 1) return frames.slice(-most);
  if (pick === MOSAIC_PICKS.ending) return frames.slice(frames.length - most);
  const chosen: T[] = [];
  const last = frames.length - 1;
  for (let i = 0; i < most; i += 1) chosen.push(frames[Math.round((i * last) / (most - 1))]);
  return chosen;
}

/**
 * The grid that gives `count` tiles the most room in a picture of this shape:
 * every column count is tried and the one whose tiles come out biggest wins.
 * Its last row may be short — see `mosaicGrid` for the grid a picture uses.
 */
export function mosaicLayout(count: number, width: number, height: number): { columns: number; rows: number; side: number } {
  let best = { columns: 1, rows: Math.max(1, count), side: 0 };
  for (let columns = 1; columns <= Math.max(1, count); columns += 1) {
    const rows = Math.ceil(count / columns);
    const side = Math.min(width / columns, height / rows);
    if (side > best.side) best = { columns, rows, side };
  }
  return best;
}

/**
 * How much smaller than the loosest layout's a full grid's tiles may come out.
 * A full grid of nearly every position beats a bigger grid of far fewer.
 */
const FULL_GRID_SIDE = 0.85;

/**
 * A FULL GRID, ENDING ON ITS LAST TILE. John, 2026-09-25: "can we not end the
 * screenshot at the final bottom right frame?" — a last row half empty read as
 * a picture that stopped. So `shown` is always `columns × rows`, at most
 * `count`, and the last position lands in the bottom right corner.
 *
 * Every column count is tried with as many whole rows as `count` fills. Of the
 * grids whose tiles are nearly as big as the loosest layout's, the one showing
 * the most positions wins, then the one with the bigger tiles. The loosest
 * layout's own columns always qualify — one row fewer if its last is short —
 * so there is always an answer. A count that is not a neat rectangle loses a
 * few positions, skipped evenly by `pickFrames`, and the title bar says so.
 */
export function mosaicGrid(count: number, width: number, height: number): { columns: number; rows: number; side: number; shown: number } {
  if (count <= 0) return { columns: 0, rows: 0, side: 0, shown: 0 };
  const floor = mosaicLayout(count, width, height).side * FULL_GRID_SIDE;
  let best = { columns: 1, rows: 1, side: Math.min(width, height), shown: 1 };
  for (let columns = 1; columns <= count; columns += 1) {
    const rows = Math.floor(count / columns);
    const side = Math.min(width / columns, height / rows);
    if (side < floor) continue;
    const shown = columns * rows;
    if (shown > best.shown || (shown === best.shown && side > best.side)) best = { columns, rows, side, shown };
  }
  return best;
}

/**
 * The title bar's measures, as shares of the picture's shorter side so the
 * type reads the same on both shapes: the name's line, then the details'.
 * A portrait picture is narrow, so its details get a third line.
 */
const BAR = { top: 0.018, big: 0.03, small: 0.019, gap: 0.0275, step: 0.0255, bottom: 0.022 } as const;

/** The bar's height in pixels, and how many lines of details it has room for. */
function barOf(width: number, height: number): { bar: number; lines: number } {
  const lines = height > width ? 3 : 2;
  const share = BAR.top + BAR.big * 0.6 + BAR.gap + (lines - 1) * BAR.step + BAR.bottom;
  return { bar: Math.round(Math.min(width, height) * share), lines };
}

/**
 * A long game's grid, grown to fill its shape. `MOSAIC_MOST_TILES` sets how
 * small a tile may get; a shape whose grid of that many leaves a band of
 * ground — portrait's eight columns by fifteen rows leave room for a
 * sixteenth — takes whole rows or columns more at the same tile size, while
 * the game has positions for them.
 */
function grown(grid: ReturnType<typeof mosaicGrid>, count: number, width: number, height: number): ReturnType<typeof mosaicGrid> {
  const { columns, side } = grid;
  let { rows } = grid;
  let across = columns;
  while ((rows + 1) * side <= height + 1e-9 && across * (rows + 1) <= count) rows += 1;
  while ((across + 1) * side <= width + 1e-9 && (across + 1) * rows <= count) across += 1;
  return { columns: across, rows, side, shown: across * rows };
}

/**
 * The picture's layout before anything is drawn: the bar across the top and
 * the grid under it — so the panel can say, before drawing, whether a game has
 * more positions than the picture will hold.
 */
export function mosaicPlan(count: number, width: number, height: number): { bar: number; columns: number; rows: number; side: number; shown: number } {
  const { bar } = barOf(width, height);
  const grid = mosaicGrid(Math.min(count, MOSAIC_MOST_TILES), width, height - bar);
  return { bar, ...(count > grid.shown ? grown(grid, count, width, height - bar) : grid) };
}

/**
 * One tile's board, as SVG drawn into the square at (x, y) with sides `side`.
 *
 * When the tiles are big enough to carry a label, a strip under the board is
 * kept for it and the board is drawn smaller above it, the same for every tile
 * so a row of boards lines up. The label used to sit in the board's corner,
 * where a full board's last row of pieces covered it.
 */
function tileSvg(frame: MosaicFrame, size: number, cells: boolean, x: number, y: number, side: number): string {
  const art = MOSAIC_ART;
  const pad = side * art.gap;
  const inner = side - pad * 2;
  const labelled = side >= art.labelFrom;
  const font = Math.max(9, side * 0.075);
  const board = labelled ? inner - font * 1.6 : inner;
  const step = cells ? board / size : board / (size + 1);
  const at = (i: number) => (cells ? step * (i + 0.5) : step * (i + 1));
  const ox = x + pad + (inner - board) / 2;
  const oy = y + pad;
  const parts: string[] = [`<rect x="${x + pad}" y="${oy}" width="${inner}" height="${inner}" rx="${inner * 0.03}" fill="${art.wood}"/>`];

  const lines = cells ? Array.from({ length: size + 1 }, (_, i) => i * step) : Array.from({ length: size }, (_, i) => at(i));
  const from = cells ? 0 : at(0);
  const to = cells ? board : at(size - 1);
  const stroke = Math.max(0.5, step * 0.04);
  const path = lines.map((p) => `M${ox + from} ${oy + p}H${ox + to}M${ox + p} ${oy + from}V${oy + to}`).join("");
  parts.push(`<path d="${path}" stroke="${art.line}" stroke-width="${stroke}" opacity="0.7" fill="none"/>`);

  const radius = step * 0.44;
  [...frame.board].forEach((cell, index) => {
    if (cell === ".") return;
    const cx = ox + at(index % size);
    const cy = oy + at(Math.floor(index / size));
    if (cell === "x") {
      parts.push(`<rect x="${cx - radius}" y="${cy - radius}" width="${radius * 2}" height="${radius * 2}" fill="${art.line}" opacity="0.55"/>`);
      return;
    }
    if (cell === "h") {
      parts.push(`<circle cx="${cx}" cy="${cy}" r="${radius * 0.5}" fill="${art.hot}"/>`);
      return;
    }
    const black = cell === "b" || cell === "B";
    parts.push(
      `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${black ? art.black : art.white}" stroke="${black ? "#000" : art.whiteEdge}" stroke-width="${stroke}"/>`,
    );
    if (cell === "B" || cell === "W") {
      parts.push(`<circle cx="${cx}" cy="${cy}" r="${radius * 0.45}" fill="none" stroke="${art.crown}" stroke-width="${stroke * 2}"/>`);
    }
  });

  // The move under the board — its number and its name, "12 · H8", the way the move list reads.
  if (labelled && frame.move > 0) {
    const words = frame.name === "" ? `${frame.move}` : `${frame.move} · ${escaped(frame.name)}`;
    parts.push(
      `<text x="${x + side / 2}" y="${oy + board + font * 1.15}" font-family="system-ui, sans-serif" font-size="${font}" text-anchor="middle" fill="${art.label}">${words}</text>`,
    );
  }
  return parts.join("");
}

/**
 * Parts joined with " · " onto at most `most` lines of `wide` characters each,
 * in order; whatever will not fit ends the last line with an ellipsis.
 */
function wrapped(parts: readonly string[], wide: number, most: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const [i, part] of parts.entries()) {
    const joined = line === "" ? part : `${line} · ${part}`;
    if (joined.length <= wide || line === "") {
      line = joined;
      continue;
    }
    if (lines.length === most - 1) {
      lines.push(fitted(`${line} · ${parts.slice(i).join(" · ")}`, wide));
      return lines;
    }
    lines.push(line);
    line = part;
  }
  if (line !== "") lines.push(fitted(line, wide));
  return lines.slice(0, most);
}

/**
 * THE BAR ACROSS THE TOP. John, 2026-09-25: "add a nice bar at the top of the
 * image with the title... ITSUTSU GAME VIEWER: and then the title... and a
 * date perhaps, and any other references or info. if we have a title there,
 * then we don't need the title in the bottom right." So the brand and the
 * game's name on one line, and under it everything else a caller knows —
 * the date, the event, the result, the source — on one or two lines. The
 * brand is the logo, not words typed in a font (John, 2026-09-26: "should be
 * using my Logo"): the kit's wordmark down the bar's left, the rest beside it.
 */
function titleBarSvg(title: MosaicTitle, width: number, height: number): string {
  const art = MOSAIC_ART;
  const { bar, lines: room } = barOf(width, height);
  const short = Math.min(width, height);
  const pad = short * 0.025;
  const big = short * BAR.big;
  const small = short * BAR.small;
  // The wordmark's own box has its margins drawn in, so it runs the bar's height and sits at its left edge.
  const logoHigh = bar * 0.82;
  const logoWide = (logoHigh * MOSAIC_WORDMARK.width) / MOSAIC_WORDMARK.height;
  const textAt = logoWide + pad * 0.5;
  // An average character of the site's sans is a little over half its size across.
  const wideAt = (font: number) => Math.max(8, Math.floor((width - textAt - pad) / (font * 0.56)));
  const name = fitted(title.name, wideAt(big));
  const lines = wrapped(title.details, wideAt(small), room);
  // Fewer lines than there is room for sit in the middle of the bar, not at its top.
  const shift = ((room - lines.length) * BAR.step * short) / 2;
  const nameAt = shift + short * (BAR.top + BAR.big * 0.6);
  const lineAt = (i: number) => nameAt + short * (BAR.gap + i * BAR.step);
  const font = `font-family="system-ui, sans-serif"`;
  const parts = [
    `<rect width="${width}" height="${bar}" fill="${art.bar}"/>`,
    `<rect y="${bar - short * 0.003}" width="${width}" height="${short * 0.003}" fill="${art.wood}"/>`,
    `<svg x="0" y="${(bar - logoHigh) / 2}" width="${logoWide}" height="${logoHigh}" viewBox="0 0 ${MOSAIC_WORDMARK.width} ${MOSAIC_WORDMARK.height}">` +
      `<title>${MOSAIC_COPY.brand}</title>${MOSAIC_WORDMARK.body}</svg>`,
    `<text x="${textAt}" y="${centredBaseline(nameAt, big)}" ${font} font-size="${big}" font-weight="600" fill="${art.barTitle}">${escaped(name)}</text>`,
    ...lines.map(
      (line, i) =>
        `<text x="${textAt}" y="${centredBaseline(lineAt(i), small)}" ${font} font-size="${small}" fill="${art.barLine}">${escaped(line)}</text>`,
    ),
  ];
  return parts.join("");
}

/**
 * The whole picture: the title bar, and under it the chosen positions as a
 * full grid of tiles, in order left to right and top to bottom, the last in
 * the bottom right corner, centred on a dark ground of the picture's shape.
 */
export function mosaicSvg(picture: MosaicPicture): string {
  const { frames, pick, size, grid, width, height, title } = picture;
  const cells = grid === BOARD_GRIDS.cells;
  const { bar, columns, rows, side, shown } = mosaicPlan(frames.length, width, height);
  // A grid holds `shown` and no more, so "every" is only ever every one that fits.
  const chosen = pickFrames(frames, pick === MOSAIC_PICKS.every ? MOSAIC_PICKS.spread : pick, shown);
  const left = (width - columns * side) / 2;
  const top = bar + (height - bar - rows * side) / 2;
  const tiles = chosen.map((frame, i) => tileSvg(frame, size, cells, left + (i % columns) * side, top + Math.floor(i / columns) * side, side));
  // First, so a long line of details can never push it off the end.
  const details = shown < frames.length ? [MOSAIC_COPY.shownOf(shown, frames.length), ...title.details] : title.details;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="${width}" height="${height}" fill="${MOSAIC_ART.ground}"/>` +
    titleBarSvg({ name: title.name, details }, width, height) +
    tiles.join("") +
    `</svg>`
  );
}
