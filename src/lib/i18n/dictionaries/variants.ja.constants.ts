import type { RuleVariant } from "../../gomoku/gomoku.types";
import { VARIANT_COPY_JA_CHECKERS } from "./variants.ja.checkers.constants";
import { VARIANT_COPY_JA_DROPS } from "./variants.ja.drops.constants";
import { VARIANT_COPY_JA_FIVE_IN_A_ROW } from "./variants.ja.fiveInARow.constants";
import { VARIANT_COPY_JA_SMALL_BOARDS } from "./variants.ja.smallBoards.constants";
import { VARIANT_COPY_JA_STRANGE_BOARDS } from "./variants.ja.strangeBoards.constants";
import { VARIANT_COPY_JA_TERRITORY } from "./variants.ja.territory.constants";
import { VARIANT_COPY_JA_TURN_AND_TAKE } from "./variants.ja.turnAndTake.constants";
import type { VariantCopyJa } from "./variants.ja.types";

/**
 * Every game's Japanese copy, joined from one file per family (the homes in
 * `families.data.ts`). Typed `Record<RuleVariant, …>`, so a game with no
 * Japanese does not compile: the same promise `RULE_VARIANT_DISPLAY` makes for
 * the English row it sits beside. `variants.coverage.test.ts` holds what the
 * type cannot see: one line for each English bullet, and a review stamp.
 */
export const VARIANT_COPY_JA: Record<RuleVariant, VariantCopyJa> = {
  ...VARIANT_COPY_JA_FIVE_IN_A_ROW,
  ...VARIANT_COPY_JA_DROPS,
  ...VARIANT_COPY_JA_TURN_AND_TAKE,
  ...VARIANT_COPY_JA_STRANGE_BOARDS,
  ...VARIANT_COPY_JA_CHECKERS,
  ...VARIANT_COPY_JA_TERRITORY,
  ...VARIANT_COPY_JA_SMALL_BOARDS,
};
