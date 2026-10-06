import { MOSAIC_ART, MOSAIC_COPY } from "@/lib/record/mosaic.constants";
import { barOf, escaped, mosaicLayout, titleBarSvg } from "@/lib/record/mosaic";
import type { MosaicTitle } from "@/lib/record/mosaic.types";
import { centredBaseline } from "@/lib/ui/svgText";

import { boundsOf, decodeGrid, placeOf } from "./grid";
import { tileFace } from "./tileFace";
import { KUMIMOJI_WALLPAPER_COPY, KUMIMOJI_WALLPAPER_MOST, WALLPAPER_TABLE_MARGIN, WALLPAPER_TILE_ART } from "./wallpaper.constants";
import type { KumimojiWallpaperPicture, WallpaperCrossword, WallpaperPlan, WallpaperTile } from "./wallpaper.types";

/**
 * EVERY CROSSWORD A MEMBER HAS BUILT, AS ONE PICTURE. John, 2026-09-28:
 * "every single game you play is saved and so you can have a history of all
 * the nice cool maps that you made… a wallpaper of all the cool games you've
 * played, similar to the other games where you have wallpapers."
 *
 * The game wallpaper's picture in every convention it has — the two shapes
 * (`MOSAIC_SHAPES`), the dark ground, the title bar with the logo
 * (`titleBarSvg`), a square of wood per tile with a line under it — and one
 * finished crossword on each square, its tiles drawn as the game draws them.
 *
 * PURE, as `mosaic.ts` is: crosswords in, an SVG string out, with no DOM, no
 * canvas and no request, so it is tested here and drawn in the reader's
 * browser, never on the site's servers.
 */

/** Tiles' letters: the site's sans, with the Japanese faces a phone or a desk already has for kana. */
const LETTER_FONT = `system-ui, -apple-system, 'Hiragino Sans', 'Yu Gothic', 'Noto Sans JP', sans-serif`;
/** The blank wild's 五, in mincho as the game sets it. */
const MINCHO_FONT = `'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', serif`;

/**
 * Where the crosswords go. The grid that gives each cell the most room
 * (`mosaicLayout`, the game wallpaper's own), and — unlike a game's positions,
 * which are thinned to a full rectangle — every crossword asked for, up to
 * `KUMIMOJI_WALLPAPER_MOST`: each is somebody's own work, and leaving one out
 * to square the grid would be losing it. A short last row is centred.
 */
export function wallpaperPlan(count: number, width: number, height: number): WallpaperPlan {
  const { bar } = barOf(width, height);
  const shown = Math.min(Math.max(0, count), KUMIMOJI_WALLPAPER_MOST);
  if (shown === 0) return { bar, columns: 0, rows: 0, side: 0, lastRow: 0 };
  const { columns, rows, side } = mosaicLayout(shown, width, height - bar);
  return { bar, columns, rows, side, lastRow: shown - (rows - 1) * columns };
}

/** The top-left corner of each cell, in the order the crosswords are laid: left to right, top to bottom. */
export function wallpaperPlaces(count: number, width: number, height: number): { x: number; y: number; side: number }[] {
  const { bar, columns, rows, side, lastRow } = wallpaperPlan(count, width, height);
  const top = bar + (height - bar - rows * side) / 2;
  const places: { x: number; y: number; side: number }[] = [];
  for (let row = 0; row < rows; row += 1) {
    const across = row === rows - 1 ? lastRow : columns;
    const left = (width - across * side) / 2;
    for (let col = 0; col < across; col += 1) places.push({ x: left + col * side, y: top + row * side, side });
  }
  return places;
}

/**
 * The crosswords to lay, oldest first, so the newest lands in the bottom
 * right as a game's last move does: the newest `KUMIMOJI_WALLPAPER_MOST` of
 * rows that arrive newest first, each read back from its code. A code that
 * does not read as a grid, or reads as no tiles, is left out rather than drawn
 * as an empty square — an empty square would say a crossword had no tiles.
 */
export function wallpaperCrosswords(rows: readonly WallpaperCrossword[], labelOf: (row: WallpaperCrossword, tiles: number) => string): WallpaperTile[] {
  const read: WallpaperTile[] = [];
  for (const row of rows) {
    if (read.length === KUMIMOJI_WALLPAPER_MOST) break;
    const tiles = decodeGrid(row.answer);
    if (tiles === null || tiles.size === 0) continue;
    read.push({ tiles, finishedAt: row.finishedAt, label: labelOf(row, tiles.size) });
  }
  return read.reverse();
}

/** A day as YYYY-MM-DD in the calendar of wherever this runs: the reader's, since it runs in their browser. */
export function dayOf(iso: string): string | null {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
}

/** What a tile prints: English in capitals, as the game shows it; kana and the blank wild's 五 as they are. */
function glyphOf(face: ReturnType<typeof tileFace>): string {
  return face.glyph.toUpperCase();
}

/** One tile at (x, y) with sides `size`: the white tile or the charcoal wild, its letter, and a kana's other forms in its corner. */
function tileSvg(code: string, x: number, y: number, size: number): string {
  const art = WALLPAPER_TILE_ART;
  const face = tileFace(code);
  const rim = Math.max(0.5, size * 0.05);
  const radius = size * 0.14;
  const parts = [
    `<rect x="${x}" y="${y + size * 0.04}" width="${size}" height="${size}" rx="${radius}" fill="${art.shadow}"/>`,
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="${face.wild ? art.wild : art.tile}" stroke="${face.wild ? art.wild : art.rim}" stroke-opacity="0.7" stroke-width="${rim}"/>`,
  ];
  const ink = face.wild ? art.wildLetter : art.letter;
  const font = size * art.letterShare;
  const middle = y + size * (face.blank ? 0.4 : 0.5);
  const family = face.blank ? MINCHO_FONT : LETTER_FONT;
  parts.push(
    `<text x="${x + size / 2}" y="${centredBaseline(middle, font)}" font-family="${family}" font-size="${font}" font-weight="700" text-anchor="middle" fill="${ink}">${escaped(glyphOf(face))}</text>`,
  );
  if (face.forms !== "" && size >= art.formsFrom) {
    const small = font * art.formsShare;
    parts.push(
      `<text x="${x + size * 0.93}" y="${y + size * 0.05 + small}" font-family="${LETTER_FONT}" font-size="${small}" text-anchor="end" fill="${ink}" opacity="0.75">${escaped(face.forms)}</text>`,
    );
  }
  // The logo's five stones under the 五, as the game's blank wild carries them.
  if (face.blank && size >= art.stonesFrom) {
    const wide = size * 0.62;
    const r = wide / 14;
    const cy = y + size * 0.91 - r;
    [0, 1, 2, 3, 4].forEach((at) => {
      const cx = x + (size - wide) / 2 + r + at * ((wide - 2 * r) / 4);
      const dark = at !== 0 && at !== 4;
      parts.push(`<circle cx="${cx}" cy="${cy}" r="${r * 0.72}" fill="${dark ? art.wild : art.wildLetter}" stroke="${art.wildLetter}" stroke-width="${r * 0.25}"/>`);
    });
  }
  return parts.join("");
}

/**
 * One crossword in the square at (x, y) with sides `side`: a square of wood,
 * ruled on the squares' edges as the table is, the tiles fitted to it with an
 * empty square all round, and — when the square is big enough to carry one —
 * the line under it that a game's tile carries its move in.
 */
export function crosswordSvg(crossword: WallpaperTile, x: number, y: number, side: number): string {
  const art = MOSAIC_ART;
  const pad = side * art.gap;
  const inner = side - pad * 2;
  const labelled = side >= art.labelFrom && crossword.label !== "";
  const font = Math.max(9, side * 0.075);
  const boardHigh = labelled ? inner - font * 1.6 : inner;
  const bounds = boundsOf(crossword.tiles) ?? { top: 0, left: 0, bottom: 0, right: 0 };
  const margin = WALLPAPER_TABLE_MARGIN;
  const cols = bounds.right - bounds.left + 1 + margin * 2;
  const rows = bounds.bottom - bounds.top + 1 + margin * 2;
  const step = Math.min(inner / cols, boardHigh / rows);
  const boxLeft = x + pad;
  const boxTop = y + pad;
  // The crossword's first square, centred in the board's part of the wood.
  const ox = boxLeft + (inner - cols * step) / 2 + margin * step;
  const oy = boxTop + (boardHigh - rows * step) / 2 + margin * step;
  const parts = [`<rect x="${boxLeft}" y="${boxTop}" width="${inner}" height="${inner}" rx="${inner * 0.03}" fill="${art.wood}"/>`];

  // The ruling, a tile apart and lined up with the tiles, across the board's part of the wood.
  const lines: string[] = [];
  for (let at = ox - Math.floor((ox - boxLeft) / step) * step; at <= boxLeft + inner + 1e-6; at += step) lines.push(`M${at} ${boxTop}V${boxTop + boardHigh}`);
  for (let at = oy - Math.floor((oy - boxTop) / step) * step; at <= boxTop + boardHigh + 1e-6; at += step) lines.push(`M${boxLeft} ${at}H${boxLeft + inner}`);
  parts.push(`<path d="${lines.join("")}" stroke="${art.line}" stroke-width="${Math.max(0.5, step * 0.04)}" opacity="${WALLPAPER_TILE_ART.rulingOpacity}" fill="none"/>`);

  const inset = step * 0.04;
  for (const [square, code] of crossword.tiles) {
    const { row, col } = placeOf(square);
    parts.push(tileSvg(code, ox + (col - bounds.left) * step + inset, oy + (row - bounds.top) * step + inset, step - inset * 2));
  }

  if (labelled) {
    parts.push(
      `<text x="${x + side / 2}" y="${boxTop + boardHigh + font * 1.15}" font-family="system-ui, sans-serif" font-size="${font}" text-anchor="middle" fill="${art.label}">${escaped(crossword.label)}</text>`,
    );
  }
  return parts.join("");
}

/**
 * The title bar's words for the crosswords drawn: how many, the days they
 * span, the tiles laid, and the site — and, when the member has more than
 * one picture holds (`more`), that these are their newest.
 */
export function wallpaperTitle(game: string, crosswords: readonly WallpaperTile[], more: boolean, copy: typeof KUMIMOJI_WALLPAPER_COPY = KUMIMOJI_WALLPAPER_COPY): MosaicTitle {
  const days = crosswords
    .map((crossword) => dayOf(crossword.finishedAt))
    .filter((day): day is string => day !== null)
    .sort();
  const first = days[0];
  const last = days[days.length - 1];
  const span = first === undefined || last === undefined ? [] : [first === last ? first : copy.range(first, last)];
  const tiles = crosswords.reduce((sum, crossword) => sum + crossword.tiles.size, 0);
  return {
    name: copy.name(game, crosswords.length),
    details: [...(more ? [copy.newest(crosswords.length)] : []), ...span, copy.tiles(tiles), MOSAIC_COPY.site],
  };
}

/**
 * The whole picture: the title bar, and under it one square of wood per
 * crossword, oldest top left and newest bottom right, centred on the dark
 * ground of the picture's shape.
 */
export function kumimojiWallpaperSvg(picture: KumimojiWallpaperPicture): string {
  const { crosswords, width, height, title } = picture;
  const places = wallpaperPlaces(crosswords.length, width, height);
  const cells = places.map((place, i) => crosswordSvg(crosswords[i]!, place.x, place.y, place.side));
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="${width}" height="${height}" fill="${MOSAIC_ART.ground}"/>` +
    titleBarSvg(title, width, height) +
    cells.join("") +
    `</svg>`
  );
}
