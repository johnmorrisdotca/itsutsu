import Link from "@/components/ui/Link";
import { solveHelpWords } from "@/lib/puzzles/solveHelp";
import { currentSpeaker } from "@/lib/i18n/currentLocale";
import { SITE_NAME } from "@/lib/i18n/siteName";
import type { Speaker } from "@/lib/i18n/i18n";
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
import { PUZZLE_CLOCK_DISPLAY, PUZZLE_SPECS } from "@/lib/puzzles/puzzles.constants";
import { levelLabelOf, levelNameOf, puzzleCopy, puzzleName } from "@/lib/puzzles/puzzleCopy";
import { sizeWordIn } from "@/lib/puzzles/sizeWord";
import { commaOf, stopOf, withNote } from "@/lib/puzzles/puzzleText";
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

import { suidoLevelOfBoard } from "@/lib/puzzles/suido/levels";
import { isSuidoLevelSize } from "@/lib/puzzles/suido/sizes";
import { meikyuuLevelOfSolve } from "@/lib/puzzles/server/meikyuuRecords";
import { tobiishiLevelOfSolve } from "@/lib/puzzles/server/tobiishiRecords";
import { FinishedPuzzle } from "./FinishedPuzzle";
import { MeikyuuAccountLook } from "./MeikyuuAccountLook";
import { WordStyleProvider } from "./WordStyleContext";
import { GameTrail } from "@/components/games/GameTrail";

/** A word puzzle's hidden word, a Futago's two (`futago.ts`) or a Yotsugo's four (`yotsugo.ts`), in the case it is played in — a dodger's where it stood at the end (`wordOfPlay`). */
function wordOf(kind: PuzzleKind, givens: string, size: number, level: string, answer: string | null, say: Speaker): string {
  const named = (mode: { label: string; kanji: string }) => (say.pairsWithKanji ? `${mode.label} ${mode.kanji}` : mode.kanji);
  const asWord = (word: string, mode: string) => withNote(say, word, mode);
  if (isDodgeGivens(givens)) {
    const word = wordOfPlay(kind, size, level as PuzzleLevel, givens, answer === null ? [] : (guessesOf(kind, size, answer) ?? []));
    return word === null ? "" : asWord(wordsShown(kind, [word]), named(DODGE_DISPLAY));
  }
  // A Sakasa's word, the one it was played to avoid (`backwards.ts`).
  if (isBackwardsGivens(givens)) return asWord(wordsShown(kind, hiddenWordsOf(kind, size, givens)?.words ?? []), named(BACKWARDS_DISPLAY));
  const words = hiddenWordsOf(kind, size, givens)?.words ?? [];
  const mode = words.length === 4 ? YOTSUGO_DISPLAY : FUTAGO_DISPLAY;
  return words.length > 1 ? asWord(wordsShown(kind, words), named(mode)) : wordsShown(kind, words);
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
  // A Suido solve is of a LEVEL when its board is one of its size's levels (named by its hash): the same board for good, like a Tsunagi level.
  const suidoLevel = kind === "suido" && isSuidoLevelSize(found.size) ? suidoLevelOfBoard(found.size, found.givens) : null;
  // And a Meikyuu solve is of a LEVEL whenever its maze is one of the list's: the same maze for good.
  const meikyuuLevel = kind === "meikyuu" ? await meikyuuLevelOfSolve(found.size, found.givens) : null;
  // And a Tobiishi solve is of a LEVEL whenever its code is one of the package's: the same board for good.
  const tobiishiLevel = kind === "tobiishi" ? tobiishiLevelOfSolve(found.size, found.givens) : null;
  const fixed = PUZZLE_SPECS[kind].fixedLevels === true || suidoLevel !== null;
  const kept = own || (!fixed && !isTodayUtc(found.finishedAt)) || (await finishedSameGrid(me, kind, found.givens));
  const solve = kept ? found : { ...found, answer: null, steps: null };
  // A kana dodger's word is replayed from its list (`wordOfPlay`), loaded first.
  if (kind === "gomojiKana" && isDodgeGivens(found.givens)) await loadKanaWordsFromModule(found.size);
  const solver = (await memberNamesOf([solverId])).get(solverId) ?? "";
  const say = await currentSpeaker();
  const copy = puzzleCopy(kind, say.locale);
  const words = kind === "gomoji" || kind === "gomojiKana" || kind === "gomojiMot" || kind === "gomojiWort" || kind === "gomojiPop";
  const { wordStyle } = words ? await preferencesFor() : { wordStyle: undefined };
  const taken = guessesTaken(kind, solve.size, solve.level, solve.givens, found.answer);
  /* Unsolved on a countdown with guesses (or swaps) to spare, or a grid, which has no other way to end unsolved: its clock ran out. */
  // A Sakasa is won by getting through and lost by typing its word (`backwards.ts`): caught, when its last guess was the word.
  const sakasa = isBackwardsGivens(solve.givens);
  const caught = sakasa && found.answer !== null && (guessesOf(kind, solve.size, found.answer) ?? []).at(-1) === hiddenWordsOf(kind, solve.size, solve.givens)?.words[0];
  // How it ended, worked out once for every kind (`puzzleOutcome`): "Won" for a card game, "Out of guesses" for a word; a Sakasa says its own.
  const ended: PuzzleOutcome = sakasa && solve.solved
    ? { words: say.say("pset.solve.gotThrough"), mark: "success" }
    : caught
      ? { words: say.say("pset.solve.caught"), mark: "failure" }
      : puzzleOutcome(kind, solve.solved, solve.clock !== "none", taken, say);
  const outcome = ended.words;
  const timed = PUZZLE_CLOCK_DISPLAY[solve.clock as PuzzleClock] ?? PUZZLE_CLOCK_DISPLAY.none;
  const checksTaken = solve.checksUsed ? say.count("puzzle.count.check", solve.checksUsed) : null;
  const helped = [
    checksTaken === null ? null : solve.checksAllowed === null ? checksTaken : say.say("pset.solve.checksOf", { checks: checksTaken, allowed: String(solve.checksAllowed) }),
    hintsWords(kind, solve.level, solve.hintsUsed, say),
    // Cheat, or a level's explosions eased: the help that takes a solve's points and its place on the fastest table.
    solve.helped === null ? null : solveHelpWords(solve.helped, say),
  ].filter((part) => part !== null);
  const headStart = hadHeadStart(kind, solve.level, solve.hintsUsed);
  const bandLabel = levelLabelOf(solve.level, say.locale);
  // A level is named by its number, the third of its size it sits in said beside it; a board by its level.
  const levelNumber = suidoLevel ?? meikyuuLevel ?? tobiishiLevel;
  const levelLabel = levelNumber === null ? bandLabel : say.say("pset.solve.levelBand", { number: String(levelNumber), level: levelNameOf(solve.level, say.locale) });
  const levelTitle = levelNumber === null ? bandLabel : say.say("puzzle.level.number", { number: String(levelNumber) });
  // "Draw 1", "7 tiles", "9×9": the size in the words its set-up chooses it by, capitalised as a value in a list is.
  const sizeShown = capitalised(sizeWordIn(solve.size, kind, say));
  const sizeLabel = puzzleSizeLabel(kind, say);
  const timedName = say.locale === "ja" ? timed.kanji : timed.label;
  const finished = solve.finishedAt.toISOString();
  /*
   * THE FACTS IN PLAIN WORDS (John, 2026-09-29: "The box that talks about how
   * it ended... that english is also weird?"): Result, the size by its own
   * name, the level, and a date a person reads rather than 2026-09-29.
   */
  const facts: { label: string; value: ReactNode; testId: string }[] = [
    {
      label: say.say("pset.solve.result"),
      value: (
        <span className="inline-flex items-center gap-1.5">
          <ResultMark kind={ended.mark} />
          {outcome}
        </span>
      ),
      testId: "solve-outcome",
    },
    // A word puzzle says its word, found or not: a word not found is the one thing the grid cannot show.
    ...(words ? [{ label: say.say("pset.solve.theWord"), value: kept ? wordOf(kind, solve.givens, solve.size, solve.level, found.answer, say) : say.say("pset.solve.keptBackShort"), testId: "solve-word" }] : []),
    { label: sizeLabel, value: sizeShown, testId: "solve-puzzle" },
    { label: say.say("pset.solve.level"), value: levelLabel, testId: "solve-level" },
    { label: say.say("pset.solve.time"), value: clockText(solve.elapsedMs), testId: "solve-time" },
    ...(timed.ms === null ? [] : [{ label: say.say("pset.solve.countdown"), value: `${say.pairsWithKanji ? `${timed.label} ${timed.kanji}` : timed.kanji}${commaOf(say)}${timed.time}`, testId: "solve-clock" }]),
    // A word's guesses, out of the level's allowance: the other half of how it went.
    ...(taken === null ? [] : [{ label: say.say(taken.unit === "swaps" ? "pset.col.swaps" : taken.unit === "moves" ? "pset.col.moves" : "pset.col.guesses"), value: `${guessesText(taken)}`, testId: "solve-guesses" }]),
    { label: say.say("pset.solve.points"), value: String(solve.points), testId: "solve-points" },
    { label: say.say("pset.solve.helpUsed"), value: helped.length === 0 ? say.say("pset.solve.none") : helped.join(" · "), testId: "solve-help" },
    { label: say.say("pset.solve.finished"), value: <LocalTime at={finished} style="date" />, testId: "solve-date" },
  ];
  // The day as the reader reads a date, never 2026-09-30.
  const day = <LocalTime at={finished} style="date" />;
  const trail = own ? [{ label: say.say("pset.solve.yours"), href: myGamePath(kind) }, { label: day }] : [{ label: say.say("pset.rec.allSolves"), href: historyPath(kind) }, { label: day }];
  return (
    <Page>
      <SiteHeader />
      <PageTitle
        title={own ? say.say("pset.solve.yourTitle", { name: puzzleName(kind, say.locale) }) : puzzleName(kind, say.locale)}
        kanji={say.pairsWithKanji ? copy.kanji : ""}
        crumb={<GameTrail game={{ label: puzzleName(kind, say.locale), href: gamePath(kind) }} steps={trail} />}
        lead={
          own ? (
            <span className="inline-flex flex-wrap items-center gap-x-1.5" data-testid="solve-lead">
              <ResultMark kind={ended.mark} />
              <span>
                {outcome}
                {commaOf(say)}
                <LocalTime at={finished} style="date" />
                {stopOf(say)}
              </span>
            </span>
          ) : (
            <span className="inline-flex flex-wrap items-center gap-x-1.5" data-testid="solve-solver">
              <ResultMark kind={ended.mark} />
              <span>
                {say.say("pset.solve.leadBy", { outcome })}
                <PlayerName name={solver} memberId={solverId} fallback={say.say("points.board.aMember")} />
                {commaOf(say)}
                <LocalTime at={finished} style="date" />
                {stopOf(say)}
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
              kind: say.say(words ? "pset.solve.word" : "pset.solve.solve"),
              kanji: copy.kanji,
              title: (
                <>
                  <PlayerName name={solver} memberId={solverId} fallback={say.say("points.board.aMember")} />
                  {say.say("pset.solve.storyOf", { name: puzzleName(kind, say.locale) })} · {sizeShown} · {levelTitle}
                </>
              ),
              // Played, not solved: a Solitaire given up is kept and replayed too.
              source: <>{say.say("pset.solve.playedOn", { site: SITE_NAME })}{day}</>,
            }}
          />
        </WordStyleProvider>
        {/* Meikyuu is drawn in the colours the reader chose for it (`MeikyuuColours`), whoever's solve it is. */}
        {kind === "meikyuu" ? <MeikyuuAccountLook /> : null}
        {!kept ? (
          <p className="text-sm text-muted" data-testid="solve-kept-back">
            {fixed
              ? say.say("pset.solve.keptBackFixed")
              : say.say("pset.solve.keptBackToday")}{" "}
            <Link href={setUpPath(kind)} className="font-semibold text-ink underline underline-offset-2">
              {say.say(fixed ? "pset.solve.playIt" : "pset.solve.playTodays")}
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
              <dt className="text-muted">{say.say("pset.solve.race")}</dt>
              <dd>
                <Link href={matchPath(kind, solve.raceId)} className="underline underline-offset-2">
                  {say.say("pset.solve.theRaceItWas")}
                </Link>
              </dd>
            </div>
          ) : null}
        </dl>
        <p className="flex flex-wrap gap-x-4 text-sm">
          {own ? null : (
            <Link href={puzzleRecordHref(kind, { member: solverId })} className="underline underline-offset-2" data-testid="solve-their-solves">
              {say.say("pset.solve.allTheirs", { name: puzzleName(kind, say.locale) })}
            </Link>
          )}
          <Link href={puzzleRecordHref(kind, { size: solve.size, level: solve.level as PuzzleLevel, clock: isPuzzleClock(solve.clock) ? solve.clock : null, sort: PUZZLE_RECORD_SORTS.fastest })} className="underline underline-offset-2" data-testid="solve-fastest-here">
            {say.say("pset.solve.fastestSame", { size: say.locale === "ja" ? sizeLabel : (FASTEST_SAME[sizeLabel] ?? sizeLabel.toLowerCase()) })}
            {timed.ms === null ? "" : say.say("pset.solve.onClock", { clock: timedName })}
          </Link>
          <Link href={myGamePath(kind)} className="underline underline-offset-2">
            {say.say("pset.solve.allYours", { name: puzzleName(kind, say.locale) })}
          </Link>
          <Link href={setUpPath(kind)} className="font-semibold underline underline-offset-2">
            {say.say("pset.solve.playAnother")}
          </Link>
        </p>
      </div>
    </Page>
  );
}
