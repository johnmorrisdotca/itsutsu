import { HANDICAP_RULES } from "@/lib/gomoku/gomoku.constants";
import type { Handicap } from "@/lib/gomoku/gomoku.types";
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
   * A FORK NAMES NO OPPONENT AND MUST NOT. The route finds the other player in
   * the game being forked — a position belongs to the two who were in it — and
   * it does that by looking the seat up, then falls back to a board at one
   * screen when nobody held it. Sending an opponent as well would put the route
   * on both roads at once: the id binds a seat while the fallback, which only
   * watches for an ADDRESS, still concludes nobody was named and marks the game
   * a hot seat. Bound and hot-seated together is not a state anything here
   * means, and the display rules about rating read it as neither.
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
