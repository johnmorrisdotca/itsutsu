import "server-only";

import type { Stone } from "@/lib/gomoku/gomoku.types";
import { replayGame } from "@/lib/gomoku/replay";
import { matchPath, setUpLink } from "@/lib/gomoku/slugs";
import { prisma } from "@/lib/prisma";
import { seatedRivals } from "@/lib/record/rivalry";
import { RIVALRY_MOMENTS } from "@/lib/record/rivalry.constants";
import { fetchRivalryView } from "@/lib/record/rivalryRead";

import { gameResultFacts } from "./gameResult";
import { DAY_MS, RESULT_CARD_FRESH_DAYS } from "./gameResult.constants";
import type { ResultCardData } from "./gameResult.types";
import type { GameDetail } from "./gameHistory.types";
import { fetchMyGames } from "./myGames";
import { nextWaiting } from "./nextGame";

/**
 * WHAT THE RESULT CARD OVER A FINISHED BOARD SAYS, read when the record renders.
 *
 * Null — no card — for anybody who did not play (a watcher is shown the record,
 * whose heading already names the result; a card offering them a rematch and
 * their own queue would be about a game that was not theirs), for a game with no
 * result, and for a game past `RESULT_CARD_FRESH_DAYS`, which is being read back
 * rather than arriving.
 *
 * WHAT IT COSTS, and it rides the render that already happens. A game ending in
 * front of a player hands the page back to the server (`useMatchAddress`), and
 * that render is this one: no poll, no timer, no second request. The reads below
 * are made only when a card is due — one sum over this reader's XP for this game,
 * the rivalry the page's own panel reads, and the queue the header's badge reads.
 */
export async function resultCardFor(input: {
  game: GameDetail;
  /** The colour this reader held, by account or by seat cookie; null for a watcher. */
  seat: Stone | null;
  hotSeat: boolean;
  viewerId: string | null;
  /** Whether a rematch can be offered: somebody sat opposite. */
  rematchable: boolean;
  claims: Map<string, string>;
  keepFinishedDays: number;
  now?: Date;
}): Promise<ResultCardData | null> {
  const { game, seat } = input;
  const now = input.now ?? new Date();
  if (seat === null || game.status !== "finished" || game.lastMoveAt === null) return null;
  if (now.getTime() - Date.parse(game.lastMoveAt) > RESULT_CARD_FRESH_DAYS * DAY_MS) return null;

  const facts = gameResultFacts({
    result: game.result,
    final: replayGame(game),
    forfeits: game.forfeits,
    seat,
    hotSeat: input.hotSeat,
  });
  if (facts === null) return null;

  const pair = input.hotSeat
    ? null
    : seatedRivals({ black: game.blackMemberId, white: game.whiteMemberId, readerId: input.viewerId });
  const [paid, rivalry, queue] = await Promise.all([
    input.viewerId === null
      ? null
      : prisma.xpEvent.aggregate({ where: { memberId: input.viewerId, subject: game.id }, _sum: { points: true } }),
    pair === null
      ? null
      : fetchRivalryView({
          ...pair,
          readerId: input.viewerId,
          variant: game.variant,
          moment: RIVALRY_MOMENTS.after,
          thisGameId: game.id,
        }),
    fetchMyGames(input.claims, input.viewerId, now, input.keepFinishedDays),
  ]);

  const earned = paid?._sum.points ?? 0;
  const waiting = queue.groups.yourMove.filter((one) => one.game.id !== game.id);
  const next = nextWaiting(waiting);

  return {
    gameId: game.id,
    facts,
    names: { black: game.blackName, white: game.whiteName },
    xp: earned > 0 ? earned : null,
    rivalry,
    rematch: input.rematchable
      ? { href: setUpLink({ rematch: game.id }), again: false }
      : input.hotSeat
        ? { href: setUpLink({ variant: game.variant }), again: true }
        : null,
    newGame: setUpLink({}),
    waiting: next === null ? null : { count: waiting.length, href: matchPath(next.game.variant, next.game.id) },
  };
}
