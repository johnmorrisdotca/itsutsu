import { PUZZLE_LEVEL_DISPLAY, PUZZLE_SPECS, sizesOffered } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

import { sizeWord } from "./puzzles.constants";

/**
 * The line under a puzzle's description on its front door: every board its
 * set-up offers (`sizesOffered`, shelves and all), then its levels. John,
 * 2026-09-26: Tsunagi's said "4×4, 5×5, 6×6, 7×7" while its set-up offered
 * 8×8 and 9×9 behind "Bigger boards". One function, so the line and the set-up
 * cannot disagree about the boards again; `offeredLine.test.ts` holds it.
 */
export function offeredLine(kind: PuzzleKind): string {
  const sizes = sizesOffered(kind).map((side) => sizeWord(side, kind)).join(", ");
  const levels = PUZZLE_SPECS[kind].levels.map((level) => PUZZLE_LEVEL_DISPLAY[level].label.toLowerCase()).join(", ");
  return `${sizes} · ${levels}`;
}
