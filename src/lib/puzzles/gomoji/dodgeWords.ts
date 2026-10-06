import { speaker, type Speaker } from "../../i18n/i18n";
import { DEFAULT_LOCALE } from "../../i18n/i18n.constants";
import type { PuzzleSpec } from "../puzzles.types";

/**
 * WHAT A GOMOJI NIGE 逃げ IS CALLED, AND WHAT A READER IS TOLD (`dodge.ts`).
 *
 * Our own name for our version of the Absurdle idea: nige 逃げ is running
 * away, which is all the word does. A way of playing every Gomoji rather than
 * a puzzle of its own, so its words are a line on the set-up screen and a
 * bullet on each Gomoji's rules page. Kept here, rather than in the puzzles'
 * copy, which is stamped for their pictures (`puzzleArtFingerprint.ts`) and
 * none of which shows a dodger.
 */
export const DODGE_DISPLAY = {
  label: "Nige",
  kanji: "逃げ",
  /** What it is our version of, as a Gomoji's copy says its own (`inspiredBy`). */
  inspiredBy: "Absurdle",
} as const;

/** The line under the chips on the set-up screen when a Nige is chosen (`PlayWayChips`). */
export function dodgeBlurb(rows: number, say: Speaker = speaker(DEFAULT_LOCALE)): string {
  return say.say("puzzle.mode.nige.blurb", { rows: String(rows) });
}

/** The bullet on a Gomoji's rules page, in the Play section (`puzzleRulesPage.ts`). */
export function dodgeRule(grid: NonNullable<PuzzleSpec["wordGrid"]>, say: Speaker = speaker(DEFAULT_LOCALE)): string {
  return say.say(grid === "gomojiKana" ? "puzzle.mode.nige.ruleKana" : "puzzle.mode.nige.ruleLetter");
}
