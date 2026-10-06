import {
  OBSTACLE_LAYOUTS,
  OPENING_RULES,
  STONES,
  sizeForVariant,
} from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";
import { OPENING_DISPLAY } from "@/lib/gomoku/openings.constants";
import type { OpeningRule } from "@/lib/gomoku/gomoku.types";
import { openingDecidesColours } from "@/lib/gomoku/rules/opening";
import { RULE_VARIANT_DISPLAY, variantLabel } from "@/lib/gomoku/variants.constants";
import { MEMBER_KIND_DISPLAY, MEMBER_KINDS } from "@/lib/auth/memberKind";
import type { RatingRefusal } from "@/lib/rating/rateable.constants";
import { shownName } from "@/lib/rating/shownName";
import type { RulesDraft } from "./rulesDraft";
import { doorstepCopy } from "./live.constants";
import { describeHandicap, describeSettings, openingWords } from "./rulesSummary";
import { boardPhrase } from "@/lib/gomoku/boardWords";
import { describeHeadStart } from "@/lib/gomoku/headStartWords";
import { openingCopy } from "@/lib/gomoku/openingCopy";
import { pairedText, stoneName } from "@/lib/gomoku/seatWords";
import type { Speaker } from "@/lib/i18n/i18n";

/**
 * WHAT THE DOORSTEP SAYS, IN SENTENCES.
 *
 * John: "show the settings before the board, as the board means we're
 * playing!!!!" — and the page that does it has to READ like a confirmation
 * rather than like a second form. A form is a list of controls; a confirmation
 * is a paragraph somebody can take in at a glance and either accept or go back
 * from. So the facts arrive here as prose, and the same facts are laid out as a
 * short table underneath for anybody who wants to check one of them.
 *
 * PURE, AND ITS OWN MODULE, for the reason every rule in this codebase is: the
 * interesting part is not the rendering. It is which facts can be stated and
 * which cannot — see `describeSeating`, where a swap opening means the colours
 * are genuinely not decided yet and the page must say so rather than name a
 * plausible one.
 *
 * IT BORROWS RATHER THAN RESTATES. `describeSettings` is the same function the
 * folded summary on the setup screen reads from, and `describeHandicap` the same
 * one the panel beside the board reads from. A second description of a game
 * written here would be a second thing to keep in step, and the one that drifted
 * would be this one — which is the one somebody agrees to.
 */

/** The kanji this site marks a program with, wherever one is named. */
const ROBOT_KANJI = MEMBER_KIND_DISPLAY[MEMBER_KINDS.robot].kanji;

/** The other colour. */
function other(stone: Stone): Stone {
  return stone === STONES.black ? STONES.white : STONES.black;
}

/** A colour inside a sentence: "black", not "Black". */
function colourWord(say: Speaker, stone: Stone): string {
  return stoneName(say, stone).toLowerCase();
}

/**
 * WHO IS SITTING WHERE, once the address has been read.
 *
 * `mine` is nullable and that is the whole point of this shape. A game whose
 * colours a swap opening will decide has no answer to "which colour am I" yet,
 * and the wrong way to build this is a `Stone` defaulting to black: black is a
 * perfectly valid colour that would also mean "nobody has decided", and it
 * would be read as the first one every time.
 */
export type DoorstepWho = {
  /** Who it is against, as they are named — null for a seat posted for whoever answers. */
  opponent: string | null;
  /** A program. It answers at once and is never away. */
  computer: boolean;
  /** The colour the reader takes, or null where nothing has settled one yet. */
  mine: Stone | null;
  /** Which colour moves first, which is black unless a carried game says otherwise. */
  opener: Stone;
  /** Two people at one screen, so both seats are the reader's. */
  screen: boolean;
  /** The colour is to be drawn by lot as Begin is pressed, so nothing can name it yet. */
  lot?: boolean;
};

/** A name as this site prints it, with a program marked as one. */
export function playerWord(name: string, computer: boolean, say: Speaker): string {
  if (!computer) return shownName(name);
  return say.pairsWithKanji ? `${name} ${ROBOT_KANJI}` : say.say("summary.computerNamed", { name });
}

/**
 * THE FACT PEOPLE MOST WANT TO SEE, said plainly or not at all.
 *
 * A rematch is the case that proves it earns its place: the colours swap, and
 * "you are black this time" is worth reading BEFORE the board rather than being
 * worked out from it three moves in.
 *
 * And the case that proves it must sometimes decline: under Swap, Swap2 and the
 * renju protocols one player lays the first stones and the other looks at the
 * position and chooses a colour. Nothing before the game can say who ends up
 * black. So the page says the opening decides, which is true and useful, rather
 * than naming a colour that is in range and wrong half the time.
 */
export function describeSeating(rules: { opening: string }, who: DoorstepWho, say: Speaker): string {
  /*
   * The offer note is appended to whatever the seating turns out to be, rather
   * than written into each branch: there are four ways out of the function
   * below and three of them can name an opponent, so a branch is exactly the
   * kind of place a sentence gets forgotten. `offerNote` answers "" for every
   * case that is not an offer.
   */
  const note = offerNote(who, say);
  return describeSeats(rules, who, say) + (note === "" ? "" : say.sentences(["", note]));
}

function describeSeats(rules: { opening: string }, who: DoorstepWho, say: Speaker): string {
  const against = who.opponent === null ? null : playerWord(who.opponent, who.computer, say);

  if (who.screen) {
    return say.say("summary.screen");
  }

  if (openingDecidesColours(rules.opening as OpeningRule)) {
    const opening = OPENING_DISPLAY[rules.opening as OpeningRule] === undefined ? rules.opening : openingCopy(rules.opening as OpeningRule, say.locale).label;
    return against === null
      ? say.say("summary.openingDecidesPosted", { opening })
      : say.say("summary.openingDecidesAgainst", { opening, against });
  }

  if (who.lot === true) {
    return against === null ? say.say("summary.lotPosted") : say.say("summary.lotAgainst", { against });
  }
  if (who.mine === null) {
    /*
     * Nothing has said, and no opening is going to. Reached only by a shape this
     * page has not met yet, and it answers the way this codebase answers an
     * unmeasurable question: it declines rather than guessing a colour.
     */
    return against === null ? say.say("summary.settledPosted") : say.say("summary.settledAgainst", { against });
  }

  const mine = colourWord(say, who.mine);
  const theirs = colourWord(say, other(who.mine));
  const order = say.say(who.mine === who.opener ? "summary.moveFirst" : "summary.moveSecond");
  return against === null
    ? say.say("summary.seatedPosted", { mine, theirs, order })
    : say.say("summary.seatedAgainst", { against, mine, theirs, order });
}

/**
 * AND THAT PRESSING BEGIN MAKES AN OFFER, NOT A GAME.
 *
 * The doorstep's whole job is that nothing is a surprise on the other side of
 * it, and "this person is now in a game with you" stopped being what Begin
 * does. Somebody who reads this page and presses the button should know they
 * are asking rather than starting — otherwise the first surprise is a board
 * that will not let them move.
 *
 * Nothing for a program: it has nothing to accept with and its game starts at
 * once, which is the reason people pick one. Nothing for a posted seat or a
 * board at one screen either — neither names anybody to ask — and those two
 * never reach here, since this only runs where `who.opponent` is a name.
 */
export function offerNote(who: DoorstepWho, say: Speaker): string {
  if (who.computer || who.screen || who.opponent === null) return "";
  const them = playerWord(who.opponent, who.computer, say);
  return say.say("summary.offerNote", { them });
}

/**
 * The game and the board, then everything it is played under, as sentences.
 *
 * The settings come from `describeSettings` in its own order, which is the order
 * the folded summary on the setup screen shows them in — so the line somebody
 * read while choosing and the paragraph they read while confirming say the same
 * things in the same sequence. A free opening is left out here exactly as it is
 * left out of the one-line statement: the ordinary answer to a question nobody
 * asked is not worth a sentence.
 *
 * `refused` is what `draftRatingRefusal` answers — `hotSeat` where `who.screen`
 * is true, `handicap` where the draft has one, and null otherwise — and it is a
 * parameter rather than something read off the draft because the draft cannot
 * know all of it: whether both seats end up in front of one person is a fact
 * about the SEATS. It matters here because this paragraph is the last thing read
 * before a game is written — and a board at one screen or a handicap game will
 * move no rating whatever the draft says, so "Rated." above either would be this
 * page contradicting itself in two sentences.
 */
export function describeGameProse(rules: RulesDraft, refused: RatingRefusal | null, say: Speaker): string {
  const variant = rules.variant as RuleVariant;
  const copy = RULE_VARIANT_DISPLAY[variant];
  const name = copy === undefined ? variantLabel(rules.variant) : pairedText(say, copy.label, copy.kanji);
  /*
   * The board that will be DRAWN, not the number on the draft — the same care
   * `describeRules` takes, and for the same reason: the engine snaps a size the
   * variant does not offer, so a draft carrying an impossible one would have this
   * describing a board nobody will see.
   */
  const size = copy === undefined ? rules.size : sizeForVariant(variant, rules.size);
  /*
   * The board as a pair of numbers and nothing else. `BOARD_SIZE_DISPLAY` has a
   * name for each — "Eight", "Mini" — which earns its place on a chip beside a
   * picker and reads as a mistake in a sentence: "on an 8×8 Eight board".
   */
  // "an 8×8 board", or "a hexagon of 91 cells" where the board is not a square.
  const board = boardPhrase(variant, size, say);
  const blocked = rules.obstacles === OBSTACLE_LAYOUTS.hoshi;

  const sentences = [say.say(blocked ? "summary.gameOnBlocked" : "summary.gameOn", { name, board })];
  for (const word of describeSettings(rules, refused, say)) {
    if (word.text === openingWords(say, OPENING_RULES.free)) continue;
    sentences.push(say.sentence(word.text));
  }
  const headStart = describeHeadStart(rules, say);
  if (headStart !== null) sentences.push(say.sentence(headStart));
  const handicap = describeHandicap(rules.handicap, say);
  if (handicap !== null) sentences.push(say.sentence(handicap));
  return say.sentences(sentences);
}

/**
 * WHETHER THIS IS PLAYING THAT GAME AGAIN, said wherever it came from a rematch.
 *
 * A rematch swaps the colours and is paid as a rematch. A game set up from one
 * and then changed — another rule, or another player — does neither, and the
 * doorstep is the last page that can say which before Begin makes it. The set-up
 * screen let somebody choose another opponent on a rematch and this page went on
 * describing the old one, so it says the lineage out loud rather than leaving it
 * to be inferred from the seating. Null where the game did not come from a
 * rematch at all.
 */
export function describeLineage(
  again: { opponent: { name: string; computer: boolean } } | null,
  { repeat, sameOpponent }: { repeat: boolean; sameOpponent: boolean },
  say: Speaker,
): string | null {
  if (again === null) return null;
  const them = playerWord(again.opponent.name, again.opponent.computer, say);
  const copy = doorstepCopy(say);
  if (repeat) return copy.rematchOf(them);
  return sameOpponent ? copy.rematchChanged(them) : copy.notRematch(them);
}

