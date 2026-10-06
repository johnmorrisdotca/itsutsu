import Link from "@/components/ui/Link";

import { currentSpeaker } from "@/lib/i18n/currentLocale";
import type { Speaker } from "@/lib/i18n/i18n";
import { solveHelpWords } from "@/lib/puzzles/solveHelp";
import { GameName } from "@/components/games/GameName";
import { GameThumb } from "@/components/games/GameThumb";
import { CardArrow } from "@/components/ui/CardArrow";
import { STRETCHED_HOST } from "@/components/ui/ui.constants";
import { mySolvePath } from "@/lib/gomoku/slugs";
import { clockText } from "@/lib/puzzles/clockText";
import { clockWord } from "@/lib/puzzles/puzzleClock";
import { guessesText } from "@/lib/puzzles/gomoji/guessesTaken";
import { hintsWords } from "@/lib/puzzles/gomoji/headStart";
import { levelLabel, puzzleName } from "@/lib/puzzles/puzzleCopy";
import { sizeWordIn } from "@/lib/puzzles/sizeWord";
import type { MySolve } from "@/lib/puzzles/server/mySolves";

import { ago } from "./MyGameRow";
import { MY_PUZZLE_ROW } from "./mine.constants";
import { ResultMark } from "@/components/game/ResultMark";
import { puzzleOutcome } from "@/lib/puzzles/puzzleOutcome";

/** What a puzzle's count beside its time counts: a word's guesses, Koushi's swaps, a card game's moves ("131 moves", never "131 guesses"). */
const TAKEN_UNIT = { guesses: "pset.mine.unitGuesses", swaps: "pset.mine.unitSwaps", moves: "pset.mine.unitMoves" } as const;

/** The help a solve took, in words: "no help", "2 checks", "1 check, 1 hint". Nothing where it was never recorded. */
function helpWords(solve: MySolve, say: Speaker): string | null {
  if (solve.checksUsed === null && solve.hintsUsed === null && solve.helped === null) return null;
  const parts = [
    solve.helped === null ? null : solveHelpWords(solve.helped, say),
    solve.checksUsed ? say.count("puzzle.count.check", solve.checksUsed) : null,
    // A word's one help is its Head start, kept as a hint (`headStart.ts`), and said as what it was.
    hintsWords(solve.kind, solve.level, solve.hintsUsed, say)?.toLowerCase() ?? null,
  ].filter((part) => part !== null);
  return parts.length === 0 ? say.say("pset.mine.noHelp") : parts.join(say.locale === "ja" ? "、" : ", ");
}

/**
 * ONE PUZZLE A MEMBER HAS SOLVED, with its score: a row of the Completed
 * tab's one list (`completed.ts`), among the games. John, 2026-09-25: "where
 * will the completed puzzles go… where are the scores?!" It says what it was
 * worth on the leaderboard, its time and the help it took, and opens the
 * puzzle as it ended.
 */
export async function PuzzleSolveRow({ solve, now }: { solve: MySolve; now: Date }) {
  const say = await currentSpeaker();
  const help = helpWords(solve, say);
  const ended = puzzleOutcome(solve.kind, solve.solved, solve.clock !== "none", solve.guesses, say);
  return (
    <li className={`${STRETCHED_HOST} ${MY_PUZZLE_ROW}`} data-testid="puzzle-solved" data-kind={solve.kind} data-solved={solve.solved ? "true" : "false"}>
      {/* The row opens the puzzle itself, finished as it was (`PuzzleSolvePage`), not the list it is one of. */}
      <Link
        href={mySolvePath(solve.kind, solve.id)}
        data-card-link=""
        className="absolute inset-0 rounded-lg"
        aria-label={say.say("pset.mine.openSolve", { name: puzzleName(solve.kind, say.locale), ago: ago(solve.finishedAt.toISOString(), now) })}
        data-testid="puzzle-solved-open"
      />
      <GameThumb variant={solve.kind} size="small" />
      <span className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
        <span className="truncate font-medium">
          <GameName variant={solve.kind} raised />
        </span>
        <span className="text-xs text-muted" data-testid="puzzle-solved-line">
          {/* How it ended first, marked: a word whose guesses ran out is kept too, scored for the letters it found. */}
          <ResultMark kind={ended.mark} className="mr-1" />
          <span data-testid="puzzle-solved-outcome">{ended.words}</span> · {sizeWordIn(solve.size, solve.kind, say)} ·{" "}
          {levelLabel(solve.level, say.locale)} · {clockText(solve.elapsedMs)}
          {solve.guesses === null || !solve.solved ? "" : ` · ${guessesText(solve.guesses)} ${say.say(TAKEN_UNIT[solve.guesses.unit ?? "guesses"])}`}
          {help === null ? "" : ` · ${help}`}
          {clockWord(solve.clock, say) === "" ? "" : ` · ${clockWord(solve.clock, say)}`}
          {solve.raceId === null ? "" : ` · ${say.say("pset.rec.race")}`} · {ago(solve.finishedAt.toISOString(), now)}
        </span>
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-2">
        {/* The score, large, where a game's row keeps its controls: the number this row is for. */}
        <span className="flex flex-col items-end leading-none" data-testid="puzzle-solved-points">
          <span className="text-lg font-semibold tabular-nums">{solve.points}</span>
          <span className="text-[0.65rem] tracking-wide text-muted uppercase">{say.say("pset.mine.points")}</span>
        </span>
        <CardArrow />
      </span>
    </li>
  );
}
