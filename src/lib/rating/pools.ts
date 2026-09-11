import { RATING_START } from "./elo";
import { streakIn, type Streak } from "./streak";

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

/**
 * The counted part of a standing: everything that is one number in one column.
 *
 * Separate from `PoolStanding` because the streak beside them is a pair of
 * columns and cannot be addressed by a single name — `POOL_COLUMNS` maps
 * exactly these, and `STREAK_COLUMNS` maps the rest.
 */
export type PoolFigures = {
  rating: number;
  ratedGames: number;
  wins: number;
  losses: number;
  draws: number;
};

/** One player's standing in one pool: the figures, and the run they are on. */
export type PoolStanding = PoolFigures & {
  /**
   * The run this pool is on, or null where nothing has been finished in it.
   *
   * Part of the standing rather than fetched beside it, because it is stored
   * on the same row and read by the same query — a streak costs nothing to
   * read, which is the whole reason it is a column. See `streak.ts`.
   */
  streak: Streak | null;
};

export const EMPTY_STANDING: PoolStanding = {
  rating: RATING_START,
  ratedGames: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  streak: null,
};

/*
 * There is no combined rating, and that is a decision rather than a gap.
 *
 * There was one here — `combinedStanding`, a weighted average of the two
 * pools, careful about both ends: forty games against people and two against
 * Meijin read essentially as the ladder rating, and somebody who had only
 * played the computer read as their computer rating rather than as an average
 * with 1600 mixed into it. It was good work and nothing ever called it.
 *
 * John's ruling is the ladder rating alone. The pools are separate precisely
 * so that beating a program does not move where somebody stands among people,
 * and averaging them puts back what the split was for: a person could climb
 * the visible number by playing nothing but Meijin. What a list shows is
 * `ratingShown` in `shownRecord.ts` — the ladder rating, or where there is
 * none the computer rating MARKED as such, or nothing at all.
 *
 * Written down rather than simply deleted, because the next person to notice
 * that two pools could be averaged will think of it again.
 */

/**
 * Which columns each pool is kept in.
 *
 * The person-versus-person pool keeps the columns it has always had, so every
 * page, query and leaderboard that already reads `rating` reads the same
 * number tomorrow as it did yesterday. The computer pool is the new set. Both
 * `Player` and `PlayerVariantRating` carry them under the same names, so one
 * table serves both and there is one place to change if a third pool is ever
 * wanted.
 *
 * The streak is NOT here. It is two columns rather than one — a kind and a
 * count, only ever believed together — and it has a third scope the ratings
 * have no equivalent of, so it is kept by `STREAK_COLUMNS` in `streak.ts`
 * instead of being bent into a table of single names. Same idea, different
 * shape, and the name is the warning.
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
} as const satisfies Record<RatingPool, Record<keyof PoolFigures, string>>;

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
    // Null on a row that has none, which is what `streakIn` answers rather
    // than inventing a run of nought — see the head of `streak.ts`.
    streak: streakIn(row, pool),
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
