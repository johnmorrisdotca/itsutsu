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
import { decodeLayout } from "@johnmorrisdotca/tsunagi";
import { boardOf, decodeBridges } from "@/lib/puzzles/bridges/code";
import { checkPictureLogic } from "@/lib/puzzles/pictureLogic/check";
import { answerOfCells, decodeClues } from "@/lib/puzzles/pictureLogic/code";
import { linesOfAnswer, noLines } from "@johnmorrisdotca/tsunagi";
import { readKoushi } from "@/lib/puzzles/koushi/check";
import { decodeGivens, markLattice } from "@/lib/puzzles/koushi/lattice";
import { BOARD_THEMES, DEFAULT_APPEARANCE } from "@/components/board/Board.constants";

import { BlackAndWhiteGrid } from "./BlackAndWhiteGrid";
import { BridgesGrid } from "./BridgesGrid";
import { PictureLogicGrid } from "./PictureLogicGrid";
import { HiddenStonesGrid } from "./HiddenStonesGrid";
import { KoushiGrid } from "./KoushiGrid";
import { KumimojiTable } from "./KumimojiTable";
import { MahjongBoard } from "./MahjongBoard";
import { TsunagiGrid } from "./TsunagiGrid";
import { TILE_PICTURE_BOX } from "./kumimoji.constants";
import { BRIDGES_CELL_WORDS, PICTURE_CELL_WORDS } from "./puzzles.constants";
import { PuzzleGrid } from "./PuzzleGrid";
import { PuzzleSteps } from "./PuzzleSteps";
import { PatienceReplay } from "./PatienceReplay";
import { SolitaireReplay } from "./SolitaireReplay";
import { CubeReplay } from "./CubeReplay";
import { SuidoBoard } from "./SuidoBoard";
import { checkSolution } from "@/lib/puzzles/puzzleCheck";
import { decodeStepLog } from "@/lib/puzzles/stepLog";
import { resumedGame } from "@/lib/puzzles/suido/play";
import { newGame } from "@johnmorrisdotca/suido";
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
  // Where a word's or a Solitaire's replay stands, held out here: opening the box on its own moves what is inside it.
  const [wordAt, setWordAt] = useState<number | null>(null);

  // A lattice as it ended, in its colours: the grid its swaps made, or the scramble it was dealt.
  if (kind === "koushi") {
    const asked = decodeGivens(givens);
    if (asked === null) return null;
    const grid = readKoushi(givens, answer)?.played.grid ?? asked.scramble;
    return <KoushiGrid grid={grid} marks={markLattice(grid, asked.solution)} done={readOnly} onPress={NOTHING} onSwap={NOTHING} />;
  }

  // A Solitaire is its moves, played back from the deal a table at a time (`SolitaireReplay`).
  if (kind === "solitaire") {
    return (
      <Focused story={story} hydrated={hydrated} testId="solve-board" state={answer === null ? "dealt" : "replay"}>
        <SolitaireReplay size={size} level={level} givens={givens} moves={answer ?? ""} at={wordAt} go={setWordAt} />
      </Focused>
    );
  }

  // A cube is its turns, played back from the scramble a turn at a time (`CubeReplay`).
  if (kind === "cube") {
    return (
      <Focused story={story} hydrated={hydrated} testId="solve-board" state={answer === null ? "dealt" : "replay"}>
        <CubeReplay size={size} givens={givens} moves={answer ?? ""} at={wordAt} go={setWordAt} />
      </Focused>
    );
  }

  // A Suido board as it ended, its water running: the board solved, or as it stood when its clock ran out.
  if (kind === "suido") {
    return <SuidoFinished size={size} level={level} givens={givens} answer={answer} steps={steps} derive={derive} story={story} hydrated={hydrated} />;
  }

  // A FreeCell or a Spider is its moves too, played back the same way (`PatienceReplay`).
  if (kind === "freecell" || kind === "spider") {
    return (
      <Focused story={story} hydrated={hydrated} testId="solve-board" state={answer === null ? "dealt" : "replay"}>
        <PatienceReplay kind={kind} size={size} givens={givens} moves={answer ?? ""} at={wordAt} go={setWordAt} />
      </Focused>
    );
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
  /*
   * A Tsunagi board drawn as Tsunagi draws it, never as paper: its marbles, and its
   * lines where the answer is shown; the marbles alone where it is kept back.
   * It had no branch here, so a solve's page drew an empty white square (John,
   * 2026-09-26: "How is this a solved puzzle?").
   */
  if (kind === "tsunagi") {
    const layout = decodeLayout(givens, size);
    if (layout !== null) {
      const lines = (answer === null ? null : linesOfAnswer(layout, answer)) ?? noLines(layout);
      return (
        <Focused story={story} hydrated={hydrated} testId="solve-board" state={answer === null ? "dealt" : "finished"}>
          <div className="mx-auto w-full" data-focus-board>
            <TsunagiGrid layout={layout} lines={lines} marks="colours" fill="marbles" theme={BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme]} done readOnly />
          </div>
        </Focused>
      );
    }
  }
  // A Mahjong deal as it was dealt: its answer is the order it was cleared in, and a cleared table is an empty one.
  if (kind === "mahjong") {
    return (
      <Focused story={story} hydrated={hydrated} testId="solve-board" state="dealt">
        <div className="mx-auto w-full" data-focus-board>
          <MahjongBoard size={size} cells={givens} theme={BOARD_THEMES[DEFAULT_APPEARANCE.boardTheme]} readOnly />
        </div>
      </Focused>
    );
  }
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

const SUIDO_NOTES: Record<string, string> = {
  finished: "How it ended: the water runs from the pump to everything it should reach, and nothing leaks.",
  unsolved: "It ended unsolved, when its clock ran out: this is where it stood.",
  "worked-out": "Solved before its board was kept. Every board here has one answer, so this is that answer, worked out from the puzzle.",
  working: "",
  dealt: "Its finished board was not kept, so this is the board as it was dealt.",
};

/**
 * A SUIDO BOARD AS IT ENDED, drawn read-only with the water in it. A solve
 * keeps its answer, the board solved. A board whose clock ran out keeps no
 * answer but the board as it stood, as the one step it was kept with
 * (`stepsOfEnded`): drawn as it was left, and said to have ended unsolved.
 * With neither kept, and where the page may show it (`derive`), the one answer
 * every board has is worked out here, in the browser, once the page has taken over.
 */
function SuidoFinished({ size, level, givens, answer, steps, derive, story, hydrated }: { size: number; level: PuzzleLevel; givens: string; answer: string | null; steps: string | null; derive: boolean; story: BoardStory; hydrated: boolean }) {
  // The board as it stood, the last grid of the steps kept: a Suido code is longer than its cells, so the log is read at its first grid's length.
  const stood = useMemo(() => (steps === null ? null : (decodeStepLog(steps, steps.split("~")[0]!.length)?.at(-1) ?? null)), [steps]);
  const worked = useMemo(() => (answer === null && stood === null && derive && hydrated ? solvedAnswerOf("suido", size, level, givens) : null), [answer, stood, derive, hydrated, size, level, givens]);
  const shown = answer ?? stood ?? worked;
  const dealt = useMemo(() => newGame(givens), [givens]);
  if (dealt === null) return null;
  const game = (shown === null ? null : resumedGame(dealt, shown)) ?? dealt;
  const state = shown === null ? (derive && !hydrated ? "working" : "dealt") : answer === null && stood === null ? "worked-out" : checkSolution("suido", size, givens, shown, level).ok ? "finished" : "unsolved";
  return (
    <Focused story={story} hydrated={hydrated} testId="solve-board" state={state}>
      <div className="mx-auto w-full" data-focus-board>
        <SuidoBoard layout={game.start} masks={game.masks} quarters={game.quarters} readOnly done />
      </div>
      <p className="text-sm text-muted" data-testid={`solve-note-${state}`}>
        {SUIDO_NOTES[state]}
      </p>
    </Focused>
  );
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
  /* Steps and no answer: a grid that ended unsolved, its clock run out, kept as it stood (`/api/puzzles/solved`, `outOfTime`). */
  const state = answer !== null ? (frames !== null && frames.length > 1 ? "replay" : "finished") : frames !== null ? "unsolved" : worked !== null ? "worked-out" : derive && !hydrated ? "working" : "dealt";

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
  unsolved: "It ended unsolved, when its clock ran out: this is where it stood, and the scrubber steps back through how it got there.",
};

/** What a step wrote in a cell, for the list of steps: "7", "a stone", "white", "cleared". */
function sayCell(kind: PuzzleKind, value: number | string): string {
  if (kind === "hiddenStones") return value === "stone" ? "a stone" : value === "cross" ? "a cross" : "cleared";
  if (kind === "blackAndWhite") return value === 1 ? "black" : value === 2 ? "white" : "cleared";
  if (kind === "bridges") return BRIDGES_CELL_WORDS[value as string] ?? `island ${value}`;
  if (kind === "pictureLogic") return PICTURE_CELL_WORDS[value === 1 ? "#" : value === 2 ? "x" : "."]!;
  return value === 0 ? "cleared" : symbolOf(value as number);
}

/** One frame drawn on the kind's own grid, read-only. */
function GridOf({ kind, size, frame }: { kind: PuzzleKind; size: number; frame: Frame }) {
  if (frame.kind === "stones") return <HiddenStonesGrid size={size} regions={frame.regions} marks={frame.cells} done={readOnly} onPress={NOTHING} />;
  if (frame.kind === "blackAndWhite") return <BlackAndWhiteGrid size={size} givens={frame.printed} stones={frame.cells} done={readOnly} onPress={NOTHING} />;
  if (frame.kind === "bridges") {
    const board = boardOf(frame.givens, size);
    if (board === null) return null;
    return <BridgesGrid board={board} counts={decodeBridges(board, frame.cells.join("")) ?? board.spans.map(() => 0)} done={readOnly} readOnly />;
  }
  if (frame.kind === "pictureLogic") {
    const clues = decodeClues(frame.givens, size);
    if (clues === null) return null;
    // The frame that meets every clue is the picture: drawn clean, as the solve screen shows it when done.
    const solved = checkPictureLogic(size, frame.givens, answerOfCells(frame.cells)).ok;
    return <PictureLogicGrid clues={clues} cells={frame.cells} done finished={solved} readOnly />;
  }
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
