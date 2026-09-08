import "server-only";

import { foldEmail } from "@/lib/auth/members";
import { DEFAULT_SETTINGS, OPENING_RULES, RULE_VARIANTS, STONES, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { NO_HANDICAP } from "@/lib/gomoku/gomoku.constants";
import { createLiveGame } from "@/lib/history/liveGame";
import { prisma } from "@/lib/prisma";
import { isIgnoring } from "./ignores";

export type AutoMatchOutcome =
  | { kind: "matched"; gameId: string; variant: string }
  | { kind: "waiting"; requestId: string }
  | { kind: "refused"; reason: "too-many" | "unknown-game" };

/** How many requests one member may have waiting at once, as the elder sites allow. */
export const AUTO_MATCH_LIMIT = 5;

export type WaitingRequest = { id: string; variant: string; moveTimeMs: number | null; since: string };

export async function fetchMyRequests(member: string): Promise<WaitingRequest[]> {
  const rows = await prisma.autoMatchRequest.findMany({
    where: { member: foldEmail(member) },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => ({ id: row.id, variant: row.variant, moveTimeMs: row.moveTimeMs, since: row.createdAt.toISOString() }));
}

/** How many are waiting for each game right now, for the panel to say. */
export async function fetchWaitingCounts(): Promise<Map<string, number>> {
  const rows = await prisma.autoMatchRequest.groupBy({ by: ["variant"], _count: { _all: true } });
  return new Map(rows.map((row) => [row.variant, row._count._all]));
}

/** True when these two already have a running game of this kind between them. */
async function alreadyPlaying(a: string, b: string, variant: string): Promise<boolean> {
  const row = await prisma.game.findFirst({
    where: {
      status: "active",
      variant,
      OR: [
        { blackMember: a, whiteMember: b },
        { blackMember: b, whiteMember: a },
      ],
    },
    select: { id: true },
  });
  return row !== null;
}

/**
 * Asks to be paired. If somebody is already waiting for the same game at the
 * same pace, and neither ignores the other, and they are not already playing
 * that game against each other, a game is started at once between them with
 * colours drawn at random, and both requests are spent. Otherwise the request
 * waits for the next person who asks. The queue is first come, first served.
 */
export async function requestMatch(member: string, variant: string, moveTimeMs: number | null): Promise<AutoMatchOutcome> {
  const me = foldEmail(member);
  if (!(variant in RULE_VARIANTS)) return { kind: "refused", reason: "unknown-game" };
  const mine = await prisma.autoMatchRequest.count({ where: { member: me } });
  if (mine >= AUTO_MATCH_LIMIT) return { kind: "refused", reason: "too-many" };

  const candidates = await prisma.autoMatchRequest.findMany({
    where: { variant, moveTimeMs, member: { not: me } },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  for (const other of candidates) {
    if (await isIgnoring(me, other.member)) continue;
    if (await isIgnoring(other.member, me)) continue;
    if (await alreadyPlaying(me, other.member, variant)) continue;

    // Spend their request first; if it is gone, someone else paired with them a moment ago.
    const spent = await prisma.autoMatchRequest.deleteMany({ where: { id: other.id } });
    if (spent.count === 0) continue;

    const [a, b] = await Promise.all([
      prisma.member.findUnique({ where: { email: me }, select: { name: true } }),
      prisma.member.findUnique({ where: { email: other.member }, select: { name: true } }),
    ]);
    const meBlack = Math.random() < 0.5;
    const spec = VARIANT_SPECS[variant as RuleVariant];
    const game = await createLiveGame({
      size: spec.boardSizes?.[0] ?? DEFAULT_SETTINGS.size,
      variant,
      obstacles: DEFAULT_SETTINGS.obstacles,
      opening: OPENING_RULES.free,
      handicap: NO_HANDICAP,
      moveTimeMs,
      timeoutPenalty: "turn",
      allowResign: true,
      open: false,
      blackName: (meBlack ? a?.name : b?.name) ?? "",
      whiteName: (meBlack ? b?.name : a?.name) ?? "",
      winLength: spec.winLength ?? DEFAULT_SETTINGS.winLength,
      opener: STONES.black,
      blackMember: meBlack ? me : other.member,
      whiteMember: meBlack ? other.member : me,
    });
    return { kind: "matched", gameId: game.id, variant };
  }

  const request = await prisma.autoMatchRequest.create({ data: { member: me, variant, moveTimeMs } });
  return { kind: "waiting", requestId: request.id };
}

export async function cancelRequest(member: string, id: string): Promise<void> {
  await prisma.autoMatchRequest.deleteMany({ where: { id, member: foldEmail(member) } });
}
