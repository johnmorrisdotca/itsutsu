import type { Speaker } from "@/lib/i18n/i18n";
import { speaker } from "@/lib/i18n/i18n";
import { DEFAULT_LOCALE } from "@/lib/i18n/i18n.constants";
import { levelName } from "@/lib/puzzles/puzzleCopy";
import { joinedWith } from "@/lib/puzzles/puzzleText";
import { PUZZLE_SPECS, sizesOffered } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { sizeWordIn } from "@/lib/puzzles/sizeWord";

/**
 * The line under a puzzle's description on its front door: every board its
 * set-up offers (`sizesOffered`, shelves and all), then its levels. John,
 * 2026-09-26: Tsunagi's said "4×4, 5×5, 6×6, 7×7" while its set-up offered
 * 8×8 and 9×9 behind "Bigger boards". One function, so the line and the set-up
 * cannot disagree about the boards again; `offeredLine.test.ts` holds it.
 */
export function offeredLine(kind: PuzzleKind, say: Speaker = speaker(DEFAULT_LOCALE)): string {
  const sizes = joinedWith(say, sizesOffered(kind).map((side) => sizeWordIn(side, kind, say)));
  const levels = joinedWith(say, PUZZLE_SPECS[kind].levels.map((level) => levelName(level, say.locale)));
  return `${sizes} · ${levels}`;
}
