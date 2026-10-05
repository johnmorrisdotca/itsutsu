import type { Puzzle, PuzzleLevel } from "../puzzles.types";
import { seededRandom } from "../random";
import { cluesOf, encodeClues, encodePicture } from "./code";
import { drawPicture, drawScene } from "./picture";
import type { PictureStyle } from "./pictureLogic.types";
import { solveClues } from "./solve";

/**
 * Making a Picture logic puzzle, in the browser, from a seed.
 *
 * A picture first (`picture.ts`: a figure, hills or a cloud, drawn from whole
 * shapes), then its clues read off it, then the solver (`solve.ts`) works the
 * clues the way a person would. When the solver finishes, every step it took
 * was forced, so the picture is the one answer; the level is the least the
 * solver needed. A picture whose clues the solver cannot finish — two answers,
 * or one that only a search would find — is dropped, as is one that finishes
 * at another level than the one asked, and the next is drawn from the same
 * stream, so one seed always makes one puzzle.
 *
 * Measured 2026-09-29, over 600 pictures a size: a picture is drawn and judged
 * in about a tenth of a millisecond at 5×5 and a quarter at 20×20 (a cloud
 * needing trials, the slowest, 75 ms at worst). Of those the solver finishes,
 * most are easy; medium is about one in fifty at 5×5, one in eight at 10×10
 * and one in three at 20×20; hard, a trial needed, about one in a hundred
 * at every size (one in twenty-five of the 5×5 figures). So the rarest, a hard
 * 20×20, is a few hundred pictures and well under a second, and
 * `MOST_PICTURES` is far past what any seed needs.
 *
 * THE TWO BIGGEST, 40×40 AND 50×50 (2026-10-05), are made another way, for two
 * reasons found by measuring. A trial round tries every unknown cell twice,
 * which at 2,500 cells is far past a browser's patience, so a big board is
 * judged by lines alone (`solveClues` with `most` at the level asked) and
 * is offered at easy and medium only. And one picture across fifty squares is
 * a blob a clue or two a line describes, so a big board is a scene of four, one
 * to a quarter (`drawScene`), each quarter redrawn until it is solvable by
 * itself at that level, which makes the four together far likelier to be. Over
 * a hundred seeds each, on a laptop: 40×40 easy 13 ms at the median and 76 at
 * worst, medium 3 and 8; 50×50 easy 33 and 264, medium 4 and 11.
 */

/** How many pictures to draw before settling for the nearest level, so a seed can never run on. */
const MOST_PICTURES = 4000;

/** Which kind of picture a draw makes: figures most, then hills, then clouds. */
function styleOf(roll: number): PictureStyle {
  return roll < 0.45 ? "figure" : roll < 0.75 ? "hills" : "cloud";
}

const RANK: Record<PuzzleLevel, number> = { easy: 0, medium: 1, hard: 2, "extra-hard": 2 };

/**
 * The biggest side a puzzle is still judged with trials. Past it a puzzle is
 * made by reading lines alone — the ends and whole lines, never a guess, so
 * it can be solved line by line and has one answer all the same — because a
 * trial round settles the whole grid twice for every unknown cell, which at
 * 2,500 cells is the slowest thing a browser would do. Easy and medium only
 * are offered there (`levelsAt`).
 */
export const TRIALS_UP_TO = 30;

/** Past this side a picture is a scene of four (`drawScene`), because one picture is too plain to fill so many lines. */
const SCENE_FROM = 30;

export function generatePictureLogic(size: number, level: PuzzleLevel, seed: number): Puzzle {
  const random = seededRandom(seed);
  // The hardest level worth reading the clues for: all of them, or on a big board only as far as the level asked, in lines alone.
  const most: PuzzleLevel = size <= TRIALS_UP_TO ? "hard" : level === "easy" ? "easy" : "medium";
  // A big board has no hard puzzle to make (`levelsAt`); one asked for by hand is the medium it can be, and found at once, not after a search that cannot end well.
  const aim: PuzzleLevel = size > TRIALS_UP_TO && level === "hard" ? "medium" : level;
  let fallback: { givens: string; solution: string; off: number } | null = null;
  for (let attempt = 0; attempt < MOST_PICTURES; attempt += 1) {
    const picture = size > SCENE_FROM ? drawScene(size, styleOf, random, (part, side) => part.some(Boolean) && solveClues(cluesOf(part, side), most) !== null) : drawPicture(size, styleOf(random()), random);
    if (!picture.some(Boolean)) continue;
    const clues = cluesOf(picture, size);
    const found = solveClues(clues, most);
    if (found === null) continue;
    const made = { givens: encodeClues(clues), solution: encodePicture(picture) };
    if (found.level === aim) return { kind: "pictureLogic", size, level, seed, ...made };
    // The nearest level kept, in case the one asked never comes.
    const off = Math.abs(RANK[found.level] - RANK[aim]);
    if (fallback === null || off < fallback.off) fallback = { ...made, off };
  }
  if (fallback === null) throw new Error(`No ${size}×${size} Picture logic puzzle came from seed ${seed}.`);
  return { kind: "pictureLogic", size, level, seed, givens: fallback.givens, solution: fallback.solution };
}
