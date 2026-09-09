import "server-only";

import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { prisma } from "@/lib/prisma";
import { nextDeadline } from "./deadline";
import { SUMMARY_SELECT, toSummary } from "./gameHistory";
import type { GameSummary } from "./gameHistory.types";
import { GAME_ROW, replay } from "./liveGame";

/** How many open seats the board shows. Nobody reads past the first page of a noticeboard. */
const OPEN_GAMES_SHOWN = 30;

/**
 * Games with a seat anyone may take, newest first — the noticeboard the
 * turn-based sites kept, where a game could be started without knowing who
 * would answer it. A browser's own games are left off: you cannot sit
 * across from yourself.
 */
export async function fetchOpenGames(except: Iterable<string> = []): Promise<GameSummary[]> {
  const rows = await prisma.game.findMany({
    where: { status: "active", openSeat: { not: null }, id: { notIn: [...except] } },
    orderBy: [{ openedAt: "desc" }, { id: "asc" }],
    take: OPEN_GAMES_SHOWN,
    select: SUMMARY_SELECT,
  });
  return rows.map(toSummary);
}

export type SitOutcome =
  | { ok: true; token: string; seat: Stone; variant: string }
  | { ok: false; reason: "not-found" | "taken" };

/**
 * Takes the open seat. First come, first seated: the update is conditional
 * on the seat still being open, so two people answering at once cannot both
 * get it — the second finds it taken. The seat's token comes back exactly
 * once, to become that browser's claim.
 *
 * Sitting down is also where the clock starts. A posted seat runs no clock
 * at all (`deadlineFor`), but the deadline stamped when the game was created
 * is still on the row, so answering a post left up for three days would hand
 * the newcomer a deadline that expired on the first day and let the poster
 * claim a win on time against somebody who had not had a second to move.
 * Both stamps are rewritten as the seat is claimed, inside the one
 * conditional update, so the race is still decided by a single write.
 */
export async function sitAtOpenSeat(id: string): Promise<SitOutcome> {
  const row = await prisma.game.findUnique({ where: { id }, select: GAME_ROW });
  if (row === null) return { ok: false, reason: "not-found" };
  if (row.status !== "active" || row.openSeat === null) return { ok: false, reason: "taken" };

  const seat = row.openSeat === STONES.black ? STONES.black : STONES.white;
  const now = new Date();
  const taken = await prisma.game.updateMany({
    where: { id, openSeat: row.openSeat },
    data: {
      openSeat: null,
      lastMoveAt: now,
      deadlineAt: nextDeadline(row, replay(row).toPlay, now),
    },
  });
  if (taken.count === 0) return { ok: false, reason: "taken" };

  return {
    ok: true,
    seat,
    variant: row.variant,
    token: seat === STONES.black ? row.blackToken : row.whiteToken,
  };
}
