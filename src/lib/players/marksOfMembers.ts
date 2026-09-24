import "server-only";

import { prisma } from "@/lib/prisma";

import { MEMBER_MARKS_SELECT, memberMarks, type MemberMarks } from "./memberMarks";

/**
 * THE MARKS FOR A PAGE OF RATING ROWS, IN ONE READ.
 *
 * The ladders are built from rating rows, which carry a name and a member id
 * and nothing else about the person, so a ladder drew a bare name where the
 * players list drew a flag and a BOT badge. This fills that in the way
 * `xpByMemberId` fills the XP column: one `IN` over the page's ids, never a
 * query per row, and absent from the map for a name with nobody behind it.
 */
export async function marksByMemberId(
  memberIds: readonly (string | null | undefined)[],
): Promise<Map<string, MemberMarks>> {
  const ids = [...new Set(memberIds.filter((id): id is string => typeof id === "string" && id !== ""))];
  if (ids.length === 0) return new Map();
  const members = await prisma.member.findMany({
    where: { id: { in: ids } },
    select: { id: true, ...MEMBER_MARKS_SELECT },
  });
  return new Map(members.map((member) => [member.id, memberMarks(member)]));
}
