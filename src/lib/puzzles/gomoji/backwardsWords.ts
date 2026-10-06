import { speaker, type Speaker } from "../../i18n/i18n";
import { DEFAULT_LOCALE } from "../../i18n/i18n.constants";
import type { PuzzleSpec } from "../puzzles.types";
import { SAKASA_SCORE } from "./backwardsScore";

/**
 * WHAT A GOMOJI SAKASA 逆さ IS CALLED, AND WHAT A READER IS TOLD (`backwards.ts`).
 *
 * Our own name for our version of the Antiwordle idea: sakasa 逆さ is upside
 * down, the wrong way round, which is how it is played. A way of playing every
 * Gomoji rather than a puzzle of its own, so its words are a line on the set-up
 * screen and a bullet on each Gomoji's rules page. Kept here, rather than in
 * the puzzles' copy, which is stamped for their pictures
 * (`puzzleArtFingerprint.ts`) and none of which shows a Sakasa.
 */
export const BACKWARDS_DISPLAY = {
  label: "Sakasa",
  kanji: "逆さ",
  /** What it is our version of, as a Gomoji's copy says its own (`inspiredBy`). */
  inspiredBy: "Antiwordle",
} as const;

/** The line under the chips on the set-up screen when a Sakasa is chosen (`PlayWayChips`). */
export function backwardsBlurb(rows: number, say: Speaker = speaker(DEFAULT_LOCALE)): string {
  return say.say("puzzle.mode.sakasa.blurb", { rows: String(rows) });
}

/** The bullet on a Gomoji's rules page, in the Play section (`puzzleRulesPage.ts`). */
export function backwardsRule(grid: NonNullable<PuzzleSpec["wordGrid"]>, say: Speaker = speaker(DEFAULT_LOCALE)): string {
  return say.say(grid === "gomojiKana" ? "puzzle.mode.sakasa.ruleKana" : "puzzle.mode.sakasa.ruleLetter", { row: String(SAKASA_SCORE.row), through: String(SAKASA_SCORE.through) });
}
