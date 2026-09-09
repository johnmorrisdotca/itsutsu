import {
  BOARD_SIZE_DISPLAY,
  HANDICAP_RULES,
  OBSTACLE_LAYOUTS,
  OPENING_RULES,
  STONE_DISPLAY,
  sizeForVariant,
} from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY, SECOND_STONE_EXCLUSION_DISPLAY, variantLabel } from "@/lib/gomoku/variants.constants";
import { HANDICAP_RULE_DISPLAY, OPENING_DISPLAY } from "@/lib/gomoku/openings.constants";
import type { Handicap, OpeningRule, RuleVariant } from "@/lib/gomoku/gomoku.types";

/** The subset of settings a shared game carries, as strings from the store. */
export type RulesLike = {
  size: number;
  variant: string;
  obstacles: string;
  opening: string;
  handicap: Handicap;
};

/** The handicap in a sentence, or null when there is none. */
export function describeHandicap(handicap: Handicap): string | null {
  if (handicap.stone === null) return null;
  const parts = HANDICAP_RULES.filter((rule) => handicap[rule]).map((rule) =>
    HANDICAP_RULE_DISPLAY[rule].label.toLowerCase(),
  );
  if (handicap.secondStoneExclusion > 0) {
    parts.push(
      `second stone ${SECOND_STONE_EXCLUSION_DISPLAY[handicap.secondStoneExclusion].label.toLowerCase()}`,
    );
  }
  const who = STONE_DISPLAY[handicap.stone].label;
  return parts.length > 0 ? `${who} handicap: ${parts.join(", ")}` : `${who} handicap`;
}

/** One line: "Renju 連珠 · 15×15 · Pro opening · Black handicap: no double three". */
export function describeRules(rules: RulesLike): string {
  const variant = rules.variant in RULE_VARIANT_DISPLAY
    ? RULE_VARIANT_DISPLAY[rules.variant as RuleVariant]
    : null;
  /*
   * The board that is drawn, not the number in the row.
   *
   * The engine snaps a size the variant does not offer as it builds a state,
   * so the board a player looks at is always one the game actually has. The
   * row is not snapped retrospectively, and rows written before anything
   * snapped on the way in still carry impossible numbers — a Halma game
   * stored at 9 while sixteen columns are drawn in front of it, which is
   * exactly what John found. Saying the row's number would be describing a
   * board nobody can see.
   *
   * Games written since have their size settled on the way in, so for those
   * this changes nothing. It is here for the ones written before, and for the
   * general rule: a label about a board should agree with the board.
   */
  const size = variant === null ? rules.size : sizeForVariant(rules.variant as RuleVariant, rules.size);
  const parts = [
    variant ? `${variant.label} ${variant.kanji}` : variantLabel(rules.variant),
    `${size}×${size}${BOARD_SIZE_DISPLAY[size] ? ` ${BOARD_SIZE_DISPLAY[size].label}` : ""}`,
  ];
  if (rules.opening !== OPENING_RULES.free && rules.opening in OPENING_DISPLAY) {
    parts.push(`${OPENING_DISPLAY[rules.opening as OpeningRule].label} opening`);
  }
  if (rules.obstacles === OBSTACLE_LAYOUTS.hoshi) parts.push("Star blocks");
  const handicap = describeHandicap(rules.handicap);
  if (handicap !== null) parts.push(handicap);
  return parts.join(" · ");
}
