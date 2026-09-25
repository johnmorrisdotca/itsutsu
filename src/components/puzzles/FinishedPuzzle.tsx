"use client";

import { decodeBlackAndWhite } from "@/lib/puzzles/blackAndWhite/code";
import { decodeRegions, decodeStones } from "@/lib/puzzles/hiddenStones/code";
import { readNumberGivens } from "@/lib/puzzles/numberGivens";
import { decodeCells } from "@/lib/puzzles/puzzleCode";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";
import { decodeGuesses } from "@/lib/puzzles/gomoji/code";
import { decodeKanaGuesses } from "@/lib/puzzles/gomojiKana/kanaCode";

import { BlackAndWhiteGrid } from "./BlackAndWhiteGrid";
import { HiddenStonesGrid, type StoneMark } from "./HiddenStonesGrid";
import { PuzzleGrid } from "./PuzzleGrid";
import { useWordStyle } from "./WordStyleContext";
import { WordReplay } from "./WordReplay";

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

  // A word puzzle is replayed guess by guess, its keyboard beside it, as when it ended (`WordReplay`).
  if (kind === "gomoji" || kind === "gomojiKana") {
    const guesses = (answer === null ? null : kind === "gomoji" ? decodeGuesses(answer, size) : decodeKanaGuesses(answer, size)) ?? [];
    return <WordReplay kind={kind} size={size} givens={givens} guesses={guesses} style={style} />;
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
