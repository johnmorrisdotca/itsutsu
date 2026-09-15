import "server-only";

import type { Reader } from "@/lib/auth/reader.types";

import { fetchBuddies } from "./buddies";
import { ignoredMemberIds } from "./ignores";
import { fetchHereNow } from "./presence";

/** Somebody a game can be offered to. */
export type Opponent = {
  /**
   * Their member id, which is how a game against them is asked for — and how
   * this list decides who is the reader, who is ignored, and who is already
   * listed.
   */
  id: string;
  /** Null for a member who came in with an invite code. Nothing that offers a game reads it. */
  email: string | null;
  name: string;
  /** Here in the last half hour, so a hint can say so. */
  here: boolean;
};

/**
 * Everyone this member could ask for a game: whoever is about now, then the
 * people they play, with the ones they have ignored left out.
 *
 * Somebody you could ask means somebody who can answer — a person with an
 * account. Both lists already are: who is here is members seen lately, which a
 * program and a kept record never are, and a buddy list refuses anybody else.
 * It used to be keyed on the address being there at all, which also left out
 * every member who came in with an invite code.
 *
 * NOBODY FOR A READER WITH NO ACCOUNT: there is no buddy list to read and a
 * challenge they sent would be refused.
 *
 * Gathered here rather than on a page because two pages ask it now: the games
 * page, where a game is started in a sentence, and the setup screen, where it
 * is settled in full. One list, so the same people are offered by both.
 */
export async function fetchOpponents(reader: Pick<Reader, "memberId">): Promise<Opponent[]> {
  const mine = reader.memberId;
  if (mine === null) return [];
  const [here, buddies, ignored] = await Promise.all([fetchHereNow(), fetchBuddies(mine), ignoredMemberIds(mine)]);
  const hereIds = new Set(here.map((entry) => entry.id));
  return [
    ...here
      .filter((entry) => entry.id !== mine && !ignored.has(entry.id))
      .map((entry) => ({ id: entry.id, email: entry.email, name: entry.name || entry.id, here: true })),
    ...buddies
      .filter((buddy) => !hereIds.has(buddy.id) && !ignored.has(buddy.id))
      .map((buddy) => ({ id: buddy.id, email: buddy.email, name: buddy.name || buddy.id, here: false })),
  ];
}
