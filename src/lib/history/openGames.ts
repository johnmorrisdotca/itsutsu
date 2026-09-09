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

/**
 * One open seat for every combination somebody could ask for.
 *
 * The board above shows the newest thirty, which is right for a noticeboard —
 * nobody reads past the first page of one. The sentence is asking a different
 * question: "is anybody already waiting for exactly this", of a game, a pace
 * and a board. Answering that off the newest thirty is the bug this exists to
 * fix: on a day when one game is busy, every waiting seat of every other game
 * is off the end of that list, and the sentence offers to post a second seat
 * beside one already standing. That is the precise failure the control was
 * built to prevent, and it fails silently — the person sees an ordinary
 * "Post the seat" and never learns there was somebody to play.
 *
 * Found by the browser suite failing on two different specs on two runs, both
 * passing alone: thirty-one of the thirty-four open seats on that database
 * were one game, so the other games' seats were never fetched.
 *
 * Bounded by the combinations that exist rather than by a count, which is the
 * whole point — `distinct` on exactly the three columns the sentence matches
 * on, newest of each. An open seat is a small set by its nature: it stops
 * being open the moment somebody sits down, and a computer answers one left
 * standing for a day.
 */
export async function fetchSeatChoices(except: Iterable<string> = []): Promise<GameSummary[]> {
  const rows = await prisma.game.findMany({
    where: { status: "active", openSeat: { not: null }, id: { notIn: [...except] } },
    // The distinct columns first, so the newest of each group is the one kept.
    orderBy: [{ variant: "asc" }, { moveTimeMs: "asc" }, { size: "asc" }, { openedAt: "desc" }],
    distinct: ["variant", "moveTimeMs", "size"],
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
