"use client";

import { useState } from "react";

/** The sizes the tiles show at once: four, as every set-up screen keeps room for (`picker.test.ts`). */
export const SIZE_TILES = 4;

/** Where each shelf of four sizes starts: every four, and a last one moved back so it too is full — 0, 4 and 5 for nine sizes, 0, 4, 8 and 9 for thirteen. */
export function shelvesOf(count: number): number[] {
  const starts: number[] = [];
  for (let start = 0; start < count; start += SIZE_TILES) starts.push(Math.min(start, Math.max(0, count - SIZE_TILES)));
  return [...new Set(starts)];
}

/**
 * The shelf a screen opens on for the size asked for: the FIRST whose four tiles show it. The last shelf is moved back so that it is full, so it
 * overlaps the one before, and a size on both must open on the earlier: Pop Gomoji's last shelf is 4 to 7, which shows 4, 5 and 6, and an ordinary
 * five-letter set-up opened there instead of on 3 to 6 (`sizeShelves.test.ts`). A size no shelf shows opens on the first.
 */
export function shelfFor(boards: readonly number[], size: number): number {
  return shelvesOf(boards.length).find((start) => boards.slice(start, start + SIZE_TILES).includes(size)) ?? 0;
}

/**
 * MORE SIZES THAN TILES. The set-up screen keeps room for four boards and no
 * more, so a game with more shows four at a time and one press beside them turns
 * to the next shelf, and from the last back to the first. The press is always
 * there, so choosing never moves the page. Tsunagi's nine sizes were the first
 * (4 to 7, 8 to 11, and the last four, 9 to 12, so every shelf is full), Suido's
 * thirteen the second; `boards` is every size in order, smallest first.
 */
export function useSizeShelves(boards: readonly number[], initialSize: number) {
  const [size, setSize] = useState(initialSize);
  const shelves = shelvesOf(boards.length);
  const [shelf, setShelf] = useState(shelfFor(boards, initialSize));
  const shown = boards.slice(shelf, shelf + SIZE_TILES);
  const onLast = shelf === shelves[shelves.length - 1];
  const nextShelf = onLast ? 0 : shelves[shelves.indexOf(shelf) + 1]!;
  const turnShelf = () => {
    setShelf(nextShelf);
    const sizes = boards.slice(nextShelf, nextShelf + SIZE_TILES);
    if (!sizes.includes(size)) setSize(nextShelf === 0 ? sizes[sizes.length - 1]! : (sizes.find((each) => each > size) ?? sizes[0]!));
  };
  /** The last size the next shelf shows, which the press says it goes to. */
  const furthest = boards[Math.min(boards.length, nextShelf + SIZE_TILES) - 1]!;
  return { size, setSize, shown, onLast, turnShelf, furthest };
}
