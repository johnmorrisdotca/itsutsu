import { wordDataOf } from "../gomoji/wordData";
import { seededRandom, type Random } from "../random";
import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { encodeFound, encodeHive, HIVE_LANGUAGES, HIVE_LONGEST, HIVE_SHORTEST, wordPoints, type Hive } from "./code";

/**
 * MAKING A HIVE, in the browser, from a seed and a word list.
 *
 * A six-letter word with six different letters gives six of the seven, so every hive has at least one long word in it
 * and a player has something to look for. The seventh is a letter of the alphabet drawn at the seed's
 * word; the centre one of the seven. A hive is kept when the common words in it, those Kotoba lists as answers, are
 * as many as the level wants. The goal is a share of what those words are worth; any other word
 * on the list counts as well, so a good vocabulary finishes sooner, and the goal can always be reached by words most people know.
 */

/** How many common words a hive of each level holds, and the share of their points that finishes it. */
const HIVE_LEVELS: Record<"easy" | "medium" | "hard", { least: number; most: number; share: number }> = {
  easy: { least: 15, most: 45, share: 0.3 },
  medium: { least: 20, most: 70, share: 0.45 },
  hard: { least: 25, most: 90, share: 0.6 },
};

/** A word's letters as bits, for testing a word against a hive in one step. */
function bitsOf(word: string): number {
  let bits = 0;
  for (let at = 0; at < word.length; at += 1) bits |= 1 << (word.charCodeAt(at) - 97);
  return bits;
}

type Indexed = { common: { word: string; bits: number }[]; roots: string[] };
const INDEX = new Map<string, Indexed>();

function indexOf(language: "en" | "fr" | "de"): Indexed {
  const known = INDEX.get(language);
  if (known !== undefined) return known;
  const data = wordDataOf(language);
  const common: { word: string; bits: number }[] = [];
  const roots: string[] = [];
  for (let length = HIVE_SHORTEST; length <= HIVE_LONGEST; length += 1) {
    for (const word of (data[length]?.answers ?? "").split(/\s+/).filter(Boolean)) {
      if (!/^[a-z]+$/.test(word)) continue;
      const bits = bitsOf(word);
      common.push({ word, bits });
      if (length === HIVE_LONGEST && new Set(word).size === HIVE_LONGEST) roots.push(word);
    }
  }
  const made = { common, roots };
  INDEX.set(language, made);
  return made;
}

/** Draw a hive; the words on the common list it holds, longest first. */
function draw(random: Random, index: Indexed): { hive: Omit<Hive, "goal">; words: string[] } {
  const root = index.roots[Math.floor(random() * index.roots.length)]!;
  const spare = [..."abcdefghijklmnopqrstuvwxyz"].filter((letter) => !root.includes(letter));
  const letters = [...root, spare[Math.floor(random() * spare.length)]!];
  const centre = letters[Math.floor(random() * letters.length)]!;
  const rest = letters.filter((letter) => letter !== centre);
  for (let at = rest.length - 1; at > 0; at -= 1) {
    const other = Math.floor(random() * (at + 1));
    [rest[at], rest[other]] = [rest[other]!, rest[at]!];
  }
  const every = bitsOf(letters.join(""));
  const middle = bitsOf(centre);
  const words = index.common.filter((entry) => (entry.bits & middle) !== 0 && (entry.bits | every) === every).map((entry) => entry.word);
  return { hive: { centre, letters: rest.join("") }, words };
}

export function generateHachinosu(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const language = HIVE_LANGUAGES[size]!;
  const wanted = HIVE_LEVELS[level === "easy" || level === "hard" ? level : "medium"];
  const index = indexOf(language);
  const random = seededRandom(seed * 37 + size);
  random();
  random();
  let best: { hive: Omit<Hive, "goal">; words: string[] } | null = null;
  for (let tries = 0; tries < 400; tries += 1) {
    const each = draw(random, index);
    if (each.words.length >= wanted.least && each.words.length <= wanted.most) {
      best = each;
      break;
    }
    // A hive is never refused for want of one in the band: the closest under it stands in, a list being what it is.
    if (each.words.length <= wanted.most && (best === null || each.words.length > best.words.length)) best = each;
  }
  const { hive, words } = best!;
  const total = words.reduce((sum, word) => sum + wordPoints(word), 0);
  const goal = Math.max(1, Math.round(total * wanted.share));
  // The answer a solver would give: the longest words first, as far as the goal.
  const sorted = [...words].sort((a, b) => b.length - a.length || a.localeCompare(b));
  const solution: string[] = [];
  let points = 0;
  for (const word of sorted) {
    if (points >= goal) break;
    solution.push(word);
    points += wordPoints(word);
  }
  return { kind: "hachinosu", size, level, seed, givens: encodeHive({ ...hive, goal }), solution: encodeFound(solution) };
}

/** Every common word a hive holds, for what the end of a game shows. */
export function commonWordsOf(size: number, centre: string, letters: string): string[] {
  const index = indexOf(HIVE_LANGUAGES[size]!);
  const every = bitsOf(centre + letters);
  const middle = bitsOf(centre);
  return index.common.filter((entry) => (entry.bits & middle) !== 0 && (entry.bits | every) === every).map((entry) => entry.word);
}
