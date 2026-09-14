import { describe, expect, it } from "vitest";

import { gamesPlayed, ratingShown, tierShown } from "./shownRecord";
import { RATING_POOLS } from "./pools";
import { tierFor } from "./elo";
import type { PlayerProfile } from "./players";

/**
 * The case every one of the `ratingShown` tests is really about: somebody
 * whose games have all been against the computer players. The directory read
 * the ladder columns for them and printed nothing, while their own page
 * printed a real record — the same account saying two different things on
 * two pages.
 */
type Over = Omit<Partial<PlayerProfile>, "computer"> & { computer?: Partial<PlayerProfile["computer"]> };

const profile = (over: Over = {}): PlayerProfile => {
  const { computer, ...rest } = over;
  const ratedGames = rest.ratedGames ?? 0;
  return {
    key: "john morris",
    name: "John Morris",
    rating: 1500,
    ratedGames,
    tier: rest.tier ?? tierFor(ratedGames),
    wins: 0,
    losses: 0,
    draws: 0,
    ...rest,
    computer: { rating: 1500, ratedGames: 0, wins: 0, losses: 0, draws: 0, ...computer },
  } as PlayerProfile;
};

describe("gamesPlayed: every finished game, not only the rated ones", () => {
  /*
   * THE REPORTED BUG. `gamesPlayed` used to take a `PlayerProfile` — the
   * rating table — and sum its two pools. A rating row only exists for a
   * RATED game, so that answered "how many rated games" under a column that
   * says PLAYED. Measured on production: a computer player with 36 finished
   * games showed 1. It now takes the batched read of the games table itself,
   * which knows about the unrated ones too.
   */
  it("counts every game a tally carries, rated or not", () => {
    expect(gamesPlayed({ wins: 3, losses: 32, draws: 1 })).toEqual({ wins: 3, losses: 32, draws: 1 });
  });

  it("shows the record of somebody most of whose games were unrated", () => {
    // 36 finished, only 1 of them rated — the exact shape production had.
    expect(gamesPlayed({ wins: 20, losses: 15, draws: 1 })).toEqual({ wins: 20, losses: 15, draws: 1 });
  });

  it("counts nothing for a member nobody has a tally for, rather than guessing", () => {
    expect(gamesPlayed(undefined)).toEqual({ wins: 0, losses: 0, draws: 0 });
  });
});

describe("what a list prints for somebody who plays in two pools", () => {
  it("prefers the ladder rating, because that is what the column has always meant", () => {
    const laddered = profile({ ratedGames: 12, rating: 1720, computer: { ratedGames: 9, rating: 1400 } });
    expect(ratingShown(laddered)).toEqual({ rating: 1720, pool: RATING_POOLS.people, tier: "provisional" });
  });

  it("falls back to the computer rating, and says that is what it is", () => {
    const onlyBots = profile({ computer: { ratedGames: 5, rating: 1639 } });
    // Marked, not merely shown: an unlabelled number beside a name reads as a
    // place on the ladder, and this is not one.
    expect(ratingShown(onlyBots)).toEqual({
      rating: 1639,
      pool: RATING_POOLS.computer,
      // The tier travels with the rating. Taking the number from one pool and
      // the word from the other prints "1639, unrated" — the rating earned
      // against programs, described by a ladder they have never played on.
      tier: "provisional",
    });
  });

  it("stays silent rather than printing a rating nobody has earned", () => {
    expect(ratingShown(null)).toBeNull();
    expect(ratingShown(profile()), "a starting value is not a rating").toBeNull();
    expect(ratingShown(profile({ computer: { ratedGames: 1 } })), "one game is not a rating either").toBeNull();
  });
});

/**
 * The tier beside the rating is the tier OF THE POOL THE RATING CAME FROM.
 * A program's page used to take it from the people pool — nought games, so
 * "Unrated" — beside a computer-pool figure the Computers tab called
 * "Provisional"; and the Computers tab printed a number from the first rated
 * game where the Members tab printed a dash until the fourth.
 */
describe("tierShown: the tier of the pool the shown rating came from", () => {
  it("is the people pool's tier where the people pool is what is shown", () => {
    expect(tierShown(profile({ ratedGames: 25 }))).toBe("established");
    expect(tierShown(profile({ ratedGames: 7, computer: { ratedGames: 40 } }))).toBe("provisional");
  });

  it("is the computer pool's tier for somebody who has only played the programs — a program, say", () => {
    expect(tierShown(profile({ computer: { ratedGames: 7 } }))).toBe("provisional");
    expect(tierShown(profile({ computer: { ratedGames: 20 } }))).toBe("established");
  });

  it("is unrated where there is nothing to show, which is true of both pools at once", () => {
    expect(tierShown(null)).toBe("unrated");
    expect(tierShown(profile())).toBe("unrated");
    expect(tierShown(profile({ computer: { ratedGames: 3 } }))).toBe("unrated");
    expect(tierShown(profile({ ratedGames: 3, computer: { ratedGames: 3 } }))).toBe("unrated");
  });

  it("never pairs one pool's number with the other pool's word", () => {
    const onlyBots = profile({ computer: { rating: 1584, ratedGames: 7 } });
    expect(ratingShown(onlyBots)?.pool).toBe(RATING_POOLS.computer);
    expect(tierShown(onlyBots)).toBe(ratingShown(onlyBots)?.tier);
  });
});
