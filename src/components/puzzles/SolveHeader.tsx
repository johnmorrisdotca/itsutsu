"use client";

import type { ReactNode } from "react";

import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import { BUTTON_BASE, BUTTON_QUIET, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { HEAD_START_DISPLAY } from "@/lib/gomoku/headStartWords";
import { clockText } from "@/lib/puzzles/clockText";
import { FUTAGO_DISPLAY, wordCountOfGivens } from "@/lib/puzzles/gomoji/futago";
import { YOTSUGO_DISPLAY } from "@/lib/puzzles/gomoji/yotsugo";
import { isDodgeGivens } from "@/lib/puzzles/gomoji/dodgeSeed";
import { DODGE_DISPLAY } from "@/lib/puzzles/gomoji/dodgeWords";
import { isBackwardsGivens } from "@/lib/puzzles/gomoji/backwardsSeed";
import { BACKWARDS_DISPLAY } from "@/lib/puzzles/gomoji/backwardsWords";
import { PUZZLE_LEVEL_DISPLAY, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import { sizeWordIn } from "@/lib/puzzles/sizeWord";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";

import { PUZZLE_CLOCK } from "./puzzles.constants";
import { PuzzleNewGameBeside } from "./PuzzleNewGame";
import { usePuzzleClock } from "./PuzzleClockContext";
import { SolveCountdown } from "./SolveCountdown";
import type { Pausing } from "./solveShared";
import { SPACE_KEY } from "@/lib/ui/keyNames.constants";

/** The line over the grid: what was asked, the seed, and the clock. */
export function SolveHeader({
  puzzle,
  elapsedMs,
  pausing,
  headStart = false,
  asked,
}: {
  puzzle: Puzzle;
  elapsedMs: number;
  pausing?: Pausing;
  headStart?: boolean;
  /** What a puzzle of fixed levels says in place of size, level and number (Tsunagi's "Level 12 of 100"). */
  asked?: ReactNode;
}) {
  // A countdown where one was chosen (`PuzzleClockContext`), in the clock's own place.
  const clock = usePuzzleClock();
  const say = useSpeaker();
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <p className="text-sm text-muted" data-testid="puzzle-asked">
        {asked ?? (
          <>
            {sizeWordIn(puzzle.size, puzzle.kind, say)}
            {/* A puzzle with one level has no level to name (Kumimoji). */}
            {PUZZLE_SPECS[puzzle.kind].levels.length < 2 ? null : (
              <>
                {" "}· <Paired en={PUZZLE_LEVEL_DISPLAY[puzzle.level].label} kanji={PUZZLE_LEVEL_DISPLAY[puzzle.level].kanji} />
              </>
            )}
            {PUZZLE_SPECS[puzzle.kind].wordGrid === undefined ? null : isDodgeGivens(puzzle.givens) ? (
              <span data-testid="puzzle-asked-dodge">
                {" "}· <Paired en={DODGE_DISPLAY.label} kanji={DODGE_DISPLAY.kanji} />
              </span>
            ) : isBackwardsGivens(puzzle.givens) ? (
              <span data-testid="puzzle-asked-backwards">
                {" "}· <Paired en={BACKWARDS_DISPLAY.label} kanji={BACKWARDS_DISPLAY.kanji} />
              </span>
            ) : wordCountOfGivens(puzzle.givens) === 4 ? (
              <span data-testid="puzzle-asked-yotsugo">
                {" "}· <Paired en={say.say("pword.mode.fourWords")} kanji={YOTSUGO_DISPLAY.kanji} />
              </span>
            ) : wordCountOfGivens(puzzle.givens) === 2 ? (
              <span data-testid="puzzle-asked-futago">
                {" "}· <Paired en={say.say("pword.mode.twoWords")} kanji={FUTAGO_DISPLAY.kanji} />
              </span>
            ) : null}
            {headStart ? (
              <span data-testid="puzzle-asked-head-start">
                {" "}· <Paired en={HEAD_START_DISPLAY.label} kanji={HEAD_START_DISPLAY.kanji} />
              </span>
            ) : null}
            <span className="ml-2 text-xs">№ {puzzle.seed}</span>
          </>
        )}
      </p>
      {/*
        THE CLOCK ON THE LEFT, PAUSE ON THE RIGHT, and Pause always there. John,
        2026-09-25: "Pause button and clock should swap, since button has fixed
        size, and time doesn't." The button is one width for both words and is
        drawn from the start, switched off until the clock runs, so nothing
        beside it moves when the first entry starts the clock. Not in a race,
        whose clock nothing here can stop.
      */}
      <div className="flex items-center gap-2">
        {clock === "none" ? (
          <p className={PUZZLE_CLOCK} data-testid="puzzle-clock" aria-label={say.say("puzzle.solve.timeTaken")}>
            {clockText(elapsedMs)}
          </p>
        ) : (
          <SolveCountdown clock={clock} elapsedMs={elapsedMs} />
        )}
        {pausing !== undefined && !pausing.racing ? (
          <button
            type="button"
            className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} w-24 px-3 py-1 text-sm`}
            onClick={pausing.toggle}
            disabled={!pausing.canPause}
            aria-pressed={pausing.paused}
            aria-keyshortcuts={puzzle.kind === "gomoji" ? SPACE_KEY : "P"}
            data-testid="puzzle-pause"
          >
            {say.say(pausing.paused ? "puzzle.solve.resume" : "puzzle.solve.pause")}
          </button>
        ) : null}
        {pausing !== undefined && !pausing.racing ? <PuzzleNewGameBeside kind={puzzle.kind} /> : null}
      </div>
    </div>
  );
}
