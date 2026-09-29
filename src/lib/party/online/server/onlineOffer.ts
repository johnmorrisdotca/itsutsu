import "server-only";

import { prisma } from "@/lib/prisma";
import { isChild } from "@/lib/social/childRules";

import type { OnlineGameKey, OnlineOffer } from "../online.types";
import { isOnlineGame, onlineRulesOf } from "../onlineGames";

/**
 * WHAT A GAME'S SET-UP OFFERS FOR SEVERAL DEVICES, for this reader: their
 * buddies to seat by name (their own list, most recently seen first), whether
 * they may hand out a link — not a member under 13 — and the game's computer
 * players, each by the name it plays under. Undefined where the game cannot be played on several
 * devices or the reader has no account: the set-up then offers only this
 * device, exactly as before. One read of the reader's band and one of their
 * buddies, on the set-up page only.
 */
export async function onlineOfferFor(game: string, memberId: string | null): Promise<OnlineOffer | undefined> {
  if (memberId === null || !isOnlineGame(game)) return undefined;
  const [me, buddies] = await Promise.all([
    prisma.member.findUnique({ where: { id: memberId }, select: { ageBand: true } }),
    prisma.buddy.findMany({
      where: { ownerId: memberId },
      select: { buddy: { select: { id: true, name: true } } },
      orderBy: { buddy: { lastSeenAt: "desc" } },
    }),
  ]);
  return {
    game,
    buddies: buddies.map(({ buddy }) => ({ id: buddy.id, name: buddy.name || "A buddy" })),
    links: !isChild(me?.ageBand),
    computers: computersOf(game),
  };
}

/** A game's computer players as the set-up offers them: each level, and the name it plays under. */
function computersOf(game: OnlineGameKey): { level: string; name: string }[] {
  const computers = onlineRulesOf(game).computers;
  return computers === undefined ? [] : computers.levels.map((level) => ({ level, name: computers.seat(level).name }));
}
