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
import { helpOpensOn, solveHelpSays } from "@/lib/puzzles/solveHelp";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { puzzleName } from "@/lib/puzzles/puzzleCopy";
import { PUZZLE_CLOCK_DISPLAY, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { clockText } from "@/lib/puzzles/clockText";
import { wordCountOfGivens } from "@/lib/puzzles/gomoji/futago";
import { freshSeedOf } from "@/lib/puzzles/gomoji/wordsSeed";
import { freshDodgeSeed, isDodgeGivens } from "@/lib/puzzles/gomoji/dodgeSeed";
import { freshBackwardsSeed, isBackwardsGivens } from "@/lib/puzzles/gomoji/backwardsSeed";
import { freshSolitaireSeed, isAnyDeal } from "@/lib/puzzles/solitaire/generate";
import { freshSuidoSeed, suidoKindOfSeed, suidoSquaresOfSeed } from "@/lib/puzzles/suido/seed";

import { usePuzzleClock } from "./PuzzleClockContext";
import { PuzzleWallpaper } from "./PuzzleWallpaper";
import { PuzzleWayBack } from "./PuzzleWayBack";
import { useMarkPuzzleEnded, useWinSlot } from "./PuzzleWinSlot";
import type { Done, SolveRace } from "./solveShared";
import { ResultMark } from "@/components/game/ResultMark";
import { Paired } from "@/components/i18n/Paired";
import { useSpeaker } from "@/components/i18n/LocaleProvider";
import type { Speaker } from "@/lib/i18n/i18n";
import type { PhraseKey } from "@/lib/i18n/i18n.constants";

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
  const say = useSpeaker();
  const clock = usePuzzleClock();
  const another = () => {
    // A Futago's Another is two more words (`futago.ts`), a Yotsugo's four more (`yotsugo.ts`): its seed says so.
    const words = PUZZLE_SPECS[puzzle.kind].wordGrid === undefined ? 1 : wordCountOfGivens(puzzle.givens);
    // A Solitaire's Another is another deal of the same kind, winnable or any (`isAnyDeal`).
    // A dodger's Another is another dodger (`dodge.ts`), a Sakasa's another Sakasa (`backwards.ts`): its seed says so.
    const dodge = isDodgeGivens(puzzle.givens);
    const backwards = isBackwardsGivens(puzzle.givens);
    // A Suido's Another is another board of the same kind, drains or network: its seed says which (`suidoKindOfSeed`).
    const seed = puzzle.kind === "solitaire" ? freshSolitaireSeed(isAnyDeal(puzzle.seed)) : puzzle.kind === "suido" ? freshSuidoSeed(suidoKindOfSeed(puzzle.seed), suidoSquaresOfSeed(puzzle.seed)) : dodge ? freshDodgeSeed() : backwards ? freshBackwardsSeed() : freshSeedOf(words);
    router.push(joinQuery(playPath(puzzle.kind), puzzleQuery({ size: puzzle.size, level: puzzle.level, seed, checks, strict, headStart, words, dodge, backwards, clock })));
  };
  const timed = PUZZLE_CLOCK_DISPLAY[clock];
  // "Tortoise 亀" for an English reader, 亀 for a Japanese one, whose script the kanji is.
  const timedName = say.pairsWithKanji ? `${timed.label} ${timed.kanji}` : timed.kanji;
  /*
   * A CARD GAME IS WON OR GIVEN UP, never solved: Solitaire's Give up hands the
   * game in as ended (`runOut`), kept among the member's finished games and
   * paid for playing it out, as a word whose guesses ran out is.
   */
  const cards = PUZZLE_SPECS[puzzle.kind].cards === true;
  // The cube is given up the same way, and is solved rather than won.
  const gaveUp = (cards || PUZZLE_SPECS[puzzle.kind].cube === true) && done.outOfGuesses === true && done.outOfTime !== true;
  const moveWords = moves === undefined ? "" : say.count("puzzle.done.inMoves", moves);
  const anotherLabel = cards ? say.say("puzzle.done.dealAgain") : say.say("puzzle.done.another", { name: puzzleName(puzzle.kind, say.locale) });
  const time = clockText(done.elapsedMs);
  // The words between a link or a figure in a sentence: a space in English, nothing where Japanese is written solid.
  const gap = say.pairsWithKanji ? " " : "";

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
          xp: !hasAccount || done.problem !== null ? undefined : done.paid === null ? null : done.paid.points > 0 ? say.say("puzzle.done.paid", { points: String(done.paid.points), awards: awardWords(done.paid.awards, say) }) : undefined,
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
          <Paired en={say.say("puzzle.outcome.givenUp")} kanji="投了" kanjiClassName="text-base font-normal opacity-70" />
          {say.say("puzzle.done.givenUpTail", { time, moves: moveWords })}
        </p>
      ) : cards ? (
        <p className="text-lg font-semibold" data-testid="puzzle-won">
          <ResultMark kind="success" className="mr-1.5" />
          <Paired en={say.say("puzzle.outcome.won")} kanji="勝ち" kanjiClassName="text-base font-normal opacity-70" />
          {say.say("puzzle.done.wonTail", { time, moves: moveWords })}
        </p>
      ) : done.outOfTime ? (
        <p className="text-lg font-semibold" data-testid="puzzle-out-of-time">
          <ResultMark kind="failure" className="mr-1.5" />
          <Paired en={say.say("puzzle.outcome.outOfTime")} kanji="時間切れ" kanjiClassName="text-base font-normal opacity-70" />
          {say.say("puzzle.done.outOfTimeTail", { clock: timedName, time })}
        </p>
      ) : (
        <p className="text-lg font-semibold" data-testid="puzzle-solved-line">
          <ResultMark kind="success" className="mr-1.5" />
          <Paired en={say.say("puzzle.outcome.solved")} kanji="解決" kanjiClassName="text-base font-normal opacity-70" />
          {say.say("puzzle.done.solvedTail", { time, moves: moveWords, onClock: clock === "none" ? "" : say.say("puzzle.done.onClock", { clock: timedName }) })}
        </p>
      )}
      <p className="text-sm text-muted" data-testid="puzzle-paid">
        {done.outOfTime || gaveUp
          ? outOfTimeWords(done, hasAccount, say)
          : !hasAccount
            ? say.say("puzzle.done.joinToBePaid")
            : done.paid !== null
              ? done.paid.points > 0
                ? say.say("puzzle.done.paid", { points: String(done.paid.points), awards: awardWords(done.paid.awards, say) })
                : say.say("puzzle.done.alreadyPaid")
              : (done.problem ?? say.say("puzzle.done.recording"))}
        {(done.outOfTime || gaveUp) && hasAccount && race === null ? (
          <>
            {gap}
            {say.say("puzzle.done.keptBefore")}
            {gap}
            <Link href={viewHref("completed")} className="underline" data-testid="puzzle-out-of-time-kept">
              {say.say("puzzle.done.keptLink")}
            </Link>
            {gap}
            {say.say("puzzle.done.keptAfter")}
          </>
        ) : null}
      </p>
      {done.helped == null ? null : (
        // A helped solve says what it costs, before anybody wonders where its points went.
        <p className="text-sm" data-testid="puzzle-helped" data-helped={done.helped}>
          {say.say(helpOpensOn(done.helped) ? "puzzle.done.helpedCounts" : "puzzle.done.helpedNoBlock", { says: solveHelpSays(done.helped, say) })}
        </p>
      )}
      {race === null ? null : <p className="text-sm text-muted">{say.say("puzzle.done.handedIn")}</p>}
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
              {say.say(cards ? "puzzle.done.changeDraw" : "puzzle.done.changeSize")}
            </Link>
            {/* The solve just kept, to watch again step by step, as every past solve opens. */}
            {done.solveId ? (
              <Link href={mySolvePath(puzzle.kind, done.solveId)} className={`${BUTTON_BASE} ${BUTTON_QUIET}`} data-testid="puzzle-see-solve">
                {say.say(done.outOfTime || gaveUp ? "puzzle.done.seeHowFar" : cards ? "puzzle.done.seeGame" : "puzzle.done.replay")}
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
            ? say.say("puzzle.done.resultGivenUp", { time, moves: moveWords })
            : cards
              ? say.say("puzzle.done.resultWon", { time, moves: moveWords })
              : done.outOfTime
                ? say.say("puzzle.outcome.outOfTime")
                : say.say("puzzle.done.resultSolved", { time })
        }
      />
    </div>
    </>
  );
}

/** What an ending by the clock paid: playing it out, as a word played to its last guess pays. */
function outOfTimeWords(done: Done, hasAccount: boolean, say: Speaker): string {
  if (!hasAccount) return say.say("puzzle.done.unsolvedGuest");
  if (done.paid !== null) return done.paid.points > 0 ? say.say("puzzle.done.unsolvedPaid", { points: String(done.paid.points) }) : say.say("puzzle.done.unsolved");
  return done.problem ?? say.say("puzzle.done.unsolvedKeeping");
}

const AWARD_WORDS: Record<string, PhraseKey> = {
  puzzleSolved: "puzzle.award.puzzleSolved",
  puzzleEnded: "puzzle.award.puzzleEnded",
  firstOfVariant: "puzzle.award.firstOfVariant",
  firstOfFamily: "puzzle.award.firstOfFamily",
  everyVariantPlayed: "puzzle.award.everyVariantPlayed",
  everyFamilyPlayed: "puzzle.award.everyFamilyPlayed",
  raceWon: "puzzle.award.raceWon",
};

function awardWords(awards: readonly string[], say: Speaker): string {
  const words = awards.map((award) => (AWARD_WORDS[award] === undefined ? award : say.say(AWARD_WORDS[award])));
  if (words.length === 0) return say.say("puzzle.award.puzzleSolved");
  return say.list(words);
}
