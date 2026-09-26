import Link from "@/components/ui/Link";

import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { sizeWord } from "@/components/puzzles/puzzles.constants";
import { CardArrow } from "@/components/ui/CardArrow";
import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS, STRETCHED_HOST } from "@/components/ui/ui.constants";
import { mySolvePath } from "@/lib/gomoku/slugs";
import { viewHref } from "@/lib/history/myGamesViews";
import { clockText } from "@/lib/puzzles/clockText";
import { guessesText } from "@/lib/puzzles/gomoji/guessesTaken";
import { hintsWords } from "@/lib/puzzles/gomoji/headStart";
import { PUZZLE_LEVEL_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { MySolve, MySolvesPage } from "@/lib/puzzles/server/mySolves";

import { GroupHeading } from "./GroupHeading";
import { ago } from "./MyGameRow";
import { MY_GAMES_COPY, MY_PUZZLE_ROW } from "./mine.constants";
import { unsolvedWords } from "@/lib/puzzles/countdown";

/** The help a solve took, in words: "no help", "2 checks", "1 check, 1 hint". Nothing where it was never recorded. */
function helpWords(solve: MySolve): string | null {
  if (solve.checksUsed === null && solve.hintsUsed === null) return null;
  const parts = [
    solve.checksUsed ? `${solve.checksUsed} ${solve.checksUsed === 1 ? "check" : "checks"}` : null,
    // A word's one help is its Head start, kept as a hint (`headStart.ts`), and said as what it was.
    hintsWords(solve.kind, solve.level, solve.hintsUsed)?.toLowerCase() ?? null,
  ].filter((part) => part !== null);
  return parts.length === 0 ? "no help" : parts.join(", ");
}

/**
 * THE PUZZLES A MEMBER HAS SOLVED, with their scores. John, 2026-09-25: "where
 * will the completed puzzles go… where are the scores?!" Newest first, in the
 * same panel and card as the Completed games, twenty to a page with Newest and
 * Older, and each row saying what it was worth on the leaderboard, its time and
 * the help it took. A row opens the member's own solves of that puzzle.
 */
export function MyPuzzleSolves({ page, now, paged }: { page: MySolvesPage; now: Date; paged: boolean }) {
  const copy = MY_GAMES_COPY.puzzlesSolved;
  // Its own place in the address, so paging the puzzles never moves the games beside them on Completed.
  const older = page.next === null ? null : `${viewHref("completed")}&puzzle-cursor=${encodeURIComponent(page.next)}`;
  return (
    <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="puzzles-solved">
      <GroupHeading
        label={copy.label}
        kanji={copy.kanji}
        total={page.total}
        showing={page.solves.length < page.total ? page.solves.length : null}
        testId="puzzles-solved"
      />
      <p className="text-xs text-muted">{copy.hint}</p>
      {page.total === 0 ? (
        <p className="text-sm text-muted" data-testid="puzzles-solved-empty">
          {copy.empty}
        </p>
      ) : null}
      <ul className="flex flex-col gap-1.5">
        {page.solves.map((solve) => {
          const help = helpWords(solve);
          return (
            <li key={solve.id} className={`${STRETCHED_HOST} ${MY_PUZZLE_ROW}`} data-testid="puzzle-solved" data-kind={solve.kind} data-solved={solve.solved ? "true" : "false"}>
              {/* The row opens the puzzle itself, finished as it was (`PuzzleSolvePage`), not the list it is one of. */}
              <Link
                href={mySolvePath(solve.kind, solve.id)}
                data-card-link=""
                className="absolute inset-0 rounded-lg"
                aria-label={`Your ${solve.kind} of ${solve.finishedAt.toISOString().slice(0, 10)}, as it ended`}
                data-testid="puzzle-solved-open"
              />
              <GameThumb variant={solve.kind} size="small" />
              <span className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
                <span className="truncate font-medium">
                  <GameName variant={solve.kind} raised />
                </span>
                <span className="text-xs text-muted">
                  {/* A word whose guesses ran out is kept too, scored for the letters it found; it says so first. */}
                  {solve.solved ? "" : `${unsolvedWords(solve)} · `}
                  {sizeWord(solve.size, solve.kind)} · {PUZZLE_LEVEL_DISPLAY[solve.level].label} · {clockText(solve.elapsedMs)}
                  {solve.guesses === null || !solve.solved ? "" : ` · ${guessesText(solve.guesses)} guesses`}
                  {help === null ? "" : ` · ${help}`}
                  {solve.raceId === null ? "" : " · race"} · {ago(solve.finishedAt.toISOString(), now)}
                </span>
              </span>
              <span className="ml-auto flex shrink-0 items-center gap-2">
                {/* The score, large, where a game's row keeps its controls: the number this row is for. */}
                <span className="flex flex-col items-end leading-none" data-testid="puzzle-solved-points">
                  <span className="text-lg font-semibold tabular-nums">{solve.points}</span>
                  <span className="text-[0.65rem] tracking-wide text-muted uppercase">points</span>
                </span>
                <CardArrow />
              </span>
            </li>
          );
        })}
      </ul>
      {paged || older !== null ? (
        <div className="flex flex-wrap items-center gap-4">
          {paged ? (
            <Link href={viewHref("completed")} className={`${BUTTON_BASE} ${BUTTON_QUIET} px-3`} data-testid="puzzles-solved-newest">
              ← {MY_GAMES_COPY.newest}
            </Link>
          ) : null}
          {older !== null ? (
            <Link href={older} className={`${BUTTON_BASE} ${BUTTON_QUIET} ml-auto px-3`} data-testid="puzzles-solved-older">
              {MY_GAMES_COPY.older} →
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
