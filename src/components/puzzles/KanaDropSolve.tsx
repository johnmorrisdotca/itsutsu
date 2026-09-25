"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { playPath } from "@/lib/gomoku/slugs";
import { viewHref } from "@/lib/history/myGamesViews";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { decodeKanaProgress, encodeKanaProgress } from "@/lib/puzzles/puzzleProgress";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { backspace, choose, clearAt, emptyRow, step, typeLetter, wordOf, type TypingRow } from "@/lib/puzzles/wordDrop/typingRow";
import { breaksKanaHardRule, decodeKanaGivens, KANA_ROWS, toHiragana } from "@/lib/puzzles/wordDropKana/kanaCode";
import { cycleMark, kanaBase, markKanaGuess, toggleSize, type KanaMarked } from "@/lib/puzzles/wordDropKana/kanaMarks";
import { kanaScore } from "@/lib/puzzles/wordDropKana/kanaScore";
import { kanaWordsOf } from "@/lib/puzzles/wordDropKana/kanaWords";
import { finishRomaji, readRomaji } from "@/lib/puzzles/wordDropKana/romaji";
import { kanaKeyMarks, typedCounts } from "@/lib/puzzles/keyMarks";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { KanaKeyboard } from "./KanaKeyboard";
import { WordDropGrid, type CellArrow } from "./WordDropGrid";
import { WordReplay } from "./WordReplay";
import { WordScoreLine } from "./WordScoreLine";
import { useWordKeys, wordKeysClass, WordKeysToggle } from "./WordKeysToggle";
import { useWordStyle } from "./WordStyleContext";
import { WordStylePicker } from "./WordStylePicker";
import { type ResumedRun, SolveDone, SolveHeader, SolvePaused, type SolveRace, useSolve } from "./solveShared";


function arrowOf(mark: KanaMarked): CellArrow {
  return mark.wrongSize && mark.wrongMark ? "↓↑" : mark.wrongSize ? "↓" : mark.wrongMark ? "↑" : "";
}

/** The place the 小 and ゛゜ keys change: the chosen kana, or the one just typed before the waiting place. */
function lastTyped(row: TypingRow): number {
  return row.at < row.slots.length && row.slots[row.at] !== "" ? row.at : row.at - 1;
}

function changeLast(row: TypingRow, change: (kana: string) => string): TypingRow {
  const at = lastTyped(row);
  if (at < 0 || row.slots[at] === "") return row;
  return { ...row, slots: row.slots.map((kana, index) => (index === at ? change(kana) : kana)) };
}

/**
 * Solving WordDrop in kana (docs/plans/other/WORD-04-kana.md): WordDrop's
 * grid, styles and keys, with John's colours — green, orange, yellow for the
 * column, grey — and an arrow on a kana right but for its size or mark.
 *
 * Kana come from the gojūon keys under the grid, with 小 and ゛゜ to change the
 * last one, or from the desk's keyboard in romaji (`readRomaji`), the sound
 * still being typed shown beside the prompt until it is a kana. On easy and
 * medium the grid opens with the free grey word already played.
 */
export function KanaDropSolve({
  puzzle,
  hasAccount,
  race = null,
  resumed = null,
}: {
  puzzle: Puzzle;
  hasAccount: boolean;
  race?: SolveRace | null;
  resumed?: ResumedRun | null;
}) {
  const hydrated = useHydrated();
  const { style } = useWordStyle();
  const keys = useWordKeys();
  const { kind, size, level, seed } = puzzle;
  const given = useMemo(() => decodeKanaGivens(puzzle.givens, size) ?? { word: "", grey: null }, [puzzle.givens, size]);
  const hidden = given.word;
  const words = useMemo(() => kanaWordsOf(size), [size]);
  const [guesses, setGuesses] = useState<string[]>(() => (resumed === null ? null : decodeKanaProgress(resumed.progress, size)) ?? []);
  const [typing, setTyping] = useState<TypingRow>(() => emptyRow(size));
  const [romaji, setRomaji] = useState("");
  const [said, setSaid] = useState<string | null>(null);
  const { elapsedMs, done, begin, finish, runOut, pausing } = useSolve(puzzle, hasAccount, race, null, { progress: encodeKanaProgress(guesses), resumed }, false, true);

  /* The rows drawn: the free grey word first where there is one, then the guesses. */
  const shown = useMemo(() => (given.grey === null ? guesses : [given.grey, ...guesses]), [given.grey, guesses]);
  const marked = useMemo(() => shown.map((guess) => markKanaGuess([...guess], [...hidden])), [shown, hidden]);
  const known = useMemo(() => kanaKeyMarks(shown, hidden), [shown, hidden]);

  const closed = done !== null || pausing.paused;

  const edit = useCallback(
    (change: (row: TypingRow) => TypingRow) => {
      if (closed) return;
      setSaid(null);
      setTyping(change);
    },
    [closed],
  );
  const kana = useCallback((typed: string) => edit((row) => typeLetter(row, typed)), [edit]);
  const back = useCallback(() => {
    if (romaji !== "") setRomaji((pending) => pending.slice(0, -1));
    else edit(backspace);
  }, [romaji, edit]);

  /* A key on the desk: added to the romaji being typed, and every kana it completes goes into the row. */
  const roman = useCallback(
    (key: string) => {
      if (closed) return;
      const { kana: made, rest } = readRomaji(romaji + key);
      if (made.length > 0) edit((row) => made.reduce(typeLetter, row));
      setRomaji(rest);
    },
    [closed, romaji, edit],
  );

  const enter = useCallback(() => {
    if (closed) return;
    // A last "n" is ん at Enter; any other half-typed sound is dropped.
    const row = romaji === "" ? typing : finishRomaji(romaji).reduce(typeLetter, typing);
    setRomaji("");
    setTyping(row);
    const word = wordOf(row);
    if (word === null) {
      setSaid(`A guess is ${size} kana.`);
      return;
    }
    if (!words.allowed.has(word)) {
      setSaid(`${word} is not in the word list.`);
      return;
    }
    const breaks = level === "hard" ? breaksKanaHardRule(guesses, hidden, word) : null;
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
    else if (next.length === KANA_ROWS) void runOut(next.join(""), at);
  }, [closed, romaji, typing, size, words, level, guesses, hidden, begin, finish, runOut]);

  /* The desk's keyboard: romaji, kana from a Japanese keyboard, Enter, Backspace and Delete, Space and the arrows. */
  useEffect(() => {
    if (closed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select") !== null) return;
      if (/^[a-zA-Z'-]$/.test(event.key)) {
        event.preventDefault();
        roman(event.key.toLowerCase());
      } else if (/^[ぁ-ゖァ-ヶー]$/u.test(event.key)) {
        event.preventDefault();
        kana(toHiragana(event.key));
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
  }, [closed, roman, kana, enter, back, edit]);

  const free = given.grey === null ? 0 : 1;
  const left = KANA_ROWS - guesses.length;
  const score = done === null ? null : kanaScore(hidden, guesses, KANA_ROWS, done.elapsedMs);
  return (
    <section className="flex flex-col gap-4" data-testid="puzzle-play" data-kind={kind} data-seed={seed} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      {/* Over, the board becomes its replay in the same place, with its scrubber and keyboard (`WordReplay`). */}
      {done === null ? (
        <SolvePaused pausing={pausing}>
            <WordDropGrid
              size={size}
              rows={free + KANA_ROWS}
              guesses={shown}
              marks={marked.map((row) => row.map((each) => each.mark))}
              arrows={marked.map((row) => row.map(arrowOf))}
              free={free}
              typing={typing}
              done={false}
              style={style}
              onChoose={(place) => edit((row) => choose(row, place))}
            />
        </SolvePaused>
      ) : (
        <WordReplay kind="wordDropKana" size={size} givens={puzzle.givens} guesses={guesses} style={style} />
      )}
      {done === null ? (
        <>
          <p className="min-h-5 text-sm text-muted" data-testid="word-said" aria-live="polite">
            {said ?? `${free === 1 ? "The first word is free, grey everywhere. " : ""}${left} ${left === 1 ? "guess" : "guesses"} left.`}
            {romaji === "" ? null : (
              <span className="ml-2 font-mono text-ink" data-testid="kana-romaji">
                {romaji}…
              </span>
            )}
          </p>
          <div className={`${wordKeysClass(keys.shown)} flex-col`} data-testid="word-keys-box">
            <KanaKeyboard
              known={known}
              typed={typedCounts(typing.slots, kanaBase)}
              style={style}
              disabled={pausing.paused}
              onKana={kana}
              onSmall={() => edit((row) => changeLast(row, toggleSize))}
              onMark={() => edit((row) => changeLast(row, cycleMark))}
              onEnter={enter}
              onBack={back}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <WordStylePicker />
            <WordKeysToggle shown={keys.shown} onToggle={keys.toggle} />
          </div>
        </>
      ) : done.outOfGuesses ? (
        <div className="flex flex-col gap-2" data-testid="word-out">
          <p className="text-base">
            Out of guesses. The word was <strong className="tracking-wide" data-testid="word-was">{hidden}</strong>.
          </p>
          <WordScoreLine score={score!} />
          {hasAccount && race === null ? (
            <p className="text-xs text-muted" data-testid="word-kept">
              {done.paid !== null && done.paid.points > 0 ? `+${done.paid.points} XP for playing it out. ` : ""}
              Kept in{" "}
              <Link href={viewHref("puzzles")} className="underline">
                My games
              </Link>{" "}
              with your guesses.
            </p>
          ) : null}
          <Link href={`${playPath(kind)}${puzzleQuery({ size, level, seed: null, checks: null, hints: false })}`} className="text-sm font-semibold underline" data-testid="word-another">
            Another word
          </Link>
        </div>
      ) : (
        <>
          <WordScoreLine score={score!} />
          <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} checks={null} />
        </>
      )}
      {/* JMdict's licence asks for this on every page that shows its words. */}
      <p className="text-xs text-muted" data-testid="kana-credit">
        Words from{" "}
        <a href="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project" className="underline" rel="noreferrer" target="_blank">
          JMdict
        </a>{" "}
        by the Electronic Dictionary Research and Development Group, used under its{" "}
        <a href="https://www.edrdg.org/edrdg/licence.html" className="underline" rel="noreferrer" target="_blank">
          licence
        </a>{" "}
        (CC BY-SA 4.0), release {words.release}.
      </p>
    </section>
  );
}
