"use client";

import { useState } from "react";

import { ReplayScrubber } from "@/components/history/ReplayScrubber";
import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import type { Appearance } from "@/components/board/board.types";
import { knownCounts, letterKeyMarks, kanaKeyMarks, withHeadStart } from "@/lib/puzzles/keyMarks";
import { headStartKeys } from "@/lib/puzzles/gomoji/headStart";
import { guessesFor } from "@/lib/puzzles/gomoji/layout";
import { decodeHidden, languageOf, markGuess } from "@/lib/puzzles/gomoji/code";
import { emptyRow } from "@/lib/puzzles/gomoji/typingRow";
import type { WordStyle } from "@/lib/puzzles/gomoji/wordStyles";
import type { PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { decodeKanaGivens } from "@/lib/puzzles/gomojiKana/kanaCode";
import { kanaBase, markKanaGuess } from "@/lib/puzzles/gomojiKana/kanaMarks";

import { KanaKeyboard } from "./KanaKeyboard";
import { GomojiGrid, type CellArrow } from "./GomojiGrid";
import { WordKeyboard } from "./WordKeyboard";

const NOTHING = () => undefined;
const NONE: ReadonlyMap<string, number> = new Map();

/**
 * A FINISHED GOMOJI, REPLAYED GUESS BY GUESS. John, 2026-09-25: "I want the
 * ability to see the keyboard even after the game. we should also have the
 * History Scrubber here so we can replay the words chosen, with the keyboard
 * visible."
 *
 * The board, the scrubber a finished game has (`ReplayScrubber`), and the
 * keyboard read-only — each at the step being looked at: step 0 is the board
 * before the first guess (the free grey word already on it, for kana), and
 * each step after adds one guess, the keys coloured as they were then
 * (`keyMarks.ts`). It opens at the end, as the game finished. It takes the
 * live board's place when a game ends, so nothing above it moves, and a
 * finished puzzle's own page draws the same.
 */
export function WordReplay({
  kind,
  size,
  givens,
  guesses,
  level,
  headStart = false,
  style,
  appearance = DEFAULT_APPEARANCE,
  position,
}: {
  kind: "gomoji" | "gomojiKana" | "gomojiMot" | "gomojiWort";
  size: number;
  givens: string;
  guesses: readonly string[];
  /** The level it was played at, which decided its guesses (`layout.ts`). */
  level: PuzzleLevel;
  /** Whether it was played with its Head start: those keys are grey at every step, the first included (`headStart.ts`). */
  headStart?: boolean;
  style: WordStyle;
  /** The reader's board colour; the default wood where nobody has asked for it. */
  appearance?: Appearance;
  /**
   * Where the replay stands, held by the page around it when the box can be
   * opened on its own (`BoardFocus` moves its children, which would start a
   * replay of its own again at the end); null there means the end.
   */
  position?: { at: number | null; go: (index: number) => void };
}) {
  const last = guesses.length;
  const [own, setOwn] = useState(last);
  const at = position === undefined ? own : (position.at ?? last);
  const setAt = position === undefined ? setOwn : position.go;
  const played = guesses.slice(0, Math.min(at, last));
  const kana = kind === "gomojiKana";
  const lang = languageOf(kind);

  // What each kind draws at this step: its rows, their marks and arrows, and the keys' colours.
  const kanaGiven = kana ? decodeKanaGivens(givens, size) : null;
  const grey = kanaGiven?.grey ?? null;
  const word = kana ? (kanaGiven?.word ?? "") : (decodeHidden(givens, size, lang) ?? "");
  const rows = kana && grey !== null ? [grey, ...played] : played;
  const kanaMarks = kana ? rows.map((row) => markKanaGuess([...row], [...word])) : [];
  const marks = kana ? kanaMarks.map((row) => row.map((each) => each.mark)) : rows.map((row) => markGuess(row, word));
  const arrows: CellArrow[][] = kanaMarks.map((row) =>
    row.map((each) => (each.wrongSize && each.wrongMark ? "↓↑" : each.wrongSize ? "↓" : each.wrongMark ? "↑" : "")),
  );
  // How many of a letter the marks drawn at this step prove, by base for kana: a count on its key from two.
  const counted = knownCounts(rows, marks, kana ? kanaBase : undefined);
  const free = kana && grey !== null ? 1 : 0;
  const started = headStart ? headStartKeys(kind, size, givens) : [];

  return (
    <div className="flex flex-col gap-3" data-testid="word-replay" data-at={Math.min(at, last)} data-last={last}>
      <GomojiGrid
        size={size}
        rows={free + Math.max(guesses.length, guessesFor(kind === "gomojiKana" ? "gomojiKana" : "gomoji", size, level, free))}
        guesses={rows}
        marks={marks}
        arrows={arrows}
        free={free}
        typing={emptyRow(size)}
        done
        style={style}
        onChoose={NOTHING}
        appearance={appearance}
      />
      <ReplayScrubber index={Math.min(at, last)} last={last} onGo={setAt} testId="word-replay" />
      {kana ? (
        <KanaKeyboard
          known={withHeadStart(kanaKeyMarks(rows, word), started, "miss")}
          counted={counted}
          typed={NONE}
          style={style}
          disabled={false}
          readOnly
          onKana={NOTHING}
          onSmall={NOTHING}
          onMark={NOTHING}
          onEnter={NOTHING}
          onBack={NOTHING}
        />
      ) : (
        <WordKeyboard known={withHeadStart(letterKeyMarks(played, word), started, "miss")} counted={counted} style={style} lang={lang} disabled={false} readOnly onLetter={NOTHING} onEnter={NOTHING} onBack={NOTHING} />
      )}
    </div>
  );
}
