import { markGuess, type LetterMark } from "./gomoji/code";
import { kanaBase, markKanaGuess, type KanaMark } from "./gomojiKana/kanaMarks";

/**
 * WHAT EACH KEY OF A WORD PUZZLE SHOWS: the best mark its letter has had on
 * the board so far. The live screens colour their keyboards from it, and the
 * replay after a game colours its keyboard from the guesses up to the step
 * being looked at, so the two can never disagree.
 */
const LETTER_RANK: Record<LetterMark, number> = { hit: 3, near: 2, miss: 1 };

/** English: by letter, in its place over elsewhere over not in the word. */
export function letterKeyMarks(guesses: readonly string[], hidden: string): Map<string, LetterMark> {
  const best = new Map<string, LetterMark>();
  for (const guess of guesses) {
    const marks = markGuess(guess, hidden);
    [...guess].forEach((letter, at) => {
      const mark = marks[at]!;
      const was = best.get(letter);
      if (was === undefined || LETTER_RANK[mark] > LETTER_RANK[was]) best.set(letter, mark);
    });
  }
  return best;
}

/**
 * Kana: by base (ぱ counts for the は key), green over orange over yellow over
 * grey. John, 2026-09-25: "I think the yellow CHI should also be yellow in the
 * keyboard."
 */
const KANA_RANK: Record<KanaMark, number> = { hit: 4, near: 3, kin: 2, miss: 1 };

export function kanaKeyMarks(rows: readonly string[], word: string): Map<string, KanaMark> {
  const best = new Map<string, KanaMark>();
  for (const row of rows) {
    const marks = markKanaGuess([...row], [...word]);
    [...row].forEach((kana, at) => {
      const mark = marks[at]!.mark;
      const base = kanaBase(kana);
      const was = best.get(base);
      if (was === undefined || KANA_RANK[mark] > KANA_RANK[was]) best.set(base, mark);
    });
  }
  return best;
}

/**
 * The keys a head start greyed (`headStart.ts`), laid under what the guesses
 * have said: each is marked not in the word, as a guess would have marked it,
 * unless a guess has already said something better of it (a kana's yellow).
 * A new map; the one given is left as it was.
 */
export function withHeadStart<Mark extends string>(known: ReadonlyMap<string, Mark>, keys: readonly string[], miss: Mark): Map<string, Mark> {
  const out = new Map(known);
  for (const key of keys) if (!out.has(key)) out.set(key, miss);
  return out;
}

/**
 * How many times each letter is in the row being typed: its key is ringed at
 * one and carries a count at two or more. John, 2026-09-25: "add Count chips
 * on a letter when it is selected more than once." The row being typed only —
 * the guesses already sent are on the board, and the chip is about what is
 * being chosen now. A kana counts by its base, so ぱ and は are two of は.
 */
export function typedCounts(slots: readonly string[], keyOf: (letter: string) => string = (letter) => letter): Map<string, number> {
  const counts = new Map<string, number>();
  for (const slot of slots) {
    if (slot === "") continue;
    const key = keyOf(slot);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * HOW MANY OF A LETTER THE WORD IS KNOWN TO HOLD, read off the marks the
 * board already shows and never off the hidden word, so a key says no more
 * than a player looking at the board could work out. John, 2026-09-26, on a
 * solved PRIOR: "A Keyboard where a Letter was used twice should show the (2)
 * count superscript badge on the Letter R."
 *
 * Each copy of a letter marked in its place or in the word elsewhere is a
 * copy the word holds, because a guess's marks never give a letter more
 * copies than the word has (`markGuess`, `markKanaGuess`). So one guess
 * proves as many as it marked, and the word holds at least the most any
 * single guess proved: the most, not the sum, since a yellow R in one guess
 * and a yellow R in the next may be the same R. A copy marked grey proves
 * nothing more, so ERROR against a word with one R, one green and two grey,
 * proves one.
 *
 * Kana: green and orange count, green with an arrow included (the kana is in
 * that place, only its size or mark differs), and yellow does not (it says
 * the place holds a kana of the same row, not this one). Counted by base, as
 * the keys are, so ぱ and は are two of the は key: `keyOf` does that.
 *
 * Every letter proved at least once is in the map; a key shows its count from
 * two. `marks[i]` are the marks of `guesses[i]`, place by place.
 */
export function knownCounts(guesses: readonly string[], marks: readonly (readonly string[])[], keyOf: (letter: string) => string = (letter) => letter): Map<string, number> {
  const most = new Map<string, number>();
  guesses.forEach((guess, row) => {
    const shown = marks[row];
    if (shown === undefined) return;
    const proved = new Map<string, number>();
    [...guess].forEach((letter, at) => {
      const mark = shown[at];
      if (mark !== "hit" && mark !== "near") return;
      const key = keyOf(letter);
      proved.set(key, (proved.get(key) ?? 0) + 1);
    });
    for (const [key, count] of proved) if (count > (most.get(key) ?? 0)) most.set(key, count);
  });
  return most;
}

/**
 * What a screen reader hears for a key beyond its letter: how many the word is
 * known to hold (`knownCounts`) and how many are in the row being typed
 * (`typedCounts`), each from two, as the key shows them. "R, in the word
 * twice", "R, 2 in the row", or both; nothing extra when neither is shown.
 */
export function keyLabel(letter: string, known: number, typed: number): string | undefined {
  const said: string[] = [];
  if (known >= 2) said.push(`in the word ${known === 2 ? "twice" : `${known} times`}`);
  if (typed >= 2) said.push(`${typed} in the row`);
  return said.length === 0 ? undefined : [letter.toUpperCase(), ...said].join(", ");
}
