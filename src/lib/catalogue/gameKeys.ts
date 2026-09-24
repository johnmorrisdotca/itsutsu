// Relative, not `@/`: `families.ts` imports this, the browser specs import that, and Playwright resolves no alias.
import { RULE_VARIANT_LIST } from "../gomoku/gomoku.constants";
import type { RuleVariant } from "../gomoku/gomoku.types";
import { RULE_VARIANT_DISPLAY, type VariantCopy } from "../gomoku/variants.constants";
import { PUZZLE_DISPLAY, PUZZLE_KIND_LIST } from "../puzzles/puzzles.constants";
import type { PuzzleKind } from "../puzzles/puzzles.types";

/**
 * A game in the catalogue is one of two things: a rule variant the engine
 * plays between two colours, or a puzzle one person solves.
 *
 * The two are kept as two kinds rather than one stretched one (see
 * docs/plans/numbers/README.md), and this is where they meet: a family
 * holds `GameKey`s, a name or a picture is asked for by `GameKey`, and the
 * few places that only make sense for a board game — the two-player
 * set-up, a ladder, a record — ask `isPuzzleKind` and say what they skip.
 */
export type GameKey = RuleVariant | PuzzleKind;

const PUZZLES = new Set<string>(PUZZLE_KIND_LIST);

export function isPuzzleKind(key: string): key is PuzzleKind {
  return PUZZLES.has(key);
}

/** Every game and every puzzle, games first: the order the tour counts them in. */
export const EVERY_GAME_KEY: readonly GameKey[] = [...RULE_VARIANT_LIST, ...PUZZLE_KIND_LIST];

/** What a game or a puzzle is called and how it is described, whichever kind it is. */
export function gameCopyFor(key: GameKey): VariantCopy {
  return isPuzzleKind(key) ? PUZZLE_DISPLAY[key] : RULE_VARIANT_DISPLAY[key];
}

/** The copy for a key read off a stored row or an address, or null for one this deploy has not got. */
export function gameCopyOf(key: string): VariantCopy | null {
  if (isPuzzleKind(key)) return PUZZLE_DISPLAY[key];
  if (key in RULE_VARIANT_DISPLAY) return RULE_VARIANT_DISPLAY[key as RuleVariant];
  return null;
}
