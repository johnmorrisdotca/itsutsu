import "server-only";

import { fetchBuddies } from "./buddies";
import { ignoredEmails } from "./ignores";
import { fetchHereNow } from "./presence";

/** Somebody a game can be offered to. */
export type Opponent = {
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
 * Gathered here rather than on a page because two pages ask it now: the games
 * page, where a game is started in a sentence, and the setup screen, where it
 * is settled in full. One list, so the same people are offered by both.
 */
export async function fetchOpponents(email: string | null): Promise<Opponent[]> {
  if (email === null) return [];
  const [here, buddies, ignored] = await Promise.all([
    fetchHereNow(),
    fetchBuddies(email),
    ignoredEmails(email),
  ]);
  const hereEmails = new Set(here.map((entry) => entry.email));
  return [
    ...here
      .filter((entry) => entry.email !== null && entry.email !== email && !ignored.has(entry.email))
      .map((entry) => ({ email: entry.email as string, name: entry.name || (entry.email as string), here: true })),
    ...buddies
      .filter((buddy) => buddy.email !== null && !hereEmails.has(buddy.email) && !ignored.has(buddy.email))
      .map((buddy) => ({ email: buddy.email as string, name: buddy.name || (buddy.email as string), here: false })),
  ];
}
