import "server-only";

import { memberKind, type MemberKind } from "@/lib/auth/memberKind";
import { prisma } from "@/lib/prisma";

/** What a name is drawn with beside it (`PlayerName`): the flag and the kind badge. */
export type NameTag = { country: string | null; kind: MemberKind };

/**
 * THE FLAG AND BADGE FOR EVERY NAME ON A PAGE, IN ONE READ.
 *
 * John, 2026-09-25: "we can't be inconsistent in pages, and have a flag in one
 * list, but not in another." A list built from games or awards carries member
 * ids and names but not where anybody is, so it asks here once for the whole
 * page — one `IN` over the ids, two columns — the way `xpByMemberId` fills the
 * XP column. Never once per row. A program needs nothing from here: its badge
 * and flag come from its id (`botNames.ts`).
 */
export async function nameTagsOf(ids: Iterable<string | null | undefined>): Promise<Map<string, NameTag>> {
  const wanted = [...new Set([...ids].filter((id): id is string => typeof id === "string" && id !== ""))];
  if (wanted.length === 0) return new Map();
  const rows = await prisma.member.findMany({
    where: { id: { in: wanted } },
    select: { id: true, country: true, unclaimableBecause: true },
  });
  return new Map(rows.map((row) => [row.id, { country: row.country, kind: memberKind({ email: null, unclaimableBecause: row.unclaimableBecause }) }]));
}
