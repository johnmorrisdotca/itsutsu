import Link from "@/components/ui/Link";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { sizeWord } from "@/components/puzzles/puzzles.constants";
import { CardArrow } from "@/components/ui/CardArrow";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS, RAISED_LINK, STRETCHED_HOST } from "@/components/ui/ui.constants";
import { familyPath, playPath } from "@/lib/gomoku/slugs";
import { clockText } from "@/lib/puzzles/clockText";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { PUZZLE_LEVEL_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import type { runsOf } from "@/lib/puzzles/server/puzzleRuns";

import { GroupHeading } from "./GroupHeading";
import { MY_GAMES_COPY, MY_PUZZLE_ROW } from "./mine.constants";

/**
 * THE PUZZLES A MEMBER HAS GOING, beside their games.
 *
 * John, 2026-09-24: "I started Numbers game, paused it, then clicked away...
 * why is it not showing up in my current games list?" A puzzle is kept when it
 * is paused or its page is left (`useKeptRun`), and this is where it waits:
 * the puzzle, its size and level, the time so far, and the way back to the
 * very grid, opened where it was left.
 *
 * In the panel every group of games has (`GroupHeading`, the game rows' card),
 * since John, 2026-09-25, found the tab in a plain box of its own. The runs are
 * read once by `MyGamesList`, which also counts them on the tab. An empty panel
 * keeps its heading and says so, with the way to a puzzle.
 */
export function MyPuzzleRuns({ runs }: { runs: Awaited<ReturnType<typeof runsOf>> }) {
  const copy = MY_GAMES_COPY.puzzlesGoing;
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="puzzles-going">
      <GroupHeading label={copy.label} kanji={copy.kanji} total={runs.length} waiting testId="puzzles-going" />
      <p className="text-xs text-muted">{copy.hint}</p>
      {runs.length === 0 ? (
        <p className="text-sm text-muted" data-testid="puzzles-going-empty">
          {MY_GAMES_COPY.empty.puzzles}{" "}
          <Link href={familyPath("numberPlace")} className="font-medium text-ink underline underline-offset-4">
            Play one →
          </Link>
        </p>
      ) : null}
      <ul className="flex flex-col gap-1.5">
        {runs.map((run) => {
          const kind = run.kind as PuzzleKind;
          const level = run.level as PuzzleLevel;
          const href = `${playPath(kind)}${puzzleQuery({ size: run.size, level, seed: run.seed, checks: run.checksAllowed, hints: run.hintsAllowed, strict: run.strict })}`;
          return (
            <li key={run.id} className={`${STRETCHED_HOST} ${MY_PUZZLE_ROW}`} data-testid="puzzle-going" data-kind={kind} data-seed={run.seed}>
              {/* The whole card carries on, as a game's row opens its game; the name above it leads to the puzzle. */}
              <Link href={href} data-card-link="" className="absolute inset-0 rounded-lg" aria-label={`Carry on with ${kind}`} />
              <GameThumb variant={kind} size="small" />
              <span className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
                <span className="truncate font-medium">
                  <GameName variant={kind} raised />
                </span>
                <span className="text-xs text-muted">
                  {sizeWord(run.size, kind)} · {PUZZLE_LEVEL_DISPLAY[level].label} · {clockText(run.elapsedMs)} so far
                  {run.checksAllowed !== null ? ` · ${run.checksAllowed === 1 ? "one check" : `${run.checksAllowed} checks`}` : ""}
                  {run.hintsAllowed ? " · hints" : ""}
                  {run.strict ? " · strict" : ""}
                </span>
              </span>
              <span className="ml-auto flex shrink-0 items-center gap-2">
                <Link href={href} className={`${BUTTON_BASE} ${BUTTON_QUIET} ${RAISED_LINK} shrink-0`} data-testid="puzzle-going-continue">
                  {MY_GAMES_COPY.continueGame} →
                </Link>
                <CardArrow />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
