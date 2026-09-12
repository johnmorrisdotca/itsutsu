import { tierFor, type RatingTier } from "./elo";
import { RATING_POOLS, type RatingPool } from "./pools";
import type { PlayerProfile } from "./players";
import type { PlayedTally } from "@/lib/history/playerRecord";

/**
 * What a list should print beside somebody's name when they play in two pools.
 *
 * A game against a computer is scored in a pool of its own, so that beating a
 * program never moves where somebody stands among the people. That is right,
 * and it leaves a person's figures split across two sets of columns — and a
 * list showing one set while calling it "W L D" is not showing a smaller
 * truth, it is showing a different person's.
 *
 * The failure was already written down, one type away, about the other half
 * of it: "a page that read the ordinary figures for a bot would say it had
 * never played, however many games it had just finished." That was fixed for
 * bots, on the list beside this one. The same sentence is true of a PERSON
 * whose games have all been against computers, and on the members list it was
 * not fixed — the directory printed 0W 0L 0D and a dash for the rating while
 * that person's own page showed five games and a rating of 1639. Two lists,
 * one page, the same account, contradicting each other.
 */

/**
 * Every finished game somebody has played here — every one, not only the
 * rated ones.
 *
 * THIS USED TO READ `PlayerProfile`, the rating table, and summed its two
 * pools exactly the way the doc comment above still describes. That was a
 * second, narrower bug wearing the first one's fix: a rating row only ever
 * exists for a RATED game — `liveGame.ts` calls `recordResult` only when the
 * row says rated — so summing both pools' rating columns answers "how many
 * rated games", not "how many played", while the column above it says
 * PLAYED. Measured on production: a computer player with 36 finished games
 * showed 1, because 35 of them were unrated bot-series runs. The two humans
 * on the same page matched exactly, because every game either of them had
 * played happened to be rated — which is exactly why nobody had caught it.
 *
 * So this now takes the batched read of the games table itself
 * (`fetchPlayedTallies`, for a list; `fetchPlayerRecord`, for one person's own
 * page) rather than the rating rows, and the header, the code and a player's
 * own page all mean the same thing by "played" again.
 *
 * Undefined rather than defaulted before the call, matching `Map.get` — a
 * member nobody has a tally for has played nothing, not nothing worth
 * reporting.
 */
export function gamesPlayed(played: PlayedTally | undefined): { wins: number; losses: number; draws: number } {
  if (played === undefined) return { wins: 0, losses: 0, draws: 0 };
  return { wins: played.wins, losses: played.losses, draws: played.draws };
}

/**
 * The rating worth printing beside a name, and which pool earned it — or null
 * where there is nothing honest to print.
 *
 * The ladder rating comes first, because that is what the column has always
 * meant and what somebody comparing two people is asking. Only when a person
 * has no settled rating among the people does the computer pool answer, and
 * then it must be MARKED: an unlabelled 1639 beside a name reads as a place
 * on the ladder, and it is not one.
 *
 * Null rather than a starting value, for the reason the whole of this file
 * exists. A rating nobody has earned yet is not a rating of 1500; it is
 * silence, and the column prints a dash.
 */
export function ratingShown(
  profile: PlayerProfile | null,
): { rating: number; pool: RatingPool; tier: RatingTier } | null {
  if (profile === null) return null;
  if (profile.tier !== "unrated") {
    return { rating: profile.rating, pool: RATING_POOLS.people, tier: profile.tier };
  }
  const computerTier = tierFor(profile.computer.ratedGames);
  if (computerTier !== "unrated") {
    /*
     * The tier travels with the rating, because a page showing one beside the
     * other must not take them from different pools. "1639, unrated" is what
     * that mistake looks like: the number earned against programs, the word
     * describing a ladder they have never played on.
     */
    return { rating: profile.computer.rating, pool: RATING_POOLS.computer, tier: computerTier };
  }
  return null;
}
