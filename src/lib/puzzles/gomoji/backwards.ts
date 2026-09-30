import type { PuzzleKind } from "../puzzles.types";
import { kanaWordsOf } from "../gomojiKana/kanaWords";
import { kanaBase, markKanaGuess } from "../gomojiKana/kanaMarks";
import { allowedFor, isWord, languageOf, markGuess } from "./code";

/**
 * GOMOJI PLAYED BACKWARDS: Gomoji Sakasa 逆さ, our version of the Antiwordle
 * idea. A word is hidden as ever, and the aim is NOT to find it: every row of
 * the board filled without typing it is a win, and typing it ends the game.
 *
 * What makes it a puzzle is that every letter uncovered has to be used again
 * (Gomoji's own hard rule, `breaksHardRule`): a green stays where it is, an
 * orange is used somewhere, and a grey may not be typed again. So each row
 * narrows what the next may be, towards the one word that keeps to all of it,
 * which is the hidden one. The colours are Gomoji's, marked as ever.
 *
 * Harder is longer, so the levels run backwards too: easy asks for the
 * published game's count of rows, medium one more, hard the whole board —
 * an ordinary Gomoji's hard count at easy and its easy count at hard.
 */

export { backwardsGuesses } from "./backwardsRows";

/**
 * WHAT THE ROWS SO FAR ASK OF THE NEXT, worked out once from the guesses and
 * the word so that a list of thousands can be tested against it quickly: the
 * places fixed green, how many of each letter must be used again (by its base,
 * for kana), and the letters shown grey and nowhere found, never to be typed.
 */
export type BackwardsKeep = { fixed: string[]; need: Map<string, number>; banned: Set<string>; typed: Set<string>; kana: boolean };

export function backwardsKeep(kind: PuzzleKind, guesses: readonly string[], word: string): BackwardsKeep {
  const kana = kind === "gomojiKana";
  const fixed: string[] = [];
  const need = new Map<string, number>();
  const banned = new Set<string>();
  for (const guess of guesses) {
    const units = [...guess];
    const found = new Map<string, number>();
    const greys: string[] = [];
    if (kana) {
      markKanaGuess(units, [...word]).forEach((mark, at) => {
        const plain = mark.mark === "hit" && !mark.wrongSize && !mark.wrongMark;
        const base = kanaBase(units[at]!);
        if (plain) fixed[at] = units[at]!;
        else if (mark.mark === "hit" || mark.mark === "near") found.set(base, 1);
        else greys.push(base);
        if (plain) found.set(base, found.get(base) ?? 0);
      });
    } else {
      markGuess(guess, word).forEach((mark, at) => {
        const letter = units[at]!;
        if (mark === "hit") fixed[at] = letter;
        if (mark === "miss") greys.push(letter);
        else found.set(letter, (found.get(letter) ?? 0) + 1);
      });
    }
    for (const [unit, count] of found) if (count > (need.get(unit) ?? 0)) need.set(unit, count);
    for (const grey of greys) if (!found.has(grey)) banned.add(grey);
  }
  return { fixed, need, banned, typed: new Set(guesses), kana };
}

/** Why a guess may not follow, in words, or null when it may. */
export function breaksKeep(keep: BackwardsKeep, next: string): string | null {
  if (keep.typed.has(next)) return `${show(next)} has been played already`;
  const units = [...next];
  for (const [at, unit] of keep.fixed.entries()) {
    if (unit !== undefined && units[at] !== unit) return `the ${ordinal(at + 1)} must stay ${show(unit)}`;
  }
  const bases = keep.kana ? units.map(kanaBase) : units;
  for (const [unit, count] of keep.need) {
    if (bases.filter((each) => each === unit).length < count) return `the guess must use ${show(unit)}`;
  }
  const again = bases.find((each) => keep.banned.has(each));
  return again === undefined ? null : `${show(again)} was grey, and may not be used again`;
}

const show = (unit: string) => unit.toUpperCase();
const ordinal = (n: number) => ["first", "second", "third", "fourth", "fifth", "sixth"][n - 1] ?? `${n}th`;

/**
 * Why a guess may not follow these, in words, or null when it may: every
 * letter uncovered used again — a green in its place, an orange somewhere —
 * and no letter shown grey typed again. The hidden word always keeps to it,
 * so a player is never left with no guess at all: only, at the last, with it.
 */
export function breaksBackwardsRule(kind: PuzzleKind, guesses: readonly string[], word: string, next: string): string | null {
  return breaksKeep(backwardsKeep(kind, guesses, word), next);
}

/** Whether a word may be guessed at all in this Gomoji: in its list, as any guess must be. */
export function isGuessable(kind: PuzzleKind, size: number, word: string): boolean {
  if (kind === "gomojiKana") return [...word].length === size && kanaWordsOf(size).allowed.has(word);
  return isWord(word, size, languageOf(kind));
}

/** The words the generator's way through is drawn from: the level's answers, words anybody would know. */
function wayPool(kind: PuzzleKind, size: number): readonly string[] {
  return kind === "gomojiKana" ? [...kanaWordsOf(size).allowed] : allowedFor(size, languageOf(kind));
}

/** `count` words spread through a list from a place the seed chooses: the same sample in every browser. */
function spread(words: readonly string[], count: number, seed: number): string[] {
  if (words.length <= count) return [...words];
  const step = words.length / count;
  const offset = (Math.abs(seed) % 997) / 997;
  return Array.from({ length: count }, (_, at) => words[Math.floor((at + offset) * step) % words.length]!);
}

/**
 * A WAY THROUGH, for the generator's solution and the tests: `rows` guesses,
 * none of them the word, each keeping to the rule. Each is the one of a
 * sample of the words that may follow which leaves the most words able to
 * follow it — a player who knew the word, keeping their options open. Null
 * when the sample finds no way, which the tests hold never happens.
 */
export function survive(kind: PuzzleKind, size: number, word: string, rows: number, seed: number, sample = 80): string[] | null {
  const pool = wayPool(kind, size).filter((each) => each !== word);
  const guesses: string[] = [];
  const open = (after: readonly string[], among: readonly string[]) => {
    const keep = backwardsKeep(kind, after, word);
    return among.filter((each) => each !== word && breaksKeep(keep, each) === null);
  };
  while (guesses.length < rows) {
    const choices = open(guesses, pool);
    if (choices.length === 0) return null;
    const tries = spread(choices, sample, seed + guesses.length);
    const probe = spread(pool, sample * 2, seed - guesses.length);
    let pick = tries[0]!;
    let best = -1;
    for (const each of tries) {
      const after = [...guesses, each];
      const room = guesses.length + 1 === rows ? 1 : open(after, probe).length;
      if (room > best) {
        best = room;
        pick = each;
      }
    }
    guesses.push(pick);
  }
  return guesses;
}
