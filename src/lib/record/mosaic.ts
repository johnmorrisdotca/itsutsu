import { BOARD_GRIDS, HOT, STONES, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { GameState, RuleVariant } from "@/lib/gomoku/gomoku.types";
import { pointName } from "@/lib/gomoku/notation";
import { stonelessWord } from "@/lib/gomoku/rules/stoneless";

import { MOSAIC_ART, MOSAIC_PICKS, type MosaicPick } from "./mosaic.constants";
import type { MosaicFrame, MosaicPicture } from "./mosaic.types";
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
 * The card after the last move: the game's own lines on a board's wood,
 * centred, as wide as every space the last row leaves over — so the lines have
 * room, and the picture ends on the game's name rather than a row of dark.
 */
function detailsSvg(lines: readonly string[], x: number, y: number, width: number, side: number): string {
  const art = MOSAIC_ART;
  const pad = side * art.gap;
  const tall = side - pad * 2;
  const wide = width - pad * 2;
  const font = Math.max(9, Math.min(tall * 0.1, (tall * 0.8) / (lines.length * 1.45)));
  const gap = font * 1.45;
  const top = y + side / 2 - ((lines.length - 1) * gap) / 2;
  const most = Math.max(8, Math.floor(wide / (font * 0.55)));
  const text = lines
    .map(
      (line, i) =>
        `<text x="${x + width / 2}" y="${centredBaseline(top + i * gap, font)}" font-family="system-ui, sans-serif" font-size="${font}" font-weight="${i === 0 ? 600 : 400}" text-anchor="middle" fill="${art.line}">${escaped(fitted(line, most))}</text>`,
    )
    .join("");
  return `<rect x="${x + pad}" y="${y + pad}" width="${wide}" height="${tall}" rx="${tall * 0.03}" fill="${art.wood}"/>${text}`;
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
  /*
   * The spaces the last row leaves over. With the game's details, one card as
   * wide as all of them; with none, an empty board in each. Left unfilled,
   * the dark ground.
   */
  const spare = columns * rows - frames.length;
  if (picture.fillSpare && spare > 0) {
    const { x, y } = place(frames.length);
    if (picture.details.length > 0) {
      tiles.push(detailsSvg(picture.details, x, y, spare * side, side));
    } else {
      const empty: MosaicFrame = { board: ".".repeat(size * size), move: 0, name: "" };
      for (let i = frames.length; i < frames.length + spare; i += 1) tiles.push(tileSvg(empty, size, cells, place(i).x, place(i).y, side));
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="${width}" height="${height}" fill="${MOSAIC_ART.ground}"/>` +
    tiles.join("") +
    `</svg>`
  );
}
