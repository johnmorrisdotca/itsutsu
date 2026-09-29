import { answersFor } from "../src/lib/puzzles/gomoji/code";
import { lettersOf } from "../src/lib/puzzles/kumimoji/grid";
import { tileWords } from "../src/lib/puzzles/kumimoji/tileWords";

/**
 * A small crossword out of a Kumimoji hand, as a player would lay it: the
 * longest everyday word the hand makes, across, and then up to `downs` words
 * hanging down from its letters, two columns apart so they never touch. The
 * everyday words are Gomoji's easy answers, so the picture does not spell a
 * word nobody knows.
 *
 * The same as the one inside `puzzle-screenshots.spec.ts`, which is watched
 * by the puzzle pictures' stamp; that spec can import this one the next time
 * its pictures are re-taken.
 */
export function crosswordFrom(hand: string, downs: number): { letter: string; square: string }[] {
  const fits = (word: string, letters: string) => [...lettersOf(word)].every(([letter, count]) => (lettersOf(letters).get(letter) ?? 0) >= count);
  const everyday = (length: number) => (length === 4 || length === 5 ? answersFor(length, true) : tileWords().byLength.get(length)!);
  const across = [5, 4].map((length) => everyday(length).find((word) => fits(word, hand))).find((word) => word !== undefined)!;
  const laid = [...across].map((letter, col) => ({ letter, square: `0,${col}` }));
  let left = hand;
  for (const letter of across) left = left.replace(letter, "");
  let from = -2;
  for (let col = 0; col < across.length && laid.length < hand.length; col += 1) {
    if (col - from < 2 || downs === 0) continue;
    const down = [5, 4]
      .map((length) => everyday(length).find((word) => word[0] === across[col] && fits(word.slice(1), left)))
      .find((word) => word !== undefined);
    if (down === undefined) continue;
    for (const [row, letter] of [...down.slice(1)].entries()) {
      laid.push({ letter, square: `${row + 1},${col}` });
      left = left.replace(letter, "");
    }
    from = col;
    downs -= 1;
  }
  return laid;
}
