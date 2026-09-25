"use client";

import { useState } from "react";

import { ReplayScrubber } from "@/components/history/ReplayScrubber";
import { letterKeyMarks, kanaKeyMarks } from "@/lib/puzzles/keyMarks";
import { decodeHidden, markGuess } from "@/lib/puzzles/gomoji/code";
import { guessesFor } from "@/lib/puzzles/gomoji/layout";
import { emptyRow } from "@/lib/puzzles/gomoji/typingRow";
import type { WordStyle } from "@/lib/puzzles/gomoji/wordStyles";
import type { PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { decodeKanaGivens } from "@/lib/puzzles/gomojiKana/kanaCode";
import { markKanaGuess } from "@/lib/puzzles/gomojiKana/kanaMarks";

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
  style,
}: {
  kind: "gomoji" | "gomojiKana";
  size: number;
  givens: string;
  guesses: readonly string[];
  /** The level it was played at, which decided its guesses (`layout.ts`). */
  level: PuzzleLevel;
  style: WordStyle;
}) {
  const last = guesses.length;
  const [at, setAt] = useState(last);
  const played = guesses.slice(0, Math.min(at, last));
  const kana = kind === "gomojiKana";

  // What each kind draws at this step: its rows, their marks and arrows, and the keys' colours.
  const kanaGiven = kana ? decodeKanaGivens(givens, size) : null;
  const grey = kanaGiven?.grey ?? null;
  const word = kana ? (kanaGiven?.word ?? "") : (decodeHidden(givens, size) ?? "");
  const rows = kana && grey !== null ? [grey, ...played] : played;
  const kanaMarks = kana ? rows.map((row) => markKanaGuess([...row], [...word])) : [];
  const marks = kana ? kanaMarks.map((row) => row.map((each) => each.mark)) : rows.map((row) => markGuess(row, word));
  const arrows: CellArrow[][] = kanaMarks.map((row) =>
    row.map((each) => (each.wrongSize && each.wrongMark ? "↓↑" : each.wrongSize ? "↓" : each.wrongMark ? "↑" : "")),
  );
  const free = kana && grey !== null ? 1 : 0;

  return (
    <div className="flex flex-col gap-3" data-testid="word-replay" data-at={Math.min(at, last)} data-last={last}>
      <GomojiGrid
        size={size}
        rows={free + Math.max(guesses.length, guessesFor(kind, size, level, free))}
        guesses={rows}
        marks={marks}
        arrows={arrows}
        free={free}
        typing={emptyRow(size)}
        done
        style={style}
        onChoose={NOTHING}
      />
      <ReplayScrubber index={Math.min(at, last)} last={last} onGo={setAt} testId="word-replay" />
      {kana ? (
        <KanaKeyboard
          known={kanaKeyMarks(rows, word)}
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
        <WordKeyboard known={letterKeyMarks(played, word)} style={style} disabled={false} readOnly onLetter={NOTHING} onEnter={NOTHING} onBack={NOTHING} />
      )}
    </div>
  );
}
