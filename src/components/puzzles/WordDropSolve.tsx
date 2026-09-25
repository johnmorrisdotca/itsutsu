"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { playPath } from "@/lib/gomoku/slugs";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { decodeWordDropProgress, encodeWordDropProgress } from "@/lib/puzzles/puzzleProgress";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { breaksHardRule, decodeHidden, isWord, markGuess, rowsFor, type LetterMark } from "@/lib/puzzles/wordDrop/code";
import { backspace, choose, clearAt, emptyRow, step, typeLetter, wordOf, type TypingRow } from "@/lib/puzzles/wordDrop/typingRow";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { WordDropGrid } from "./WordDropGrid";
import { WordKeyboard } from "./WordKeyboard";
import { useWordStyle } from "./WordStyleContext";
import { WordStylePicker } from "./WordStylePicker";
import { useWordKeys, wordKeysClass, WordKeysToggle } from "./WordKeysToggle";
import { type ResumedRun, SolveDone, SolveHeader, SolvePaused, type SolveRace, useSolve } from "./solveShared";

const BEST: Record<LetterMark, number> = { hit: 3, near: 2, miss: 1 };

/**
 * Solving WordDrop: type a word, press Enter, read its colours, and find the
 * hidden word before the rows run out.
 *
 * Letters come from the keyboard under the grid or the one on the desk; a
 * guess must be a word of the list (`isWord`), and at hard it must use every
 * letter already found (`breaksHardRule`). A guess that is refused costs
 * nothing and says why. The word found is handed in as every guess in order;
 * the rows spent without finding it end the puzzle unsolved (`runOut`), and
 * the word is shown.
 */
export function WordDropSolve({
  puzzle,
  hasAccount,
  race = null,
  resumed = null,
}: {
  puzzle: Puzzle;
  hasAccount: boolean;
  race?: SolveRace | null;
  /** What was written on this puzzle when it was last left, to start from; null for a fresh start. */
  resumed?: ResumedRun | null;
}) {
  const hydrated = useHydrated();
  const { style } = useWordStyle();
  const keys = useWordKeys();
  const { kind, size, level, seed } = puzzle;
  const hidden = useMemo(() => decodeHidden(puzzle.givens, size) ?? "", [puzzle.givens, size]);
  const rows = rowsFor(size);
  const [guesses, setGuesses] = useState<string[]>(() => (resumed === null ? null : decodeWordDropProgress(resumed.progress, size)) ?? []);
  const [typing, setTyping] = useState<TypingRow>(() => emptyRow(size));
  const [said, setSaid] = useState<string | null>(null);
  const { elapsedMs, done, begin, finish, runOut, pausing } = useSolve(
    puzzle,
    hasAccount,
    race,
    null,
    { progress: encodeWordDropProgress(guesses), resumed },
    false,
    true,
  );

  const marks = useMemo(() => guesses.map((guess) => markGuess(guess, hidden)), [guesses, hidden]);
  const known = useMemo(() => {
    const best = new Map<string, LetterMark>();
    guesses.forEach((guess, row) =>
      [...guess].forEach((letter, at) => {
        const mark = marks[row]![at]!;
        const was = best.get(letter);
        if (was === undefined || BEST[mark] > BEST[was]) best.set(letter, mark);
      }),
    );
    return best;
  }, [guesses, marks]);

  const closed = done !== null || pausing.paused;

  /* Every change to the row being typed goes through here (`typingRow.ts`): a letter, a clear, a tap, an arrow. */
  const edit = useCallback(
    (change: (row: TypingRow) => TypingRow) => {
      if (closed) return;
      setSaid(null);
      setTyping(change);
    },
    [closed],
  );
  const letter = useCallback((typed: string) => edit((row) => typeLetter(row, typed)), [edit]);
  const back = useCallback(() => edit(backspace), [edit]);

  const enter = useCallback(() => {
    if (closed) return;
    const word = wordOf(typing);
    if (word === null) {
      setSaid(`A guess is ${size} letters.`);
      return;
    }
    if (!isWord(word, size)) {
      setSaid(`${word.toUpperCase()} is not in the word list.`);
      return;
    }
    const breaks = level === "hard" ? breaksHardRule(guesses, hidden, word) : null;
    if (breaks !== null) {
      setSaid(`Hard: ${breaks}.`);
      return;
    }
    const at = begin();
    const next = [...guesses, word];
    setGuesses(next);
    setTyping(emptyRow(size));
    setSaid(null);
    if (word === hidden) void finish(next.join(""), at);
    else if (next.length === rows) void runOut(next.join(""), at);
  }, [closed, typing, size, level, guesses, hidden, begin, finish, runOut, rows]);

  /* The desk's keyboard: letters, Enter, Backspace and Delete, Space to clear the chosen letter, the arrows to move — whenever the puzzle is open. */
  useEffect(() => {
    if (closed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select") !== null) return;
      if (/^[a-zA-Z]$/.test(event.key)) {
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
    <section className="flex flex-col gap-4" data-testid="puzzle-play" data-kind={kind} data-seed={seed} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      <SolvePaused pausing={pausing}>
        <WordDropGrid
          size={size}
          rows={rows}
          guesses={guesses}
          marks={marks}
          typing={typing}
          done={done !== null}
          style={style}
          onChoose={(place) => edit((row) => choose(row, place))}
        />
      </SolvePaused>
      {done === null ? (
        <>
          <p className="min-h-5 text-sm text-muted" data-testid="word-said" aria-live="polite">
            {said ?? `Type a ${size}-letter word and press Enter. ${rows - guesses.length} ${rows - guesses.length === 1 ? "guess" : "guesses"} left.`}
          </p>
          <div className={`${wordKeysClass(keys.shown)} flex-col`} data-testid="word-keys-box">
            <WordKeyboard known={known} style={style} disabled={pausing.paused} onLetter={letter} onEnter={enter} onBack={back} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <WordStylePicker />
            <WordKeysToggle shown={keys.shown} onToggle={keys.toggle} />
          </div>
        </>
      ) : done.outOfGuesses ? (
        <div className="flex flex-col gap-2" data-testid="word-out">
          <p className="text-base">
            Out of guesses. The word was <strong className="uppercase tracking-wide" data-testid="word-was">{hidden}</strong>.
          </p>
          <Link href={`${playPath(kind)}${puzzleQuery({ size, level, seed: null, checks: null, hints: false })}`} className="text-sm font-semibold underline" data-testid="word-another">
            Another word
          </Link>
        </div>
      ) : (
        <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} checks={null} />
      )}
    </section>
  );
}
