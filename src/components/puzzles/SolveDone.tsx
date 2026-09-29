"use client";

import Link from "@/components/ui/Link";
import { useRouter } from "next/navigation";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS } from "@/components/ui/ui.constants";
import { viewHref } from "@/lib/history/myGamesViews";
import { mySolvePath, playPath, setUpPath } from "@/lib/gomoku/slugs";
import { helpOpensOn, SOLVE_HELP_SAYS } from "@/lib/puzzles/solveHelp";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { PUZZLE_CLOCK_DISPLAY, PUZZLE_DISPLAY, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { clockText } from "@/lib/puzzles/clockText";
import { wordCountOfGivens } from "@/lib/puzzles/gomoji/futago";
import { freshSeedOf } from "@/lib/puzzles/gomoji/wordsSeed";

import { usePuzzleClock } from "./PuzzleClockContext";
import { PuzzleWayBack } from "./PuzzleWayBack";
import type { Done, SolveRace } from "./solveShared";

/**
 * The card at the end: the time, what was paid, another puzzle or a different
 * size, and the way back to the puzzle's page and its family.
 *
 * OUT OF TIME is this card too, for a grid (a word and a lattice say it in
 * their own ending, beside the word they hid): the puzzle ended unsolved when
 * its countdown reached nought, the grid stays drawn as it stood, and the card
 * says the clock ran out, that it is kept among the member's finished games,
 * and offers another on the same clock.
 */
export function SolveDone({
  puzzle,
  done,
  hasAccount,
  race = null,
  checks = null,
  strict = false,
  headStart = false,
  onward,
}: {
  /** Where a puzzle of fixed levels goes on to, in place of Another and the set-up: Tsunagi's next level, and its board of levels. */
  onward?: { next: { href: string; label: string } | null; all: { href: string; label: string } };
  puzzle: Puzzle;
  done: Done;
  hasAccount: boolean;
  race?: SolveRace | null;
  /** The allowance this one was solved under, which Another keeps. */
  checks?: number | null;
  /** Gomoji's Strict, which Another keeps too. */
  strict?: boolean;
  /** Gomoji's Head start, which Another keeps as well. */
  headStart?: boolean;
}) {
  const router = useRouter();
  const clock = usePuzzleClock();
  const copy = PUZZLE_DISPLAY[puzzle.kind];
  const another = () => {
    // A Futago's Another is two more words (`futago.ts`), a Yotsugo's four more (`yotsugo.ts`): its seed says so.
    const words = PUZZLE_SPECS[puzzle.kind].wordGrid === undefined ? 1 : wordCountOfGivens(puzzle.givens);
    router.push(`${playPath(puzzle.kind)}${puzzleQuery({ size: puzzle.size, level: puzzle.level, seed: freshSeedOf(words), checks, strict, headStart, words, clock })}`);
  };
  const timed = PUZZLE_CLOCK_DISPLAY[clock];
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="puzzle-done" data-out-of-time={done.outOfTime ? "true" : undefined} aria-live="polite">
      {done.outOfTime ? (
        <p className="text-lg font-semibold" data-testid="puzzle-out-of-time">
          Out of time <span className="font-mincho text-base font-normal opacity-70">時間切れ</span>: the {timed.label} {timed.kanji} ran down from{" "}
          {clockText(done.elapsedMs)} before it was solved.
        </p>
      ) : (
        <p className="text-lg font-semibold">
          Solved <span className="font-mincho text-base font-normal opacity-70">解決</span> in {clockText(done.elapsedMs)}
          {clock === "none" ? "" : `, on the ${timed.label} ${timed.kanji}`}.
        </p>
      )}
      <p className="text-sm text-muted" data-testid="puzzle-paid">
        {done.outOfTime
          ? outOfTimeWords(done, hasAccount)
          : !hasAccount
            ? "A member is paid XP for a solve. Join, and the next one counts."
            : done.paid !== null
              ? done.paid.points > 0
                ? `+${done.paid.points} XP, for ${awardWords(done.paid.awards)}.`
                : "Already paid for this puzzle, or the day's allowance is spent — the solve still stands."
              : (done.problem ?? "Recording your solve…")}
        {done.outOfTime && hasAccount && race === null ? (
          <>
            {" "}
            Kept in{" "}
            <Link href={viewHref("completed")} className="underline" data-testid="puzzle-out-of-time-kept">
              My games
            </Link>{" "}
            as it stood, with your finished puzzles.
          </>
        ) : null}
      </p>
      {done.helped == null ? null : (
        // A helped solve says what it costs, before anybody wonders where its points went.
        <p className="text-sm" data-testid="puzzle-helped" data-helped={done.helped}>
          {SOLVE_HELP_SAYS[done.helped]}. It counts as solved, but scores no points and is not on the fastest table
          {helpOpensOn(done.helped) ? "." : ", and it does not open the next block: solve it with its explosions on for that."}
        </p>
      )}
      {race === null ? null : <p className="text-sm text-muted">Handed in. The race above says how it stands.</p>}
      <div className="flex flex-wrap gap-2" data-testid="puzzle-way-on">
        {race === null && onward !== undefined ? (
          <>
            {onward.next === null ? null : (
              <Link href={onward.next.href} className={`${BUTTON_BASE} ${BUTTON_STRONG}`} data-testid="puzzle-next-level">
                {onward.next.label}
              </Link>
            )}
            <Link href={onward.all.href} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="puzzle-all-levels">
              {onward.all.label}
            </Link>
          </>
        ) : race === null ? (
          <>
            <button type="button" className={`${BUTTON_BASE} ${BUTTON_STRONG}`} onClick={another} data-testid="puzzle-another">
              Another {copy.label} →
            </button>
            <Link href={setUpPath(puzzle.kind)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="puzzle-set-up">
              Change the size or level
            </Link>
            {/* The solve just kept, to watch again step by step, as every past solve opens. */}
            {done.solveId ? (
              <Link href={mySolvePath(puzzle.kind, done.solveId)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="puzzle-see-solve">
                {done.outOfTime ? "See how far it got" : "Replay this solve"}
              </Link>
            ) : null}
          </>
        ) : null}
        <PuzzleWayBack kind={puzzle.kind} />
      </div>
    </div>
  );
}

/** What an ending by the clock paid: playing it out, as a word played to its last guess pays. */
function outOfTimeWords(done: Done, hasAccount: boolean): string {
  if (!hasAccount) return "It ends unsolved. A member's is kept, and paid a little for playing it out.";
  if (done.paid !== null) return done.paid.points > 0 ? `It ends unsolved: +${done.paid.points} XP for playing it out.` : "It ends unsolved.";
  return done.problem ?? "It ends unsolved. Keeping it…";
}

const AWARD_WORDS: Record<string, string> = {
  puzzleSolved: "the solve",
  puzzleEnded: "playing it out",
  firstOfVariant: "your first of this puzzle",
  firstOfFamily: "your first puzzle at all",
  everyVariantPlayed: "every game on the site played",
  everyFamilyPlayed: "every family met",
  raceWon: "winning the race",
};

function awardWords(awards: readonly string[]): string {
  const words = awards.map((award) => AWARD_WORDS[award] ?? award);
  if (words.length <= 1) return words[0] ?? "the solve";
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}
