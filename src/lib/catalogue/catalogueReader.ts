import type { CatalogueStats, GameStats, TopPlayerShown } from "./catalogue.types";

/**
 * WHAT A READER WITH NO SESSION IS SHOWN OF THE CATALOGUE'S FIGURES — THE ONE
 * PLACE IT IS DECIDED.
 *
 * John's rule for strangers is "browse the site, the games, the rules etc...
 * see some stuff", and his rule for the open pages is that they name nobody:
 * he took his twelve-year-old's surname off every list, and
 * `e2e/gate.spec.ts` ("and show nothing anybody wrote, which is what open
 * means here") fails when /games carries a `/players/` link or a player's
 * name to a reader with no session. The figures are one thing and the people
 * are another, so a stranger gets every figure and none of the names.
 *
 * What stays, and why each is safe:
 *
 *  - the counts, the dates and the standings link — they name nobody;
 *  - the top player's RECORD, still linked, by the member's opaque id — an id
 *    says nothing about anybody. Where there is no id, the link could only ask
 *    by the whole name, so those numbers go plain;
 *  - which ladder it is — people or the computer.
 *
 * What goes: the name, the level beside it (a badge with no name is a
 * sentence with its subject missing), and the last game's id (a match page is
 * not open to a stranger, so the date is plain words).
 *
 * If the open-pages rule changes, this function is the change. Nothing below
 * it asks who is reading.
 */
export function forReader(stats: CatalogueStats, signedIn: boolean): CatalogueStats {
  if (signedIn) return stats;
  const games: Record<string, GameStats> = {};
  for (const [variant, game] of Object.entries(stats.games)) {
    games[variant] = {
      ...game,
      last: game.last === null ? null : { ...game.last, gameId: null },
      top: game.top === null ? null : unnamed(game.top),
    };
  }
  const families: CatalogueStats["families"] = {};
  for (const [key, family] of Object.entries(stats.families)) {
    families[key] =
      family.crowns?.kind === "held"
        ? { ...family, crowns: { ...family.crowns, holder: unnamed(family.crowns.holder) } }
        : family;
  }
  return { games, families };
}

function unnamed(top: TopPlayerShown): TopPlayerShown {
  return { ...top, name: null, level: null };
}
