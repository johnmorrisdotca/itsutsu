import { describe, expect, it } from "vitest";

import { RATING_POOLS, gamesPlayed, ratingShown } from "./wholeRecord";
import { tierFor } from "./elo";
import type { PlayerProfile } from "./players";

/**
 * The case every one of these is really about: somebody whose games have all
 * been against the computer players. The directory read the ladder columns for
 * them and printed nothing, while their own page printed a real record — the
 * same account saying two different things on two pages.
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

describe("what a list prints for somebody who plays in two pools", () => {
  it("counts games from both pools, because a game against a program is one somebody played", () => {
    const both = profile({ wins: 2, losses: 1, draws: 1, computer: { wins: 3, losses: 2, draws: 0 } });
    expect(gamesPlayed(both)).toEqual({ wins: 5, losses: 3, draws: 1 });
  });

  it("shows the record of somebody who has only ever played the computer", () => {
    /*
     * THE REPORTED BUG. Five games, three won, two lost — and the members
     * list showed 0W 0L 0D because every one of them was scored in the other
     * pool. Their own page showed the five all along.
     */
    const onlyBots = profile({ computer: { ratedGames: 5, wins: 3, losses: 2, draws: 0, rating: 1639 } });
    expect(gamesPlayed(onlyBots)).toEqual({ wins: 3, losses: 2, draws: 0 });
  });

  it("prefers the ladder rating, because that is what the column has always meant", () => {
    const laddered = profile({ ratedGames: 12, rating: 1720, computer: { ratedGames: 9, rating: 1400 } });
    expect(ratingShown(laddered)).toEqual({ rating: 1720, pool: RATING_POOLS.people });
  });

  it("falls back to the computer rating, and says that is what it is", () => {
    const onlyBots = profile({ computer: { ratedGames: 5, rating: 1639 } });
    // Marked, not merely shown: an unlabelled number beside a name reads as a
    // place on the ladder, and this is not one.
    expect(ratingShown(onlyBots)).toEqual({ rating: 1639, pool: RATING_POOLS.computer });
  });

  it("stays silent rather than printing a rating nobody has earned", () => {
    expect(ratingShown(null)).toBeNull();
    expect(ratingShown(profile()), "a starting value is not a rating").toBeNull();
    expect(ratingShown(profile({ computer: { ratedGames: 1 } })), "one game is not a rating either").toBeNull();
  });

  it("counts nothing for somebody with no record at all, rather than guessing", () => {
    expect(gamesPlayed(null)).toEqual({ wins: 0, losses: 0, draws: 0 });
  });
});
