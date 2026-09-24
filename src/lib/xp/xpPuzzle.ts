import { familyKeyOf } from "@/lib/gomoku/families";
import { puzzleHash } from "@/lib/puzzles/puzzleCode";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

import { XP_EVENTS } from "./xp.constants";
import type { XpAward } from "./xp.types";

/**
 * What a solved puzzle pays, in the order it should be read.
 *
 * The same shape as `gameAwards` for a finished game, and the same tour: a
 * puzzle is a game in the catalogue, so a first solve of it is a first game
 * of a variant and a first puzzle at all is a first game of the Numbers
 * family. Both of those are what lets the eighth family be met and "every
 * game played" be reached with the puzzles counted in.
 *
 * `puzzleSolved` is keyed on the grid — kind, side and the hash of its
 * givens — so a puzzle re-entered from the same address pays nothing more,
 * and the unique index does the rest.
 */
export function puzzleSubject(kind: PuzzleKind, size: number, givens: string): string {
  return `${kind}:${size}:${puzzleHash(givens)}`;
}

export function puzzleAwards(kind: PuzzleKind, size: number, givens: string): XpAward[] {
  const awards: XpAward[] = [
    { type: XP_EVENTS.puzzleSolved, subject: puzzleSubject(kind, size, givens) },
    { type: XP_EVENTS.firstOfVariant, subject: kind },
  ];
  /* Null is a puzzle in no family, which `puzzles.coverage.test.ts` refuses;
     it pays nothing rather than paying under a made-up key. */
  const family = familyKeyOf(kind);
  if (family !== null) awards.push({ type: XP_EVENTS.firstOfFamily, subject: family });
  return awards;
}
