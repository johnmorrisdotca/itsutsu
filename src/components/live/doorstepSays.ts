import {
  OBSTACLE_LAYOUTS,
  OPENING_RULES,
  STONES,
  STONE_DISPLAY,
  sizeForVariant,
} from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";
import { OPENING_DISPLAY } from "@/lib/gomoku/openings.constants";
import type { OpeningRule } from "@/lib/gomoku/gomoku.types";
import { openingDecidesColours } from "@/lib/gomoku/rules/opening";
import { RULE_VARIANT_DISPLAY, variantLabel } from "@/lib/gomoku/variants.constants";
import { MEMBER_KIND_DISPLAY, MEMBER_KINDS } from "@/lib/auth/memberKind";
import { shownName } from "@/lib/rating/shownName";
import type { RulesDraft } from "./rulesDraft";
import { describeHandicap, describeSettings } from "./rulesSummary";

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
function colourWord(stone: Stone): string {
  return STONE_DISPLAY[stone].label.toLowerCase();
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
};

/** A name as this site prints it, with a program marked as one. */
export function playerWord(name: string, computer: boolean): string {
  return computer ? `${name} ${ROBOT_KANJI}` : shownName(name);
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
export function describeSeating(rules: { opening: string }, who: DoorstepWho): string {
  /*
   * The offer note is appended to whatever the seating turns out to be, rather
   * than written into each branch: there are four ways out of the function
   * below and three of them can name an opponent, so a branch is exactly the
   * kind of place a sentence gets forgotten. `offerNote` answers "" for every
   * case that is not an offer.
   */
  return describeSeats(rules, who) + offerNote(who);
}

function describeSeats(rules: { opening: string }, who: DoorstepWho): string {
  const against = who.opponent === null ? null : playerWord(who.opponent, who.computer);

  if (who.screen) {
    return "Both seats are yours: two people at one screen, taking turns on this device.";
  }

  if (openingDecidesColours(rules.opening as OpeningRule)) {
    const opening = OPENING_DISPLAY[rules.opening as OpeningRule]?.label ?? rules.opening;
    const decides = `The ${opening} opening decides who plays which colour, once the first stones are down.`;
    return against === null
      ? `${decides} The other seat is posted for whoever answers it.`
      : `Against ${against}. ${decides}`;
  }

  if (who.mine === null) {
    /*
     * Nothing has said, and no opening is going to. Reached only by a shape this
     * page has not met yet, and it answers the way this codebase answers an
     * unmeasurable question: it declines rather than guessing a colour.
     */
    return against === null
      ? "The seat is posted for whoever answers it; the colours are settled when the game is made."
      : `Against ${against}. The colours are settled when the game is made.`;
  }

  const mine = colourWord(who.mine);
  const theirs = colourWord(other(who.mine));
  const order = who.mine === who.opener ? "move first" : "move second";
  return against === null
    ? `You are ${mine} and ${order}. The ${theirs} seat is posted on the games page for whoever answers it.`
    : `Against ${against}, who plays ${theirs}; you are ${mine} and ${order}.`;
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
export function offerNote(who: DoorstepWho): string {
  if (who.computer || who.screen || who.opponent === null) return "";
  const them = playerWord(who.opponent, who.computer);
  return ` This is an offer: ${them} can accept or decline it, and declining costs nobody anything.`;
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
 */
export function describeGameProse(rules: RulesDraft): string {
  const variant = rules.variant as RuleVariant;
  const copy = RULE_VARIANT_DISPLAY[variant];
  const name = copy === undefined ? variantLabel(rules.variant) : `${copy.label} ${copy.kanji}`;
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
  const board = `${size}×${size}`;
  const blocks = rules.obstacles === OBSTACLE_LAYOUTS.hoshi ? ", with the star points blocked" : "";

  const sentences = [`${name} on ${article(board)} ${board} board${blocks}.`];
  for (const word of describeSettings(rules)) {
    if (word.text === `${OPENING_DISPLAY[OPENING_RULES.free].label} opening`) continue;
    sentences.push(`${word.text}.`);
  }
  const handicap = describeHandicap(rules.handicap);
  if (handicap !== null) sentences.push(`${handicap}.`);
  return sentences.join(" ");
}

/** "an 8×8", "a 19×19". English, from the digit that is actually spoken. */
function article(board: string): string {
  return /^(8|11|18)/.test(board) ? "an" : "a";
}
