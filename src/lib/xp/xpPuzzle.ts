import { familyKeyOf } from "@/lib/gomoku/families";
import { puzzleHash } from "@/lib/puzzles/puzzleCode";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

import { XP_EVENTS } from "./xp.constants";
import type { XpAward } from "./xp.types";

/**
 * What a finished puzzle pays, in the order it should be read: a solve, or a
 * word whose guesses ran out (`solved` false), which pays `puzzleEnded` in
 * place of `puzzleSolved` and the same tour — a puzzle played out has been
 * played, as a game lost has.
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

export function puzzleAwards(kind: PuzzleKind, size: number, givens: string, solved = true): XpAward[] {
  const awards: XpAward[] = [
    { type: solved ? XP_EVENTS.puzzleSolved : XP_EVENTS.puzzleEnded, subject: puzzleSubject(kind, size, givens) },
    { type: XP_EVENTS.firstOfVariant, subject: kind },
  ];
  /* Null is a puzzle in no family, which `puzzles.coverage.test.ts` refuses;
     it pays nothing rather than paying under a made-up key. */
  const family = familyKeyOf(kind);
  if (family !== null) awards.push({ type: XP_EVENTS.firstOfFamily, subject: family });
  return awards;
}
