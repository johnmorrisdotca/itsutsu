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
   *
   * The address is still here because the ignore and buddy lists are KEPT by
   * address — but nothing that offers a game or tells two people apart reads it
   * any more. A computer player has no address at all, so the id was always the
   * form that works for everybody, and it keeps members' addresses out of the
   * markup of every page with a chooser on it.
   */
  id: string;
  email: string;
  name: string;
  /** Here in the last half hour, so a hint can say so. */
  here: boolean;
};

/**
 * Everyone this member could ask for a game: whoever is about now, then the
 * people they play, with the ones they have ignored left out.
 *
 * Somebody you could ask means somebody who can answer. A kept record has a
 * name and a history and no address, so it is nobody to challenge — that is
 * why this is keyed on the address being there at all.
 *
 * NOBODY FOR A READER WITH NO ACCOUNT. An invite holder is signed in and has no
 * address, so there is no buddy list to read and a challenge they sent would
 * be refused; the list is empty rather than a room full of offers the route
 * turns down.
 *
 * Gathered here rather than on a page because two pages ask it now: the games
 * page, where a game is started in a sentence, and the setup screen, where it
 * is settled in full. One list, so the same people are offered by both.
 */
export async function fetchOpponents(reader: Pick<Reader, "email" | "memberId" | "hasAccount">): Promise<Opponent[]> {
  if (!reader.hasAccount || reader.email === null) return [];
  const [here, buddies, ignored] = await Promise.all([
    fetchHereNow(),
    fetchBuddies(reader.email),
    ignoredMemberIds(reader.email),
  ]);
  const hereIds = new Set(here.map((entry) => entry.id));
  return [
    ...here
      .filter((entry) => entry.email !== null && entry.id !== reader.memberId && !ignored.has(entry.id))
      .map((entry) => ({
        id: entry.id,
        email: entry.email as string,
        name: entry.name || (entry.email as string),
        here: true,
      })),
    ...buddies
      .filter((buddy) => buddy.email !== null && !hereIds.has(buddy.id) && !ignored.has(buddy.id))
      .map((buddy) => ({
        id: buddy.id,
        email: buddy.email as string,
        name: buddy.name || (buddy.email as string),
        here: false,
      })),
  ];
}
