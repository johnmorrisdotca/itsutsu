import Link from "@/components/ui/Link";
import { SOLVE_HELP_WORDS } from "@/lib/puzzles/solveHelp";
import { notFound } from "next/navigation";

import { PageTitle } from "@/components/layout/Headings";
import { Page } from "@/components/layout/Page";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { currentMemberId } from "@/lib/auth/currentSession";
import { PlayerName } from "@/components/players/PlayerName";
import { gamePath, historyPath, matchPath, myGamePath, setUpPath } from "@/lib/gomoku/slugs";
import { PUZZLE_RECORD_SORTS, puzzleRecordHref } from "@/lib/puzzles/puzzleRecordAddress";
import { anySolveOf, finishedSameGrid } from "@/lib/puzzles/server/puzzleRecord";
import { preferencesFor } from "@/lib/preferences/memberPreferences";
import { clockText } from "@/lib/puzzles/clockText";
import { guessesTaken, guessesText } from "@/lib/puzzles/gomoji/guessesTaken";
import { hadHeadStart, hintsWords } from "@/lib/puzzles/gomoji/headStart";
import { PUZZLE_CLOCK_DISPLAY, PUZZLE_DISPLAY, PUZZLE_LEVEL_DISPLAY, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import type { PuzzleClock, PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { isPuzzleClock } from "@/lib/puzzles/puzzleClock";
import { memberNamesOf, ownSolveOf } from "@/lib/puzzles/server/puzzleSolves";
import { YOTSUGO_DISPLAY } from "@/lib/puzzles/gomoji/yotsugo";
import { FUTAGO_DISPLAY, guessesOf, hiddenWordsOf, wordsShown } from "@/lib/puzzles/gomoji/futago";
import { wordOfPlay } from "@/lib/puzzles/gomoji/dodgePlay";
import { isDodgeGivens } from "@/lib/puzzles/gomoji/dodgeSeed";
import { loadKanaWordsFromModule } from "@/lib/puzzles/gomojiKana/kanaWordsModule";
import { DODGE_DISPLAY } from "@/lib/puzzles/gomoji/dodgeWords";
import { isBackwardsGivens } from "@/lib/puzzles/gomoji/backwardsSeed";
import { BACKWARDS_DISPLAY } from "@/lib/puzzles/gomoji/backwardsWords";
import { WORD_STYLES } from "@/lib/puzzles/gomoji/wordStyles";

import type { ReactNode } from "react";

import { ResultMark } from "@/components/game/ResultMark";
import { LocalTime } from "@/components/ui/LocalTime";
import { puzzleOutcome, puzzleSizeLabel, type PuzzleOutcome } from "@/lib/puzzles/puzzleOutcome";

import { suidoLevelOfBoard, loadSuidoLevelsAt } from "@/lib/puzzles/suido/levels";
import { isSuidoLevelSize } from "@/lib/puzzles/suido/sizes";
import { meikyuuLevelOfSolve } from "@/lib/puzzles/server/meikyuuRecords";
import { FinishedPuzzle } from "./FinishedPuzzle";
import { sizeWord } from "./puzzles.constants";
import { MeikyuuAccountLook } from "./MeikyuuAccountLook";
import { WordStyleProvider } from "./WordStyleContext";
import { GameTrail } from "@/components/games/GameTrail";

/** A word puzzle's hidden word, a Futago's two (`futago.ts`) or a Yotsugo's four (`yotsugo.ts`), in the case it is played in — a dodger's where it stood at the end (`wordOfPlay`). */
function wordOf(kind: PuzzleKind, givens: string, size: number, level: string, answer: string | null): string {
  if (isDodgeGivens(givens)) {
    const word = wordOfPlay(kind, size, level as PuzzleLevel, givens, answer === null ? [] : (guessesOf(kind, size, answer) ?? []));
    return word === null ? "" : `${wordsShown(kind, [word])} (${DODGE_DISPLAY.label} ${DODGE_DISPLAY.kanji})`;
  }
  // A Sakasa's word, the one it was played to avoid (`backwards.ts`).
  if (isBackwardsGivens(givens)) return `${wordsShown(kind, hiddenWordsOf(kind, size, givens)?.words ?? [])} (${BACKWARDS_DISPLAY.label} ${BACKWARDS_DISPLAY.kanji})`;
  const words = hiddenWordsOf(kind, size, givens)?.words ?? [];
  const mode = words.length === 4 ? YOTSUGO_DISPLAY : FUTAGO_DISPLAY;
  return words.length > 1 ? `${wordsShown(kind, words)} (${mode.label} ${mode.kanji})` : wordsShown(kind, words);
}

/** A value in the facts box starts with a capital: "Draw 1", not "draw 1". */
const capitalised = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** What the fastest times share with this solve, by its size's name: "same draw and level". */
const FASTEST_SAME: Record<string, string> = { "Free cells": "cells" };

/** Whether a moment falls on today's date in UTC, the day today's puzzle is everybody's (`dailySeed`). */
function isTodayUtc(at: Date, now = new Date()): boolean {
  return at.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
}

/**
 * ONE FINISHED PUZZLE: the grid as it ended (`FinishedPuzzle`), and how it
 * went — who, when, what size and level, how long, what it scored, and the
 * checks and hints it took. John, 2026-09-25: "Drilldown into solved puzzles
 * doesn't work. Sudoku I couldn't see a game." Every row that lists a solve
 * leads here.
 *
 * TWO ADDRESSES, ONE PAGE. `mine` is /games/<slug>/me/<id>, the reader's own
 * place for their own solve, and answers anybody else, or nobody signed in,
 * with no such puzzle. `anyone` is /games/<slug>/history/<id>, where every
 * time on a board of solves leads (John, 2026-09-26: "No way to view played
 * games"): any member's solve, to any member, behind the invite as a game's
 * record is (`src/proxy.ts`). A child's solve is shown as a child's games
 * are: to members, never to a stranger.
 *
 * AND IT KEEPS TODAY'S PUZZLE A PUZZLE. Today's puzzle is the same grid for
 * everybody (`daily.ts`), so somebody else's answer from today is not shown to
 * a reader who has not finished that grid themselves: the page draws it as it
 * was dealt and says when the answer opens. From tomorrow, or once the reader
 * has finished it, it is shown whole.
 */
export async function PuzzleSolvePage({ kind, solveId, whose }: { kind: PuzzleKind; solveId: string; whose: "mine" | "anyone" }) {
  const me = await currentMemberId();
  const found = whose === "mine" ? (me === null ? null : await ownSolveOf(me, kind, solveId)) : await anySolveOf(kind, solveId);
  if (found === null) notFound();
  const solverId = "memberId" in found ? (found.memberId as string) : me!;
  const own = solverId === me;
  /*
   * Somebody else's answer to a board the reader may still play is kept back. A
   * day's puzzle opens the next day; a fixed level (Tsunagi's) is the same board
   * for good, so it stays kept back until the reader has solved that level
   * themselves (John, 2026-09-26: "How is this a solved puzzle?").
   */
  // A Suido solve is of a LEVEL when its board is one of its size's levels (read here, once, from that size): the same board for good, like a Tsunagi level.
  const suidoLevel = kind === "suido" && isSuidoLevelSize(found.size) ? await suidoLevelOfSolve(found.size, found.givens) : null;
  // And a Meikyuu solve is of a LEVEL whenever its maze is one of the list's: the same maze for good.
  const meikyuuLevel = kind === "meikyuu" ? await meikyuuLevelOfSolve(found.size, found.givens) : null;
  const fixed = PUZZLE_SPECS[kind].fixedLevels === true || suidoLevel !== null;
  const kept = own || (!fixed && !isTodayUtc(found.finishedAt)) || (await finishedSameGrid(me, kind, found.givens));
  const solve = kept ? found : { ...found, answer: null, steps: null };
  // A kana dodger's word is replayed from its list (`wordOfPlay`), loaded first.
  if (kind === "gomojiKana" && isDodgeGivens(found.givens)) await loadKanaWordsFromModule(found.size);
  const solver = (await memberNamesOf([solverId])).get(solverId) ?? "";
  const copy = PUZZLE_DISPLAY[kind];
  const words = kind === "gomoji" || kind === "gomojiKana" || kind === "gomojiMot" || kind === "gomojiWort" || kind === "gomojiPop";
  const { wordStyle } = words ? await preferencesFor() : { wordStyle: undefined };
  const taken = guessesTaken(kind, solve.size, solve.level, solve.givens, found.answer);
  /* Unsolved on a countdown with guesses (or swaps) to spare, or a grid, which has no other way to end unsolved: its clock ran out. */
  // A Sakasa is won by getting through and lost by typing its word (`backwards.ts`): caught, when its last guess was the word.
  const sakasa = isBackwardsGivens(solve.givens);
  const caught = sakasa && found.answer !== null && (guessesOf(kind, solve.size, found.answer) ?? []).at(-1) === hiddenWordsOf(kind, solve.size, solve.givens)?.words[0];
  // How it ended, worked out once for every kind (`puzzleOutcome`): "Won" for a card game, "Out of guesses" for a word; a Sakasa says its own.
  const ended: PuzzleOutcome = sakasa && solve.solved
    ? { words: "Got through", mark: "success" }
    : caught
      ? { words: "Caught", mark: "failure" }
      : puzzleOutcome(kind, solve.solved, solve.clock !== "none", taken);
  const outcome = ended.words;
  const timed = PUZZLE_CLOCK_DISPLAY[solve.clock as PuzzleClock] ?? PUZZLE_CLOCK_DISPLAY.none;
  const helped = [
    solve.checksUsed ? `${solve.checksUsed} ${solve.checksUsed === 1 ? "check" : "checks"}${solve.checksAllowed === null ? "" : ` of ${solve.checksAllowed}`}` : null,
    hintsWords(kind, solve.level, solve.hintsUsed),
    // Cheat, or a level's explosions eased: the help that takes a solve's points and its place on the fastest table.
    solve.helped === null ? null : SOLVE_HELP_WORDS[solve.helped],
  ].filter((part) => part !== null);
  const headStart = hadHeadStart(kind, solve.level, solve.hintsUsed);
  const bandLabel = PUZZLE_LEVEL_DISPLAY[solve.level as PuzzleLevel]?.label ?? solve.level;
  // A level is named by its number, the third of its size it sits in said beside it; a board by its level.
  const levelNumber = suidoLevel ?? meikyuuLevel;
  const levelLabel = levelNumber === null ? bandLabel : `${levelNumber}, ${bandLabel.toLowerCase()}`;
  const levelTitle = levelNumber === null ? bandLabel : `Level ${levelNumber}`;
  // "Draw 1", "7 tiles", "9×9": the size in the words its set-up chooses it by, capitalised as a value in a list is.
  const sizeShown = capitalised(sizeWord(solve.size, kind));
  const sizeLabel = puzzleSizeLabel(kind);
  const finished = solve.finishedAt.toISOString();
  /*
   * THE FACTS IN PLAIN WORDS (John, 2026-09-29: "The box that talks about how
   * it ended... that english is also weird?"): Result, the size by its own
   * name, the level, and a date a person reads rather than 2026-09-29.
   */
  const facts: { label: string; value: ReactNode; testId: string }[] = [
    {
      label: "Result",
      value: (
        <span className="inline-flex items-center gap-1.5">
          <ResultMark kind={ended.mark} />
          {outcome}
        </span>
      ),
      testId: "solve-outcome",
    },
    // A word puzzle says its word, found or not: a word not found is the one thing the grid cannot show.
    ...(words ? [{ label: "The word", value: kept ? wordOf(kind, solve.givens, solve.size, solve.level, found.answer) : "Kept back until tomorrow", testId: "solve-word" }] : []),
    { label: sizeLabel, value: sizeShown, testId: "solve-puzzle" },
    { label: "Level", value: levelLabel, testId: "solve-level" },
    { label: "Time", value: clockText(solve.elapsedMs), testId: "solve-time" },
    ...(timed.ms === null ? [] : [{ label: "Countdown", value: `${timed.label} ${timed.kanji}, ${timed.time}`, testId: "solve-clock" }]),
    // A word's guesses, out of the level's allowance: the other half of how it went.
    ...(taken === null ? [] : [{ label: taken.unit === "swaps" ? "Swaps" : taken.unit === "moves" ? "Moves" : "Guesses", value: `${guessesText(taken)}`, testId: "solve-guesses" }]),
    { label: "Points", value: String(solve.points), testId: "solve-points" },
    { label: "Help used", value: helped.length === 0 ? "None" : helped.join(" · "), testId: "solve-help" },
    { label: "Finished", value: <LocalTime at={finished} style="date" />, testId: "solve-date" },
  ];
  // The day as the reader reads a date, never 2026-09-30.
  const day = <LocalTime at={finished} style="date" />;
  const trail = own ? [{ label: "Yours", href: myGamePath(kind) }, { label: day }] : [{ label: "All solves", href: historyPath(kind) }, { label: day }];
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={own ? `Your ${copy.label}` : copy.label}
        kanji={copy.kanji}
        crumb={<GameTrail game={{ label: copy.label, href: gamePath(kind) }} steps={trail} />}
        lead={
          own ? (
            <span className="inline-flex flex-wrap items-center gap-x-1.5" data-testid="solve-lead">
              <ResultMark kind={ended.mark} />
              <span>
                {outcome}, <LocalTime at={finished} style="date" />.
              </span>
            </span>
          ) : (
            <span className="inline-flex flex-wrap items-center gap-x-1.5" data-testid="solve-solver">
              <ResultMark kind={ended.mark} />
              <span>
                {outcome} by <PlayerName name={solver} memberId={solverId} fallback="A member" />, <LocalTime at={finished} style="date" />.
              </span>
            </span>
          )
        }
      />
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4" data-width-reason="one finished puzzle: its board, the facts beside it and the lead that says how it ended, kept to the width the board is drawn at" data-testid="solve-page" data-solve={solve.id} data-kept={solve.answer === null ? "false" : "true"} data-own={own ? "true" : "false"}>
        <WordStyleProvider initial={wordStyle ?? WORD_STYLES.reversi} saves={false}>
          <FinishedPuzzle
            kind={kind}
            size={solve.size}
            level={solve.level as PuzzleLevel}
            givens={solve.givens}
            answer={solve.answer}
            steps={kept ? solve.steps : null}
            derive={kept && solve.solved}
            headStart={headStart}
            story={{
              kind: words ? "Word" : "Solve",
              kanji: copy.kanji,
              title: (
                <>
                  <PlayerName name={solver} memberId={solverId} fallback="A member" />
                  &apos;s {copy.label} · {sizeShown} · {levelTitle}
                </>
              ),
              // Played, not solved: a Solitaire given up is kept and replayed too.
              source: <>Played on Itsutsu · {day}</>,
            }}
          />
        </WordStyleProvider>
        {/* Meikyuu is drawn in the colours the reader chose for it (`MeikyuuColours`), whoever's solve it is. */}
        {kind === "meikyuu" ? <MeikyuuAccountLook /> : null}
        {!kept ? (
          <p className="text-sm text-muted" data-testid="solve-kept-back">
            {fixed
              ? "This level is the same board for everybody, so how it was solved is kept back until you have solved it yourself. Here it is as it is dealt."
              : "Today's puzzle is the same for everybody, so how it was solved is kept back until tomorrow, or until you have finished it yourself."}{" "}
            <Link href={setUpPath(kind)} className="font-semibold text-ink underline underline-offset-2">
              {fixed ? "Play it" : "Play today's"}
            </Link>
          </p>
        ) : null}
        <dl className={`${PANEL_CLASS} grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm`} data-testid="solve-facts">
          {facts.map((fact) => (
            <div key={fact.testId} className="contents">
              <dt className="text-muted">{fact.label}</dt>
              <dd className="tabular-nums" data-testid={fact.testId}>
                {fact.value}
              </dd>
            </div>
          ))}
          {solve.raceId !== null ? (
            <div className="contents">
              <dt className="text-muted">Race</dt>
              <dd>
                <Link href={matchPath(kind, solve.raceId)} className="underline underline-offset-2">
                  The race it was
                </Link>
              </dd>
            </div>
          ) : null}
        </dl>
        <p className="flex flex-wrap gap-x-4 text-sm">
          {own ? null : (
            <Link href={puzzleRecordHref(kind, { member: solverId })} className="underline underline-offset-2" data-testid="solve-their-solves">
              All their {copy.label}
            </Link>
          )}
          <Link href={puzzleRecordHref(kind, { size: solve.size, level: solve.level as PuzzleLevel, clock: isPuzzleClock(solve.clock) ? solve.clock : null, sort: PUZZLE_RECORD_SORTS.fastest })} className="underline underline-offset-2" data-testid="solve-fastest-here">
            {`Fastest times, same ${FASTEST_SAME[sizeLabel] ?? sizeLabel.toLowerCase()} and level`}
            {timed.ms === null ? "" : ` on the ${timed.label}`}
          </Link>
          <Link href={myGamePath(kind)} className="underline underline-offset-2">
            All your {copy.label}
          </Link>
          <Link href={setUpPath(kind)} className="font-semibold underline underline-offset-2">
            Play another
          </Link>
        </p>
      </div>
    </Page>
  );
}

/** The level a Suido solve's board is, at its size, or null for a board made from a seed: the size's levels are read once, here, and nowhere a page does not ask. */
async function suidoLevelOfSolve(size: number, givens: string): Promise<number | null> {
  await loadSuidoLevelsAt(size);
  return suidoLevelOfBoard(size, givens);
}
