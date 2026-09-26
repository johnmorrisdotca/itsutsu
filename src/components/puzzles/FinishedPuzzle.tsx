"use client";

import { decodeBlackAndWhite } from "@/lib/puzzles/blackAndWhite/code";
import { decodeRegions, decodeStones } from "@/lib/puzzles/hiddenStones/code";
import { readNumberGivens } from "@/lib/puzzles/numberGivens";
import { decodeCells } from "@/lib/puzzles/puzzleCode";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { decodeGuesses, languageOf } from "@/lib/puzzles/gomoji/code";
import { decodeKanaGuesses } from "@/lib/puzzles/gomojiKana/kanaCode";
import { decodeGrid } from "@/lib/puzzles/kumimoji/grid";
import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";

import { BlackAndWhiteGrid } from "./BlackAndWhiteGrid";
import { HiddenStonesGrid, type StoneMark } from "./HiddenStonesGrid";
import { KumimojiTable } from "./KumimojiTable";
import { TILE_PICTURE_BOX } from "./kumimoji.constants";
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
export function FinishedPuzzle({
  kind,
  size,
  level,
  givens,
  answer,
  headStart = false,
}: {
  kind: PuzzleKind;
  size: number;
  level: PuzzleLevel;
  givens: string;
  answer: string | null;
  /** A word played with its Head start (`hadHeadStart`), replayed with those keys grey. */
  headStart?: boolean;
}) {
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
  if (kind === "gomoji" || kind === "gomojiKana" || kind === "gomojiMot" || kind === "gomojiWort") {
    const guesses = (answer === null ? null : kind === "gomojiKana" ? decodeKanaGuesses(answer, size) : decodeGuesses(answer, size, languageOf(kind))) ?? [];
    return <WordReplay kind={kind} size={size} givens={givens} guesses={guesses} level={level} headStart={headStart} style={style} />;
  }

  // A Kumimoji is its crossword, laid out on its table and fitted to the box.
  if (kind === "kumimoji") {
    const tiles = (answer === null ? null : decodeGrid(answer)) ?? new Map<string, string>();
    return <KumimojiTable tiles={tiles} theme={BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme]} readOnly boxClass={TILE_PICTURE_BOX} />;
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
