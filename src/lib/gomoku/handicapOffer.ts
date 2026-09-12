import {
  LINE_RULES,
  STONE_DISPLAY,
  VARIANT_SPECS,
} from "./gomoku.constants";
import { RULE_VARIANT_DISPLAY } from "./variants.constants";
import type { HandicapRule, RuleVariant, Stone } from "./gomoku.types";

/**
 * Whether one handicap toggle does anything for this colour at this game, and
 * if not, why not.
 *
 * A handicap can only ever make a colour's game harder — `rulesFor` in
 * `rules/handicap.ts` tightens and never loosens — so a toggle asking for a
 * restriction the variant already imposes is not a choice, and one about
 * captures in a game without captures is not a choice either. Both still show,
 * because a reader comparing two games wants to see that renju already forbids
 * the double three rather than to find that row missing; they show as answered
 * rather than as open.
 *
 * IT LIVES HERE BECAUSE IT IS ASKED IN TWO PLACES. The local board's handicap
 * panel has asked it since handicaps existed, and the setup screen has to ask
 * exactly the same question now that a handicap can be settled before the game
 * exists. Two copies of "renju already forbids this for black" is one rule that
 * can drift, and the one that drifts is whichever was not being looked at.
 *
 * It takes the VARIANT rather than a whole `GameSettings`, because the variant
 * is all it reads — and the setup screen has a draft rather than a game.
 */
export type HandicapOffer = {
  /** Whether the toggle is a choice here at all. */
  available: boolean;
  /** Whether the game imposes it anyway, so it reads as on and cannot come off. */
  imposed: boolean;
  /** Why it is not a choice, for the hint beside it. Null when it is one. */
  note: string | null;
};

export function handicapOffer(
  rule: HandicapRule,
  variant: RuleVariant,
  stone: Stone,
): HandicapOffer {
  const spec = VARIANT_SPECS[variant];
  const open: HandicapOffer = { available: true, imposed: false, note: null };
  const already: HandicapOffer = {
    available: false,
    imposed: true,
    note: `Already a rule of ${RULE_VARIANT_DISPLAY[variant].label} for ${STONE_DISPLAY[
      stone
    ].label.toLowerCase()}.`,
  };
  const elsewhere = (note: string): HandicapOffer => ({ available: false, imposed: false, note });

  switch (rule) {
    case "doubleThree":
    case "doubleFour":
    case "overline":
      return spec.forbidden[stone].includes(rule) ? already : open;
    case "exactLine":
      return spec.lineRule[stone] === LINE_RULES.atLeast ? open : already;
    case "openLine":
      return spec.lineRule[stone] === LINE_RULES.exactOpen ? already : open;
    case "singleStone":
      return spec.stonesPerTurn > 1
        ? open
        : elsewhere("Only in a game that places two stones a turn.");
    case "noCaptures":
      return spec.captures ? open : elsewhere("Only in a game with captures.");
    case "longerLine":
      return open;
  }
}
