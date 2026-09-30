import { DAILY_SEED_BLOCK, SEED_MOST, seededRandom } from "./random";

/**
 * THE SEEDS A WINNABLE CARD DEAL TRIES AFTER ITS OWN, for a game whose seed
 * names "the first deal from here the solver wins" (FreeCell, Spider): not the
 * next numbers, which would be tomorrow's daily seed and the day after's, but
 * numbers drawn from the seed in a fixed order, anywhere in the range but the
 * daily words' block — so every browser tries the same deals in the same order.
 */
export function nextWinnableTry(seed: number, tried: number): number {
  const drawn = Math.floor(seededRandom(seed * 31 + tried)() * (SEED_MOST - DAILY_SEED_BLOCK.size)) + 1;
  return drawn >= DAILY_SEED_BLOCK.from ? drawn + DAILY_SEED_BLOCK.size : drawn;
}
