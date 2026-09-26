import "server-only";

import { memberKind } from "@/lib/auth/memberKind";
import { prisma } from "@/lib/prisma";

import { levelShown } from "./levelShown";
import type { NameTag } from "./nameTag.types";
import { xpForBadge } from "./xpScope";

export type { NameTag } from "./nameTag.types";

/**
 * THE FLAG, BADGE AND LEVEL FOR EVERY NAME ON A PAGE, IN ONE READ.
 *
 * John, 2026-09-25: "we can't be inconsistent in pages, and have a flag in one
 * list, but not in another." A list built from games or awards carries member
 * ids and names but not where anybody is, so it asks here once for the whole
 * page — one `IN` over the ids, a handful of columns — the way `xpByMemberId` fills the
 * XP column. Never once per row. A program needs nothing from here: its badge
 * and flag come from its id (`botNames.ts`).
 */
export async function nameTagsOf(ids: Iterable<string | null | undefined>): Promise<Map<string, NameTag>> {
  const wanted = [...new Set([...ids].filter((id): id is string => typeof id === "string" && id !== ""))];
  if (wanted.length === 0) return new Map();
  const rows = await prisma.member.findMany({
    where: { id: { in: wanted } },
    select: { id: true, country: true, unclaimableBecause: true, xp: true, xpEverywhere: true },
  });
  return new Map(rows.map((row) => [row.id, tagOf(row)]));
}

/**
 * The names behind member ids AND their marks, in the one read — for a board
 * that has only ids (the puzzle and IP boards), where `memberNamesOf` and
 * `nameTagsOf` would be two queries over the same rows.
 */
export async function namesAndTagsOf(
  ids: Iterable<string | null | undefined>,
): Promise<{ names: Map<string, string>; tags: Map<string, NameTag> }> {
  const wanted = [...new Set([...ids].filter((id): id is string => typeof id === "string" && id !== ""))];
  if (wanted.length === 0) return { names: new Map(), tags: new Map() };
  const rows = await prisma.member.findMany({
    where: { id: { in: wanted } },
    select: { id: true, name: true, country: true, unclaimableBecause: true, xp: true, xpEverywhere: true },
  });
  return {
    names: new Map(rows.map((row) => [row.id, row.name])),
    tags: new Map(rows.map((row) => [row.id, tagOf(row)])),
  };
}

/** One member row's marks, for a read that already has the row (`fetchHereNow`). */
export function tagOf(row: { country: string; unclaimableBecause: string | null; xp: number; xpEverywhere: number }): NameTag {
  return {
    country: row.country,
    kind: memberKind({ email: null, unclaimableBecause: row.unclaimableBecause }),
    // The badge's total, as beside every name (`xpForBadge`), so a list and the members table agree.
    level: levelShown({ xp: xpForBadge(row) }),
  };
}
