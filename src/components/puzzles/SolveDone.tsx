"use client";

import Link from "@/components/ui/Link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";

import { WinCover } from "@/components/game/WinCover";
import type { WinStep } from "@/components/game/winCover.types";
import { solvedNews } from "@/components/game/winNews";

import { BUTTON_BASE, BUTTON_QUIET, BUTTON_STRONG, PANEL_CLASS, SELECTABLE } from "@/components/ui/ui.constants";
import { viewHref } from "@/lib/history/myGamesViews";
import { joinQuery, mySolvePath, playPath, setUpPath } from "@/lib/gomoku/slugs";
import { helpOpensOn, SOLVE_HELP_SAYS } from "@/lib/puzzles/solveHelp";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { PUZZLE_CLOCK_DISPLAY, PUZZLE_DISPLAY, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { clockText } from "@/lib/puzzles/clockText";
import { wordCountOfGivens } from "@/lib/puzzles/gomoji/futago";
import { freshSeedOf } from "@/lib/puzzles/gomoji/wordsSeed";
import { freshDodgeSeed, isDodgeGivens } from "@/lib/puzzles/gomoji/dodgeSeed";
import { freshBackwardsSeed, isBackwardsGivens } from "@/lib/puzzles/gomoji/backwardsSeed";
import { freshSolitaireSeed, isAnyDeal } from "@/lib/puzzles/solitaire/generate";
import { freshSuidoSeed, suidoKindOfSeed } from "@/lib/puzzles/suido/seed";

import { usePuzzleClock } from "./PuzzleClockContext";
import { PuzzleWallpaper } from "./PuzzleWallpaper";
import { PuzzleWayBack } from "./PuzzleWayBack";
import { useMarkPuzzleEnded, useWinSlot } from "./PuzzleWinSlot";
import type { Done, SolveRace } from "./solveShared";
import { ResultMark } from "@/components/game/ResultMark";

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
  moves,
}: {
  /** A card game's count of moves (Solitaire), said with its time. */
  moves?: number;
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
    // A Solitaire's Another is another deal of the same kind, winnable or any (`isAnyDeal`).
    // A dodger's Another is another dodger (`dodge.ts`), a Sakasa's another Sakasa (`backwards.ts`): its seed says so.
    const dodge = isDodgeGivens(puzzle.givens);
    const backwards = isBackwardsGivens(puzzle.givens);
    // A Suido's Another is another board of the same kind, drains or network: its seed says which (`suidoKindOfSeed`).
    const seed = puzzle.kind === "solitaire" ? freshSolitaireSeed(isAnyDeal(puzzle.seed)) : puzzle.kind === "suido" ? freshSuidoSeed(suidoKindOfSeed(puzzle.seed)) : dodge ? freshDodgeSeed() : backwards ? freshBackwardsSeed() : freshSeedOf(words);
    router.push(joinQuery(playPath(puzzle.kind), puzzleQuery({ size: puzzle.size, level: puzzle.level, seed, checks, strict, headStart, words, dodge, backwards, clock })));
  };
  const timed = PUZZLE_CLOCK_DISPLAY[clock];
  /*
   * A CARD GAME IS WON OR GIVEN UP, never solved: Solitaire's Give up hands the
   * game in as ended (`runOut`), kept among the member's finished games and
   * paid for playing it out, as a word whose guesses ran out is.
   */
  const cards = PUZZLE_SPECS[puzzle.kind].cards === true;
  // The cube is given up the same way, and is solved rather than won.
  const gaveUp = (cards || PUZZLE_SPECS[puzzle.kind].cube === true) && done.outOfGuesses === true && done.outOfTime !== true;
  const moveWords = moves === undefined ? "" : `, in ${moves} ${moves === 1 ? "move" : "moves"}`;
  const anotherLabel = `${cards ? "Deal again" : `Another ${copy.label}`} →`;

  /*
   * THE COVER OVER THE BOARD, for a win made on this page (`WinCover`): this
   * card mounts only when a solve finishes here, so it opens with the card and
   * never on a page opened on a finished one. Solved, a helped solve included,
   * or a card game won — never out of time, out of guesses or given up, which
   * end with this card alone as before; and never in a race, whose result is
   * the race's to say above. It offers the first way on this card offers.
   */
  const slot = useWinSlot();
  useMarkPuzzleEnded();
  const [covered, setCovered] = useState(true);
  const won = race === null && done.outOfGuesses !== true;
  const firstStep: WinStep | null =
    onward !== undefined ? (onward.next ?? onward.all) : { label: anotherLabel, onPress: another };
  const cover =
    won && covered && slot !== null ? (
      <WinCover
        news={solvedNews({
          cards,
          elapsed: clockText(done.elapsedMs),
          moves,
          xp: !hasAccount || done.problem !== null ? undefined : done.paid === null ? null : done.paid.points > 0 ? `+${done.paid.points} XP, for ${awardWords(done.paid.awards)}.` : undefined,
          next: firstStep,
        })}
        onClose={() => setCovered(false)}
      />
    ) : null;
  return (
    <>
    {cover === null || slot === null ? null : createPortal(cover, slot)}
    <div className={`${PANEL_CLASS} ${SELECTABLE} flex flex-col gap-3`} data-testid="puzzle-done" data-out-of-time={done.outOfTime ? "true" : undefined} aria-live="polite">
      {gaveUp ? (
        <p className="text-lg font-semibold" data-testid="puzzle-given-up">
          <ResultMark kind="failure" className="mr-1.5" />
          Given up <span className="font-mincho text-base font-normal opacity-70">投了</span> after {clockText(done.elapsedMs)}
          {moveWords}.
        </p>
      ) : cards ? (
        <p className="text-lg font-semibold" data-testid="puzzle-won">
          <ResultMark kind="success" className="mr-1.5" />
          Won <span className="font-mincho text-base font-normal opacity-70">勝ち</span> in {clockText(done.elapsedMs)}
          {moveWords}.
        </p>
      ) : done.outOfTime ? (
        <p className="text-lg font-semibold" data-testid="puzzle-out-of-time">
          <ResultMark kind="failure" className="mr-1.5" />
          Out of time <span className="font-mincho text-base font-normal opacity-70">時間切れ</span>: the {timed.label} {timed.kanji} ran down from{" "}
          {clockText(done.elapsedMs)} before it was solved.
        </p>
      ) : (
        <p className="text-lg font-semibold" data-testid="puzzle-solved-line">
          <ResultMark kind="success" className="mr-1.5" />
          Solved <span className="font-mincho text-base font-normal opacity-70">解決</span> in {clockText(done.elapsedMs)}
          {moveWords}
          {clock === "none" ? "" : `, on the ${timed.label} ${timed.kanji}`}.
        </p>
      )}
      <p className="text-sm text-muted" data-testid="puzzle-paid">
        {done.outOfTime || gaveUp
          ? outOfTimeWords(done, hasAccount)
          : !hasAccount
            ? "A member is paid XP for a solve. Join, and the next one counts."
            : done.paid !== null
              ? done.paid.points > 0
                ? `+${done.paid.points} XP, for ${awardWords(done.paid.awards)}.`
                : "Already paid for this puzzle, or the day's allowance is spent — the solve still stands."
              : (done.problem ?? "Recording your solve…")}
        {(done.outOfTime || gaveUp) && hasAccount && race === null ? (
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
              {anotherLabel}
            </button>
            <Link href={setUpPath(puzzle.kind)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="puzzle-set-up">
              {cards ? "Change the draw or passes" : "Change the size or level"}
            </Link>
            {/* The solve just kept, to watch again step by step, as every past solve opens. */}
            {done.solveId ? (
              <Link href={mySolvePath(puzzle.kind, done.solveId)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="puzzle-see-solve">
                {done.outOfTime || gaveUp ? "See how far it got" : cards ? "See this game" : "Replay this solve"}
              </Link>
            ) : null}
          </>
        ) : null}
        <PuzzleWayBack kind={puzzle.kind} />
      </div>
      {/* The grid as it was finished, as a desktop or phone wallpaper, as every board game offers its positions. */}
      <PuzzleWallpaper
        puzzle={puzzle}
        result={
          gaveUp
            ? `Given up after ${clockText(done.elapsedMs)}${moveWords}`
            : cards
              ? `Won in ${clockText(done.elapsedMs)}${moveWords}`
              : done.outOfTime
                ? "Out of time"
                : `Solved in ${clockText(done.elapsedMs)}`
        }
      />
    </div>
    </>
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
