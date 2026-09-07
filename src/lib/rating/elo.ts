/**
 * Elo with tiers, the way a turn-based site does it.
 *
 * A new player starts at 1600 and is *unrated* until a few games are in,
 * *provisional* while the rating is still finding its level, and
 * *established* after that. Provisional ratings move faster. A favourite of
 * more than 400 points gains nothing for winning, which takes the point out
 * of farming weak opponents.
 */

export type RatingTier = "unrated" | "provisional" | "established";

export const RATING_START = 1600;

/** Games before a rating means anything, and before it settles. */
export const UNRATED_BELOW = 4;
export const PROVISIONAL_BELOW = 20;

/** How far one game can move a rating, by tier. */
const K_PROVISIONAL = 40;
const K_ESTABLISHED = 20;

/** Beyond this gap the favourite has nothing to gain from a win. */
const FARMING_GAP = 400;

export type Rated = {
  rating: number;
  ratedGames: number;
};

export type GameScore = 1 | 0.5 | 0;

export function tierFor(ratedGames: number): RatingTier {
  if (ratedGames < UNRATED_BELOW) return "unrated";
  if (ratedGames < PROVISIONAL_BELOW) return "provisional";
  return "established";
}

export const TIER_DISPLAY: Record<RatingTier, { label: string; kanji: string; note: string }> = {
  unrated: { label: "Unrated", kanji: "未定", note: "Fewer than four rated games." },
  provisional: { label: "Provisional", kanji: "仮", note: "Still finding its level; moves quickly." },
  established: { label: "Established", kanji: "確定", note: "Twenty rated games or more." },
};

/** The chance the first player beats the second, as Elo sees it. */
export function expectedScore(rating: number, opponent: number): number {
  return 1 / (1 + 10 ** ((opponent - rating) / 400));
}

/** A player's new rating after one game against `opponent` with `score`. */
export function nextRating(player: Rated, opponent: Rated, score: GameScore): number {
  const k = tierFor(player.ratedGames) === "established" ? K_ESTABLISHED : K_PROVISIONAL;
  const gain = k * (score - expectedScore(player.rating, opponent.rating));
  // A favourite by more than the gap cannot gain, only lose.
  if (player.rating - opponent.rating > FARMING_GAP && gain > 0) return player.rating;
  return Math.round(player.rating + gain);
}

/** Both players after one game, from the first player's point of view. */
export function rateGame(
  first: Rated,
  second: Rated,
  firstScore: GameScore,
): { first: Rated; second: Rated } {
  const secondScore = (1 - firstScore) as GameScore;
  return {
    first: { rating: nextRating(first, second, firstScore), ratedGames: first.ratedGames + 1 },
    second: { rating: nextRating(second, first, secondScore), ratedGames: second.ratedGames + 1 },
  };
}
