import type { MyGame, MyGames } from "@/lib/history/myGames.types";
import { botInSeat } from "./bots";
import { BROWSER_REPLY_GRACE_MS, UNANSWERED_TURNS_AT_ONCE } from "./bots.constants";

/**
 * The games where a computer is to move and nobody has answered for it.
 *
 * A computer's reply in a live game is worked out in the player's own browser
 * (`useBotSeat`), and the move route is told so and stays out of it. That is
 * the whole saving, and it opens one hole: a tab closed mid-thought leaves the
 * computer still to move with nothing anywhere working on it. The player's own
 * list files the game under "their move", so nothing would ever send them back
 * to the board that would have answered — the game simply stops.
 *
 * So the read of a player's games is where it is found. That list already
 * knows whose turn each game is, so finding one costs nothing, and it is where
 * the person who closed the tab looks next. Only past the grace, so the server
 * never races a browser still thinking; only a few at once, so one read cannot
 * turn into a backlog's worth of searches.
 *
 * Pure, and apart from `botPlay.ts`, so the rule can be checked without a
 * database.
 */
export function unansweredBotTurns(groups: Pick<MyGames, "theirMove" | "unstarted">, now: Date): MyGame[] {
  return [...groups.theirMove, ...groups.unstarted]
    .filter((one) => one.offer === null)
    .filter((one) => one.toPlay !== null && botInSeat(one.game, one.toPlay) !== null)
    .filter((one) => now.getTime() - new Date(one.since).getTime() > BROWSER_REPLY_GRACE_MS)
    .slice(0, UNANSWERED_TURNS_AT_ONCE);
}
