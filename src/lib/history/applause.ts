import "server-only";

import { prisma } from "@/lib/prisma";
import type { ApplauseEmoji } from "./applause.constants";

/** How a game's applause reads: how many of each mark, and which one is yours. */
export type ApplauseTally = {
  counts: Record<string, number>;
  total: number;
  /** The mark this reader left, if they left one. */
  mine: string | null;
};

export async function fetchApplause(gameId: string, member: string | null): Promise<ApplauseTally> {
  const rows = await prisma.applause.findMany({
    where: { gameId },
    select: { emoji: true, member: true },
  });
  const counts: Record<string, number> = {};
  let mine: string | null = null;
  for (const row of rows) {
    counts[row.emoji] = (counts[row.emoji] ?? 0) + 1;
    if (member !== null && row.member === member) mine = row.emoji;
  }
  return { counts, total: rows.length, mine };
}

/**
 * Leaves a mark, changes it, or takes it back.
 *
 * One per member per game, so the same mark pressed twice is a change of
 * mind and removes it. A game that is not finished takes none: applause is
 * for a game somebody has played to its end.
 */
export async function setApplause(
  gameId: string,
  member: string,
  emoji: ApplauseEmoji,
): Promise<{ ok: true; tally: ApplauseTally } | { ok: false; reason: "not-found" | "unfinished" }> {
  const game = await prisma.game.findUnique({ where: { id: gameId }, select: { status: true } });
  if (game === null) return { ok: false, reason: "not-found" };
  if (game.status !== "finished") return { ok: false, reason: "unfinished" };

  const existing = await prisma.applause.findUnique({
    where: { gameId_member: { gameId, member } },
    select: { emoji: true },
  });
  if (existing !== null && existing.emoji === emoji) {
    await prisma.applause.delete({ where: { gameId_member: { gameId, member } } });
  } else {
    await prisma.applause.upsert({
      where: { gameId_member: { gameId, member } },
      create: { gameId, member, emoji },
      update: { emoji },
    });
  }
  return { ok: true, tally: await fetchApplause(gameId, member) };
}
