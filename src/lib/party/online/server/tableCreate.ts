import "server-only";

import { randomBytes } from "node:crypto";

import { makeGameId } from "@/lib/history/gameId";
import { prisma } from "@/lib/prisma";
import { buddyMemberIds } from "@/lib/social/buddies";
import { isChild } from "@/lib/social/childRules";
import { listable } from "@/lib/social/listable";

import { COMPUTER_SEAT_NAME, ONLINE_SEAT_KINDS } from "../online.constants";
import type { OnlineGameKey, OnlineSeatAsk } from "../online.types";
import { onlineRulesOf } from "../onlineGames";
import { seatAsksRefusal, standingOf } from "../onlineSeats";
import { noticeInvited } from "./tableNotices";
import { SEATING_REFUSALS, seatingRefusal, tablesCapRefusal } from "./tableSeating";

/** A new open seat's link: the whole credential for taking it, so long and random. */
export function seatToken(): string {
  return randomBytes(18).toString("base64url");
}

/** An id no table has yet: the same eight characters a game's has, checked free. */
async function freeTableId(tries = 5): Promise<string> {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    const id = makeGameId();
    const taken = await prisma.partyTable.findUnique({ where: { id }, select: { id: true } });
    if (taken === null) return id;
  }
  throw new Error("Could not find a free table id.");
}

type Maker = { id: string; name: string };

/**
 * A TABLE MADE FROM THE SET-UP: the game started by its own rules, the maker
 * in seat 1, each other seat a buddy (seated at once and told in their inbox),
 * an open seat with a link, or a computer. The reason it cannot be made, or
 * the new table's id.
 *
 * Every refusal is decided before anything is written: the seats' shape
 * (`seatAsksRefusal`), each buddy being on the maker's own buddy list and a
 * person here, the rules of who may sit with whom (`seatingRefusal`, every
 * pair), and the twenty-tables cap for everybody seated.
 */
export async function createTable({
  game,
  size,
  asks,
  maker,
}: {
  game: OnlineGameKey;
  size: number;
  asks: readonly OnlineSeatAsk[];
  maker: Maker;
}): Promise<{ refused: string; status: 403 | 404 | 422 } | { id: string }> {
  const rules = onlineRulesOf(game);
  const band = await prisma.member.findUnique({ where: { id: maker.id }, select: { ageBand: true } });
  const shape = seatAsksRefusal(asks, { counts: rules.counts, computer: rules.computer !== undefined, links: !isChild(band?.ageBand), makerId: maker.id });
  if (shape !== null) return { refused: shape, status: 422 };
  const boardSize = rules.sizes.length === 0 ? 0 : size;
  const started = rules.start(boardSize, asks.length);
  if (started === null) return { refused: "That game is not offered at that size.", status: 422 };

  const mine = await tablesCapRefusal(maker.id, "you");
  if (mine !== null) return { refused: mine, status: 422 };

  // Each buddy by name: on the maker's own list, a person here, under the cap, and free to sit with everybody else asked.
  const buddyIds = asks.flatMap((ask) => (ask.kind === "buddy" ? [ask.memberId] : []));
  const mayAsk = buddyIds.length === 0 ? new Set<string>() : await buddyMemberIds(maker.id);
  const buddies = await prisma.member.findMany({ where: { id: { in: buddyIds } } });
  const seated = [maker.id];
  for (const id of buddyIds) {
    const buddy = buddies.find((one) => one.id === id);
    if (buddy === undefined || !listable(buddy) || !mayAsk.has(id)) return { refused: "You can ask the people on your buddy list.", status: 404 };
    const company = await seatingRefusal(id, seated);
    const refusal = company === null ? await tablesCapRefusal(id, "them") : SEATING_REFUSALS[company];
    if (refusal !== null) return { refused: refusal, status: 403 };
    seated.push(id);
  }

  const id = await freeTableId();
  const now = new Date();
  const standing = standingOf(rules, started);
  await prisma.partyTable.create({
    data: {
      id,
      game,
      size: boardSize,
      state: rules.encode(started),
      ...standing,
      movedAt: now,
      hostMemberId: maker.id,
      seats: {
        create: asks.map((ask, seat) => {
          if (ask.kind === "me") return { seat, kind: ONLINE_SEAT_KINDS.member, memberId: maker.id, name: maker.name, joinedAt: now };
          if (ask.kind === "buddy") {
            const buddy = buddies.find((one) => one.id === ask.memberId)!;
            return { seat, kind: ONLINE_SEAT_KINDS.member, memberId: buddy.id, name: buddy.name, joinedAt: now };
          }
          if (ask.kind === "computer") return { seat, kind: ONLINE_SEAT_KINDS.computer, name: COMPUTER_SEAT_NAME };
          return { seat, kind: ONLINE_SEAT_KINDS.open, token: seatToken() };
        }),
      },
    },
  });
  await noticeInvited({ id, game }, buddyIds, maker);
  return { id };
}
