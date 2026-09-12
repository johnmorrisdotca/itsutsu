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
import { describeClock } from "@/lib/history/deadline";
import { RATING_REFUSED_WORD, type RatingRefusal } from "@/lib/rating/rateable.constants";

/** The subset of settings a shared game carries, as strings from the store. */
export type RulesLike = {
  size: number;
  variant: string;
  obstacles: string;
  opening: string;
  handicap: Handicap;
};

/**
 * One fact about a game, for the line that stands in for a folded control.
 *
 * `notable` is NOT "changed from the default", which is a question this
 * cannot answer: the pace a screen opens on is the member's own standing
 * preference rather than a constant, so there is no default here to compare
 * with, and a flag claiming otherwise would be a judgement nobody made.
 *
 * It is the question it CAN answer — whether this is the ordinary setting or
 * one worth noticing. That does the job the flag was wanted for: a rematch
 * arriving with a five-minute clock reads differently from one with none,
 * because a clock is notable and no clock is not.
 */
export type SettingWord = { text: string; notable: boolean };

/** The settings a game carries besides which game it is and what board it is on. */
export type SettingsLike = {
  opening: string;
  allowResign: boolean;
  moveTimeMs: number | null;
  clockMode: string;
  rated: boolean;
};

/**
 * The settings that are not the game or the board, as words.
 *
 * This is what a folded disclosure shows in place of its controls, so it is
 * read from the SAME value the controls are bound to — see `MoreSettings`.
 * A summary computed from anything else could say "No clock" over a form
 * about to submit one, which is worse than no summary at all.
 *
 * The clock is one word for two controls, because `describeClock` already
 * folds the mode into the phrase: "5 minutes a move" and "20 minutes each
 * for the whole game" say which mode without naming it. What running out of
 * time costs is not here — it exists only when a clock does, it is a detail
 * of the clock rather than a choice beside it, and a line long enough to
 * wrap twice costs back the height this whole disclosure is for. It is one
 * tap away, with everything else.
 */
export function describeSettings(rules: SettingsLike, refusal: RatingRefusal | null = null): SettingWord[] {
  const opening =
    rules.opening in OPENING_DISPLAY
      ? OPENING_DISPLAY[rules.opening as OpeningRule].label
      : rules.opening;
  return [
    { text: `${opening} opening`, notable: rules.opening !== OPENING_RULES.free },
    {
      text: rules.allowResign ? "Resigning allowed" : "No resigning",
      notable: !rules.allowResign,
    },
    {
      text: describeClock(rules.clockMode, rules.moveTimeMs),
      notable: rules.moveTimeMs !== null,
    },
    /*
     * THE ROW'S FLAG IS THE LAST THING ASKED, NOT THE FIRST.
     *
     * A refusal beats it both ways round. A game the site cannot rate is not
     * "Rated" however the column reads — twelve production rows said exactly
     * that, in this line, under a notice saying the game would not count — and
     * it is not "Friendly" either, because nobody chose it: see the note on
     * `hotSeat` in `rateable.constants.ts`.
     *
     * Null by default, so a caller that holds a DRAFT rather than a game reads
     * the choice being made, which is usually all it has.
     *
     * USUALLY, AND THE EXCEPTION IS WORTH SAYING: a draft whose press is
     * already settled to a board at one screen — a fork with nobody to hand
     * the second seat to — can know the refusal before the game exists, and
     * the setup form and the doorstep pass `hotSeat` for exactly that case.
     * The rating there is not a choice, so those two do not offer it either;
     * see `RulesForm`'s `refused`. Everywhere else they pass nothing and the
     * choice stands.
     */
    refusal !== null
      ? { text: RATING_REFUSED_WORD, notable: true }
      : { text: rules.rated ? "Rated" : "Friendly", notable: !rules.rated },
  ];
}

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
