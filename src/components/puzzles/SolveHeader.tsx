"use client";

import type { ReactNode } from "react";

import { BUTTON_BASE, BUTTON_QUIET, TAP_HEIGHT } from "@/components/ui/ui.constants";
import { HEAD_START_DISPLAY } from "@/lib/gomoku/headStartWords";
import { clockText } from "@/lib/puzzles/clockText";
import { wordCountOfGivens } from "@/lib/puzzles/gomoji/futago";
import { YOTSUGO_DISPLAY, wordModeDisplay } from "@/lib/puzzles/gomoji/yotsugo";
import { PUZZLE_LEVEL_DISPLAY, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";

import { PUZZLE_CLOCK, sizeWord } from "./puzzles.constants";
import type { Pausing } from "./solveShared";

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
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <p className="text-sm text-muted" data-testid="puzzle-asked">
        {asked ?? (
          <>
            {sizeWord(puzzle.size, puzzle.kind)}
            {/* A puzzle with one level has no level to name (Kumimoji). */}
            {PUZZLE_SPECS[puzzle.kind].levels.length < 2 ? null : (
              <>
                {" "}· {PUZZLE_LEVEL_DISPLAY[puzzle.level].label} <span className="font-mincho">{PUZZLE_LEVEL_DISPLAY[puzzle.level].kanji}</span>
              </>
            )}
            {(() => {
              // A Futago's two words or a Yotsugo's four (`yotsugo.ts`), said beside the level.
              const mode = PUZZLE_SPECS[puzzle.kind].wordGrid === undefined ? null : wordModeDisplay(wordCountOfGivens(puzzle.givens));
              return mode === null ? null : (
                <span data-testid={mode === YOTSUGO_DISPLAY ? "puzzle-asked-yotsugo" : "puzzle-asked-futago"}>
                  {" "}· {mode.words} <span className="font-mincho">{mode.kanji}</span>
                </span>
              );
            })()}
            {headStart ? (
              <span data-testid="puzzle-asked-head-start">
                {" "}· {HEAD_START_DISPLAY.label} <span className="font-mincho">{HEAD_START_DISPLAY.kanji}</span>
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
        <p className={PUZZLE_CLOCK} data-testid="puzzle-clock" aria-label="time taken">
          {clockText(elapsedMs)}
        </p>
        {pausing !== undefined && !pausing.racing ? (
          <button
            type="button"
            className={`${BUTTON_BASE} ${BUTTON_QUIET} ${TAP_HEIGHT} w-24 px-3 py-1 text-sm`}
            onClick={pausing.toggle}
            disabled={!pausing.canPause}
            aria-pressed={pausing.paused}
            aria-keyshortcuts={puzzle.kind === "gomoji" ? "Space" : "P"}
            data-testid="puzzle-pause"
          >
            {pausing.paused ? "Resume" : "Pause"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
