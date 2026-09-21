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
}: {
  /** The form as it stands, with any posted seat's board already settled into it. */
  settled: RulesDraft;
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
   * THE DOORSTEP REMAINS, for the one case where it is not a repeat: taking a
   * seat SOMEBODY ELSE posted. The rules being agreed to there are theirs, not
   * yours, and reading them before sitting down is the whole purpose of the
   * page. `waiting` is exactly that case, and it still goes there.
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
    random && pool.length > 0
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
