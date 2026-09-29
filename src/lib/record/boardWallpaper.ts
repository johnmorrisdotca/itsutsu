import { MOSAIC_ART, MOSAIC_COPY } from "./mosaic.constants";
import { barOf, titleBarSvg } from "./mosaic";
import type { MosaicTitle } from "./mosaic.types";

/**
 * A FINISHED BOARD AS A WALLPAPER: the game wallpaper's frame — the dark
 * ground, the title bar with the logo (`titleBarSvg`), the two shapes — with
 * the board itself in the middle, as it was drawn on the page
 * (`boardSnapshot.ts`), as large as the shape allows.
 *
 * The board games' wallpaper is every position of the game (`mosaic.ts`).
 * Every other game — a puzzle, a party table, a card game — has no moves to
 * draw a board from, only the board the reader finished on, so its wallpaper
 * is that board, and its title bar says what it was and how it ended.
 *
 * PURE: a picture of the board and its size in, an SVG string out.
 */
export type BoardWallpaperPicture = {
  /** The board, as a PNG data: address. */
  board: { url: string; width: number; height: number };
  width: number;
  height: number;
  title: MosaicTitle;
};

/** How much of the room under the bar the board may take, so the ground frames it. */
const BOARD_SHARE = 0.9;

/** Where the board sits: centred under the bar, as large as fits, its own shape kept. */
export function boardPlace(board: { width: number; height: number }, width: number, height: number): { x: number; y: number; w: number; h: number } {
  const { bar } = barOf(width, height);
  const roomW = width * BOARD_SHARE;
  const roomH = (height - bar) * BOARD_SHARE;
  const scale = Math.min(roomW / Math.max(1, board.width), roomH / Math.max(1, board.height));
  const w = board.width * scale;
  const h = board.height * scale;
  return { x: (width - w) / 2, y: bar + (height - bar - h) / 2, w, h };
}

export function boardWallpaperSvg(picture: BoardWallpaperPicture): string {
  const { board, width, height, title } = picture;
  const place = boardPlace(board, width, height);
  const round = Math.min(place.w, place.h) * 0.02;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<defs><clipPath id="board-edge"><rect x="${place.x}" y="${place.y}" width="${place.w}" height="${place.h}" rx="${round}"/></clipPath></defs>` +
    `<rect width="${width}" height="${height}" fill="${MOSAIC_ART.ground}"/>` +
    titleBarSvg(title, width, height) +
    `<image href="${board.url}" x="${place.x}" y="${place.y}" width="${place.w}" height="${place.h}" preserveAspectRatio="xMidYMid meet" clip-path="url(#board-edge)"/>` +
    `</svg>`
  );
}

/** The day, in this reader's calendar — called in a handler, where there is only the browser. */
export function todayWords(at: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
}

/** The title bar of a finished board: the game's name, then the day, how it ended, and the site. */
export function boardWallpaperTitle(name: string, details: readonly string[], at: Date = new Date()): MosaicTitle {
  return { name, details: [todayWords(at), ...details.filter((detail) => detail !== ""), MOSAIC_COPY.site] };
}
