import "server-only";

import { prisma } from "@/lib/prisma";

import { ONLINE_SEAT_KINDS, ONLINE_STATUS } from "../online.constants";
import type { OnlineGameKey, OnlineStatus } from "../online.types";
import { isOnlineGame } from "../onlineGames";
import { shownName } from "@/lib/rating/shownName";
import { nameTagsOf, type NameTag } from "@/lib/xp/nameTagsOf";

import { resultFor } from "./tableNotices";

/** How many finished tables Completed lists: the newest, like the finished games' first page. */
export const MY_TABLES_FINISHED_SHOWN = 20;

/** One table on My games: which game, who is at it, whose turn, and how it went for the reader. */
export type MyTable = {
  id: string;
  game: OnlineGameKey;
  status: OnlineStatus;
  /** The reader's seat. */
  mySeat: number;
  /** Everybody at the table in seat order, the reader included. */
  seats: { seat: number; name: string; memberId: string | null; kind: string }[];
  toPlay: number | null;
  /** Whether it waits on the reader. */
  yourMove: boolean;
  /** On a table that is over: how it went for the reader. */
  result: "won" | "shared" | "lost" | "ended" | null;
  movedAt: string;
};

/**
 * THE READER'S TABLES ON SEVERAL DEVICES, for My games: the ones going (every
 * one — the cap is twenty) with those waiting on the reader first, and the
 * newest finished ones. Two indexed reads through `PartySeat_member_idx`, one
 * for each tab, and one for the tags beside the names, whichever tab is open — the tabs' counts need both. Completed
 * lists the newest twenty and counts what it lists, so its number is a set it shows.
 */
export async function myTables(memberId: string): Promise<{ going: MyTable[]; finished: MyTable[]; tags: Map<string, NameTag> }> {
  const mine = { seats: { some: { memberId, kind: ONLINE_SEAT_KINDS.member } } };
  const include = { seats: { orderBy: { seat: "asc" as const } } };
  const [going, finished] = await Promise.all([
    prisma.partyTable.findMany({ where: { ...mine, status: ONLINE_STATUS.playing }, include, orderBy: { movedAt: "desc" } }),
    prisma.partyTable.findMany({
      where: { ...mine, status: { in: [ONLINE_STATUS.finished, ONLINE_STATUS.ended] } },
      include,
      orderBy: { finishedAt: "desc" },
      take: MY_TABLES_FINISHED_SHOWN,
    }),
  ]);
  const shown = (rows: typeof going) =>
    rows.flatMap((row) => {
      const mySeat = row.seats.find((one) => one.memberId === memberId)?.seat;
      if (mySeat === undefined || !isOnlineGame(row.game)) return [];
      const status = row.status as OnlineStatus;
      const table: MyTable = {
        id: row.id,
        game: row.game,
        status,
        mySeat,
        seats: row.seats.map((one) => ({ seat: one.seat, name: shownName(one.name), memberId: one.memberId, kind: one.kind })),
        toPlay: row.toPlay,
        yourMove: status === ONLINE_STATUS.playing && row.toPlay === mySeat,
        result: status === ONLINE_STATUS.playing ? null : resultFor(mySeat, row.winners, status === ONLINE_STATUS.ended),
        movedAt: row.movedAt.toISOString(),
      };
      return [table];
    });
  const goingShown = shown(going);
  const finishedShown = shown(finished);
  // The flag and badge beside every name at every table listed, one read for all of them (`nameTagsOf`).
  const tags = await nameTagsOf([...goingShown, ...finishedShown].flatMap((table) => table.seats.map((seat) => seat.memberId)));
  return {
    // Waiting on the reader first, then the rest, each newest first — the order the queue of games keeps.
    going: [...goingShown.filter((one) => one.yourMove), ...goingShown.filter((one) => !one.yourMove)],
    finished: finishedShown,
    tags,
  };
}
