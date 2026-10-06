import { clockText } from "@/lib/puzzles/clockText";
import { fixedLevelName } from "@/lib/puzzles/fixedLevel";
import { keptRunAsked } from "@/lib/puzzles/puzzleAddress";
import { clockWord } from "@/lib/puzzles/puzzleClock";
import { levelLabel } from "@/lib/puzzles/puzzleCopy";
import { PUZZLE_CLOCK_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { sizeWordIn } from "@/lib/puzzles/sizeWord";
import type { Speaker } from "@/lib/i18n/i18n";

/** What a kept run is, in a line: its size, its level, the time so far and whatever else set it apart. */
export type KeptRunLike = Parameters<typeof keptRunAsked>[1] & { elapsedMs: number; seed: number; level: string };

/**
 * A KEPT RUN, NAMED BY WHAT IT IS: "3×3 · Easy · 1:23 so far", in the
 * reader's language.
 *
 * One line for My games' row (`MyPuzzleRuns`) and for the set-up screen's note
 * of the run the reader already has (`SetUpKept`), so the two can never
 * describe the same run differently. John, 2026-10-06, pressing Continue on a
 * Cube set-up after choosing a 2×2: "it starts with a 3x3 game." The button
 * said Continue and nothing about which; this is the which.
 */
export function keptRunDetail(kind: PuzzleKind, run: KeptRunLike, say: Speaker): string {
  const asked = keptRunAsked(kind, run);
  return [
    `${sizeWordIn(run.size, kind, say)} · ${fixedLevelName(kind, run.seed, say) ?? levelLabel(run.level as PuzzleLevel, say.locale)} · ${say.say("pset.mine.soFar", { time: clockText(run.elapsedMs) })}`,
    run.checksAllowed !== null ? ` · ${say.count("pset.mine.checks", run.checksAllowed)}` : "",
    asked.hints ? ` · ${say.say("pset.mine.hints")}` : "",
    run.strict ? ` · ${say.say("pset.mine.strict")}` : "",
    asked.headStart ? ` · ${say.say("pset.fast.headStart")}` : "",
    asked.clock === undefined || asked.clock === "none" ? "" : ` · ${say.say("pset.mine.countdownLeft", { countdown: clockWord(asked.clock, say), time: clockText(Math.max(0, (PUZZLE_CLOCK_DISPLAY[asked.clock].ms ?? 0) - run.elapsedMs)) })}`,
  ].join("");
}
