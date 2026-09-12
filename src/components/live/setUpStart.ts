import { FIRST_STONE, HANDICAP_RULES, STONES } from "@/lib/gomoku/gomoku.constants";
import type { Handicap, Stone } from "@/lib/gomoku/gomoku.types";
import type { RulesDraft } from "./rulesDraft";
import type { SetUpAgain, SetUpFork, SetUpOpponent } from "./setUp.types";

/**
 * WHAT PRESSING START ACTUALLY ASKS FOR.
 *
 * Pure, and its own module, because it is the one piece of this screen that is
 * a decision rather than a rendering — and because the interesting case cannot
 * be seen by looking at the form.
 *
 * A REMATCH IS ONLY A REMATCH WHILE IT IS UNCHANGED. The creation route takes
 * everything about a rematch from the game being repeated and nothing from the
 * request, deliberately: "anything the caller could send instead would be a way
 * of it quietly not being one." That is right, and it is also exactly what John
 * asked to be able to do — "I want to definitely play Bob at Reversi, but I want
 * to try that variant, and change some rules."
 *
 * Both hold, because they are two different games. So: while the form still
 * describes the game it was filled in from, this asks for a REMATCH and the
 * route carries the board, the seed, the line length and the swapped colours
 * exactly as it always has. The moment somebody changes a rule it stops asking
 * for one and asks for an ordinary challenge against the same player, carrying
 * what it was given. Nothing here weakens the route's rule; it stops making a
 * claim that would no longer be true.
 */
export type SetUpCreation = {
  /** The body to send to the creation route. */
  body: Record<string, unknown>;
  /**
   * Whether this is still a repeat of the game it came from — so the screen can
   * say when it has stopped being one, rather than swapping a person's colours
   * back without mentioning it.
   */
  repeat: boolean;
};

/** Whether two drafts describe the same game, ignoring where the seat is advertised. */
export function sameRules(one: RulesDraft, two: RulesDraft): boolean {
  return (
    one.variant === two.variant &&
    one.size === two.size &&
    one.obstacles === two.obstacles &&
    one.opening === two.opening &&
    one.moveTimeMs === two.moveTimeMs &&
    one.timeoutPenalty === two.timeoutPenalty &&
    one.clockMode === two.clockMode &&
    one.rated === two.rated &&
    one.allowResign === two.allowResign &&
    sameHandicap(one.handicap, two.handicap)
  );
}

/** Field by field, through the rule list, so a toggle added later is compared too. */
function sameHandicap(one: Handicap, two: Handicap): boolean {
  if (one.stone !== two.stone) return false;
  if (one.secondStoneExclusion !== two.secondStoneExclusion) return false;
  return HANDICAP_RULES.every((rule) => one[rule] === two[rule]);
}

export function creationFor({
  rules,
  source,
  opponent,
  again,
  fork,
  carry,
}: {
  /** The form as it stands. */
  rules: RulesDraft;
  /** The form as it arrived, for a rematch to notice it has been changed. Null where nothing was pre-filled. */
  source: RulesDraft | null;
  opponent: SetUpOpponent | null;
  again: SetUpAgain | null;
  fork: SetUpFork | null;
  /** The line length, the seed, who opens, the draw limit — carried, never asked. */
  carry: Record<string, unknown>;
}): SetUpCreation {
  /*
   * Still the same game, so ask for the rematch itself and let the route carry
   * every part of it — including the ones this form has no row for and the
   * colour swap, which no other request can express.
   */
  if (again !== null && source !== null && sameRules(rules, source)) {
    return { body: { rematch: again.id }, repeat: true };
  }

  /*
   * A seat posted for whoever answers, which is the only case with nobody on
   * the other side of it. Everything else binds a second seat, so `open` is
   * false: a game that is both a challenge and an advertisement is two games.
   */
  const posted = opponent === null && fork === null;
  /*
   * A FORK NAMES NO OPPONENT AND HAS NO NEED TO. The route finds the other
   * player in the game being forked — a position belongs to the two who were in
   * it — by reading the seats, and falls back to a board at one screen only
   * where nobody held one.
   *
   * It used to be stronger than that: sending an opponent as well put the route
   * on both roads at once, because the fallback watched for an ADDRESS and a
   * bound id was not one, so the game came out bound AND hot-seated. That is
   * gone — the route resolves the opponent by member id now, so a named one is
   * simply honoured over the position's — and this stays as it is because the
   * route still knows better than this screen who was in that game.
   */
  const body: Record<string, unknown> = {
    ...carry,
    ...rules,
    open: posted,
    ...(fork !== null
      ? { from: { id: fork.id, move: fork.move } }
      : opponent !== null
        ? { challengeId: opponent.id }
        : {}),
  };

  return { body, repeat: false };
}

/**
 * WHICH COLOUR THE ASKER ENDS UP WITH, worked out here because this module is
 * where what the route will do with a request is already reasoned about.
 *
 * The doorstep states every fact a game will be played under before it exists,
 * and the colours are the fact people most want — a rematch swaps them, and
 * "you are black this time" is worth reading before the board rather than being
 * worked out from it. So it has to be knowable in advance, and it is: each shape
 * of creation puts the asker somewhere the route decides, not somewhere chance
 * does.
 *
 *  - A REMATCH swaps, and `colourAfterSwap` has already said which way round.
 *  - A FORK keeps the colour that played the position, because the position
 *    belongs to the colours that were in it.
 *  - A CHALLENGE gives the challenger black — see `askingSomebody` in
 *    `liveAgainst.ts`, which seats whoever asks as black wherever no position has
 *    settled the colours, and keeps the position's colours where one has.
 *  - A POSTED SEAT keeps black for whoever posted it, for the same reason: the
 *    route binds its creator to black and hands back only that seat's token.
 *
 * `mine` is nullable and `screen` is separate, because "both seats are yours"
 * and "you are black" are different answers and a colour standing in for the
 * first would be read as the second.
 */
export function seatsFor({
  again,
  fork,
}: {
  again: SetUpAgain | null;
  fork: SetUpFork | null;
}): { mine: Stone | null; screen: boolean } {
  if (again !== null) return { mine: again.colour, screen: false };
  if (fork !== null) return { mine: fork.colour, screen: fork.alone };
  /*
   * Everything else: whoever asks takes black. True of a challenge and of a
   * posted seat alike, and stated as one fact rather than two branches because
   * the route states it as one — `seats.blackMemberId` is the asker in both.
   */
  return { mine: STONES.black, screen: false };
}

/**
 * Which colour moves first. Black, unless a game being carried says otherwise.
 *
 * Read out of `carry` rather than off the draft, because whoever opens is not a
 * row on this form — it comes with a rematch or a fork and is passed straight
 * through. Anything unreadable falls back to the same default the creation route
 * applies, so the sentence a reader is shown is the game they will get.
 */
export function openerIn(carry: Record<string, unknown>): Stone {
  const opener = carry.opener;
  return opener === STONES.black || opener === STONES.white ? opener : FIRST_STONE;
}
