import type { VariantCopy } from "../../gomoku/variants.constants";
import type { PuzzleSpec } from "../puzzles.types";

/*
 * KUNIATE'S SHARE OF THE PUZZLES' TABLES. One game with one card: an outline, a flag and
 * a capital are the three ways of asking, chosen on the set-up as a size is, so a day's
 * question and a table of fastest times stay apart underneath (John, 2026-09-28: "this is
 * the correct way we should handle our language variants or corpus variants."). The name
 * and the look are the site's own; the shapes, flags and names are its open-source packages'.
 */

export const KUNIATE_SPEC: PuzzleSpec = {
  sizes: [1, 2, 3],
  offered: [1, 2, 3],
  defaultSize: 1,
  levels: ["easy", "medium", "hard"],
  defaultLevel: "medium",
  // Givens are three characters; an answer is six guesses of two letters.
  mostCells: 12,
  helps: false,
  layouts: true,
};

/** Each way of asking, under its tile. The tile's big mark is one character (`TILE_MARKS` in `PuzzleBoardAndSizes.tsx`: 形, 旗, 都); the kanji here is the plain word under it. */
export const KUNIATE_SIZE_NAMES: Record<number, { label: string; kanji: string }> = {
  1: { label: "Outline", kanji: "形" },
  2: { label: "Flag", kanji: "旗" },
  3: { label: "Capital", kanji: "首都" },
};

export const KUNIATE_DISPLAY: VariantCopy = {
  label: "Kuniate",
  kanji: "国当て",
  tagline: "Name the hidden country from its outline, its flag or its capital, in six guesses.",
  inspiredBy: "the guess-the-country puzzle of the day",
  origin:
    "Telling a country by its shape is as old as the school atlas, and a puzzle of the day has lately made it a habit. 国当て means guessing the country. The outlines here are drawn from Natural Earth, a public-domain atlas, and the flags and capitals come from our own open-source packages, Chizu, Hata and Kuni.",
  rules: [
    "A country is hidden. You are shown its outline, its flag or the name of its capital, whichever you chose.",
    "You have six guesses. Start typing a name and choose it from the list: every country and territory is on it, in the language you read.",
    "After a wrong guess you are told how far that place is from the answer and which way to go from it.",
    "Today's puzzle is the same for everybody, a different country for each way of asking. Any other is a new country from its number.",
  ],
  board: "Outline shows the country's shape and nothing else. Flag shows its flag. Capital names its capital city. Easy asks for the best-known countries, medium for more, and hard for any of the world's 195.",
};
