import { isHousekiKind, isPuzzleKind, isRuleVariant } from "@/lib/catalogue/gameKeys";
import { HOUSEKI_KIND_LIST } from "@/lib/houseki/houseki.constants";
import type { HousekiKind } from "@/lib/houseki/houseki.types";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { PUZZLE_KIND_LIST } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

/** What a board counts: some games, some puzzles, some Houseki games. */
export type IpScope = { variants: readonly RuleVariant[]; puzzles: readonly PuzzleKind[]; houseki?: readonly HousekiKind[] };

/** One game's board, or one puzzle's, or one Houseki game's. */
export function scopeOfGame(key: RuleVariant | PuzzleKind | HousekiKind): IpScope {
  if (isHousekiKind(key)) return { variants: [], puzzles: [], houseki: [key] };
  return isPuzzleKind(key) ? { variants: [], puzzles: [key] } : { variants: [key as RuleVariant], puzzles: [] };
}

/** One family's board: every game, puzzle and Houseki game at home in it. A party game wins nothing anybody records, so it adds nothing. */
export function scopeOfFamily(familyKey: string): IpScope | null {
  const family = GAME_FAMILIES.find((one) => one.key === familyKey);
  if (family === undefined) return null;
  return {
    variants: family.games.filter(isRuleVariant),
    puzzles: family.games.filter(isPuzzleKind),
    houseki: family.games.filter(isHousekiKind),
  };
}

/** The site's board: everything. */
export const SITE_SCOPE: IpScope = { variants: RULE_VARIANT_LIST, puzzles: PUZZLE_KIND_LIST, houseki: HOUSEKI_KIND_LIST };
