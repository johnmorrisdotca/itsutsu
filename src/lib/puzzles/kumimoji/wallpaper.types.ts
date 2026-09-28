import type { MosaicTitle } from "@/lib/record/mosaic.types";

import type { Tiles } from "./grid";

/**
 * One finished crossword as the wallpaper asks the site for it: the grid in
 * its code (`encodeGrid`), the hand it opened with, and when it was finished,
 * as an ISO string. Nothing else about the solve, and nothing about anybody.
 */
export type WallpaperCrossword = { answer: string; size: number; finishedAt: string };

/** One crossword ready to draw: its tiles, when it was finished, and the line under it — the day it was built, in the reader's calendar. */
export type WallpaperTile = { tiles: Tiles; finishedAt: string; label: string };

/** Everything one wallpaper needs: the crosswords in the order they are laid, the picture's shape in pixels, and its title. */
export type KumimojiWallpaperPicture = {
  crosswords: readonly WallpaperTile[];
  width: number;
  height: number;
  title: MosaicTitle;
};

/** Where the crosswords go: the bar's height, the grid of cells under it, and how many cells the last row holds. */
export type WallpaperPlan = { bar: number; columns: number; rows: number; side: number; lastRow: number };

/** Where the press has got to: nothing asked yet, asking, the answer, or no answer. */
export type WallpaperFetch = { state: "idle" } | { state: "loading" } | { state: "failed" } | { state: "ready"; rows: readonly WallpaperCrossword[] };
