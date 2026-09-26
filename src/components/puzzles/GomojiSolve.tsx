"use client";

import Link from "@/components/ui/Link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { FeltPatches } from "@/components/board/FeltPatches";
import { useFeltChoice } from "@/components/board/useFeltChoice";
import type { Appearance } from "@/components/board/board.types";
import { playPath } from "@/lib/gomoku/slugs";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { decodeGomojiProgress, encodeGomojiProgress } from "@/lib/puzzles/puzzleProgress";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { breaksHardRule, decodeHidden, isWord, languageOf, markGuess } from "@/lib/puzzles/gomoji/code";
import { guessesFor } from "@/lib/puzzles/gomoji/layout";
import { backspace, choose, clearAt, emptyRow, step, typeLetter, wordOf, type TypingRow } from "@/lib/puzzles/gomoji/typingRow";
import { headStartKeys } from "@/lib/puzzles/gomoji/headStart";
import { knownCounts, letterKeyMarks, typedCounts, withHeadStart } from "@/lib/puzzles/keyMarks";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { viewHref } from "@/lib/history/myGamesViews";
import { wordScore } from "@/lib/puzzles/gomoji/wordScore";

import { GomojiGrid } from "./GomojiGrid";
import { WordReplay } from "./WordReplay";
import { WordScoreLine } from "./WordScoreLine";
import { WordKeyboard } from "./WordKeyboard";
import { useWordStyle } from "./WordStyleContext";
import { WordStylePicker } from "./WordStylePicker";
import { usePlayInView } from "./usePlayInView";
import { useWordKeys, wordKeysClass, WordKeysToggle } from "./WordKeysToggle";
import { type ResumedRun, SolveDone, SolveHeader, SolvePaused, type SolveRace, useSolve } from "./solveShared";
import { PuzzleWayBack } from "./PuzzleWayBack";
import { BUTTON_BASE, BUTTON_STRONG } from "@/components/ui/ui.constants";

/**
 * Solving Gomoji: type a word, press Enter, read its colours, and find the
 * hidden word before the rows run out.
 *
 * Letters come from the keyboard under the grid or the one on the desk; a
 * guess must be a word of the list (`isWord`), and Strict, where it was
 * chosen, must use every letter already found (`breaksHardRule`). The level
 * decides how many guesses there are (`layout.ts`). A guess that is refused costs
 * nothing and says why. The word found is handed in as every guess in order;
 * the rows spent without finding it end the puzzle unsolved (`runOut`), and
 * the word is shown.
 */
export function GomojiSolve({
  puzzle,
  strict = false,
  headStart = false,
  hasAccount,
  race = null,
  resumed = null,
  appearance = DEFAULT_APPEARANCE,
}: {
  /** Whether Strict was chosen: every letter found must be played again, a green in its place. */
  strict?: boolean;
  /** Whether Head start was chosen: as many letters as the word has, none of them in it, grey before the first guess (`headStart.ts`). */
  headStart?: boolean;
  puzzle: Puzzle;
  hasAccount: boolean;
  race?: SolveRace | null;
  /** What was written on this puzzle when it was last left, to start from; null for a fresh start. */
  resumed?: ResumedRun | null;
  /** The reader's board, so the board colour picker starts where they left it (`useFeltChoice`). */
  appearance?: Appearance;
}) {
  const hydrated = useHydrated();
  const { style } = useWordStyle();
  const keys = useWordKeys();
  // The same board colour picker a Reversi or Gomoku board offers (`useFeltChoice`); every Gomoji style shares it.
  const { felt, chooseFelt } = useFeltChoice(appearance);
  const dressed = useMemo(() => ({ ...appearance, felt }), [appearance, felt]);
  const { kind, size, level, seed } = puzzle;
  const lang = useMemo(() => languageOf(kind), [kind]);
  const hidden = useMemo(() => decodeHidden(puzzle.givens, size, lang) ?? "", [puzzle.givens, size, lang]);
  // Mot and Wort are laid out as English Gomoji is (`layout.ts`).
  const rows = guessesFor("gomoji", size, level, 0);
  const [guesses, setGuesses] = useState<string[]>(() => (resumed === null ? null : decodeGomojiProgress(resumed.progress, size, lang)) ?? []);
  const [typing, setTyping] = useState<TypingRow>(() => emptyRow(size));
  const [said, setSaid] = useState<string | null>(null);
  // Typing has begun: from here the board and the keys are kept on the screen together (`usePlayInView`).
  const [engaged, setEngaged] = useState(false);
  const { elapsedMs, done, begin, finish, runOut, pausing } = useSolve(
    puzzle,
    hasAccount,
    race,
    null,
    { progress: encodeGomojiProgress(guesses), resumed, strict, headStart },
    false,
    true,
  );

  const marks = useMemo(() => guesses.map((guess) => markGuess(guess, hidden)), [guesses, hidden]);
  // The head start's letters are grey from the first moment, as a guess would have left them; a guess can only say the same of them.
  const given = useMemo(() => (headStart ? headStartKeys(kind, size, puzzle.givens) : []), [headStart, kind, size, puzzle.givens]);
  const known = useMemo(() => withHeadStart(letterKeyMarks(guesses, hidden), given, "miss"), [guesses, hidden, given]);
  // How many of a letter the marks on the board prove, never the hidden word: a count on its key from two.
  const counted = useMemo(() => knownCounts(guesses, marks), [guesses, marks]);

  const playRoot = usePlayInView(engaged && done === null, typing);
  const closed = done !== null || pausing.paused;

  /* Every change to the row being typed goes through here (`typingRow.ts`): a letter, a clear, a tap, an arrow. */
  const edit = useCallback(
    (change: (row: TypingRow) => TypingRow) => {
      if (closed) return;
      setSaid(null);
      setEngaged(true);
      setTyping(change);
    },
    [closed],
  );
  /* The first letter typed starts the clock, not the first guess sent: see `GomojiKanaSolve`'s `kana`. */
  const letter = useCallback(
    (typed: string) => {
      if (closed) return;
      begin();
      edit((row) => typeLetter(row, typed));
    },
    [closed, begin, edit],
  );
  const back = useCallback(() => edit(backspace), [edit]);

  const enter = useCallback(() => {
    if (closed) return;
    const word = wordOf(typing);
    if (word === null) {
      setSaid(`A guess is ${size} letters.`);
      return;
    }
    if (!isWord(word, size, lang)) {
      setSaid(`${word.toUpperCase()} is not in the word list.`);
      return;
    }
    const breaks = strict ? breaksHardRule(guesses, hidden, word) : null;
    if (breaks !== null) {
      setSaid(`Strict: ${breaks}.`);
      return;
    }
    const at = begin();
    const next = [...guesses, word];
    setGuesses(next);
    setTyping(emptyRow(size));
    setSaid(null);
    if (word === hidden) void finish(next.join(""), at);
    else if (next.length === rows) void runOut(next.join(""), at);
  }, [closed, typing, size, strict, guesses, hidden, lang, begin, finish, runOut, rows]);

  /* The desk's keyboard: letters, Enter, Backspace and Delete, Space to clear the chosen letter, the arrows to move — whenever the puzzle is open. */
  useEffect(() => {
    if (closed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select") !== null) return;
      if (/^[a-zA-ZäöüÄÖÜ]$/.test(event.key)) {
        event.preventDefault();
        letter(event.key.toLowerCase());
      } else if (event.key === "Enter") {
        event.preventDefault();
        enter();
      } else if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        back();
      } else if (event.key === " ") {
        event.preventDefault();
        edit(clearAt);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        edit((row) => step(row, event.key === "ArrowLeft" ? -1 : 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closed, letter, enter, back, edit]);

  return (
    <section ref={playRoot} className="flex flex-col gap-4" data-testid="puzzle-play" data-kind={kind} data-seed={seed} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} headStart={headStart} />
      {/* Over, the board becomes its replay in the same place, with its scrubber and keyboard (`WordReplay`). */}
      {done === null ? (
        <SolvePaused pausing={pausing}>
          <GomojiGrid
            size={size}
            rows={rows}
            guesses={guesses}
            marks={marks}
            typing={typing}
            done={false}
            style={style}
            onChoose={(place) => edit((row) => choose(row, place))}
            appearance={dressed}
          />
        </SolvePaused>
      ) : (
        <WordReplay
          kind={kind === "gomojiKana" ? "gomojiKana" : kind === "gomojiMot" ? "gomojiMot" : kind === "gomojiWort" ? "gomojiWort" : "gomoji"}
          size={size}
          givens={puzzle.givens}
          guesses={guesses}
          level={level}
          headStart={headStart}
          style={style}
          appearance={dressed}
        />
      )}
      {done === null ? (
        <>
          <p className="min-h-5 text-sm text-muted" data-testid="word-said" aria-live="polite">
            {said ?? `Type a ${size}-letter word and press Enter. ${rows - guesses.length} ${rows - guesses.length === 1 ? "guess" : "guesses"} left.`}
          </p>
          <div className={`${wordKeysClass(keys.shown)} flex-col`} data-testid="word-keys-box">
            <WordKeyboard known={known} counted={counted} typed={typedCounts(typing.slots)} style={style} lang={lang} disabled={pausing.paused} onLetter={letter} onEnter={enter} onBack={back} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <WordStylePicker />
            <FeltPatches felt={felt} wood={appearance.boardTheme} onChoose={chooseFelt} />
            <WordKeysToggle shown={keys.shown} onToggle={keys.toggle} />
          </div>
        </>
      ) : done.outOfGuesses ? (
        <div className="flex flex-col gap-2" data-testid="word-out">
          <p className="text-base">
            Out of {rows} guesses. The word was <strong className="uppercase tracking-wide" data-testid="word-was">{hidden}</strong>.
          </p>
          <WordScoreLine score={wordScore(hidden, guesses, rows, done.elapsedMs)} headStart={headStart} />
          {/* Where the word went, and what playing it out paid: a loss is kept, never lost. */}
          {hasAccount && race === null ? (
            <p className="text-xs text-muted" data-testid="word-kept">
              {done.paid !== null && done.paid.points > 0 ? `+${done.paid.points} XP for playing it out. ` : ""}
              Kept in{" "}
              <Link href={viewHref("completed")} className="underline">
                My games
              </Link>{" "}
              with your guesses.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2" data-testid="puzzle-way-on">
            <Link
              href={`${playPath(kind)}${puzzleQuery({ size, level, seed: null, checks: null, hints: false, strict, headStart })}`}
              className={`${BUTTON_BASE} ${BUTTON_STRONG}`}
              data-testid="word-another"
            >
              Another word →
            </Link>
            <PuzzleWayBack kind={kind} />
          </div>
        </div>
      ) : (
        <>
          <WordScoreLine score={wordScore(hidden, guesses, rows, done.elapsedMs)} headStart={headStart} />
          <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} checks={null} strict={strict} headStart={headStart} />
        </>
      )}
      {/*
        The licences of the dictionaries and of FrequencyWords ask for this on every page that shows their words: French and
        German only, English's SCOWL asks for no in-page credit. The dictionary decides what is a word, Wiktionary which may
        be hidden, and the count how common.
      */}
      {lang === "en" ? null : (
        <p className="text-xs text-muted" data-testid="word-credit">
          Words from{" "}
          {lang === "fr" ? (
            <a href="http://www.lexique.org" className="underline" rel="noreferrer" target="_blank">
              Lexique 3.83
            </a>
          ) : (
            <a href="https://github.com/languagetool-org/german-pos-dict" className="underline" rel="noreferrer" target="_blank">
              LanguageTool&apos;s German dictionary
            </a>
          )}
          {" and "}
          <a href="https://en.wiktionary.org" className="underline" rel="noreferrer" target="_blank">
            Wiktionary
          </a>
          , ranked by{" "}
          <a href="https://github.com/hermitdave/FrequencyWords" className="underline" rel="noreferrer" target="_blank">
            FrequencyWords
          </a>{" "}
          by Hermit Dave, a count of OpenSubtitles 2018; all used under{" "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" className="underline" rel="noreferrer" target="_blank">
            CC BY-SA 4.0
          </a>
          .
        </p>
      )}
    </section>
  );
}
