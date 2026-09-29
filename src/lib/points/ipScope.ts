import { isPuzzleKind, isRuleVariant } from "@/lib/catalogue/gameKeys";
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

/** One family's board: every game and puzzle at home in it. A party game wins nothing anybody records, so it adds nothing. */
export function scopeOfFamily(familyKey: string): IpScope | null {
  const family = GAME_FAMILIES.find((one) => one.key === familyKey);
  if (family === undefined) return null;
  return {
    variants: family.games.filter(isRuleVariant),
    puzzles: family.games.filter(isPuzzleKind),
  };
}

/** The site's board: everything. */
export const SITE_SCOPE: IpScope = { variants: RULE_VARIANT_LIST, puzzles: PUZZLE_KIND_LIST };
