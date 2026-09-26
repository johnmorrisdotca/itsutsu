"use client";

import { useMemo, useState, type ReactNode } from "react";

import { BoardFocus } from "@/components/board/BoardFocus";
import type { BoardStory } from "@/components/board/board.types";
import { symbolOf } from "@/lib/puzzles/puzzleCode";
import type { PuzzleKind, PuzzleLevel } from "@/lib/puzzles/puzzles.types";
import { finishedFrames, type Frame } from "@/lib/puzzles/finishedFrames";
import { solvedAnswerOf } from "@/lib/puzzles/solvedAnswer";
import { readyMark, useHydrated } from "@/lib/ui/hydrated";
import { decodeGuesses, languageOf } from "@/lib/puzzles/gomoji/code";
import { decodeKanaGuesses } from "@/lib/puzzles/gomojiKana/kanaCode";
import { decodeGrid } from "@/lib/puzzles/kumimoji/grid";
import { readKoushi } from "@/lib/puzzles/koushi/check";
import { decodeGivens, markLattice } from "@/lib/puzzles/koushi/lattice";
import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";

import { BlackAndWhiteGrid } from "./BlackAndWhiteGrid";
import { HiddenStonesGrid } from "./HiddenStonesGrid";
import { KoushiGrid } from "./KoushiGrid";
import { KumimojiTable } from "./KumimojiTable";
import { TILE_PICTURE_BOX } from "./kumimoji.constants";
import { PuzzleGrid } from "./PuzzleGrid";
import { PuzzleSteps } from "./PuzzleSteps";
import { useWordStyle } from "./WordStyleContext";
import { WordReplay } from "./WordReplay";

const NOTHING = () => undefined;
/** Every grid here is finished: drawn readOnly, through its `done` mode, with nothing to press. */
const readOnly = true;

/**
 * A FINISHED PUZZLE, REPLAYED AS IT WAS SOLVED, in a box that opens on its own
 * (`BoardFocus`). John, 2026-09-25: "Drilldown into solved puzzles doesn't
 * work. Sudoku I couldn't see a game." — and 2026-09-26, on a past solve:
 * "viewing past game shows no scrubber and doesn't have the option to View As
 * a Modal."
 *
 * The grid each kind is solved on, read-only, with the scrubber and the folded
 * list of steps the live solve has (`PuzzleSteps`), opening at the end. A word
 * is replayed guess by guess (`WordReplay`), its guesses being its steps.
 *
 * Three honest states for a grid, each said under it rather than papered over:
 *
 *  - Steps kept: every grid on the way, from the first to the answer.
 *  - No steps (a solve kept before they were): the finished grid alone, and no
 *    scrubber — never a replay made up.
 *  - No answer either (kept before grids were), and `derive` on: the answer is
 *    worked out from the givens here in the browser, once (`solvedAnswerOf`),
 *    since every grid has exactly one. If it cannot be, the grid as dealt, and
 *    the page says so. `derive` is off where the page is keeping today's
 *    answer back from somebody who has not solved it.
 */
export function FinishedPuzzle({
  kind,
  size,
  level,
  givens,
  answer,
  steps = null,
  derive = false,
  headStart = false,
  story,
}: {
  kind: PuzzleKind;
  size: number;
  level: PuzzleLevel;
  givens: string;
  answer: string | null;
  /** The grids on the way (`stepLog.ts`), or null where none were kept. */
  steps?: string | null;
  /** Whether a missing answer may be worked out from the givens. */
  derive?: boolean;
  /** A word played with its Head start (`hadHeadStart`), replayed with those keys grey. */
  headStart?: boolean;
  /** What this board is and whose, for the header over it when it is opened on its own. */
  story: BoardStory;
}) {
  const { style } = useWordStyle();
  const hydrated = useHydrated();
  // Where a word's replay stands, held out here: opening the box on its own moves what is inside it.
  const [wordAt, setWordAt] = useState<number | null>(null);

  // A lattice as it ended, in its colours: the grid its swaps made, or the scramble it was dealt.
  if (kind === "koushi") {
    const asked = decodeGivens(givens);
    if (asked === null) return null;
    const grid = readKoushi(givens, answer)?.played.grid ?? asked.scramble;
    return <KoushiGrid grid={grid} marks={markLattice(grid, asked.solution)} done={readOnly} onPress={NOTHING} onSwap={NOTHING} />;
  }

  // A word puzzle is replayed guess by guess, its keyboard beside it, as when it ended (`WordReplay`).
  if (kind === "gomoji" || kind === "gomojiKana" || kind === "gomojiMot" || kind === "gomojiWort" || kind === "gomojiPop") {
    const guesses = (answer === null ? null : kind === "gomojiKana" ? decodeKanaGuesses(answer, size) : decodeGuesses(answer, size, languageOf(kind))) ?? [];
    return (
      <Focused story={story} hydrated={hydrated} testId="solve-board" state="word">
        <div className="mx-auto w-full" data-focus-board>
          <WordReplay kind={kind} size={size} givens={givens} guesses={guesses} level={level} headStart={headStart} style={style} position={{ at: wordAt, go: setWordAt }} />
        </div>
      </Focused>
    );
  }

  // A Kumimoji is its crossword, laid out on its table and fitted to the box; it keeps no steps to replay.
  if (kind === "kumimoji") {
    const tiles = (answer === null ? null : decodeGrid(answer)) ?? new Map<string, string>();
    return (
      <Focused story={story} hydrated={hydrated} testId="solve-board" state="tiles">
        <div className="mx-auto w-full" data-focus-board>
          <KumimojiTable tiles={tiles} theme={BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme]} readOnly boxClass={TILE_PICTURE_BOX} />
        </div>
      </Focused>
    );
  }

  return <GridReplay kind={kind} size={size} level={level} givens={givens} answer={answer} steps={steps} derive={derive} story={story} hydrated={hydrated} />;
}

function GridReplay({
  kind,
  size,
  level,
  givens,
  answer,
  steps,
  derive,
  story,
  hydrated,
}: {
  kind: PuzzleKind;
  size: number;
  level: PuzzleLevel;
  givens: string;
  answer: string | null;
  steps: string | null;
  derive: boolean;
  story: BoardStory;
  hydrated: boolean;
}) {
  /* The answer worked out in the browser, after it has taken over from the
     server's page: never on the server, and once, however often it draws. */
  const worked = useMemo(() => (answer === null && derive && hydrated ? solvedAnswerOf(kind, size, level, givens) : null), [answer, derive, hydrated, kind, size, level, givens]);
  const final = answer ?? worked;
  const { dealt, frames } = useMemo(() => finishedFrames(kind, size, givens, final, steps), [kind, size, givens, final, steps]);
  // Held here, above the box: opening it on its own moves what is inside it, and the scrubber stays where it was.
  const [at, setAt] = useState<number | null>(null);
  const last = frames === null ? 0 : frames.length - 1;
  const viewing = at === null ? last : Math.min(at, last);
  const shown: Frame = frames?.[viewing] ?? dealt.finished ?? dealt.start;
  const state = answer !== null ? (frames !== null && frames.length > 1 ? "replay" : "finished") : worked !== null ? "worked-out" : derive && !hydrated ? "working" : "dealt";

  return (
    <Focused story={story} hydrated={hydrated} testId="solve-board" state={state}>
      {/* Opened on its own, the grid is as large as leaves room for the scrubber under it (globals.css). */}
      <div className="mx-auto w-full" data-focus-board>
        <GridOf kind={kind} size={size} frame={shown} />
      </div>
      {frames !== null && frames.length > 1 ? (
        <PuzzleSteps<number | string>
          steps={frames.map((frame): readonly (number | string)[] => frame.cells)}
          viewing={viewing}
          go={(index) => setAt(Math.max(0, Math.min(index, last)))}
          size={size}
          say={(value) => sayCell(kind, value)}
        />
      ) : null}
      <p className="text-sm text-muted" data-testid={`solve-note-${state}`}>
        {NOTES[state]}
      </p>
    </Focused>
  );
}

const NOTES: Record<string, string> = {
  replay: "Step back through it with the scrubber: from where it started to the answer.",
  finished: "Its steps were not kept, so it shows how it ended, with nothing to step through.",
  "worked-out": "Solved before its grid was kept. Every puzzle here has one answer, so this is that answer, worked out from the puzzle.",
  working: "",
  dealt: "Its finished grid was not kept, so this is the puzzle as it was dealt.",
};

/** What a step wrote in a cell, for the list of steps: "7", "a stone", "white", "cleared". */
function sayCell(kind: PuzzleKind, value: number | string): string {
  if (kind === "hiddenStones") return value === "stone" ? "a stone" : value === "cross" ? "a cross" : "cleared";
  if (kind === "blackAndWhite") return value === 1 ? "black" : value === 2 ? "white" : "cleared";
  return value === 0 ? "cleared" : symbolOf(value as number);
}

/** One frame drawn on the kind's own grid, read-only. */
function GridOf({ kind, size, frame }: { kind: PuzzleKind; size: number; frame: Frame }) {
  if (frame.kind === "stones") return <HiddenStonesGrid size={size} regions={frame.regions} marks={frame.cells} done={readOnly} onPress={NOTHING} />;
  if (frame.kind === "blackAndWhite") return <BlackAndWhiteGrid size={size} givens={frame.printed} stones={frame.cells} done={readOnly} onPress={NOTHING} />;
  const asked = frame.asked;
  return (
    <PuzzleGrid
      kind={kind}
      size={size}
      givens={asked.cells}
      entries={frame.cells}
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

/** The board and what goes under it, in the box that opens on its own; marked ready once the browser has it. */
function Focused({ story, hydrated, testId, state, children }: { story: BoardStory; hydrated: boolean; testId: string; state: string; children: ReactNode }) {
  return (
    <BoardFocus label="this puzzle" story={story} layout="flex flex-col gap-3">
      <div className="flex flex-col gap-3" data-testid={testId} data-state={state} {...readyMark(hydrated)}>
        {children}
      </div>
    </BoardFocus>
  );
}
