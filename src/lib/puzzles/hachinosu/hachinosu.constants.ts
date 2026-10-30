import type { VariantCopy } from "../../gomoku/variants.constants";
import type { PuzzleSpec } from "../puzzles.types";

/*
 * HACHINOSU'S SHARE OF THE PUZZLES' TABLES. One card: a language is a setting of a game, never a game of its own
 * (John, 2026-09-28), so English, French and German are the set-up's tiles and the puzzle's size. The name and the
 * look are the site's own, and the words are Kotoba's real dictionaries (`@johnmorrisdotca/kotoba`).
 */

export const HACHINOSU_SPEC: PuzzleSpec = {
  sizes: [1, 2, 3],
  offered: [1, 2, 3],
  defaultSize: 1,
  levels: ["easy", "medium", "hard"],
  defaultLevel: "medium",
  // A hive's words run together, at their very most, and its givens are ten characters.
  mostCells: 2000,
  helps: false,
  layouts: true,
};

export const HACHINOSU_SIZE_NAMES: Record<number, { label: string; kanji: string }> = {
  1: { label: "English", kanji: "英語" },
  2: { label: "French", kanji: "フランス語" },
  3: { label: "German", kanji: "ドイツ語" },
};

export const HACHINOSU_DISPLAY: VariantCopy = {
  label: "Hachinosu",
  kanji: "蜂の巣",
  tagline: "Make words from seven letters, always using the one in the middle.",
  inspiredBy: "the seven-letter hive of words",
  origin:
    "Seven letters in a ring round one more is a word puzzle the newspapers made a habit of. 蜂の巣 means a beehive. The hives here are made by our own code from Kotoba, our open-source word lists, which are built from real dictionaries of each language.",
  rules: [
    "Make words of four letters or more from the seven in the hive. Every word must use the centre letter, and a letter can be used as often as you like.",
    "A four-letter word is worth 1 point. A longer one is worth a point for each of its letters.",
    "Reach the goal to finish the hive. The common words alone can always reach it, and any other word on the list counts too.",
    "Today's puzzle is the same hive for everybody in each language. Any other is a new hive from its number.",
  ],
  board: "Choose English, French or German; accents and umlauts are left off. Easy asks for about a third of what the hive's common words are worth, medium nearly half, and hard three fifths.",
};
