// Relative, not `@/`: the browser specs import this file, and Playwright resolves no alias in what it imports.
import { type GameKey, isPartyKind, isRuleVariant } from "../catalogue/gameKeys";
import { listedGameOf } from "../catalogue/gameSettings";

import { ALSO_LISTED_IN } from "./familyShelves";
import type { GameFamily, ShelvedGame } from "./families.types";
import type { RuleVariant } from "./gomoku.types";
import { GAME_FAMILIES } from "./families.data";
import { familyPath } from "./slugs";

/** The families, as `families.data.ts` lists them (each row's identity, words and games): read by everything here, and exported for every caller that asks this module. */
export { GAME_FAMILIES };

/**
 * Whether any of a family's own games is one this site keeps a record of — a
 * rule variant or a puzzle — rather than only party games, which are played
 * and kept in one browser (`isPartyKind`). A shelf of guests keeps none.
 */
export function familyKeepsRecords(family: GameFamily): boolean {
  return family.games.some((game) => !isPartyKind(game));
}

/**
 * THE FAMILIES THAT ARE SOME GAME'S HOME: every family but a shelf of guests
 * alone. What a list of every game, each once under its home, is drawn from
 * (`GameList`), so a party game has its section like any other.
 */
export const HOME_FAMILIES: GameFamily[] = GAME_FAMILIES.filter((family) => family.games.length > 0);

/**
 * THE FAMILIES A RECORDED GAME IS PLAYED FROM: the families some rule variant
 * or puzzle calls home.
 *
 * What "every family" means wherever one is counted towards an award or a
 * tour — `everyFamilyPlayed` is paid for a first game in each of these — so a
 * family nobody can be seen to play a game from (Party games, whose own games
 * never reach the server) would make it a prize no member could ever finish.
 * Two lists rather than one name covering both: "where a game lives" and
 * "where a game is counted" stopped being the same families the day Dots and
 * Boxes moved in.
 */
export const RECORDED_FAMILIES: GameFamily[] = GAME_FAMILIES.filter(familyKeepsRecords);

/**
 * WHERE A FAMILY'S PAGE IS. For a family some recorded game calls home, under
 * the first of its games — `/games/<slug>/family`, the address it has always
 * had, since "the family Renju is in" is a question about Renju. A family with
 * no recorded game — Party games, a shelf of guests and the party games at
 * home in it — has an address of its own at `/games/<key>`: an address the
 * gate already reads as the catalogue's, open to anybody, and a folder of its
 * own under `src/app/games` (`families.coverage.test.ts` holds every such
 * family to one). A party game's own `/family` is not answered: its family
 * already has this one.
 */
export function familyPagePath(family: GameFamily): string {
  const first = family.games.find((game) => !isPartyKind(game));
  return first === undefined ? `/games/${family.key}` : familyPath(first);
}

/**
 * The games in a family the engine plays: its rule variants, its puzzles and
 * party games left out. The two-player set-up, a ladder, a record and the
 * played-figures read this; anything that names or counts a family's games
 * reads `family.games`.
 */
export function boardGamesOf(family: GameFamily): RuleVariant[] {
  return family.games.filter(isRuleVariant);
}

/**
 * THE MOST GAMES ONE SHELF SHOWS, its own and its guests together.
 *
 * John, 2026-09-22: "I want to have MAX 8 items per family". A shelf longer
 * than that is a third line of games on the set-up screen, and a list rather
 * than a choice. A game added to a full family, or a guest listed on one, fails
 * `variants.coverage.test.ts` — so the question "what could be merged or taken
 * out?" is asked the day the ninth arrives, not found on a screen later.
 */
export const FAMILY_MOST_GAMES = 8;

/**
 * THE FAMILIES THAT WERE FOLDED INTO OTHERS, and the one they went to.
 *
 * Three shelves became one each on 2026-09-22, on John's reading of the set-up
 * screen: "Less categories… merge Pieces/Twists with Strange Boards as one
 * family… Territory/Connections (for Go and Hex) could be same family as
 * well… Flips and Captures are kind of the same concept."
 *
 * THIS TABLE EXISTS BECAUSE A KEY IS A THING SOMEBODY HAS BEEN PAID UNDER.
 * `firstOfFamily` writes the family's key into the XP ledger and is paid once
 * per `(member, type, subject)`, so a retired key does not stop meaning
 * anything the moment it leaves `GAME_FAMILIES` — there are rows holding it.
 * Read forward through here, a row written under `captures` is a row for the
 * family that absorbed it, which is what stops a member being counted as
 * having met eight families when three of their rows are two.
 *
 * It is not a redirect table for addresses: a family has no address of its own
 * (a family page is `/games/<slug>/family`, keyed by the GAME), so nothing a
 * reader could have bookmarked breaks. Only the ledger remembers these.
 *
 * Nothing is removed from here once it is in it. A key retired today has rows
 * against it for as long as the ledger exists.
 */
export const FAMILY_ABSORBED: Record<string, string> = {
  captures: "flips",
  "pieces-and-twists": "strange-boards",
  connections: "territory",
  /* 2026-09-24: Halma and Chinese Checkers joined Go and Hex, making room
     under the cap of eight for a family of number puzzles. */
  races: "territory",
};

/**
 * The family a key means TODAY: itself, or the family that absorbed it.
 *
 * Anything counting families over stored rows reads this first. A key that is
 * neither current nor retired comes back unchanged rather than null: this
 * answers "what is this called now", and a key from a future nobody here knows
 * about is not a question this can refuse usefully.
 */
export function familyKeyNow(key: string): string {
  return FAMILY_ABSORBED[key] ?? key;
}

/** Whether a family's shelf shows this game, at home or as a guest. */
export function familyShows(family: GameFamily, variant: GameKey): boolean {
  return (
    family.games.includes(variant) ||
    (ALSO_LISTED_IN[variant] ?? []).some((listing) => listing.family === family.key)
  );
}

/**
 * The games a family's shelf shows: its own, in their load-bearing order, then
 * the guests listed on it from other families, each carrying its home.
 *
 * A family's COUNTS read `family.games`, never this: a guest is counted once,
 * at home.
 */
export function gamesShownIn(family: GameFamily): ShelvedGame[] {
  const own: ShelvedGame[] = family.games.map((variant) => ({ variant, listed: "home" }));
  const guests = (Object.keys(ALSO_LISTED_IN) as GameKey[]).flatMap((variant): ShelvedGame[] => {
    const home = familyOf(variant);
    const listedHere = (ALSO_LISTED_IN[variant] ?? []).some((listing) => listing.family === family.key);
    const listing = (ALSO_LISTED_IN[variant] ?? []).find((one) => one.family === family.key);
    return home === null || home.key === family.key || !listedHere || listing === undefined
      ? []
      : [{ variant, listed: "shelf", home, why: listing.why }];
  });
  return [...own, ...guests];
}

/**
 * A family's shelf with its puzzles and party games left off: what the
 * two-player set-up screen draws. Either on that screen would be a tile the
 * board cannot show; each is set up from its own page.
 */
export function boardGamesShownIn(family: GameFamily): (ShelvedGame & { variant: RuleVariant })[] {
  return gamesShownIn(family).filter((shown): shown is ShelvedGame & { variant: RuleVariant } => isRuleVariant(shown.variant));
}

/** The other games in the family a variant belongs to, for "also try" links. */
export function siblingsOf(variant: GameKey): { family: (typeof GAME_FAMILIES)[number]; games: GameKey[] } | null {
  const listed = listedGameOf(variant) as GameKey;
  const family = GAME_FAMILIES.find((entry) => entry.games.includes(listed));
  if (family === undefined) return null;
  return { family, games: family.games.filter((game) => game !== listed) };
}

/**
 * The family a variant belongs to, whole — the game itself included.
 *
 * Deliberately not `siblingsOf`, which leaves the game out because it exists
 * to say "also try". A family PAGE is about the family, and a list of a
 * family's games that omits the one you are standing in is a list that is
 * wrong about the family. Two questions, two functions.
 */
export function familyOf(variant: GameKey): (typeof GAME_FAMILIES)[number] | null {
  // A setting of a game (a Gomoji in French, `gameSettings.ts`) is in its game's family.
  const listed = listedGameOf(variant) as GameKey;
  return GAME_FAMILIES.find((entry) => entry.games.includes(listed)) ?? null;
}

/**
 * The key of the family a variant belongs to, or null when it is in none.
 *
 * Null rather than the variant's own name or an empty string, and the caller
 * has to deal with it: the XP ledger keys an award on this, and a stand-in
 * value would be a family that does not exist earning a family's award. Every
 * variant is in a family today and `variants.coverage.test.ts` keeps it that
 * way, so null is the answer to a question about a game that has not been put
 * in one yet — which is a thing to stay silent about, not to guess at.
 */
export function familyKeyOf(variant: GameKey): string | null {
  return familyOf(variant)?.key ?? null;
}

/**
 * HOW MANY GAMES A FAMILY'S SHELF HOLDS, in words: its own, then any listed
 * from other families said apart, since a guest is counted once, at home. A
 * shelf of guests alone says so rather than "0 games".
 */
export function familyCountWords(family: GameFamily): string {
  return shelfCountWords(family.games.length, gamesShownIn(family).length - family.games.length);
}

/** The same words from the two counts, for a caller holding a family's copy rather than the family. */
export function shelfCountWords(home: number, guests: number): string {
  const games = (count: number) => `${count} ${count === 1 ? "game" : "games"}`;
  if (guests === 0) return games(home);
  if (home === 0) return `${games(guests)} from other families`;
  return `${games(home)}, and ${guests} from other families`;
}
