/**
 * WHICH WAY UP A TALL MAZE IS SHOWN, as the site decides it. A tall maze is two columns to three rows: made to
 * stand upright on a phone held upright, and to lie down on a wide screen, where upright it would be a narrow
 * strip with the page empty on either side. The package does the turning (`orientation`: a quarter turn
 * counter-clockwise, presentation only, so a line is the same line either way up) and can decide it itself
 * (`auto`); the site decides here instead, from the room the board's COLUMN has, and hands the package a plain
 * `portrait` or `landscape`. The reason is the wood: the frame round the maze has to be the shape the box inside
 * it is, and the package's own decision reads the width of the element it is mounted in, which is that frame, so
 * a frame that follows the decision would change the width the decision reads. Deciding from the column, which
 * does not change, cannot loop. It is the package's rule (`autoTurn`): turn when that makes the maze at least a
 * twelfth bigger.
 *
 * Remembered on the device, like the colours (`itsutsu.meikyuu.wayup`): Auto by default, and Upright and
 * Lying down for a reader who knows which they want.
 */
export const MEIKYUU_WAY_UP = ["auto", "portrait", "landscape"] as const;

export type MeikyuuWayUp = (typeof MEIKYUU_WAY_UP)[number];

/** Where the choice is kept on a device. */
export const WAY_UP_STORAGE = "itsutsu.meikyuu.wayup";

/** What a window holds besides the board, in pixels, in the page: its header, the trail and title over it. The board is never taller than the window less this, and never under 60% of it. */
export const MEIKYUU_RESERVE_PX = 256;

/** The same, in the modal of "Just the board": the backdrop's and the modal's padding, with the controls beside the board on a desk (10rem) or under it below one (24rem). */
export const MEIKYUU_BARE_RESERVE_REM = { beside: 10, under: 24 } as const;

/** Whether a word is one of the choices. */
export function isWayUp(word: unknown): word is MeikyuuWayUp {
  return typeof word === "string" && (MEIKYUU_WAY_UP as readonly string[]).includes(word);
}

/** The room a tall board has: the column's width, and the window's height less what else is on the page. Null before either is known. */
export type MeikyuuRoom = { width: number; height: number };

export function roomOf(columnWidth: number, windowHeight: number, reserve: number = MEIKYUU_RESERVE_PX): MeikyuuRoom | null {
  if (!(columnWidth > 0) || !(windowHeight > 0)) return null;
  return { width: columnWidth, height: Math.max(windowHeight - reserve, windowHeight * 0.6) };
}

/**
 * Whether a tall maze (columns over rows `ratio`, 2:3) is shown lying down. `portrait` never, `landscape` always;
 * `auto` when lying down makes the maze more than a twelfth bigger in the room there is, and never without knowing
 * the room (upright is how it was made, and how a phone has it).
 */
export function lyingDown(setting: MeikyuuWayUp, ratio: number, room: MeikyuuRoom | null): boolean {
  if (setting === "landscape") return true;
  if (setting === "portrait" || room === null) return false;
  // The maze's long side, in pixels, as large as the room lets it be: stood up it is as tall as the room, and as wide as `ratio` of that; lying down the other way.
  const upright = Math.min(room.width / ratio, room.height);
  const lying = Math.min(room.width, room.height / ratio);
  return lying > upright * (1 + 1 / 12);
}
