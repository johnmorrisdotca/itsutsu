/**
 * Which game to play next, and the order a queue of them reads in.
 *
 * Pure, and separate from `myGames.ts` because that file reaches the database
 * and this rule has to be checkable without one — and because the same rule is
 * wanted in two places: the order the "Your move" list is drawn in, and which
 * game somebody is taken to after they move.
 *
 * OLDEST FIRST, which is the opposite of every other list on this site. A
 * record reads newest first because it is history and the last thing that
 * happened is the interesting one. A queue of games waiting on YOU is not
 * history; it is a debt, and the one that has been waiting longest is the one
 * somebody is most likely to be wondering about. The elder correspondence
 * sites all worked this way, and John plays several games at once.
 */
import { GAME_STATUS } from "@/lib/gomoku/gomoku.constants";
import type { GameStatus, Stone } from "@/lib/gomoku/gomoku.types";
import { AFTER_MOVE, type AfterMove } from "@/lib/preferences/turnFlow";

export type Waiting = { since: string };

/** Longest-waiting first. The tie is broken so two games cannot swap places between reads. */
export function waitingFirst<T extends Waiting>(a: T, b: T): number {
  return a.since.localeCompare(b.since);
}

/**
 * The next game to be taken to, or null when nothing is waiting.
 *
 * `exclude` is the game just played: after a move, that board is the one place
 * somebody has definitely finished with, and it may still be in the list for
 * a moment — a game where a move takes a turn rather than ending it can come
 * straight back round to you.
 */
export function nextWaiting<T extends Waiting & { game: { id: string; variant?: string } }>(
  yourMove: readonly T[],
  exclude?: string,
  /**
   * The same game only, Pente to Pente — John's "next SIMILAR game", which is
   * what makes a session of twelve boards bearable: one set of rules in your
   * head at a time. Undefined asks for the next waiting game of any kind.
   */
  sameAs?: string,
): T | null {
  const queue = [...yourMove]
    .filter((one) => one.game.id !== exclude)
    .filter((one) => sameAs === undefined || one.game.variant === sameAs)
    .sort(waitingFirst);
  return queue[0] ?? null;
}

/**
 * Whether a player is carried onward from the board they have just moved on.
 *
 * Two boards do not send anybody anywhere, and they are different kinds of no.
 *
 * A move does not always end a turn — Connect6 lays two stones — so the board
 * can still be waiting on the same person a moment after they played. Carrying
 * them "onward" to where they already are would read as the feature being
 * broken, and `nextWaiting` cannot see it, because from the queue's point of
 * view that game is genuinely waiting on them.
 *
 * And a game that has just ENDED is the one board worth staying on. The result
 * is what the move was for. Whisking somebody past their own win is not taking
 * them onward; it is taking the game away from them.
 *
 * A COMPUTER TO MOVE IS A THIRD, and it is the one that hid a feature. The
 * computer's reply is worked out in this browser now (`useBotSeat`), on the
 * board the player is looking at. Carrying them onward unmounts that board and
 * the worker with it, mid-thought, so the reply never came: measured, the ask
 * went out and no answer ever arrived, and it read as a worker that does not
 * work in a live game. It was a worker thrown away by the page leaving. And
 * staying costs nothing — the turn comes straight back round in a second or
 * two, as it always did when the server answered inside the move's request.
 */
export function carriesOnwardFrom(
  status: GameStatus,
  toPlay: Stone,
  seat: Stone,
  computerToMove: boolean,
): boolean {
  if (status !== GAME_STATUS.playing) return false;
  if (computerToMove) return false;
  return toPlay !== seat;
}

/**
 * Whether this player is moved on at all, rather than left where they are.
 *
 * John asked for the advance to be the default and to be refusable: "players
 * should NEVER have to hunt for the game that is waiting for a move... unless
 * they choose an option in the settings."
 *
 * THE SETTINGS NOW EXIST, and this reads them. It used to answer true for
 * everybody, with a note saying the opt-out was waiting on a preferences
 * registry that was being built elsewhere — refusing to invent a place to
 * store the answer rather than reading one that was not there. The registry
 * landed; `afterMove` is the row, and `stay` is the refusal.
 */
export function advancesAfterMove(afterMove: AfterMove): boolean {
  return afterMove !== AFTER_MOVE.stay;
}
