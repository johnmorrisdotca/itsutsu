"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { playPath } from "@/lib/gomoku/slugs";
import { viewHref } from "@/lib/history/myGamesViews";
import { puzzleQuery } from "@/lib/puzzles/puzzleAddress";
import { decodeKanaProgress, encodeKanaProgress } from "@/lib/puzzles/puzzleProgress";
import type { Puzzle } from "@/lib/puzzles/puzzles.types";
import { backspace, choose, clearAt, emptyRow, step, typeLetter, wordOf, type TypingRow } from "@/lib/puzzles/gomoji/typingRow";
import { guessesFor } from "@/lib/puzzles/gomoji/layout";
import { breaksKanaHardRule, decodeKanaGivens, toHiragana } from "@/lib/puzzles/gomojiKana/kanaCode";
import { cycleMark, kanaBase, markKanaGuess, toggleSize, type KanaMarked } from "@/lib/puzzles/gomojiKana/kanaMarks";
import { kanaScore } from "@/lib/puzzles/gomojiKana/kanaScore";
import { kanaWordsOf } from "@/lib/puzzles/gomojiKana/kanaWords";
import { finishRomaji, readRomaji } from "@/lib/puzzles/gomojiKana/romaji";
import { kanaKeyMarks, typedCounts } from "@/lib/puzzles/keyMarks";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";

import { KanaKeyboard } from "./KanaKeyboard";
import { GomojiGrid, type CellArrow } from "./GomojiGrid";
import { WordReplay } from "./WordReplay";
import { WordScoreLine } from "./WordScoreLine";
import { useWordKeys, wordKeysClass, WordKeysToggle } from "./WordKeysToggle";
import { useWordStyle } from "./WordStyleContext";
import { WordStylePicker } from "./WordStylePicker";
import { usePlayInView } from "./usePlayInView";
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
 * Solving Gomoji in kana (docs/plans/other/WORD-04-kana.md): Gomoji's
 * grid, styles and keys, with John's colours — green, orange, yellow for the
 * column, grey — and an arrow on a kana right but for its size or mark.
 *
 * Kana come from the gojūon keys under the grid, with 小 and ゛゜ to change the
 * last one, or from the desk's keyboard in romaji (`readRomaji`), the sound
 * still being typed shown beside the prompt until it is a kana. On easy and
 * medium the grid opens with the free grey word already played. The level
 * decides how many guesses follow it (`layout.ts`); Strict, where it was
 * chosen, holds every guess to the kana already found (`breaksKanaHardRule`).
 */
export function GomojiKanaSolve({
  puzzle,
  strict = false,
  hasAccount,
  race = null,
  resumed = null,
}: {
  puzzle: Puzzle;
  /** Whether Strict was chosen: every kana found must be played again, a green in its place. */
  strict?: boolean;
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
  const free = given.grey === null ? 0 : 1;
  const rows = guessesFor("gomojiKana", size, level, free);
  const words = useMemo(() => kanaWordsOf(size), [size]);
  const [guesses, setGuesses] = useState<string[]>(() => (resumed === null ? null : decodeKanaProgress(resumed.progress, size)) ?? []);
  const [typing, setTyping] = useState<TypingRow>(() => emptyRow(size));
  const [romaji, setRomaji] = useState("");
  const [said, setSaid] = useState<string | null>(null);
  // Typing has begun: from here the board and the keys are kept on the screen together (`usePlayInView`).
  const [engaged, setEngaged] = useState(false);
  const { elapsedMs, done, begin, finish, runOut, pausing } = useSolve(puzzle, hasAccount, race, null, { progress: encodeKanaProgress(guesses), resumed, strict }, false, true);

  /* The rows drawn: the free grey word first where there is one, then the guesses. */
  const shown = useMemo(() => (given.grey === null ? guesses : [given.grey, ...guesses]), [given.grey, guesses]);
  const marked = useMemo(() => shown.map((guess) => markKanaGuess([...guess], [...hidden])), [shown, hidden]);
  const known = useMemo(() => kanaKeyMarks(shown, hidden), [shown, hidden]);

  const playRoot = usePlayInView(engaged && done === null, typing);
  const closed = done !== null || pausing.paused;

  const edit = useCallback(
    (change: (row: TypingRow) => TypingRow) => {
      if (closed) return;
      setSaid(null);
      setEngaged(true);
      setTyping(change);
    },
    [closed],
  );
  /*
   * The first kana typed starts the clock, on the keys under the board as on
   * a desk's keyboard. It started at the first guess sent, so on a phone a
   * player typing their first word watched 0:00 and a Pause they could not
   * press — John, 2026-09-25: "clock doesn't start on iPhone with keyboard use."
   */
  const kana = useCallback(
    (typed: string) => {
      if (closed) return;
      begin();
      edit((row) => typeLetter(row, typed));
    },
    [closed, begin, edit],
  );
  const back = useCallback(() => {
    if (romaji !== "") setRomaji((pending) => pending.slice(0, -1));
    else edit(backspace);
  }, [romaji, edit]);

  /* A key on the desk: added to the romaji being typed, and every kana it completes goes into the row. */
  const roman = useCallback(
    (key: string) => {
      if (closed) return;
      const { kana: made, rest } = readRomaji(romaji + key);
      if (made.length > 0) {
        begin();
        edit((row) => made.reduce(typeLetter, row));
      }
      setRomaji(rest);
    },
    [closed, romaji, begin, edit],
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
    const breaks = strict ? breaksKanaHardRule(guesses, hidden, word) : null;
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
  }, [closed, romaji, typing, size, words, strict, guesses, hidden, begin, finish, runOut, rows]);

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

  const left = rows - guesses.length;
  const score = done === null ? null : kanaScore(hidden, guesses, rows, done.elapsedMs);
  return (
    <section ref={playRoot} className="flex flex-col gap-4" data-testid="puzzle-play" data-kind={kind} data-seed={seed} {...readyMark(hydrated)}>
      <SolveHeader puzzle={puzzle} elapsedMs={elapsedMs} pausing={pausing} />
      {/* Over, the board becomes its replay in the same place, with its scrubber and keyboard (`WordReplay`). */}
      {done === null ? (
        <SolvePaused pausing={pausing}>
            <GomojiGrid
              size={size}
              rows={free + rows}
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
        <WordReplay kind="gomojiKana" size={size} givens={puzzle.givens} guesses={guesses} level={level} style={style} />
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
              last={lastTyped(typing) >= 0 && typing.slots[lastTyped(typing)] !== "" ? typing.slots[lastTyped(typing)]! : null}
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
          <Link href={`${playPath(kind)}${puzzleQuery({ size, level, seed: null, checks: null, hints: false, strict })}`} className="text-sm font-semibold underline" data-testid="word-another">
            Another word
          </Link>
        </div>
      ) : (
        <>
          <WordScoreLine score={score!} />
          <SolveDone puzzle={puzzle} done={done} hasAccount={hasAccount} race={race} checks={null} strict={strict} />
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
