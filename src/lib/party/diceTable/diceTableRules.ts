// Relative, like the rest of lib/party: the browser specs import this, and Playwright resolves no alias.
import { LIARS_RULES } from "../liarsDice/liarsDice";
import { PIG_RULES } from "../pig/pig";
import { SAYU_RULES } from "../sayu/sayu";
import { TEN_THOUSAND_RULES } from "../tenThousand/tenThousand";

import type { DiceTableKind } from "./diceTable.constants";
import type { DiceTableRules } from "./diceTable.types";

/**
 * THE FOUR PLAIN DICE GAMES' RULES AND NOTHING ELSE, for what keeps one of them,
 * which reaches a page's server build through `keptStores.ts`: this names only
 * this site's own rules, where `PARTY_RULES` carries every game package.
 */
export const DICE_TABLE_RULES: Record<DiceTableKind, DiceTableRules<unknown, unknown>> = {
  pig: PIG_RULES as unknown as DiceTableRules<unknown, unknown>,
  tenThousand: TEN_THOUSAND_RULES as unknown as DiceTableRules<unknown, unknown>,
  liarsDice: LIARS_RULES as unknown as DiceTableRules<unknown, unknown>,
  sayu: SAYU_RULES as unknown as DiceTableRules<unknown, unknown>,
};

/** A score as a table prints it: 10,000. A date's formatter is not for this, and the figure is the same in both languages. */
export function scoreWords(points: number): string {
  return String(points).replace(/\B(?=(\d{3})+$)/g, ",");
}
