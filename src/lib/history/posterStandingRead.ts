import "server-only";

import { prisma } from "@/lib/prisma";
import { playerKey } from "@/lib/rating/playerKey";
import { toProfile } from "@/lib/rating/players";

import { posterKeyOf, posterRow, standingOf } from "./posterStanding";
import type { PosterRef, PosterStanding } from "./posterStanding.types";

/**
 * Every poster's standing on a board, keyed by `posterKeyOf`, in two queries
 * whatever the board holds: the rating rows for all their ids and names, and the
 * member rows for their totals and countries. Never one read per seat.
 *
 * Asked for every seat a reader could sit in, before the rating filter narrows
 * them, so the filter and the lines beside it read one answer.
 */
export async function fetchPosterStandings(posters: readonly PosterRef[]): Promise<Map<string, PosterStanding>> {
  if (posters.length === 0) return new Map();
  const ids = [...new Set(posters.map((poster) => poster.memberId).filter((id): id is string => id !== null))];
  const keys = [...new Set(posters.map((poster) => playerKey(poster.name)).filter((key) => key !== ""))];

  const [rows, members] = await Promise.all([
    prisma.player.findMany({ where: { OR: [{ memberId: { in: ids } }, { key: { in: keys } }] } }),
    ids.length === 0
      ? Promise.resolve([])
      : prisma.member.findMany({ where: { id: { in: ids } }, select: { id: true, xp: true, country: true } }),
  ]);
  const memberById = new Map(members.map((member) => [member.id, member]));

  return new Map(
    posters.map((poster) => {
      const row = posterRow(poster, rows);
      const member = poster.memberId === null ? null : (memberById.get(poster.memberId) ?? null);
      return [posterKeyOf(poster), standingOf({ profile: row === null ? null : toProfile(row), member })];
    }),
  );
}
