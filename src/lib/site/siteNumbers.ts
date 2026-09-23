import "server-only";

import { unstable_cache } from "next/cache";

import { computerSeatIds } from "@/lib/history/gameHistory";
import { buildGameWhere, toGameHistoryQuery } from "@/lib/history/gameHistoryQuery";
import { prisma } from "@/lib/prisma";
import { RECENCY_MINUTES } from "@/lib/social/presence";

/**
 * THREE NUMBERS ON THE FRONT PAGE, the way Pente.org prints them — players,
 * games, here now — counted honestly for a site that is small on purpose
 * (John, 2026-09-16).
 *
 * PEOPLE ONLY. A program is not a player and a game two programs played is not
 * a community's game, and they are real rows, which is what makes padding the
 * number the easy mistake:
 * - players: members who are people with an account — the same test as
 *   `listable` (no program tier, not a kept record of somebody elsewhere);
 * - games: finished games with no program in either seat, counted by the
 *   record's OWN filter (`pool=people`), so the number and the list it links to
 *   are the same set;
 * - here now: people seen in the last few minutes who show themselves online.
 *
 * CACHED FOR TWO MINUTES and asked for only when the page renders — never
 * polled. "Online now" is the kind of number that quietly becomes a bill.
 */
export type SiteNumbers = { players: number; games: number; hereNow: number };

/** The record's people-only filter, as /history?pool=people reads it. */
export const PEOPLE_GAMES_PATH = "/history?pool=people";

async function countSiteNumbers(): Promise<SiteNumbers> {
  const query = toGameHistoryQuery(new URL(`https://itsutsu.local${PEOPLE_GAMES_PATH}`));
  if ("error" in query) throw new Error(`The people-only record query no longer parses: ${query.error}`);
  const since = new Date(Date.now() - RECENCY_MINUTES.now * 60_000);
  const person = { botTier: null, unclaimableBecause: null };
  const [players, games, hereNow] = await Promise.all([
    prisma.member.count({ where: person }),
    computerSeatIds().then((computers) =>
      prisma.game.count({ where: buildGameWhere(query, { computers, named: [] }) }),
    ),
    prisma.member.count({ where: { ...person, showOnline: true, lastSeenAt: { gte: since } } }),
  ]);
  return { players, games, hereNow };
}

export const siteNumbers = unstable_cache(countSiteNumbers, ["site-numbers"], { revalidate: 120 });
