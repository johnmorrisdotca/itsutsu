import { BOARD_GRIDS, HOT, STONES, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { GameState, RuleVariant } from "@/lib/gomoku/gomoku.types";
import { pointName } from "@/lib/gomoku/notation";
import { stonelessWord } from "@/lib/gomoku/rules/stoneless";

import { MOSAIC_ART, MOSAIC_PICKS, type MosaicPick } from "./mosaic.constants";
import type { MosaicFrame, MosaicPicture } from "./mosaic.types";

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
 */
export function pickFrames<T>(frames: readonly T[], pick: MosaicPick, most: number): T[] {
  if (frames.length <= most || pick === MOSAIC_PICKS.every) return [...frames];
  if (pick === MOSAIC_PICKS.ending) return frames.slice(frames.length - most);
  const chosen: T[] = [];
  const last = frames.length - 1;
  for (let i = 0; i < most; i += 1) chosen.push(frames[Math.round((i * last) / (most - 1))]);
  return chosen;
}

/**
 * The grid that gives `count` tiles the most room in a picture of this shape:
 * every column count is tried and the one whose tiles come out biggest wins.
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

/** One tile's board, as SVG drawn into the square at (x, y) with sides `side`. */
function tileSvg(frame: MosaicFrame, size: number, cells: boolean, x: number, y: number, side: number): string {
  const art = MOSAIC_ART;
  const pad = side * art.gap;
  const inner = side - pad * 2;
  const step = cells ? inner / size : inner / (size + 1);
  const at = (i: number) => (cells ? step * (i + 0.5) : step * (i + 1));
  const ox = x + pad;
  const oy = y + pad;
  const parts: string[] = [`<rect x="${ox}" y="${oy}" width="${inner}" height="${inner}" rx="${inner * 0.03}" fill="${art.wood}"/>`];

  const lines = cells ? Array.from({ length: size + 1 }, (_, i) => i * step) : Array.from({ length: size }, (_, i) => at(i));
  const from = cells ? 0 : at(0);
  const to = cells ? inner : at(size - 1);
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

  /*
   * The move in the tile's corner — its number and its name on the board,
   * "12 · H8", the way the move list reads — when the tile is big enough to
   * carry it. A spare board has neither.
   */
  if (side >= art.labelFrom && frame.move > 0) {
    const font = Math.max(9, side * 0.075);
    const words = frame.name === "" ? `${frame.move}` : `${frame.move} · ${escaped(frame.name)}`;
    parts.push(
      `<text x="${x + side - pad * 1.5}" y="${y + side - pad * 1.5}" font-family="system-ui, sans-serif" font-size="${font}" text-anchor="end" fill="${art.label}">${words}</text>`,
    );
  }
  return parts.join("");
}

/** The card in the last spare space: the game's own lines on a board's wood, centred. */
function detailsSvg(lines: readonly string[], x: number, y: number, side: number): string {
  const art = MOSAIC_ART;
  const pad = side * art.gap;
  const inner = side - pad * 2;
  const font = Math.max(9, inner * 0.075);
  const gap = font * 1.45;
  const top = y + side / 2 - ((lines.length - 1) * gap) / 2;
  const most = Math.max(8, Math.floor(inner / (font * 0.55)));
  const text = lines
    .map(
      (line, i) =>
        `<text x="${x + side / 2}" y="${top + i * gap}" font-family="system-ui, sans-serif" font-size="${font}" font-weight="${i === 0 ? 600 : 400}" text-anchor="middle" dominant-baseline="middle" fill="${art.line}">${escaped(fitted(line, most))}</text>`,
    )
    .join("");
  return `<rect x="${x + pad}" y="${y + pad}" width="${inner}" height="${inner}" rx="${inner * 0.03}" fill="${art.wood}"/>${text}`;
}

/**
 * The whole picture: the chosen positions as tiles, in order left to right and
 * top to bottom, centred on a dark ground the shape of the screen it was made for.
 */
export function mosaicSvg(picture: MosaicPicture): string {
  const { frames, size, grid, width, height } = picture;
  const cells = grid === BOARD_GRIDS.cells;
  const { columns, rows, side } = mosaicLayout(frames.length, width, height);
  const left = (width - columns * side) / 2;
  const top = (height - rows * side) / 2;
  const place = (i: number) => ({ x: left + (i % columns) * side, y: top + Math.floor(i / columns) * side });
  const tiles = frames.map((frame, i) => tileSvg(frame, size, cells, place(i).x, place(i).y, side));
  // The spaces the last row leaves over: empty boards, the last of them carrying the game's own lines.
  const slots = columns * rows;
  if (picture.fillSpare && slots > frames.length) {
    const empty: MosaicFrame = { board: ".".repeat(size * size), move: 0, name: "" };
    for (let i = frames.length; i < slots; i += 1) {
      const { x, y } = place(i);
      const last = i === slots - 1 && picture.details.length > 0;
      tiles.push(last ? detailsSvg(picture.details, x, y, side) : tileSvg(empty, size, cells, x, y, side));
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="${width}" height="${height}" fill="${MOSAIC_ART.ground}"/>` +
    tiles.join("") +
    `</svg>`
  );
}
