import { speaker, type Speaker } from "../i18n/i18n";

import { gamesShownIn } from "./families";
import type { GameFamily } from "./families.types";

/*
 * Apart from `families.ts` because the browser specs import that file, and
 * Playwright resolves no `@/` alias in what it imports: the words need the
 * speaker, which sits behind one.
 */

/**
 * HOW MANY GAMES A FAMILY'S SHELF HOLDS, in words: its own, then any listed
 * from other families said apart, since a guest is counted once, at home. A
 * shelf of guests alone says so rather than "0 games".
 */
export function familyCountWords(family: GameFamily, say: Speaker = speaker("en")): string {
  return shelfCountWords(family.games.length, gamesShownIn(family).length - family.games.length, say);
}

/** The same words from the two counts, for a caller holding a family's copy rather than the family. */
export function shelfCountWords(home: number, guests: number, say: Speaker = speaker("en")): string {
  const games = (count: number) => say.count("count.gameKind", count);
  if (guests === 0) return games(home);
  if (home === 0) return say.say("gomoku.shelfGuests", { games: games(guests) });
  return say.say("gomoku.shelfBoth", { games: games(home), guests: say.number(guests) });
}
