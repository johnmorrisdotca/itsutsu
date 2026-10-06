import type { PuzzleKind } from "./puzzles.types";
import { suidoLevelOfSeed } from "./suido/seed";
import { setOfSeed } from "@johnmorrisdotca/tsunagi";

/**
 * WHICH LEVEL A RUN IS OF, for a puzzle that has fixed levels beside, or in
 * place of, the boards it makes: Tsunagi's seed IS its level's number (every
 * Tsunagi is a level, and so is every Meikyuu and every Tobiishi), and Suido's seed names a level only in the block kept
 * for them (`suido/seed.ts`), every other seed being a board made at random.
 * Null for a seed that names no level, and for every kind without any.
 * Read where a page says "Level 12" in place of a seed's number.
 */
export function fixedLevelOf(kind: PuzzleKind, seed: number): number | null {
  // A Tsunagi level with portals is kept as 1,000 and its number (`tsunagi/levels.ts`): its number is what a reader knows it by.
  if (kind === "tsunagi") return Number.isInteger(seed) && seed >= 1 ? setOfSeed(seed).level : null;
  if (kind === "meikyuu" || kind === "tobiishi") return Number.isInteger(seed) && seed >= 1 ? seed : null;
  if (kind === "suido") return suidoLevelOfSeed(seed);
  return null;
}

/** What a level is called where a page names one: "Level 12", or "Portal level 12" for one of Tsunagi's with portals; null for a seed that names none. */
export function fixedLevelName(kind: PuzzleKind, seed: number): string | null {
  const number = fixedLevelOf(kind, seed);
  if (number === null) return null;
  return kind === "tsunagi" && setOfSeed(seed).set === "portals" ? `Portal level ${number}` : `Level ${number}`;
}

/** The address of a size's board of levels, set-up, for a run of a level: the set the level is in, where it is not the first. */
export function levelsQueryOf(kind: PuzzleKind, size: number, seed: number): string {
  return kind === "tsunagi" && setOfSeed(seed).set === "portals" ? `?size=${size}&set=portals` : `?size=${size}`;
}

/** The words on the button to the next level: plain when it is the one after, and saying why when it is further back. */
export function nextLevelLabel(after: number, next: number): string {
  return next === after + 1 ? `Level ${next} →` : `Level ${next}, the first one you have not finished →`;
}
