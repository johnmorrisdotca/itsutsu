import { describe, expect, it } from "vitest";

import { decodeStones } from "./hiddenStones/code";
import { finishedFrames } from "./finishedFrames";
import { generatePuzzle } from "./generate";
import { decodeCells } from "./puzzleCode";
import { encodeNumberProgress, encodeStoneProgress, type StoneMarkCode } from "./puzzleProgress";
import { encodeStepLog } from "./stepLog";

/*
 * A finished grid's replay: the steps the solve screen kept end one entry
 * short, because the entry that finished it is the answer. So the replay is
 * the kept steps and then the answer, from the empty grid to the solved one.
 */
describe("the frames a finished grid replays", () => {
  const puzzle = generatePuzzle("numberPlace", 4, "easy", 7);
  const givens = decodeCells(puzzle.givens, 4)!;
  const solution = decodeCells(puzzle.solution, 4)!;
  const open = givens.flatMap((given, index) => (given === 0 ? [index] : []));

  /** Every grid a solver who filled the open cells in order went through, the last left off as the solve screen leaves it. */
  function solving(): string {
    const grids: number[][] = [new Array<number>(16).fill(0)];
    for (const cell of open.slice(0, -1)) {
      const next = [...grids.at(-1)!];
      next[cell] = solution[cell]!;
      grids.push(next);
    }
    return encodeStepLog(grids.map(encodeNumberProgress));
  }

  it("runs from the empty grid to the answer, one entry a step", () => {
    const { frames } = finishedFrames("numberPlace", 4, puzzle.givens, puzzle.solution, solving());
    expect(frames).not.toBeNull();
    expect(frames!.length).toBe(open.length + 1);
    expect(frames![0]!.cells.every((cell) => cell === 0)).toBe(true);
    const last = frames!.at(-1)!.cells as number[];
    expect(last.map((cell, index) => (givens[index] !== 0 ? givens[index] : cell))).toEqual(solution);
  });

  it("with no steps kept, has nothing to step through and draws the answer", () => {
    const { frames, dealt } = finishedFrames("numberPlace", 4, puzzle.givens, puzzle.solution, null);
    expect(frames).toBeNull();
    expect((dealt.finished!.cells as number[]).filter((cell) => cell !== 0).length).toBe(open.length);
  });

  it("drops a log that does not read, rather than replaying part of one", () => {
    expect(finishedFrames("numberPlace", 4, puzzle.givens, puzzle.solution, "nonsense").frames).toBeNull();
    expect(finishedFrames("numberPlace", 4, puzzle.givens, puzzle.solution, "1234~zz").frames).toBeNull();
  });

  it("with no answer, draws the grid as dealt and names no finish", () => {
    const { dealt } = finishedFrames("numberPlace", 4, puzzle.givens, null, null);
    expect(dealt.finished).toBeNull();
    expect(dealt.start.cells.every((cell) => cell === 0)).toBe(true);
  });

  it("lays the answer's stones over a Hidden Stones grid, keeping the crosses the solver drew", () => {
    const stones = generatePuzzle("hiddenStones", 5, "easy", 3);
    const answer = decodeStones(stones.solution, 5)!;
    const marks: StoneMarkCode[] = new Array<StoneMarkCode>(25).fill("");
    const crossed = answer[0] === 0 ? 1 : 0;
    const steps = [encodeStoneProgress(marks)];
    marks[crossed] = "cross";
    steps.push(encodeStoneProgress(marks));
    const { frames } = finishedFrames("hiddenStones", 5, stones.givens, stones.solution, encodeStepLog(steps));
    const last = frames!.at(-1)!.cells as StoneMarkCode[];
    expect(frames!.length).toBe(3);
    expect(last[crossed]).toBe("cross");
    expect(answer.every((col, row) => last[row * 5 + col] === "stone")).toBe(true);
  });
});
