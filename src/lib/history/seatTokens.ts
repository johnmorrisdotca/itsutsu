import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import type { CreatedGame } from "./liveGame.types";

/**
 * WHICH SEAT KEYS THE ANSWER TO A CREATION MAY CARRY.
 *
 * A SEAT THAT IS SOMEBODY ELSE'S IS NOT YOURS TO HOLD THE TOKEN FOR.
 *
 * A token is the whole credential. `stoneForToken` is what every seat-bound
 * endpoint identifies a player by — resigning, moving, giving time, claiming a
 * timeout, changing the rules — so whoever holds a seat's token can act AS that
 * seat, whatever any rule about membership says.
 *
 * The condition used to read `open === true && !hotSeat`, which named the
 * noticeboard case rather than the rule, and the two are not the same set. A
 * CHALLENGE binds white to another member's id and is rated by default, and it
 * fell outside "posted" — so the challenger was handed their opponent's token
 * and could resign on their behalf, crediting themselves a rated win and
 * writing a loss that person never played onto a permanent public record. A
 * rematch and a fork against a known opponent did the same.
 *
 * So the rule, stated as the rule: **a seat that is not the caller's to give
 * never has its token returned.** Both tokens still go back when both seats are
 * theirs — a private game they must send a link for, or a hot-seat board where
 * one browser plays both colours.
 *
 * Nothing on the client is narrowed by this: `StartGame`, `SetUpGame` and
 * `StartSharedGame` read `blackToken` only. Do not widen the return "for
 * symmetry" — the asymmetry is the point.
 *
 * PURE, AND ITS OWN MODULE, because it has been got wrong twice and both times
 * silently: nothing fails, nobody is refused, and a token simply arrives
 * somewhere it should not. A rule like that wants to be checkable without a
 * request, which is what `seatTokens.test.ts` does — and it has to live where a
 * reader looking for "who may hold a seat" will find it, beside `seats.ts`,
 * rather than four hundred lines down a route handler.
 */

/** What the caller is being handed back: the whole game, or one seat of it. */
export type CreationBody = CreatedGame | { id: string; blackToken?: string; whiteToken?: string };

/**
 * THREE WAYS A SEAT IS NOT YOURS TO HOLD, and each has cost something:
 *
 *  - **POSTED** on the noticeboard. Nobody is bound to it; it is answered by
 *    sitting down, so there is nobody for the poster to send a link to.
 *  - **BOUND TO SOMEBODY ELSE** by a challenge, a rematch or a fork. This is
 *    the one that was a real bug, described above.
 *  - **OFFERED** to somebody who has not answered. An offered seat is UNBOUND,
 *    so the test above it stops seeing it — and without this the offerer would
 *    be handed their offeree's token, which is the same bug wearing a new
 *    shape. An offer mints a way in for nobody: the offeree reaches their seat
 *    by member id once it is theirs, and `acceptOffer` replaces the token at
 *    that moment, so the value that existed while the game was a question
 *    cannot play the seat once it is an answer.
 *
 * The unbound seat of a PRIVATE game is the case that must still come back: it
 * is unbound for the opposite reason — the caller has to send a link to whoever
 * they mean to play, and cannot without the token. So "unbound" alone answers
 * nothing, because it means both "for whoever sits down", "for whoever I
 * invite" and "for the one person I asked". `posted` and `offered` are what
 * tell the three apart.
 */
export function withholdsASeat({
  hotSeat,
  posted,
  offered,
  seats,
  caller,
}: {
  /** One token for both chairs: every seat is the caller's. */
  hotSeat: boolean;
  /** A seat on the noticeboard, for whoever sits down. */
  posted: boolean;
  /** A seat proposed to one named person who has yet to answer. */
  offered: boolean;
  seats: { blackMemberId?: string | null; whiteMemberId?: string | null };
  /** The member asking, or null for a browser with no account. */
  caller: string | null;
}): boolean {
  if (hotSeat) return false;
  if (posted || offered) return true;
  const bound = [seats.blackMemberId, seats.whiteMemberId].filter(
    (id): id is string => id !== undefined && id !== null,
  );
  return bound.some((id) => id !== caller);
}

/**
 * THEIR OWN SEAT, WHICHEVER COLOUR IT IS — not "the black one".
 *
 * A REMATCH SWAPS THE COLOURS (`seatsForRematch`: "They had black, so now I
 * do"), so the caller is white about half the time. Returning `blackToken` for
 * every withheld case would have handed them their opponent's token in exactly
 * those games — the same bug pointed the other way, and harder to notice
 * because it only appears on the second game between two people.
 *
 * Black where nothing says otherwise, which is right rather than a guess: the
 * caller is only handed ONE token when a seat is being withheld, and in every
 * such case either their own id is on a seat (and this finds it) or the game is
 * posted, where the creator sits as black by construction.
 */
export function callersSeat(
  seats: { blackMemberId?: string | null; whiteMemberId?: string | null },
  caller: string | null,
): Stone {
  const white =
    caller !== null && seats.whiteMemberId !== undefined && seats.whiteMemberId === caller;
  return white ? STONES.white : STONES.black;
}

/**
 * The body of a 201 from the creation route: the whole game where both seats
 * are the caller's to give, and their own seat alone where one is not.
 */
export function creationBody(
  created: CreatedGame,
  withheld: boolean,
  mine: Stone,
): CreationBody {
  if (!withheld) return created;
  const token = mine === STONES.white ? created.whiteToken : created.blackToken;
  return { id: created.id, [`${mine}Token`]: token };
}
