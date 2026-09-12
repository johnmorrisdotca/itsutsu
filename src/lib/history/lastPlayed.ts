import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * When each of a batch of members last finished a game here.
 *
 * FOR THE OPERATOR'S BOTS TAB, where it answers a question no other column on
 * the site can: a computer player is never SEEN — it does not sign in, so its
 * `lastSeenAt` is frozen at the moment its row was written — and "last played"
 * is the only recency a program has. An operator looking at seven rows wants to
 * know which of them anybody is actually playing.
 *
 * NULL MEANS NO FINISHED GAME, and it is a null rather than the row's creation
 * date or the epoch. A plausible-looking date for "never" is the shape
 * AGENTS.md names: it would be in range, it would sort, and it would be read as
 * a game that was played. The caller says "no games yet" instead.
 *
 * TWO AGGREGATES RATHER THAN A SCAN. A member holds either seat, so the most
 * recent game is the later of two maxima — asked of the database, which answers
 * with one row per member per seat, instead of fetching the games and reducing
 * them here. That matters more than it looks: a bot-against-bot batch leaves
 * thousands of finished games behind, and reading them all to find one date is
 * the cost-per-row fault this codebase has already paid for twice.
 *
 * The same `finished` and not-`abandoned` filter `fetchPlayedTallies` uses, so
 * the date and the count on one row are about the same set of games. A game
 * called off before the first stone is not a result.
 */
export async function lastPlayedByMember(
  ids: readonly string[],
): Promise<Map<string, Date | null>> {
  const wanted = [...new Set(ids.filter((id) => id !== ""))];
  const latest = new Map<string, Date | null>(wanted.map((id) => [id, null]));
  if (wanted.length === 0) return latest;

  const where = { status: "finished", result: { not: "abandoned" } } as const;
  const [asBlack, asWhite] = await Promise.all([
    prisma.game.groupBy({
      by: ["blackMemberId"],
      where: { ...where, blackMemberId: { in: wanted } },
      _max: { playedAt: true },
    }),
    prisma.game.groupBy({
      by: ["whiteMemberId"],
      where: { ...where, whiteMemberId: { in: wanted } },
      _max: { playedAt: true },
    }),
  ]);

  const keep = (id: string | null, at: Date | null) => {
    if (id === null || at === null || !latest.has(id)) return;
    const known = latest.get(id) ?? null;
    if (known === null || at > known) latest.set(id, at);
  };
  for (const row of asBlack) keep(row.blackMemberId, row._max.playedAt);
  for (const row of asWhite) keep(row.whiteMemberId, row._max.playedAt);

  return latest;
}
