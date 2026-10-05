import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import {
  HELP_COST,
  KUMIMOJI_SHORT_BAG,
  KUMIMOJI_TILES_LEAST,
  KUMIMOJI_TILES_MOST,
  LEVEL_ADD,
  LEVEL_FAMILY_PRICE_MOST,
  LEVELS_A_SIZE,
  PUZZLE_PRICE_LEAST,
  PUZZLE_PRICE_MOST,
  PUZZLE_PRICING,
  RANK_ADD_MOST,
  RANK_OF_THIRD,
  type Pricing,
  type Reference,
} from "./ladder.constants";

/** A number to the nearest five. */
export function toFive(value: number): number {
  return Math.round(value / 5) * 5;
}

/**
 * Kumimoji's rung from the tiles in its bag: 50 at 40 tiles to 125 at 288,
 * geometrically (a bag twice the size is not twice the work to price, it is a
 * step up), to the nearest five. The SQL that counts IP repeats this exactly
 * (`ladderSql.ts`); `ladder.coverage.test.ts` holds the two to one table.
 */
export function kumimojiRung(tiles: number): number {
  const spread = Math.log(KUMIMOJI_TILES_MOST / KUMIMOJI_TILES_LEAST);
  const rung = toFive(50 + (75 * Math.log(Math.max(tiles, 1) / KUMIMOJI_TILES_LEAST)) / spread);
  return Math.min(125, Math.max(50, rung));
}

/** What a level's place among a size's 256 adds to the rung: 0 for the first, 50 for the last, to the nearest five. */
export function rankAdd(rank: number): number {
  const place = Math.min(LEVELS_A_SIZE, Math.max(1, Math.round(rank)));
  return toFive((RANK_ADD_MOST * (place - 1)) / (LEVELS_A_SIZE - 1));
}

/** What a level adds to the rung of a puzzle: nothing for a kind made at only one level. */
export function levelAdd(oneLevel: boolean, level: PuzzleLevel): number {
  return oneLevel ? 0 : LEVEL_ADD[level];
}

/** The kinds made at one level only, so a level adds nothing to their rung. */
const ONE_LEVEL: ReadonlySet<PuzzleKind> = new Set<PuzzleKind>(["freecell", "spider", "tobiishi", "crossSums"]);

/** The rung of a size, interpolated between the sizes priced where a kind keeps a size it prices no rung for; null where it prices none at all. */
function rungOf(pricing: Exclude<Pricing, { how: "tiles" }>, size: number): number | null {
  const own = pricing.rungs[size];
  if (own !== undefined) return own;
  const sizes = Object.keys(pricing.rungs).map(Number).sort((a, b) => a - b);
  if (sizes.length === 0) return null;
  const below = [...sizes].reverse().find((each) => each < size);
  const above = sizes.find((each) => each > size);
  // A size beyond the ends takes the end's rung.
  if (below === undefined) return pricing.rungs[sizes[0]!]!;
  if (above === undefined) return pricing.rungs[sizes[sizes.length - 1]!]!;
  const low = pricing.rungs[below]!;
  return toFive(low + ((pricing.rungs[above]! - low) * (size - below)) / (above - below));
}

/**
 * WHAT A SOLVE OF THIS PUZZLE IS WORTH IN IP, with no help taken and finished
 * as well as the puzzle asks: the one function every price comes from. The
 * kind and size name the rung, the level adds to it, and for a family of 256
 * fixed levels (`rank`, from 1) the level's own place does. A kept solve names
 * only the third of the levels it was in, so `rank` is left out and the middle
 * of that third is used. Kumimoji's rung is its bag (`tiles`), where its size
 * is the hand it opens with.
 *
 * Between 50 and 150, and between 50 and 200 for Meikyuu, Suido and Tsunagi.
 */
export function price(kind: PuzzleKind, size: number, level: PuzzleLevel, rank?: number, tiles?: number): number {
  const pricing = PUZZLE_PRICING[kind];
  if (pricing.how === "tiles") {
    const bag = tiles ?? KUMIMOJI_SHORT_BAG[size] ?? KUMIMOJI_TILES_LEAST;
    return kumimojiRung(bag) + levelAdd(false, level);
  }
  const rung = rungOf(pricing, size) ?? PUZZLE_PRICE_LEAST;
  if (pricing.how === "ranked") return Math.min(LEVEL_FAMILY_PRICE_MOST, rung + rankAdd(rank ?? RANK_OF_THIRD[level]));
  return Math.min(PUZZLE_PRICE_MOST, rung + levelAdd(ONE_LEVEL.has(kind), level));
}

/** The points a good solve scores on the puzzle's own board, for a puzzle priced by how well it was done; null for one that scores by the cell. */
export function nativeReference(kind: PuzzleKind, size: number, tiles?: number): number | null {
  const pricing = PUZZLE_PRICING[kind];
  const reference: Reference | undefined = "full" in pricing ? pricing.full : undefined;
  if (reference === undefined) return null;
  if (reference.per === "size") return reference.each * size;
  if (reference.per === "tile") return reference.each * (tiles ?? KUMIMOJI_SHORT_BAG[size] ?? KUMIMOJI_TILES_LEAST);
  return reference.each;
}

/** What one kept solve is, as far as its price goes. */
export type SolveFacts = {
  kind: PuzzleKind;
  size: number;
  level: PuzzleLevel;
  /** The score on the puzzle's own board (`PuzzleSolve.points`). */
  points: number;
  /** Check and Hint presses, as the solve recorded them (null counted as none). */
  helps: number;
  /** False for a word whose guesses ran out. */
  solved: boolean;
  /** The length of the puzzle's code, which is a Kumimoji's tiles. */
  tiles?: number;
};

/**
 * WHAT A KEPT SOLVE PAYS IN IP, the price scaled by what the solver did and
 * rounded to the nearest five. A puzzle scored by the cell keeps the share of
 * its score that help left (price × score / (score + 50 a help)), so a Check
 * or a Hint still costs. A word, a tile game and Koushi are scored by more
 * than finishing, so the price is half for finishing and half for how well
 * (0.5 + 0.5 × the share of a good solve's points, never more than all of it);
 * a word whose guesses ran out has only the share. Nothing for a solve that
 * scored nothing, and never less than 5 for one that scored.
 *
 * `ladderSql.ts` repeats this in SQL for the boards, and the end-to-end test
 * `e2e/ip-boards.spec.ts` holds the two to the same figures.
 */
export function solveIp(facts: SolveFacts): number {
  if (facts.points <= 0) return 0;
  const base = price(facts.kind, facts.size, facts.level, undefined, facts.tiles);
  const reference = nativeReference(facts.kind, facts.size, facts.tiles);
  const share = reference === null ? facts.points / (facts.points + HELP_COST * facts.helps) : Math.min(1, facts.points / reference);
  const factor = reference === null ? share : facts.solved ? 0.5 + 0.5 * share : share;
  return Math.max(5, toFive(base * factor));
}
