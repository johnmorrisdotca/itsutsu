// Relative: the engine boundary (`boundary.coverage.test.ts`) allows no alias under src/lib/gomoku.
import { RULE_VARIANTS } from "../gomoku.constants";
import type { RuleVariant } from "../gomoku.types";

/**
 * THE GAMES WITH A PASS-AND-PLAY TABLE OF THEIR OWN, beyond the practice board
 * for two: the ones whose page offers it, and the only ones
 * `/games/<slug>/pass-and-play` answers for. A table, so a page never asks a
 * game's name.
 *
 * - Chinese Checkers, for two to six round the star (`partyCheckers.ts`).
 * - Go, as Pair Go: two teams of two, taking turns (`pairGo.ts`).
 * - Halma, for four (or two) racing corner to corner (`partyHalma.ts`).
 *
 * Chinese Checkers and Halma are both races for the far camp, and share what
 * a race table is (`partyRace.ts`).
 */
export const PARTY_PLAY_GAMES: readonly RuleVariant[] = [RULE_VARIANTS.chineseCheckers, RULE_VARIANTS.go, RULE_VARIANTS.halma];
