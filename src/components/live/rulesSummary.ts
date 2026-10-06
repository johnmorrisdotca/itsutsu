import {
  BOARD_SIZE_DISPLAY,
  HANDICAP_RULES,
  OBSTACLE_LAYOUT_DISPLAY,
  OBSTACLE_LAYOUTS,
  OPENING_RULES,
  sizeForVariant,
} from "@/lib/gomoku/gomoku.constants";
import { RULE_VARIANT_DISPLAY, variantLabel } from "@/lib/gomoku/variants.constants";
import { OPENING_DISPLAY } from "@/lib/gomoku/openings.constants";
import { handicapCopy, openingCopy, secondStoneLabel } from "@/lib/gomoku/openingCopy";
import { pairedText, stoneName } from "@/lib/gomoku/seatWords";
import type { Speaker } from "@/lib/i18n/i18n";
import { describeHeadStart } from "@/lib/gomoku/headStartWords";
import { boardWords } from "@/lib/gomoku/boardWords";
import type { Handicap, HeadStart, OpeningRule, RuleVariant } from "@/lib/gomoku/gomoku.types";
import { describeClock } from "@/lib/history/deadline";
import { RATING_REFUSED_WORD, type RatingRefusal } from "@/lib/rating/rateable.constants";

/** The subset of settings a shared game carries, as strings from the store. */
export type RulesLike = {
  size: number;
  variant: string;
  obstacles: string;
  opening: string;
  handicap: Handicap;
  headStart: HeadStart;
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
export function describeSettings(rules: SettingsLike, refusal: RatingRefusal | null, say: Speaker): SettingWord[] {
  return [
    { text: openingWords(say, rules.opening), notable: rules.opening !== OPENING_RULES.free },
    {
      text: say.say(rules.allowResign ? "summary.resignAllowed" : "summary.noResign"),
      notable: !rules.allowResign,
    },
    {
      text: describeClock(rules.clockMode, rules.moveTimeMs, say),
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
      ? { text: say.say(RATING_REFUSED_WORD), notable: true }
      : { text: say.say(rules.rated ? "played.rated" : "played.friendly"), notable: !rules.rated },
  ];
}

/** "Pro opening", "開局ルール：五路制限": an opening named for the reader, or the stored word where this build has none. */
export function openingWords(say: Speaker, opening: string): string {
  const name = opening in OPENING_DISPLAY ? openingCopy(opening as OpeningRule, say.locale).label : opening;
  return say.say("summary.opening", { opening: name });
}

/** The handicap in a sentence, or null when there is none. */
export function describeHandicap(handicap: Handicap, say: Speaker): string | null {
  if (handicap.stone === null) return null;
  const parts = HANDICAP_RULES.filter((rule) => handicap[rule]).map((rule) =>
    handicapCopy(rule, say.locale).label.toLowerCase(),
  );
  if (handicap.secondStoneExclusion > 0) {
    parts.push(
      say.say("summary.secondStone", { where: secondStoneLabel(handicap.secondStoneExclusion, say.locale).toLowerCase() }),
    );
  }
  const who = stoneName(say, handicap.stone);
  return parts.length > 0 ? say.say("summary.handicapWith", { colour: who, parts: say.joined(parts) }) : say.say("summary.handicap", { colour: who });
}

/** One line: "Renju 連珠 · 15×15 · Pro opening · Black handicap: no double three". */
export function describeRules(rules: RulesLike, say: Speaker): string {
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
    variant ? pairedText(say, variant.label, variant.kanji) : variantLabel(rules.variant),
    /*
     * The board in the shape it really is: "8×8" for a square, "91 cells"
     * for the hexagon — see `boardWords`. The size's own name ("Mini",
     * "Eleven") follows it where there is one.
     */
    `${boardWords(rules.variant as RuleVariant, size, say)}${
      BOARD_SIZE_DISPLAY[size] ? ` ${say.pairName(BOARD_SIZE_DISPLAY[size].label, BOARD_SIZE_DISPLAY[size].kanji).text}` : ""
    }`,
  ];
  if (rules.opening !== OPENING_RULES.free && rules.opening in OPENING_DISPLAY) {
    parts.push(openingWords(say, rules.opening));
  }
  if (rules.obstacles === OBSTACLE_LAYOUTS.hoshi) {
    parts.push(say.pairName(OBSTACLE_LAYOUT_DISPLAY.hoshi.label, OBSTACLE_LAYOUT_DISPLAY.hoshi.kanji).text);
  }
  // The head start first, then the harder rules: the order the set-up screen asks them in.
  const headStart = describeHeadStart(rules, say);
  if (headStart !== null) parts.push(headStart);
  const handicap = describeHandicap(rules.handicap, say);
  if (handicap !== null) parts.push(handicap);
  return parts.join(" · ");
}
