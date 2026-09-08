import "server-only";

import { playerKey } from "@/lib/rating/playerKey";
import { prisma } from "@/lib/prisma";

/** How a player has behaved with the clock: time given, time received, and how those games went. */
export type TimeGiftRecord = {
  gaveIn: number;
  receivedIn: number;
  wonAfterReceiving: number;
  lostAfterReceiving: number;
};

export async function fetchTimeGiftRecord(name: string): Promise<TimeGiftRecord> {
  const key = playerKey(name);
  const empty: TimeGiftRecord = { gaveIn: 0, receivedIn: 0, wonAfterReceiving: 0, lostAfterReceiving: 0 };
  if (key === "") return empty;
  const games = await prisma.game.findMany({
    where: {
      OR: [
        { blackName: { equals: key, mode: "insensitive" } },
        { whiteName: { equals: key, mode: "insensitive" } },
      ],
      gifts: { some: {} },
    },
    select: { id: true, blackName: true, whiteName: true, status: true, winner: true, gifts: { select: { giver: true } } },
  });
  const record = { ...empty };
  for (const game of games) {
    const mine = playerKey(game.blackName) === key ? "black" : "white";
    const gave = game.gifts.some((gift) => gift.giver === mine);
    const received = game.gifts.some((gift) => gift.giver !== mine);
    if (gave) record.gaveIn += 1;
    if (received) {
      record.receivedIn += 1;
      if (game.status === "finished" && game.winner === mine) record.wonAfterReceiving += 1;
      else if (game.status === "finished" && game.winner !== null) record.lostAfterReceiving += 1;
    }
  }
  return record;
}
