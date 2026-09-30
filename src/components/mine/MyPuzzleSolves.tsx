import Link from "@/components/ui/Link";

import { SOLVE_HELP_WORDS } from "@/lib/puzzles/solveHelp";
import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { sizeWord } from "@/components/puzzles/puzzles.constants";
import { CardArrow } from "@/components/ui/CardArrow";
import { STRETCHED_HOST } from "@/components/ui/ui.constants";
import { mySolvePath } from "@/lib/gomoku/slugs";
import { clockText } from "@/lib/puzzles/clockText";
import { clockWord } from "@/lib/puzzles/puzzleClock";
import { guessesText } from "@/lib/puzzles/gomoji/guessesTaken";
import { hintsWords } from "@/lib/puzzles/gomoji/headStart";
import { PUZZLE_LEVEL_DISPLAY } from "@/lib/puzzles/puzzles.constants";
import type { MySolve } from "@/lib/puzzles/server/mySolves";

import { ago } from "./MyGameRow";
import { MY_PUZZLE_ROW } from "./mine.constants";

/** The help a solve took, in words: "no help", "2 checks", "1 check, 1 hint". Nothing where it was never recorded. */
function helpWords(solve: MySolve): string | null {
  if (solve.checksUsed === null && solve.hintsUsed === null && solve.helped === null) return null;
  const parts = [
    solve.helped === null ? null : SOLVE_HELP_WORDS[solve.helped],
    solve.checksUsed ? `${solve.checksUsed} ${solve.checksUsed === 1 ? "check" : "checks"}` : null,
    // A word's one help is its Head start, kept as a hint (`headStart.ts`), and said as what it was.
    hintsWords(solve.kind, solve.level, solve.hintsUsed)?.toLowerCase() ?? null,
  ].filter((part) => part !== null);
  return parts.length === 0 ? "no help" : parts.join(", ");
}

/**
 * ONE PUZZLE A MEMBER HAS SOLVED, with its score: a row of the Completed
 * tab's one list (`completed.ts`), among the games. John, 2026-09-25: "where
 * will the completed puzzles go… where are the scores?!" It says what it was
 * worth on the leaderboard, its time and the help it took, and opens the
 * puzzle as it ended.
 */
export function PuzzleSolveRow({ solve, now }: { solve: MySolve; now: Date }) {
  const help = helpWords(solve);
  return (
    <li className={`${STRETCHED_HOST} ${MY_PUZZLE_ROW}`} data-testid="puzzle-solved" data-kind={solve.kind} data-solved={solve.solved ? "true" : "false"}>
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
          {solve.solved ? "" : solve.guesses === null ? "Not solved · " : "Not found · "}
          {sizeWord(solve.size, solve.kind)} · {PUZZLE_LEVEL_DISPLAY[solve.level].label} · {clockText(solve.elapsedMs)}
          {solve.guesses === null || !solve.solved ? "" : ` · ${guessesText(solve.guesses)} guesses`}
          {help === null ? "" : ` · ${help}`}
          {clockWord(solve.clock) === "" ? "" : ` · ${clockWord(solve.clock)}`}
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
}
