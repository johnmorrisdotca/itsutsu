import "server-only";

import { prisma } from "@/lib/prisma";
import { MEMBER_STREAK_SCOPES, streakWrite, type StreakOutcome } from "./streak";
import { outcomeFor } from "./pools";

/**
 * The run over every finished game a member has played here.
 *
 * `recordResult` keeps the three RATED runs on `Player`, and is called only
 * when the row says rated. This keeps the fourth — the one the PLAYED column
 * beside it is counting — and is called wherever a game is DECIDED, whether or
 * not anything rated it. An all-games run maintained only on rated games would
 * be a rated run wearing a different name, which is the one way this can be
 * wrong while looking right.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE DEFINITION IS `fetchPlayedTallies`, AND NOT A SECOND VERSION OF IT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `history/playerRecord.ts` has the number this run will be printed next to.
 * If the two are about sets of games that differ by even one game, the row
 * contradicts itself in a way a reader can see — which is worse than the dash
 * this replaces. So the three rules that decide the set are stated once, here,
 * and `playedRun.test.ts` pins them against the same games that function
 * counts:
 *
 * - **A game counts when it is finished and its result is not `abandoned`.**
 *   Called off before the first stone is not a result; nothing is recorded.
 * - **BY MEMBER ID ONLY, never by name.** Production carries a decided game
 *   between "Meijin" and "Hidemasa Tamenoki" with both seats' ids null,
 *   recorded before those member rows existed. A name fallback pulls it into a
 *   total it was never bound to — 60 where the count says 59.
 * - **A game against yourself is one game, counted from the black seat.** Both
 *   seats carry the one id, and a naive pass over the seats counts it twice.
 *   John has played himself; that game is why his record reads 14 played.
 *
 * Nothing here tests `rated`, `isHotSeat` or `isRateable`. None of those is
 * part of what PLAYED counts, and adding one would narrow this set away from
 * the count it has to match. A hot-seat game whose creator was signed in is a
 * game that member played, and the column says so.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT IT COSTS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * One read of at most two rows by primary key, and one transaction of at most
 * two small updates — per finished GAME, never per move, and nothing at all
 * for a game neither seat was bound to. No page reads a game to show this: the
 * members list already fetches every `Member` row it lists, so the run comes
 * back on rows that were being read anyway, which is the whole reason it is a
 * column. See `Player.peopleStreakKind`, which says it at length.
 *
 * The read is there because the run is extended by `streakWrite` — the one
 * implementation of "one more result" on the site — rather than by a second
 * copy of that rule written in SQL. It inherits `recordResult`'s race with it:
 * two games for one member finishing in the same instant can both read the
 * same run and one increment is lost. That is a property of every stored run
 * here, not a new one, and it is the honest trade for having the rule in one
 * place. The backfill puts such a row right.
 */

/** One decided game, as much of it as this needs. */
export type DecidedGame = {
  blackMemberId: string | null;
  whiteMemberId: string | null;
  winner: "black" | "white" | null;
};

/** One member's half of one decided game. */
export type PlayedSide = { memberId: string; outcome: StreakOutcome };

/**
 * Whose run this game moves, and which way — the whole definition, as a pure
 * function so it can be checked against `fetchPlayedTallies` without a
 * database.
 *
 * An unbound seat contributes nothing: there is no row for a run to live on,
 * and the count beside it does not include the game either. A seat whose id
 * matches the other seat's is the same person twice, and is answered once from
 * black.
 */
export function playedSides(game: DecidedGame): PlayedSide[] {
  const sides: PlayedSide[] = [];
  if (game.blackMemberId !== null) {
    sides.push({ memberId: game.blackMemberId, outcome: outcomeFor(game.winner, "black") });
  }
  if (game.whiteMemberId !== null && game.whiteMemberId !== game.blackMemberId) {
    sides.push({ memberId: game.whiteMemberId, outcome: outcomeFor(game.winner, "white") });
  }
  return sides;
}

/**
 * Carries each bound seat's run forward by one result.
 *
 * Call it once, where a game has just been decided, having established that it
 * IS decided: this takes the seats and the winner and asks no question about
 * the status, because the four places a game ends have each already answered
 * it. A game filed as `abandoned` must not reach here.
 */
export async function recordPlayed(game: DecidedGame): Promise<void> {
  const sides = playedSides(game);
  if (sides.length === 0) return;

  const rows = await prisma.member.findMany({
    where: { id: { in: sides.map((side) => side.memberId) } },
    select: { id: true, playedStreakKind: true, playedStreakCount: true },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));

  const writes = sides.flatMap((side) => {
    const row = byId.get(side.memberId);
    // A seat bound to an id no member row answers to: there is nothing to
    // carry forward and nothing that would show it. Silence rather than an
    // upsert inventing a member.
    if (row === undefined) return [];
    return [
      prisma.member.update({
        where: { id: side.memberId },
        data: streakWrite(
          row as unknown as Record<string, unknown>,
          side.outcome,
          MEMBER_STREAK_SCOPES,
        ) as never,
      }),
    ];
  });
  if (writes.length === 0) return;
  await prisma.$transaction(writes);
}
