import { BOT_TIER_LIST } from "./opponent.constants";
import type { LadderMeasurement, LadderNeighbour, LadderNeighbours } from "./ladderStrength.types";
import type { BotTier } from "./opponent.types";

/**
 * HOW ONE GRADE ACTUALLY DID AGAINST THE GRADE ABOVE IT AND THE ONE BELOW, at
 * one game.
 *
 * The ladder claims an ORDER — разряд below 級 below 段 below 名人 below 国手 —
 * and the useful question about an order is never "what is this player's
 * number", it is "does the next rung up actually beat this one HERE". So a
 * whole round robin is reduced to the two comparisons somebody choosing an
 * opponent is making anyway: the rung I would step up to, and the one I came
 * from.
 *
 * Read from the asked-for grade's side of the board, whichever way round the
 * pairing was stored — a pairing records `first`'s wins, and `first` is
 * whoever the round robin happened to enumerate first, which is not a fact
 * about either player.
 *
 * The ends of the ladder have one neighbour, and that is null rather than an
 * empty record: разряд has nothing below it, and "no rung there" and "played
 * nobody" are different facts.
 */
export function ladderNeighbours(measurement: LadderMeasurement, tier: BotTier): LadderNeighbours {
  const at = BOT_TIER_LIST.indexOf(tier);
  if (at === -1) return { above: null, below: null };
  return {
    above: neighbour(measurement, tier, BOT_TIER_LIST[at + 1]),
    below: neighbour(measurement, tier, BOT_TIER_LIST[at - 1]),
  };
}

/** One pairing, from `tier`'s side; null when there is no such rung or it was never played. */
function neighbour(measurement: LadderMeasurement, tier: BotTier, other: BotTier | undefined): LadderNeighbour | null {
  if (other === undefined) return null;
  for (const pairing of measurement.pairings) {
    if (pairing.first === tier && pairing.second === other) {
      return { tier: other, wins: pairing.wins, losses: pairing.losses, draws: pairing.draws };
    }
    if (pairing.first === other && pairing.second === tier) {
      // Stored from the other side, so the wins are the losses.
      return { tier: other, wins: pairing.losses, losses: pairing.wins, draws: pairing.draws };
    }
  }
  return null;
}

/**
 * Whether a pairing settles anything, which is a question about the SAMPLE and
 * not about the score.
 *
 * TWENTY GAMES IS A SMALL NUMBER, and the arithmetic is unforgiving about how
 * small. 名人 lost 7-13 to 国手 at Reversi, which reads like a result and is
 * not one: over twenty decided games that comes up about a quarter of the time
 * between two players of exactly equal strength. At draughts they were 3-6
 * with eleven drawn, which is half the time. Printing "国手 beats 名人" from
 * either would be this site asserting something it has not measured — the same
 * fault as a count with no games behind it, one layer along.
 *
 * So a gap has to clear two standard deviations of a coin: `|wins - losses| <
 * 2 * sqrt(decided)` reads as level. On the numbers actually in the table that
 * line falls exactly where the binomial does — every pairing it calls level
 * has a two-sided p above 0.23, and the two it calls real are at 0.001 and
 * below.
 *
 * DRAWS ARE NOT SAMPLE. They are counted and shown, because eleven draws in
 * twenty is a fact about the game worth reading, but they say nothing about
 * which player is stronger and so they do not make a margin look better
 * supported than it is. A draughts pairing of 3-6-11 is nine games of
 * evidence, not twenty.
 *
 * The honest reading of the current table is therefore the one that started
 * this ticket and has NOT gone away: at both measured games the top two rungs
 * are one player. What twenty games can show is the big gaps — 段 losing every
 * game to 名人 — and it shows those plainly.
 */
export function readsAsLevel(neighbour: LadderNeighbour): boolean {
  const decided = neighbour.wins + neighbour.losses;
  if (decided === 0) return true;
  return Math.abs(neighbour.wins - neighbour.losses) < 2 * Math.sqrt(decided);
}
