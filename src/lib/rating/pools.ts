import { RATING_START, tierFor, type RatingTier } from "./elo";

/**
 * The two pools a rated game can move.
 *
 * Games against a person move one ladder; games against a computer player move
 * another. Two pools rather than one, because a computer opponent is always
 * available and always willing to play: with a single ladder every rating on
 * the site would drift towards wherever the graded players happened to
 * settle, and a ladder of people would quietly stop being a ladder of people.
 *
 * This is the whole answer to that problem. Nothing is capped, discounted or
 * marked provisional to compensate — a game against the computer is rated
 * fully and symmetrically, on both sides, exactly like any other rated game.
 * It is simply rated somewhere else.
 *
 * The pool is a property of the game, not of the player. That is what makes it
 * symmetric: in a game against Meijin, the person and Meijin both move in the
 * computer pool. Meijin's ordinary rating stays untouched at its starting
 * value for ever, because Meijin never plays a person-versus-person game — and
 * that is the honest answer rather than an awkward one.
 */

export type RatingPool = "people" | "computer";

export const RATING_POOLS = {
  people: "people",
  computer: "computer",
} as const satisfies Record<RatingPool, RatingPool>;

export const RATING_POOL_LIST: readonly RatingPool[] = [
  RATING_POOLS.people,
  RATING_POOLS.computer,
];

export const RATING_POOL_DISPLAY: Record<
  RatingPool,
  { label: string; kanji: string; blurb: string }
> = {
  people: {
    label: "Against people",
    kanji: "対人",
    blurb: "Rated games against other members. This is the ladder.",
  },
  computer: {
    label: "Against the computer",
    kanji: "対コンピュータ",
    blurb: "Rated games against Kyu, Dan and Meijin, kept apart from the ladder.",
  },
};

/** The overall figure, which is both pools read together. */
export const OVERALL_DISPLAY = {
  label: "Overall",
  kanji: "総合",
  blurb: "Both pools together, weighted by how many games are in each.",
};

/** Which pool a finished game belongs in. */
export function poolFor(againstComputer: boolean): RatingPool {
  return againstComputer ? RATING_POOLS.computer : RATING_POOLS.people;
}

/** One player's standing in one pool. */
export type PoolStanding = {
  rating: number;
  ratedGames: number;
  wins: number;
  losses: number;
  draws: number;
};

export const EMPTY_STANDING: PoolStanding = {
  rating: RATING_START,
  ratedGames: 0,
  wins: 0,
  losses: 0,
  draws: 0,
};

/**
 * The two pools read as one figure, for a page that wants to say how somebody
 * is doing without asking which opponents they chose.
 *
 * Weighted by games played, which is the only combination that stays honest at
 * both ends: somebody with forty games against people and two against Meijin
 * reads essentially as their ladder rating, and somebody who has only ever
 * played the computer reads as their computer rating rather than as a made-up
 * average with 1600 in it. Nobody has played nothing and rated 1600 by
 * accident; with no games at all it is the starting rating, which is what it
 * has always been.
 *
 * Wins, losses and draws simply add up. They are counts of things that
 * happened, and both pools happened.
 */
export function combinedStanding(
  people: PoolStanding,
  computer: PoolStanding,
): PoolStanding {
  const games = people.ratedGames + computer.ratedGames;
  const rating =
    games === 0
      ? RATING_START
      : Math.round(
          (people.rating * people.ratedGames + computer.rating * computer.ratedGames) / games,
        );
  return {
    rating,
    ratedGames: games,
    wins: people.wins + computer.wins,
    losses: people.losses + computer.losses,
    draws: computer.draws + people.draws,
  };
}

/**
 * How settled a combined figure is. Read from the games in both pools together,
 * because a rating made of forty games is a rating whichever ladder they were
 * played on.
 */
export function combinedTier(people: PoolStanding, computer: PoolStanding): RatingTier {
  return tierFor(people.ratedGames + computer.ratedGames);
}

/**
 * Which columns each pool is kept in.
 *
 * The person-versus-person pool keeps the columns it has always had, so every
 * page, query and leaderboard that already reads `rating` reads the same
 * number tomorrow as it did yesterday. The computer pool is the new set. Both
 * `Player` and `PlayerVariantRating` carry them under the same names, so one
 * table serves both and there is one place to change if a third pool is ever
 * wanted.
 */
export const POOL_COLUMNS = {
  people: {
    rating: "rating",
    ratedGames: "ratedGames",
    wins: "wins",
    losses: "losses",
    draws: "draws",
  },
  computer: {
    rating: "computerRating",
    ratedGames: "computerRatedGames",
    wins: "computerWins",
    losses: "computerLosses",
    draws: "computerDraws",
  },
} as const satisfies Record<RatingPool, Record<keyof PoolStanding, string>>;

/** One row's standing in one pool, read through the column names above. */
export function standingIn(
  row: Record<string, unknown>,
  pool: RatingPool,
): PoolStanding {
  const columns = POOL_COLUMNS[pool];
  const read = (name: string, fallback: number) =>
    typeof row[name] === "number" ? (row[name] as number) : fallback;
  return {
    rating: read(columns.rating, RATING_START),
    ratedGames: read(columns.ratedGames, 0),
    wins: read(columns.wins, 0),
    losses: read(columns.losses, 0),
    draws: read(columns.draws, 0),
  };
}

/**
 * The write for one player's half of a finished game, in the pool it belongs
 * to: the new rating and game count outright, the tallies incremented.
 */
export function poolWrite(
  pool: RatingPool,
  rating: number,
  ratedGames: number,
  outcome: "win" | "loss" | "draw",
): Record<string, number | { increment: number }> {
  const columns = POOL_COLUMNS[pool];
  return {
    [columns.rating]: rating,
    [columns.ratedGames]: ratedGames,
    [columns.wins]: { increment: outcome === "win" ? 1 : 0 },
    [columns.losses]: { increment: outcome === "loss" ? 1 : 0 },
    [columns.draws]: { increment: outcome === "draw" ? 1 : 0 },
  };
}

/** How a result reads for one colour. */
export function outcomeFor(
  winner: "black" | "white" | null,
  stone: "black" | "white",
): "win" | "loss" | "draw" {
  if (winner === null) return "draw";
  return winner === stone ? "win" : "loss";
}
