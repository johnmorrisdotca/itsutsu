import Link from "next/link";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { Paired } from "@/components/i18n/Paired";
import { sizeWord } from "@/components/puzzles/puzzles.constants";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS, SECTION_HEADING } from "@/components/ui/ui.constants";
import { currentMemberId } from "@/lib/auth/currentSession";
import { playPath } from "@/lib/gomoku/slugs";
import { clockText } from "@/lib/puzzles/clockText";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { PUZZLE_LEVEL_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { runsOf } from "@/lib/puzzles/server/puzzleRuns";

import { MY_GAMES_COPY } from "./mine.constants";

/**
 * THE PUZZLES A MEMBER HAS GOING, beside their games.
 *
 * John, 2026-09-24: "I started Numbers game, paused it, then clicked away...
 * why is it not showing up in my current games list?" A puzzle is kept when it
 * is paused or its page is left (`useKeptRun`), and this is where it waits:
 * the puzzle, its size and level, the time so far, and the way back to the
 * very grid, opened where it was left.
 *
 * One indexed read, of at most `RUNS_KEPT` rows. Nothing for a visitor, and
 * nothing when there is nothing going — the games list above already says
 * what to do with an empty page.
 */
export async function MyPuzzleRuns() {
  const memberId = await currentMemberId();
  if (memberId === null) return null;
  const runs = await runsOf(memberId);
  if (runs.length === 0) return null;
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="puzzles-going">
      <h2 className={SECTION_HEADING}>
        <Paired en={MY_GAMES_COPY.puzzlesGoing.label} kanji={MY_GAMES_COPY.puzzlesGoing.kanji} kanjiClassName="text-sm font-normal opacity-70" />
      </h2>
      <ul className="flex flex-col">
        {runs.map((run) => {
          const kind = run.kind as PuzzleKind;
          const level = run.level as PuzzleLevel;
          return (
            <li key={run.id} className="flex flex-wrap items-center gap-3 border-t border-rule py-2 first:border-t-0" data-testid="puzzle-going" data-kind={kind} data-seed={run.seed}>
              <GameThumb variant={kind} size="small" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
                <span className="font-medium">
                  <GameName variant={kind} /> · {sizeWord(run.size)} · {PUZZLE_LEVEL_DISPLAY[level].label}
                </span>
                <span className="text-xs text-muted">
                  {clockText(run.elapsedMs)} so far
                  {run.checksAllowed !== null ? ` · ${run.checksAllowed === 1 ? "one check" : `${run.checksAllowed} checks`}` : ""}
                </span>
              </span>
              <Link
                href={`${playPath(kind)}${puzzleQuery({ size: run.size, level, seed: run.seed, checks: run.checksAllowed })}`}
                className={`${BUTTON_BASE} ${BUTTON_QUIET} shrink-0`}
                data-testid="puzzle-going-continue"
              >
                {MY_GAMES_COPY.continueGame} →
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
