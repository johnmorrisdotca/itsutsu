import type { PuzzleCheck } from "../puzzles.types";
import { decodeGrid, judgeGrid, lettersOf, sameLetters } from "./grid";
import { KUMIMOJI_BAG, KUMIMOJI_SCORE } from "./tiles.constants";
import { tileWords } from "./tileWords";

/**
 * WHETHER A GRID FINISHES A KUMIMOJI: the one check the server also runs.
 * O(squares) and a lookup a word, nothing searched: the grid uses exactly the
 * tiles of the bag, as many of each, it is all one piece, and every run of two
 * or more across or down is in the list. Which tiles were traded on the way
 * does not matter — a finished game holds the whole bag whatever came out of
 * it when — so the answer is the grid alone.
 *
 * Written out here rather than asked of the play page, which is what made the
 * grid; the list must have been loaded (`loadTileWords`), and a check that
 * cannot read it refuses.
 */
export function checkKumimoji(size: number, givens: string, answer: string): PuzzleCheck {
  const inBag = KUMIMOJI_BAG[size];
  if (inBag === undefined) return { ok: false, reason: `no Kumimoji with a hand of ${size}` };
  if (typeof givens !== "string" || givens.length !== inBag || !/^[a-z]+$/.test(givens)) return { ok: false, reason: "the givens are not a bag of tiles" };
  const tiles = decodeGrid(answer);
  if (tiles === null) return { ok: false, reason: "the answer is not a grid" };
  if (!sameLetters(lettersOf(tiles.values()), lettersOf(givens))) return { ok: false, reason: "the grid does not use exactly the tiles of the bag" };
  let allowed: ReadonlySet<string>;
  try {
    allowed = tileWords().allowed;
  } catch {
    return { ok: false, reason: "the word list is not loaded" };
  }
  const verdict = judgeGrid(tiles, (word) => allowed.has(word));
  if (verdict.apart.size > 0) return { ok: false, reason: "the tiles are not all joined" };
  if (verdict.notWords.length > 0) return { ok: false, reason: `${verdict.notWords[0]} is not in the word list` };
  if (!verdict.sound) return { ok: false, reason: "the grid is not finished" };
  return { ok: true };
}

/** A finished game's leaderboard points (`KUMIMOJI_SCORE`): ten a tile, and up to as much again for speed. */
export function kumimojiPoints(givens: string, elapsedMs: number): number {
  const tiles = givens.length;
  const base = KUMIMOJI_SCORE.tile * tiles;
  const slowest = KUMIMOJI_SCORE.slowestMsATile * tiles;
  const speed = Math.max(0, Math.round(base * (1 - Math.max(0, elapsedMs) / slowest)));
  return base + speed;
}
