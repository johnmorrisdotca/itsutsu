import "server-only";

import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { SeatOnBoard } from "@/components/mine/startGame.types";
import { currentMemberId } from "@/lib/auth/currentSession";
import { ignoredMemberIds } from "@/lib/social/ignores";
import { currentEmail } from "@/lib/auth/currentSession";
import { fetchOpenSeats } from "./openGames";
import type { GameSummary } from "./gameHistory.types";

/**
 * The seats somebody could sit down at, for the screen that sets a game up.
 *
 * Asking for a game somebody is already asking for should sit you down with
 * them rather than post a second seat beside theirs and leave two people
 * waiting for each other. The one-line sentence that used to start games did
 * that, and put the reason better than I can: auto-match and posting a seat
 * are the same wish said twice, and the only difference is whether anybody is
 * already asking.
 *
 * TWO SEATS ARE NEVER OFFERED, and both exclusions were got wrong here first
 * — I wrote this by copying the shape of the old code and copied a bug the
 * lobby had already had and fixed:
 *
 *  - YOUR OWN, keyed by MEMBER ID and not by the browser's seat cookies. A
 *    cookie is the wrong key: a seat belongs to the account on every device,
 *    so posting on a phone and reading the board on a laptop offered it
 *    straight back. The server refuses to seat somebody at their own posted
 *    game, so an offer keyed by cookie is one the site would then reject —
 *    worse than no offer at all.
 *
 *  - ONE POSTED BY SOMEBODY IGNORED, also by member id. The ignore list is
 *    kept by address and a seat is keyed by id, so asking a set of addresses
 *    whether it holds an id is a question with one answer — which is how the
 *    lobby's copy of this managed to do nothing at all for a while.
 */
export async function seatsToSitAt(): Promise<SeatOnBoard[]> {
  const [mine, email] = await Promise.all([currentMemberId(), currentEmail()]);
  const [rows, ignored] = await Promise.all([
    fetchOpenSeats(),
    email === null ? Promise.resolve(new Set<string>()) : ignoredMemberIds(email),
  ]);

  const theirs = (game: GameSummary) => {
    const poster = game.openSeat === STONES.black ? game.whiteMemberId : game.blackMemberId;
    if (poster === null) return true;
    if (mine !== null && poster === mine) return false;
    return !ignored.has(poster);
  };

  return rows.filter(theirs).map((game) => ({
    id: game.id,
    variant: game.variant,
    size: game.size,
    moveTimeMs: game.moveTimeMs,
    who: (game.openSeat === STONES.black ? game.whiteName : game.blackName).trim() || "Somebody",
  }));
}
