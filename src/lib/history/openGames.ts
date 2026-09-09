import "server-only";

import { STONES } from "@/lib/gomoku/gomoku.constants";
import type { Stone } from "@/lib/gomoku/gomoku.types";
import { prisma } from "@/lib/prisma";
import { nextDeadline } from "./deadline";
import { SUMMARY_SELECT, toSummary } from "./gameHistory";
import type { GameSummary } from "./gameHistory.types";
import { GAME_ROW, replay } from "./liveGame";

/** How many open seats the board shows. Nobody reads past the first page of a noticeboard. */
export const OPEN_GAMES_SHOWN = 30;

/**
 * Every seat anyone may take, newest first — the noticeboard the turn-based
 * sites kept, where a game could be started without knowing who would answer
 * it.
 *
 * All of them, not a page of them, because two things read this list and they
 * want different amounts of it: the board shows the newest thirty, and the
 * sentence above it asks whether anybody is waiting for one particular game
 * at one particular pace on one particular board. That second question used
 * to be answered off the same thirty, which meant that on a day when one game
 * was busy every other game's waiting seat was off the end and the sentence
 * offered to post a second seat beside one already standing.
 *
 * Both the cap and the narrowing happen above this now, in that order, and
 * that order is the whole lesson: a list cut to a length and then filtered
 * has lost rows the filter would have kept.
 *
 * An open seat is a small set by its nature — it stops being open the moment
 * somebody sits down, and a computer answers one left standing for a day — so
 * fetching all of them is a cheaper thing than it sounds.
 */
export async function fetchOpenSeats(except: Iterable<string> = []): Promise<GameSummary[]> {
  const rows = await prisma.game.findMany({
    where: { status: "active", openSeat: { not: null }, id: { notIn: [...except] } },
    orderBy: [{ openedAt: "desc" }, { id: "asc" }],
    select: SUMMARY_SELECT,
  });
  return rows.map(toSummary);
}

/**
 * One seat for each game, pace and board — the newest of each, in that order.
 *
 * What the sentence needs, and no more: it matches on exactly those three
 * things, so a second seat asking for the same three is a seat it can never
 * offer. Newest of each, and newest first, because the board the sentence
 * suggests follows whichever seat somebody is already waiting on.
 *
 * Pure, and it takes the list already narrowed to seats this reader could
 * actually sit in. That is not a detail: choosing one of each first and
 * dropping the unusable ones afterwards loses a whole combination whenever
 * the newest of it is the reader's own — a stranger's identical seat standing
 * right behind it, invisible.
 */
export function oneOfEachKind(seats: readonly GameSummary[]): GameSummary[] {
  const seen = new Set<string>();
  return seats.filter((seat) => {
    const kind = `${seat.variant}/${seat.moveTimeMs}/${seat.size}`;
    if (seen.has(kind)) return false;
    seen.add(kind);
    return true;
  });
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
      /*
       * Sitting down here is a seat being taken without the link ever being
       * followed, so it has to be stamped in the same breath — otherwise the
       * seat's link goes on being shown to everybody after somebody is
       * sitting in it, which is the whole thing this column exists to stop.
       * In the same conditional update, so the race is still one write.
       */
      [seat === STONES.black ? "blackClaimedAt" : "whiteClaimedAt"]: now,
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
