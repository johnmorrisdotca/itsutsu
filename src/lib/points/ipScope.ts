import { isPuzzleKind } from "@/lib/catalogue/gameKeys";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { PUZZLE_KIND_LIST } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

/** What a board counts: some games, some puzzles. */
export type IpScope = { variants: readonly RuleVariant[]; puzzles: readonly PuzzleKind[] };

/** One game's board, or one puzzle's. */
export function scopeOfGame(key: RuleVariant | PuzzleKind): IpScope {
  return isPuzzleKind(key) ? { variants: [], puzzles: [key] } : { variants: [key], puzzles: [] };
}

/** One family's board: every game and puzzle at home in it. */
export function scopeOfFamily(familyKey: string): IpScope | null {
  const family = GAME_FAMILIES.find((one) => one.key === familyKey);
  if (family === undefined) return null;
  return {
    variants: family.games.filter((game): game is RuleVariant => !isPuzzleKind(game)),
    puzzles: family.games.filter((game): game is PuzzleKind => isPuzzleKind(game)),
  };
}

/** The site's board: everything. */
export const SITE_SCOPE: IpScope = { variants: RULE_VARIANT_LIST, puzzles: PUZZLE_KIND_LIST };
