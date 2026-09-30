import type { PuzzleKind } from "./puzzles.types";
import { dealOfSeed } from "./solitaire/code";
import { spiderDealOfSeed } from "./spider/code";

/**
 * THE DEAL A CARD GAME'S SEED NAMES, with nothing that solves: the plain
 * shuffle of the seed, one deck for Solitaire and FreeCell, two of the chosen
 * suits for Spider. Every card game here deals its puzzle from exactly this
 * (their `generate.ts`), so the solved route checks a won game against its
 * seed in one pass: a won game of some other deal is not a game of this one.
 * Null for a kind that is not a card game.
 */
export function cardDealOfSeed(kind: PuzzleKind, size: number, seed: number): string | null {
  if (kind === "solitaire" || kind === "freecell") return dealOfSeed(seed);
  if (kind === "spider") return spiderDealOfSeed(seed, size);
  return null;
}
