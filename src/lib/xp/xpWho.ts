import type { Prisma } from "@prisma/client";

import { DIRECTORY_WHO, DIRECTORY_WHO_LIST, type DirectoryWho } from "@/lib/rating/directoryFilter";

/**
 * WHO THE XP BOARD IS ABOUT: people, the computer players, or everyone.
 *
 * The programs stand on the ladder like anyone now, and John's answer to a
 * board that mixes the two was "filters are the way to go". This is the same
 * three-way choice the players page offers — the same words, the same chips,
 * the same values — and it is carried the same way: in the query, never the
 * path, with no redirect to a cleaned-up address (a redirect is what lets a
 * client-side cache answer a click with a stale page; see AGENTS.md, "A Test
 * That Does What A User Would Not Do").
 *
 * REMEMBERED ON ITS OWN KEY. The board and the rungs are one thing and share
 * one memory (`xpWho`); the players page has its own (`playersWho`). Choosing
 * Computers on the board never changes what /players opens with, or the other
 * way round — two pages, two questions, two answers. Default Everyone, the
 * same as /players.
 *
 * The narrowing is a `where` on the member row's engine name, so the query
 * pages and orders the narrowed set exactly as it does the whole one, and
 * every count on the page counts what the reader is looking at.
 */

export const XP_WHO_PARAM = "who";

export const XP_WHO_DEFAULT: DirectoryWho = DIRECTORY_WHO.everyone;

/** The who the address asks for, or null where it says nothing this board offers. */
export function askedXpWho(query: Record<string, string | string[] | undefined>): DirectoryWho | null {
  const raw = query[XP_WHO_PARAM];
  const one = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  return (DIRECTORY_WHO_LIST as readonly string[]).includes(one) ? (one as DirectoryWho) : null;
}

/** The narrowing as the database applies it: nothing for everyone. */
export function xpWhoWhere(who: DirectoryWho): Prisma.MemberWhereInput {
  if (who === DIRECTORY_WHO.people) return { botTier: null };
  if (who === DIRECTORY_WHO.computers) return { botTier: { not: null } };
  return {};
}

/**
 * The address for a chip: the page's other choices kept, the cursor and the
 * count-from dropped, since a narrowed board starts at its own first page.
 * Always names the who, Everyone included, so that following the chip is the
 * address SAYING it — which is what gets it remembered.
 */
export function xpWhoHref(at: string, query: string, who: DirectoryWho): string {
  const params = new URLSearchParams(query);
  params.delete("cursor");
  params.delete("from");
  params.set(XP_WHO_PARAM, who);
  return `${at}?${params.toString()}`;
}

/** How the page names the narrowed set in a sentence. */
export const XP_WHO_SAID: Record<DirectoryWho, string> = {
  [DIRECTORY_WHO.everyone]: "everyone",
  [DIRECTORY_WHO.people]: "the people",
  [DIRECTORY_WHO.computers]: "the computer players",
};
