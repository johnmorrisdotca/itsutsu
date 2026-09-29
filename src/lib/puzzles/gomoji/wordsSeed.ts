import { dailyWordSeed } from "../dailyWords/dailyDay";
import { freshSeed } from "../random";
import { freshFutagoSeed, futagoDailySeed, isFutagoSeed } from "./futagoSeed";
import type { WordCount } from "./words.types";
import { freshYotsugoSeed, isYotsugoSeed, yotsugoDailySeed } from "./yotsugoSeed";

/**
 * HOW MANY WORDS A GOMOJI'S SEED HIDES, and a seed for each count. The seed is
 * the one thing a kept run is found by that can say it (`futagoSeed.ts`,
 * `yotsugoSeed.ts`), so every caller that needs the count of a run, an
 * address or a fresh puzzle asks here rather than each block by name.
 */
export function wordCountOfSeed(seed: number): WordCount {
  return isYotsugoSeed(seed) ? 4 : isFutagoSeed(seed) ? 2 : 1;
}

/** A new seed hiding this many words, for a puzzle nobody asked for by number. */
export function freshSeedOf(count: WordCount): number {
  return count === 4 ? freshYotsugoSeed() : count === 2 ? freshFutagoSeed() : freshSeed();
}

/** The seed a day's words are played at, one, two or four of them. */
export function dailySeedOf(count: WordCount, day: string): number {
  return count === 4 ? yotsugoDailySeed(day) : count === 2 ? futagoDailySeed(day) : dailyWordSeed(day);
}

/** A count read from anywhere — an address, a prop — as one the game offers, one word for anything else. */
export function asWordCount(value: unknown): WordCount {
  return value === 2 || value === 4 ? value : 1;
}
