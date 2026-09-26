"use client";

import Link from "@/components/ui/Link";
import { useRouter } from "next/navigation";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS } from "@/components/ui/ui.constants";
import { mySolvePath, playPath, setUpPath } from "@/lib/gomoku/slugs";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { PUZZLE_DISPLAY, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { clockText } from "@/lib/puzzles/clockText";
import { COUNTDOWNS, countdownOfMs } from "@/lib/puzzles/countdown";
import { freshSeed } from "@/lib/puzzles/random";
import { isFutagoGivens } from "@/lib/puzzles/gomoji/futago";
import { freshFutagoSeed } from "@/lib/puzzles/gomoji/futagoSeed";

import { useCountdownMs } from "./countdownContext";
import { PuzzleWayBack } from "./PuzzleWayBack";
import type { Done, SolveRace } from "./solveShared";

/** The card at the end: the time, what was paid, another puzzle or a different size, and the way back to the puzzle's page and its family. */
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
  const copy = PUZZLE_DISPLAY[puzzle.kind];
  // Another is played against the same countdown, if there was one (`countdown.ts`).
  const countdown = countdownOfMs(useCountdownMs());
  const another = () => {
    // A Futago's Another is two more words (`futago.ts`): its seed says so.
    const twins = PUZZLE_SPECS[puzzle.kind].wordGrid !== undefined && isFutagoGivens(puzzle.givens);
    router.push(`${playPath(puzzle.kind)}${puzzleQuery({ size: puzzle.size, level: puzzle.level, seed: twins ? freshFutagoSeed() : freshSeed(), checks, strict, headStart, twins, ...(countdown === null ? {} : { countdown }) })}`);
  };
  const ran = COUNTDOWNS[countdownOfMs(done.elapsedMs) ?? countdown ?? "fox"];
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-3`} data-testid="puzzle-done" data-ended={done.outOfTime ? "time" : "solved"} aria-live="polite">
      {done.outOfTime ? (
        <p className="text-lg font-semibold" data-testid="puzzle-time-up">
          Time&apos;s up <span className="font-mincho text-base font-normal opacity-70">時間切れ</span>: the {ran.label}&apos;s {ran.minutes}{" "}
          {ran.minutes === 1 ? "minute" : "minutes"} ran out before it was done.
        </p>
      ) : (
        <p className="text-lg font-semibold">
          Solved <span className="font-mincho text-base font-normal opacity-70">解決</span> in {clockText(done.elapsedMs)}.
        </p>
      )}
      <p className="text-sm text-muted" data-testid="puzzle-paid">
        {done.outOfTime
          ? hasAccount
            ? done.paid !== null
              ? `${done.paid.points > 0 ? `+${done.paid.points} XP for playing it out. ` : ""}Kept in My games, unsolved, as it stood.`
              : (done.problem ?? "Keeping it in My games…")
            : "A member's puzzle is kept in My games when time runs out. Join, and the next one is."
          : !hasAccount
          ? "A member is paid XP for a solve. Join, and the next one counts."
          : done.paid !== null
            ? done.paid.points > 0
              ? `+${done.paid.points} XP, for ${awardWords(done.paid.awards)}.`
              : "Already paid for this puzzle, or the day's allowance is spent — the solve still stands."
            : (done.problem ?? "Recording your solve…")}
      </p>
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
                Replay this solve
              </Link>
            ) : null}
          </>
        ) : null}
        <PuzzleWayBack kind={puzzle.kind} />
      </div>
    </div>
  );
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

