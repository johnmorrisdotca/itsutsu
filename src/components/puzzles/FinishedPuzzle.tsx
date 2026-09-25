"use client";

import { decodeBlackAndWhite } from "@/lib/puzzles/blackAndWhite/code";
import { decodeRegions, decodeStones } from "@/lib/puzzles/hiddenStones/code";
import { readNumberGivens } from "@/lib/puzzles/numberGivens";
import { decodeCells } from "@/lib/puzzles/puzzleCode";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { decodeGuesses, decodeHidden, markGuess, rowsFor } from "@/lib/puzzles/wordDrop/code";
import { emptyRow } from "@/lib/puzzles/wordDrop/typingRow";
import { decodeKanaGivens, decodeKanaGuesses, KANA_ROWS } from "@/lib/puzzles/wordDropKana/kanaCode";
import { markKanaGuess } from "@/lib/puzzles/wordDropKana/kanaMarks";

import { BlackAndWhiteGrid } from "./BlackAndWhiteGrid";
import { HiddenStonesGrid, type StoneMark } from "./HiddenStonesGrid";
import { PuzzleGrid } from "./PuzzleGrid";
import { KANA_GRID_BOX } from "./puzzles.constants";
import { WordDropGrid } from "./WordDropGrid";
import { useWordStyle } from "./WordStyleContext";

const NOTHING = () => undefined;
/** Every grid here is finished: drawn readOnly, through its `done` mode, with nothing to press. */
const readOnly = true;

/**
 * A FINISHED PUZZLE, DRAWN AS IT ENDED: the grid each kind is solved on, in
 * its finished (read-only) mode, with the answer that was handed in written
 * on it. John, 2026-09-25: "Drilldown into solved puzzles doesn't work.
 * Sudoku I couldn't see a game."
 *
 * With no answer — a solve kept before answers were — it draws the puzzle as
 * it was dealt, and the page says so; nothing is guessed at to fill it.
 */
export function FinishedPuzzle({ kind, size, givens, answer }: { kind: PuzzleKind; size: number; givens: string; answer: string | null }) {
  const { style } = useWordStyle();

  if (kind === "hiddenStones") {
    const regions = decodeRegions(givens, size) ?? [];
    const stones = answer === null ? null : decodeStones(answer, size);
    const marks: StoneMark[] = new Array<StoneMark>(size * size).fill("");
    stones?.forEach((col, row) => (marks[row * size + col] = "stone"));
    return <HiddenStonesGrid size={size} regions={regions} marks={marks} done={readOnly} onPress={NOTHING} />;
  }

  if (kind === "blackAndWhite") {
    const printed = decodeBlackAndWhite(givens.slice(0, size * size), size) ?? [];
    const stones = (answer === null ? null : decodeBlackAndWhite(answer, size)) ?? printed;
    return <BlackAndWhiteGrid size={size} givens={printed} stones={stones} done={readOnly} onPress={NOTHING} />;
  }

  if (kind === "wordDrop") {
    const hidden = decodeHidden(givens, size) ?? "";
    const guesses = (answer === null ? null : decodeGuesses(answer, size)) ?? [];
    return (
      <WordDropGrid
        size={size}
        rows={rowsFor(size)}
        guesses={guesses}
        marks={guesses.map((guess) => markGuess(guess, hidden))}
        typing={emptyRow(size)}
        done={readOnly}
        style={style}
        onChoose={NOTHING}
      />
    );
  }

  if (kind === "wordDropKana") {
    const given = decodeKanaGivens(givens, size);
    const guesses = (answer === null ? null : decodeKanaGuesses(answer, size)) ?? [];
    const grey = given?.grey ?? null;
    const shown = grey === null ? guesses : [grey, ...guesses];
    const marked = shown.map((guess) => markKanaGuess([...guess], [...(given?.word ?? "")]));
    return (
      <WordDropGrid
        size={size}
        rows={(grey === null ? 0 : 1) + KANA_ROWS}
        guesses={shown}
        marks={marked.map((row) => row.map((each) => each.mark))}
        arrows={marked.map((row) => row.map((each) => (each.wrongSize && each.wrongMark ? "↓↑" : each.wrongSize ? "↓" : each.wrongMark ? "↑" : "")))}
        free={grey === null ? 0 : 1}
        box={KANA_GRID_BOX}
        typing={emptyRow(size)}
        done={readOnly}
        style={style}
        onChoose={NOTHING}
      />
    );
  }

  // Every grid of numbers: the printed cells as printed, the rest from the answer.
  const asked = readNumberGivens(kind, givens, size);
  const full = answer === null ? null : decodeCells(answer, size);
  const entries = asked.cells.map((given, index) => (given !== 0 || full === null ? 0 : (full[index] ?? 0)));
  return (
    <PuzzleGrid
      kind={kind}
      size={size}
      givens={asked.cells}
      entries={entries}
      marks={asked.marks}
      regions={asked.regions}
      cages={asked.cages}
      clues={asked.clues}
      selected={null}
      done={readOnly}
      onSelect={NOTHING}
    />
  );
}
