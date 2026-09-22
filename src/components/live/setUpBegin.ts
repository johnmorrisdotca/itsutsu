import { botsFor } from "@/lib/bots/bots.constants";
import { fixedOpener } from "@/lib/gomoku/rules/creation";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

import type { BeginAction } from "./beginGame";
import { describeSeating } from "./doorstepSays";
import { DOORSTEP_COPY } from "./live.constants";
import type { RulesDraft } from "./rulesDraft";
import type { SetUpAgain, SetUpFork, SetUpOpponent } from "./setUp.types";
import { creationFor, openerIn, seatsFor } from "./setUpStart";

/**
 * WHAT THE SET-UP SCREEN IS ABOUT TO MAKE: the request, and the sentence that
 * says who will be sitting where.
 *
 * Lifted out of `SetUpGame.tsx` when that file passed the File Size Gate, and
 * it is a responsibility rather than an offcut — every line of it answers one
 * question the screen asks once, at the bottom, over its button. The screen
 * above it is about CHOOSING; this is about what the choice comes to.
 */
export function setUpBegin({
  settled,
  asPlayed,
  opponent,
  again,
  fork,
  carry,
  random,
  waiting,
}: {
  /** The form as it stands, with any posted seat's board already settled into it. */
  settled: RulesDraft;
  /** Somebody already waiting at exactly this game, or undefined. Begin sits down with them. */
  waiting?: { id: string; who: string };
  /** The form as it arrived, for a rematch to notice it has been changed. */
  asPlayed: RulesDraft | null;
  /** Who the game is against NOW — null for a seat posted for anyone, and for a draw. */
  opponent: SetUpOpponent | null;
  again: SetUpAgain | null;
  fork: SetUpFork | null;
  carry: Record<string, unknown>;
  /** A computer player is to be drawn at random when the game is written. */
  random: boolean;
}): { begin: BeginAction; sitting: string } {
  /*
   * WHAT THE BUTTON WILL DO, worked out here — which is the change John asked
   * for on 2026-09-21: "our game signup and starting process seems to have one
   * too many screens… too much repeat info on the multi-screens."
   *
   * There were two screens saying the same thing. This one settled the rules
   * and carried them to /games/<game>/begin, which printed those rules again,
   * the same board picture again, and made the game. So this screen states the
   * game — the rules on their folded rows, the seating in a sentence below —
   * and makes it, and the press that used to be Continue is Begin.
   *
   * THE DOORSTEP REMAINS for taking a seat SOMEBODY ELSE posted when you arrive
   * at it cold — from the waiting room, where the rules being agreed to are
   * theirs and unread. `waiting` is NOT that case, and it stopped going there on
   * 2026-09-22. A seat this screen matches is one whose rules are exactly what
   * the reader just chose (`matchSeat` compares the whole of the game), and the
   * button already says who is sitting there; the doorstep after it printed
   * the same rules and the same name a third time. Three presses, on the two
   * routes whose rules a reader never gets to choose — John: "no game or
   * process should take 3 screens/clicks". So Begin sits down, and if the seat
   * has gone in the meantime it makes the game it would have made instead,
   * and says so.
   *
   * `creationFor` is the same function the doorstep asked, with the same
   * arguments, so the request is byte for byte the one that was sent before —
   * it has simply stopped needing a page of its own to be sent from.
   */
  const creation = creationFor({
    rules: settled,
    source: asPlayed,
    opponent: fork !== null ? null : opponent,
    again,
    fork,
    carry,
  });
  const seating = seatsFor({ again: creation.repeat ? again : null, fork });
  /*
   * The programs this game could be drawn from, where "a random computer
   * player" is chosen. The draw itself is made as the game is written and not
   * before, so a reload never shows one program and makes another.
   */
  const pool = random
    ? botsFor(settled.variant as RuleVariant).map((bot) => ({ id: bot.id, name: bot.name }))
    : [];
  const begin: BeginAction =
    waiting !== undefined
      ? { kind: "sit", id: waiting.id, who: waiting.who, instead: creation.body }
      : random && pool.length > 0
        ? { kind: "draw", body: creation.body, pool }
        : { kind: "create", body: creation.body };

  /*
   * WHO SITS WHERE, said before the board rather than worked out from it. This
   * is the one sentence the doorstep had that this screen did not, so it came
   * here with the button.
   */
  const sitting = describeSeating(settled, {
    opponent: random
      ? DOORSTEP_COPY.drawnFrom(pool.map((program) => program.name))
      : (opponent?.name ?? null),
    computer: random || (opponent?.computer ?? false),
    mine: seating.mine,
    opener:
      fixedOpener(settled.variant, settled.opening, { headStart: settled.headStart, size: settled.size }) ??
      openerIn(carry),
    screen: seating.screen,
  });
  return { begin, sitting };
}
