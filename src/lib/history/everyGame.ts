import "server-only";

import type { Prisma } from "@prisma/client";

import type { GameKey } from "@/lib/catalogue/gameKeys";
import { isPartyKind, isPuzzleKind, isRuleVariant } from "@/lib/catalogue/gameKeys";
import { STONES } from "@/lib/gomoku/gomoku.constants";
import { joinQuery, matchPath, mySolvePath, playPath } from "@/lib/gomoku/slugs";
import { KEPT_SEAT_KINDS, KEPT_STATUS, isKeptStatus } from "@/lib/party/kept/kept.constants";
import { keptGamePath } from "@/lib/party/kept/keptPaths";
import { ONLINE_SEAT_KINDS, ONLINE_STATUS } from "@/lib/party/online/online.constants";
import { tablePath } from "@/lib/party/online/onlinePaths";
import { prisma } from "@/lib/prisma";
import { keptRunAsked, puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { shownName } from "@/lib/rating/shownName";

import type { HistoryEntry, HistoryPage, HistoryPlayer, HistoryState } from "./everyGame.types";
import { NOT_A_REFUSED_OFFER } from "./offers";

/**
 * EVERY GAME A MEMBER HAS PLAYED, OF EVERY KIND, IN ONE LIST — the History tab
 * of My games. John, 2026-09-30: "Should contain all games ever. Card. Maps.
 * Reversi. All games. Even those that aren't completed or just passed around",
 * and "we should be allowed to view, resume".
 *
 * Five places a game is kept, read side by side and merged newest first by
 * the last thing that happened in each:
 *
 * - `Game`: every game between two seats the member sat in, going or over,
 *   the hot-seat board included — not an offer refused, not one they hid;
 * - `PartyTable` at a table on several devices, the member seated;
 * - `PartyTable` filed from one device (`keptTables.ts`): the card games, the
 *   party games, the races round one screen;
 * - `PuzzleSolve`, a puzzle finished, and `PuzzleRun`, one part way.
 *
 * A PAGE IS READ THE WAY TWO SORTED RUNS ARE MERGED (`myFinished.ts` says
 * why that is exact): each source one page deep, the merge cut to a page, and
 * the next page starts strictly before the last time shown. Two rows of one
 * member at the very same millisecond at a page's edge could be split by it —
 * a thing a person cannot do in two games at once.
 *
 * `memberId` is whose history, not who is reading, so the same read serves a
 * friend's history when that is shown.
 */

/** How many games a page of the history shows. */
export const HISTORY_PAGE = 30;

type Reading = { memberId: string; before: Date | null; limit: number };

/** A member's games between two seats: not one they hid, not an offer refused, not one nobody has answered yet. */
function gamesWhere(memberId: string): Prisma.GameWhereInput {
  return {
    AND: [
      { OR: [{ blackMemberId: memberId, hiddenByBlack: false }, { whiteMemberId: memberId, hiddenByWhite: false }] },
      NOT_A_REFUSED_OFFER,
      // An offer nobody has answered is not a game yet: it waits on Going, and joins the history once it is one.
      { OR: [{ offeredAt: null }, { status: { not: "active" } }, { moveCount: { gt: 0 } }] },
    ],
  };
}

/** The tables a member sat at, on several devices or filed from one. */
function tablesWhere(memberId: string): Prisma.PartyTableWhereInput {
  return { seats: { some: { memberId, kind: ONLINE_SEAT_KINDS.member } } };
}

/** Two seats' games: the member's side of each. */
async function gamesOf({ memberId, before, limit }: Reading): Promise<HistoryEntry[]> {
  const rows = await prisma.game.findMany({
    where: { AND: [gamesWhere(memberId), before === null ? {} : { updatedAt: { lt: before } }] },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    take: limit,
    select: {
      id: true,
      variant: true,
      status: true,
      result: true,
      winner: true,
      settledToPlay: true,
      blackMemberId: true,
      whiteMemberId: true,
      blackName: true,
      whiteName: true,
      updatedAt: true,
    },
  });
  return rows.flatMap((row) => {
    if (!isRuleVariant(row.variant)) return [];
    const hotSeat = row.blackMemberId === memberId && row.whiteMemberId === memberId;
    const mine = row.blackMemberId === memberId ? STONES.black : STONES.white;
    const theirs = mine === STONES.black ? { name: row.whiteName, memberId: row.whiteMemberId } : { name: row.blackName, memberId: row.blackMemberId };
    const state: HistoryState =
      row.status === "active"
        ? hotSeat
          ? "going"
          : row.settledToPlay === mine
            ? "yourMove"
            : "theirMove"
        : row.result === "draw"
          ? "drawn"
          : row.result === "abandoned" || row.winner === null
            ? "left"
            : hotSeat
              ? "ended"
              : row.winner === mine
                ? "won"
                : "lost";
    const others: HistoryPlayer[] = hotSeat ? [] : [{ name: shownName(theirs.name), memberId: theirs.memberId, computer: false }];
    return [{ key: `game:${row.id}`, source: "game" as const, game: row.variant, state, at: row.updatedAt.toISOString(), href: matchPath(row.variant, row.id), others }];
  });
}

/** How a table stood for the member at `seat`. */
export function tableState(status: string, seat: number, toPlay: number | null, winners: readonly number[]): HistoryState {
  if (status === ONLINE_STATUS.playing) return toPlay === seat ? "yourMove" : "theirMove";
  if (status === KEPT_STATUS.playing) return "going";
  if (status === KEPT_STATUS.left) return "left";
  if (status === ONLINE_STATUS.ended) return "ended";
  if (winners.length === 0) return "drawn";
  if (!winners.includes(seat)) return "lost";
  return winners.length > 1 ? "shared" : "won";
}

/** Tables, on several devices or filed from one: the member's seat at each. */
async function tablesOf({ memberId, before, limit }: Reading): Promise<HistoryEntry[]> {
  const rows = await prisma.partyTable.findMany({
    where: { ...tablesWhere(memberId), ...(before === null ? {} : { updatedAt: { lt: before } }) },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    take: limit,
    include: { seats: { orderBy: { seat: "asc" } } },
  });
  return rows.flatMap((row) => {
    const mine = row.seats.find((seat) => seat.memberId === memberId && seat.kind === ONLINE_SEAT_KINDS.member);
    if (mine === undefined || !(isPartyKind(row.game) || isRuleVariant(row.game))) return [];
    const device = isKeptStatus(row.status);
    const others: HistoryPlayer[] = row.seats
      .filter((seat) => seat.seat !== mine.seat && seat.kind !== ONLINE_SEAT_KINDS.open)
      .map((seat) => ({
        name: seat.kind === KEPT_SEAT_KINDS.guest ? seat.name : shownName(seat.name),
        memberId: seat.kind === KEPT_SEAT_KINDS.guest ? null : seat.memberId,
        computer: seat.kind === ONLINE_SEAT_KINDS.computer,
      }));
    return [
      {
        key: `table:${row.id}`,
        source: device ? ("device" as const) : ("table" as const),
        game: row.game as GameKey,
        state: tableState(row.status, mine.seat, row.toPlay, row.winners),
        at: row.updatedAt.toISOString(),
        href: device ? keptGamePath(row.game, row.id) : tablePath(row.game, row.id),
        others,
      },
    ];
  });
}

/** Puzzles finished, each opening its own page. */
async function solvesOf({ memberId, before, limit }: Reading, reader: string | null): Promise<HistoryEntry[]> {
  const rows = await prisma.puzzleSolve.findMany({
    where: { memberId, ...(before === null ? {} : { finishedAt: { lt: before } }) },
    orderBy: [{ finishedAt: "desc" }, { id: "asc" }],
    take: limit,
    select: { id: true, kind: true, solved: true, finishedAt: true },
  });
  return rows.flatMap((row) =>
    isPuzzleKind(row.kind)
      ? [
          {
            key: `solve:${row.id}`,
            source: "solve" as const,
            game: row.kind,
            state: row.solved ? ("solved" as const) : ("unsolved" as const),
            at: row.finishedAt.toISOString(),
            // A solve's own page is the member's; somebody else's is the puzzle itself.
            href: reader === memberId ? mySolvePath(row.kind, row.id) : playPath(row.kind),
            others: [],
          },
        ]
      : [],
  );
}

/** Puzzles part way, each carrying on where it was left — for the member; for anybody else, the puzzle. */
async function runsOfMember({ memberId, before, limit }: Reading, reader: string | null): Promise<HistoryEntry[]> {
  const rows = await prisma.puzzleRun.findMany({
    where: { memberId, ...(before === null ? {} : { updatedAt: { lt: before } }) },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    take: limit,
    select: { id: true, kind: true, size: true, level: true, seed: true, checksAllowed: true, hintsAllowed: true, strict: true, updatedAt: true, language: true, gameLength: true, doubleSet: true, diagonals: true, clock: true },
  });
  return rows.flatMap((run) => {
    if (!isPuzzleKind(run.kind)) return [];
    const kind: PuzzleKind = run.kind;
    const href = reader === memberId ? joinQuery(playPath(kind), puzzleQuery(keptRunAsked(kind, run))) : playPath(kind);
    return [{ key: `run:${run.id}`, source: "run" as const, game: kind, state: "going" as const, at: run.updatedAt.toISOString(), href, others: [] }];
  });
}

/**
 * A page of a member's history, newest first, starting strictly before
 * `before` (an ISO time from the last page's `next`), or from the newest.
 * `reader` is who is looking, which decides only where a puzzle opens.
 */
export async function historyOf(memberId: string, before: string | null, reader: string | null = memberId, limit = HISTORY_PAGE): Promise<HistoryPage> {
  const from = before === null ? null : new Date(before);
  const reading: Reading = { memberId, before: from !== null && !Number.isNaN(from.getTime()) ? from : null, limit: limit + 1 };
  const runs = await Promise.all([gamesOf(reading), tablesOf(reading), solvesOf(reading, reader), runsOfMember(reading, reader)]);
  const merged = runs.flat().sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : a.key < b.key ? -1 : 1));
  const entries = merged.slice(0, limit);
  return { entries, next: merged.length > limit ? entries.at(-1)!.at : null };
}

/** How many games are in a member's history: every page of it, counted where it is kept. */
export async function historyTotal(memberId: string): Promise<number> {
  const counts = await Promise.all([
    prisma.game.count({ where: { AND: [gamesWhere(memberId), NOT_A_REFUSED_OFFER] } }),
    prisma.partyTable.count({ where: tablesWhere(memberId) }),
    prisma.puzzleSolve.count({ where: { memberId } }),
    prisma.puzzleRun.count({ where: { memberId } }),
  ]);
  return counts.reduce((sum, count) => sum + count, 0);
}
