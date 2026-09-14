import type { RatingPool } from "@/lib/rating/pools";

/**
 * What the games index says about each game and each family, decided without
 * a database.
 *
 * John, looking at /games: "we see there are 2 captures games in this
 * family... but don't see links to the leaderboards or extended stats. The Top
 * Winner of these leaderboards." Every figure the index prints is chosen here,
 * by value, so the choice can be tested with ties, empty games and programs in
 * it — and so there is ONE definition of "top player" for three views of the
 * catalogue rather than one per view.
 */

/** One standing on one game's ladder in one pool, as the index reads it. */
export type LadderEntry = {
  /** The folded name the standing is kept under. */
  key: string;
  name: string;
  memberId: string | null;
  variant: string;
  /** Which ladder this is. Never both: the pools exist so they are not added. */
  pool: RatingPool;
  rating: number;
  ratedGames: number;
  wins: number;
  losses: number;
  draws: number;
  /** When the standing last moved, which breaks a tie the way the ladder does. */
  updatedAt: Date;
};

/**
 * THE LADDER'S OWN ORDER, and it has to be exactly that.
 *
 * The top player links to the standings page, and the standings page lists
 * `fetchVariantLeaders` best first: rating, then games played, then the one who
 * played most recently, then the name. A "top" chosen by any other order would
 * name somebody the page it links to puts second — two answers to one question
 * a click apart. Written as a list rather than a comparator alone so the SQL
 * that narrows the candidates (`catalogueStats.ts`) is built from the same
 * words.
 */
export const LADDER_ORDER = [
  { field: "rating", direction: "desc" },
  { field: "ratedGames", direction: "desc" },
  { field: "updatedAt", direction: "desc" },
  { field: "key", direction: "asc" },
] as const satisfies readonly { field: keyof LadderEntry; direction: "asc" | "desc" }[];

/** Negative when `a` stands above `b` on the ladder. */
export function ladderOrder(a: LadderEntry, b: LadderEntry): number {
  for (const { field, direction } of LADDER_ORDER) {
    const left = a[field];
    const right = b[field];
    const compared =
      left instanceof Date && right instanceof Date
        ? left.getTime() - right.getTime()
        : typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right));
    if (compared !== 0) return direction === "desc" ? -compared : compared;
  }
  return 0;
}

/**
 * THE TOP PLAYER OF EVERY GAME THAT HAS ONE, and the definition the page states.
 *
 * The top of the game's ladder AMONG PEOPLE — rated games between members,
 * best rating first — which is what `championsOf` has always meant by a
 * champion and what the standings page lists first. Where nobody holds a
 * standing among people, the top of the ladder AGAINST THE COMPUTER, and the
 * entry says so in `pool` so the strip can label it: a rating earned against
 * programs is not a place among people and must never be read as one.
 *
 * A program can be the top player. It is a player; on the computer ladder it
 * stands exactly where its games put it.
 *
 * Only standings actually earned count (`ratedGames > 0`). A row exists from a
 * player's first finished game in EITHER pool, so the other pool's columns of
 * that row are a rating of 1600 over nothing — and a starting rating is not a
 * standing, however high it sorts against somebody who has lost.
 *
 * A game with no standing in either pool is absent from the map. Absent, not
 * a blank entry: "nobody" is not a player with no wins.
 */
export function topPlayersOf(standings: readonly LadderEntry[]): Map<string, LadderEntry> {
  const best = new Map<string, LadderEntry>();
  for (const standing of standings) {
    if (standing.ratedGames <= 0) continue;
    const held = best.get(standing.variant);
    if (held === undefined || outranks(standing, held)) best.set(standing.variant, standing);
  }
  return best;
}

/** Whether `a` should be the top player over `b`: the people's ladder first, then the ladder's order. */
function outranks(a: LadderEntry, b: LadderEntry): boolean {
  if (a.pool !== b.pool) return a.pool === "people";
  return ladderOrder(a, b) < 0;
}

/** Who holds the most of one family's top places. */
export type FamilyCrowns =
  /** One player tops more of this family's games than anybody else. */
  | { kind: "held"; holder: LadderEntry; games: string[] }
  /** Two or more players top the same, largest number of them. */
  | { kind: "shared"; holders: number; each: number };

export type FamilyFigures = {
  /** Finished games across every game in the family. */
  played: number;
  /** How many of the family's games have been played here at all. */
  gamesPlayed: number;
  /** How many games the family has. */
  games: number;
  /** Null where no game in the family has a top player. */
  crowns: FamilyCrowns | null;
};

/**
 * A family's line, from its games' own figures.
 *
 * WHY CROWNS AND NOT MOST WINS, which is the obvious candidate and was asked
 * about by name. "Most wins across the family" is a record spanning several
 * games, and /history filters by ONE game — so its numbers could not link to
 * the set they counted, and a record here is a set of links or it is the fault
 * this site has a gate against. It would also have to add two pools together.
 *
 * A crown is a game's top place as `topPlayersOf` decides it, so the family
 * line is made of the same answers the game rows under it show and cannot
 * disagree with them. What it counts is GAMES OF THE CATALOGUE, each of which
 * is named and linked beside it, so nothing in it is a number with nothing
 * behind it.
 *
 * A player is one person across pools and games: their member id where there
 * is one, their folded name where there is not.
 */
export function familyFiguresOf(
  games: readonly string[],
  played: ReadonlyMap<string, number>,
  tops: ReadonlyMap<string, LadderEntry>,
): FamilyFigures {
  const counted = games.map((game) => played.get(game) ?? 0);
  const byHolder = new Map<string, { holder: LadderEntry; games: string[] }>();
  for (const game of games) {
    const top = tops.get(game);
    if (top === undefined) continue;
    const who = top.memberId ?? `name:${top.key}`;
    const entry = byHolder.get(who) ?? { holder: top, games: [] };
    entry.games.push(game);
    byHolder.set(who, entry);
  }
  const most = Math.max(0, ...[...byHolder.values()].map((entry) => entry.games.length));
  const leaders = [...byHolder.values()].filter((entry) => entry.games.length === most);
  const crowns: FamilyCrowns | null =
    most === 0
      ? null
      : leaders.length === 1
        ? { kind: "held", holder: leaders[0].holder, games: leaders[0].games }
        : { kind: "shared", holders: leaders.length, each: most };
  return {
    played: counted.reduce((sum, count) => sum + count, 0),
    gamesPlayed: counted.filter((count) => count > 0).length,
    games: games.length,
    crowns,
  };
}

/** How long ago a game was last played, in the unit a reader would say it in. */
export type SinceLastPlayed =
  | { unit: "today" }
  | { unit: "yesterday" }
  | { unit: "days" | "months" | "years"; count: number };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * "Last played 3 days ago", decided on the server at the moment of the request.
 *
 * Decided there rather than in the browser, because the Cards view draws it
 * inside a client component: a phrase worked out from the clock while
 * rendering would be one thing on the server and another after hydration the
 * moment a boundary fell between the two. The parts go down as data.
 *
 * Every count is at least two, so no unit needs a singular: one day is
 * "yesterday", under forty-five days is days, under eighteen months is months.
 * A time in the future — a clock a little ahead of the database — is today,
 * not a negative number of days.
 */
export function sinceLastPlayed(then: Date, now: Date): SinceLastPlayed {
  const days = Math.floor((startOfDay(now) - startOfDay(then)) / DAY_MS);
  if (days <= 0) return { unit: "today" };
  if (days === 1) return { unit: "yesterday" };
  if (days < 45) return { unit: "days", count: days };
  const months = Math.round(days / 30.44);
  if (months < 18) return { unit: "months", count: Math.max(2, months) };
  return { unit: "years", count: Math.max(2, Math.round(days / 365.25)) };
}

/** Midnight UTC of a moment, so "yesterday" means the calendar day and not 24 hours. */
function startOfDay(moment: Date): number {
  return Date.UTC(moment.getUTCFullYear(), moment.getUTCMonth(), moment.getUTCDate());
}
