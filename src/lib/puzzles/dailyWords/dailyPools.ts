import { PUZZLE_SPECS, sizesOffered } from "../puzzles.constants";
import type { PuzzleKind } from "../puzzles.types";
import { wordOfDay } from "./dailyCycle";
import { dayIndexOf, dayOfDailyWordSeed } from "./dailyDay";
import { dayOfFutagoSeed } from "../gomoji/futagoSeed";
import type { DailyLanguage, DailyPool, DayWord, PackedDailyPool } from "./dailyWords.types";
import { DAILY_POOL_DE } from "./pool.de.data";
import { DAILY_POOL_EN } from "./pool.en.data";
import { DAILY_POOL_FR } from "./pool.fr.data";
import { DAILY_POOL_POP } from "./pool.pop.data";

/**
 * THE DAILY WORDS OF EACH GOMOJI: which pool a kind draws from, which lengths
 * it has a word a day at, and the word itself.
 *
 * The three alphabet Gomojis' pools are small and ride with the page, as their
 * word lists already do. The kana pools are a length at a time and fetched
 * only when asked for (`loadDailyPools`), as the kana lists are; asked before
 * the fetch for a day's kana word, this refuses rather than guessing.
 */

/** The language a kind's daily words are in, or null for a puzzle that is not a word. */
export function dailyLanguageOf(kind: PuzzleKind): DailyLanguage | null {
  if (kind === "gomoji") return "en";
  if (kind === "gomojiMot") return "fr";
  if (kind === "gomojiWort") return "de";
  if (kind === "gomojiPop") return "pop";
  if (kind === "gomojiKana") return "ja";
  return null;
}

const unpacked = (versions: readonly PackedDailyPool[]): DailyPool[] =>
  versions.map((version) => ({ fromCycle: version.fromCycle, words: version.words.split(/\s+/).filter(Boolean) }));

const ALPHABET_POOLS: Record<"en" | "fr" | "de" | "pop", Record<number, readonly PackedDailyPool[]>> = { en: DAILY_POOL_EN, fr: DAILY_POOL_FR, de: DAILY_POOL_DE, pop: DAILY_POOL_POP };

const READ = new Map<string, DailyPool[]>();

/** The kana lengths with a pool file, each fetched by `importKanaPool`. */
const KANA_POOL_SIZES: readonly number[] = [3, 4, 5];

async function importKanaPool(size: number): Promise<readonly PackedDailyPool[] | null> {
  // Named one by one, so the bundler splits each length into its own chunk.
  if (size === 3) return (await import("./pool.ja.3.data")).DAILY_POOL_JA_3;
  if (size === 4) return (await import("./pool.ja.4.data")).DAILY_POOL_JA_4;
  if (size === 5) return (await import("./pool.ja.5.data")).DAILY_POOL_JA_5;
  return null;
}

/** Fetches the kana pools a kind's lengths need; nothing to fetch for the alphabet Gomojis. */
export async function loadDailyPools(kind: PuzzleKind, sizes: readonly number[] = PUZZLE_SPECS[kind].offered): Promise<void> {
  if (dailyLanguageOf(kind) !== "ja") return;
  await Promise.all(
    sizes.map(async (size) => {
      if (READ.has(`ja:${size}`)) return;
      const packed = await importKanaPool(size);
      if (packed !== null) READ.set(`ja:${size}`, unpacked(packed));
    }),
  );
}

/**
 * A kind's pool versions at a length: the list, or null where there is none
 * (a length not written yet) — and a refusal for a kana length not fetched.
 */
export function dailyPoolsOf(kind: PuzzleKind, size: number): readonly DailyPool[] | null {
  const lang = dailyLanguageOf(kind);
  return lang === null ? null : poolsIn(lang, size);
}

function poolsIn(lang: DailyLanguage, size: number): readonly DailyPool[] | null {
  const key = `${lang}:${size}`;
  const known = READ.get(key);
  if (known !== undefined) return known;
  if (lang === "ja") {
    if (KANA_POOL_SIZES.includes(size)) throw new Error(`The ${size}-kana daily pool has not been loaded (loadDailyPools).`);
    return null;
  }
  const packed = ALPHABET_POOLS[lang][size];
  if (packed === undefined) return null;
  const pools = unpacked(packed);
  READ.set(key, pools);
  return pools;
}

/**
 * The lengths a kind has a word of the day at: every length its set-up offers
 * (`sizesOffered`, both shelves of Pop Gomoji's), in order, that has a pool. A new length appears here the
 * day its pool is written; `dailyPools.test.ts` fails the build until it is.
 */
export function dailyLengths(kind: PuzzleKind): number[] {
  const lang = dailyLanguageOf(kind);
  if (lang === null) return [];
  const has = (size: number) => (lang === "ja" ? KANA_POOL_SIZES.includes(size) : ALPHABET_POOLS[lang][size] !== undefined);
  return [...sizesOffered(kind)].sort((a, b) => a - b).filter(has);
}

/** A kind's word for a day at a length, with its place in the cycle, or null for a day or length that has none. */
export function dailyWordOf(kind: PuzzleKind, size: number, day: string): DayWord | null {
  const pools = dailyPoolsOf(kind, size);
  if (pools === null) return null;
  return wordOfDay(`${dailyLanguageOf(kind)}:${size}`, pools, dayIndexOf(day));
}

/**
 * The word a seed hides when it is a day's seed (`dailyWordSeed`), or null for
 * every other seed — which the generators read as "draw the word as always".
 */
export function dailyWordOfSeed(kind: PuzzleKind, size: number, seed: number): string | null {
  const day = dayOfDailyWordSeed(seed);
  if (day === null) return null;
  return dailyWordOf(kind, size, day)?.word ?? null;
}

/**
 * A DAY'S FUTAGO (`futago.ts`): two words a day at every length, from the same
 * pool as the day's one word and in an order of their own, drawn two places at
 * a time — day N is places 2N and 2N + 1 of the Futago's cycles. So the two
 * words of a day are never one word twice, and the year the one-word cycle
 * keeps between two plays of a word (`dailyCycle.ts`) holds for every
 * Futago word too, half a year of days apart at worst. Null for a day or a
 * length with no words.
 */
export function dailyFutagoWordsOf(kind: PuzzleKind, size: number, day: string): readonly [string, string] | null {
  const pools = dailyPoolsOf(kind, size);
  if (pools === null) return null;
  const key = `${dailyLanguageOf(kind)}:${size}:futago`;
  const index = dayIndexOf(day);
  const first = wordOfDay(key, pools, 2 * index);
  const second = wordOfDay(key, pools, 2 * index + 1);
  return first === null || second === null ? null : [first.word, second.word];
}

/** The two words a seed hides when it is a day's Futago seed (`futagoDailySeed`), or null for every other seed. */
export function dailyFutagoWordsOfSeed(kind: PuzzleKind, size: number, seed: number): readonly [string, string] | null {
  const day = dayOfFutagoSeed(seed);
  return day === null ? null : dailyFutagoWordsOf(kind, size, day);
}

/**
 * Whether a word is one of a pool's, at any version. A day's word is always a
 * guess its own puzzle takes, even should a later word list drop it: the
 * checks ask this of the hidden word before refusing it as "not a word". A
 * kana pool not fetched answers no, and the check refuses, as it would anyway.
 */
export function isDailyPoolWord(lang: DailyLanguage, size: number, word: string): boolean {
  let pools: readonly DailyPool[] | null;
  try {
    pools = poolsIn(lang, size);
  } catch {
    return false;
  }
  return pools?.some((pool) => pool.words.includes(word)) ?? false;
}
