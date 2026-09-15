import "server-only";

import { SETTLED_SELECT, settledPosition } from "@/lib/history/settledTurn";
import { prisma } from "@/lib/prisma";

import { boardDay, dayBounds, daysToJudge, fullBoardAwards } from "./fullBoard";
import type { BoardGame } from "./fullBoard.types";
import { XP_EVENTS, XP_FULL_BOARD_GAMES, XP_FULL_BOARD_LOOKBACK_DAYS, XP_FULL_BOARD_RUN_MAX } from "./xp.constants";
import type { XpAward } from "./xp.types";
import { xpDayKey } from "./xpDay";

/**
 * THE FULL-BOARD AWARDS A MEMBER'S FIRST ACTION OF A NEW DAY HAS EARNED.
 *
 * The thin half: it reads the rows and hands them to `fullBoard.ts`, which
 * decides everything. Called from the two writes a member's new day already
 * makes — a person's first visit (`dailyVisit.ts`) and anybody's first finished
 * game (`xpGameServer.ts`, which is how a program is judged at all) — so there
 * is no timer, no poll and no job: nothing runs for a member who does nothing.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT IT COSTS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * **Nothing** when the last action was today: the days to judge are worked out
 * from two dates in hand, and there are none.
 *
 * **One indexed count** otherwise — the member's games still being played or
 * ended since the first day to judge, on `Game_blackMemberId_idx` and
 * `Game_whiteMemberId_idx` — and that is where it stops for nearly everybody,
 * since a board of twenty is what the rest needs.
 *
 * **One read of those games with their move times** for a member who could have
 * held a full board, and **one read of their Clean Sweep days** only when a day
 * judged was kept. At most once a day per member.
 *
 * It never throws at the write it rides: a failed read is a day not judged this
 * time, and the next action judges it again.
 */
export async function fullBoardAwardsFor({
  memberId,
  timeZone,
  lastActionAt,
  now,
}: {
  memberId: string;
  timeZone: string | null;
  /** When the member last did something, as the write in hand knows it. Null for never. */
  lastActionAt: Date | null;
  now: Date;
}): Promise<XpAward[]> {
  const days = daysToJudge(
    lastActionAt === null ? null : xpDayKey(lastActionAt, timeZone),
    xpDayKey(now, timeZone),
    XP_FULL_BOARD_LOOKBACK_DAYS,
  );
  if (days.length === 0) return [];

  const since = dayBounds(days[0], timeZone).start;
  const where = {
    AND: [
      { OR: [{ blackMemberId: memberId }, { whiteMemberId: memberId }] },
      { OR: [{ status: "active" as const }, { lastMoveAt: { gte: since } }] },
    ],
  };

  try {
    /* Fewer games than a full board in the whole window: no day could have been one. */
    if ((await prisma.game.count({ where })) < XP_FULL_BOARD_GAMES) return [];

    const rows = await prisma.game.findMany({
      where,
      select: {
        id: true,
        status: true,
        blackMemberId: true,
        whiteMemberId: true,
        blackToken: true,
        whiteToken: true,
        playedAt: true,
        blackClaimedAt: true,
        whiteClaimedAt: true,
        lastMoveAt: true,
        /* The stored turn, read back through `settledPosition` and never named here. */
        ...SETTLED_SELECT,
        moves: { select: { stone: true, createdAt: true }, orderBy: { number: "asc" } },
      },
    });

    const games: BoardGame[] = rows.flatMap((row) => {
      const finished = row.status === "finished";
      /* A finished row with no end time cannot be placed on a day, so it is left out rather than guessed at. */
      if (finished && row.lastMoveAt === null) return [];
      const settled = finished ? null : settledPosition(row);
      return [
        {
          id: row.id,
          blackMemberId: row.blackMemberId,
          whiteMemberId: row.whiteMemberId,
          /* Compared here and never carried: the tokens are the seats' secrets. */
          hotSeat: row.blackToken === row.whiteToken,
          playedAt: row.playedAt,
          blackClaimedAt: row.blackClaimedAt,
          whiteClaimedAt: row.whiteClaimedAt,
          finishedAt: finished ? row.lastMoveAt : null,
          moves: row.moves.map((move) => ({ stone: move.stone, at: move.createdAt })),
          toPlayNow: settled !== null && settled.running && (settled.toPlay === "black" || settled.toPlay === "white") ? settled.toPlay : null,
        },
      ];
    });

    const judged = days.map((day) => boardDay(games, memberId, day, timeZone));
    if (!judged.some((day) => day.full)) return [];

    const sweepDays = judged.some((day) => day.full && day.keptUp && day.moved)
      ? await prisma.xpEvent.findMany({
          where: { memberId, type: XP_EVENTS.cleanSweep },
          orderBy: { subject: "desc" },
          take: XP_FULL_BOARD_RUN_MAX,
          select: { subject: true },
        })
      : [];

    return fullBoardAwards(judged, sweepDays.map((row) => row.subject));
  } catch (problem) {
    console.error("Could not judge a full board", memberId, problem);
    return [];
  }
}
