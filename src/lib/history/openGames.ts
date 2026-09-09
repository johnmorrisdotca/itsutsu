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
export async function fetchSeatChoices(
  except: Iterable<string> = [],
  /**
   * Whether this seat is one the reader could actually sit at — not their
   * own, and not from somebody they have shut out.
   *
   * Passed in rather than queried here because the answer is about the
   * reader, not about the seat, and because it has to be applied BEFORE one
   * seat per combination is picked. Picking first and filtering after is the
   * bug this whole function exists to prevent, arrived at one layer deeper:
   * my own seat, posted a minute after an identical stranger's, is the newer
   * of the two, so it is the one kept — and then removed for being mine,
   * leaving the sentence to say nobody is asking for this. Somebody was.
   */
  answerable: (game: GameSummary) => boolean = () => true,
): Promise<GameSummary[]> {
  const rows = await prisma.game.findMany({
    where: { status: "active", openSeat: { not: null }, id: { notIn: [...except] } },
    orderBy: { openedAt: "desc" },
    select: SUMMARY_SELECT,
  });

  /*
   * Narrowed here rather than in the query, and the newest of each
   * combination chosen here rather than by `distinct`.
   *
   * A query and the loop it replaces are not interchangeable, which is the
   * lesson this function learned twice. `NOT (id IN (…))` over a column that
   * can be null answers null in SQL, which reads as "keep the row", so a seat
   * posted by somebody with no account slipped past a filter the JavaScript
   * had always handled. And `distinct` needs its columns first in the
   * ordering, which quietly sorts the answer by game and board instead of by
   * what is newest. Order, null-handling and the position of a filter are all
   * part of what a loop does, not decoration on its predicate.
   *
   * Unbounded on purpose. An open seat is a small set by its nature: it stops
   * being open the moment somebody sits down, and a computer player answers
   * one left standing for a day.
   */
  const newestOfEach = new Map<string, GameSummary>();
  for (const row of rows.map(toSummary)) {
    if (!answerable(row)) continue;
    const combination = `${row.variant}|${row.moveTimeMs}|${row.size}`;
    if (!newestOfEach.has(combination)) newestOfEach.set(combination, row);
  }
  return [...newestOfEach.values()];
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
