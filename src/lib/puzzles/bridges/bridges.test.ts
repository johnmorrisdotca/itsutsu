import { describe, expect, it } from "vitest";

import { checkSolution } from "../puzzleCheck";
import { PUZZLE_LEVEL_LIST, PUZZLE_SPECS } from "../puzzles.constants";
import { checkBridges } from "./check";
import { boardOf, bridgesAt, decodeBridges, encodeBridges, spanBetween, spanToward } from "./code";
import { generateBridges } from "./generate";
import { bridgeHint, bridgesChecked, bridgesWrong } from "./help";
import { countSolutions, glance, levelOf, openOptions, settled, solutionOf } from "./solve";

/**
 * Two little boards worked by hand, drawn row by row.
 *
 *   EASY          JOIN
 *   1 . 3         1 . 1
 *   . . .         . . .
 *   . . 2         2 . 2
 *
 * EASY yields to counting: the 1 has one span, so one bridge to the 3, which
 * then needs two more down to the 2. JOIN does not: counting cannot say
 * whether the two 1s join each other, and the joining rule can — joined, they
 * would be full and cut off from the two 2s — so they each go down to a 2, and
 * the 2s take one bridge between them.
 */
const EASY = "1.3" + "..." + "..2";
const JOIN = "1.1" + "..." + "2.2";

describe("the Bridges code", () => {
  it("finds every span between islands in line, and which of them cross", () => {
    const board = boardOf(JOIN, 3)!;
    expect(board.islands.map((island) => island.count)).toEqual([1, 1, 2, 2]);
    expect(board.spans).toHaveLength(4);
    expect(spanBetween(board, 0, 1)).not.toBeNull();
    expect(spanBetween(board, 0, 3)).toBeNull();
    expect(spanToward(board, 0, 0, 1)).toBe(spanBetween(board, 0, 1));
    expect(spanToward(board, 0, 1, 0)).toBe(spanBetween(board, 0, 2));
    expect(spanToward(board, 0, -1, 0)).toBeNull();
    expect(spanToward(board, 3, 0, -1)).toBe(spanBetween(board, 2, 3));
    // A plus: an across span and a down span through the same middle cell cross.
    const plus = boardOf(".1." + "1.1" + ".1.", 3)!;
    const across = spanBetween(plus, 1, 2)!;
    const down = spanBetween(plus, 0, 3)!;
    expect(plus.crossing[across]).toEqual([down]);
  });

  it("writes a drawing and reads it back, and refuses one that is not this board's", () => {
    const board = boardOf(JOIN, 3)!;
    const answer = solutionOf(board)!;
    const drawing = encodeBridges(board, answer);
    expect(drawing).toBe("1.1" + "|.|" + "2-2");
    expect(decodeBridges(board, drawing)).toEqual(answer);
    expect(bridgesAt(board, answer, 2)).toBe(2);
    expect(decodeBridges(board, "1-1" + "..." + "2=2")).not.toBeNull();
    // A bridge on a cell no span crosses, a bridge half drawn, and an island moved.
    expect(decodeBridges(board, "1.1" + "|-|" + "2-2")).toBeNull();
    expect(decodeBridges(board, "1.1" + "|.." + "2-2")).not.toBeNull();
    expect(decodeBridges(boardOf(".1." + "1.1" + ".1." , 3)!, ".1." + "1-1" + ".1.")).not.toBeNull();
    expect(decodeBridges(board, "2.1" + "|.|" + "2-2")).toBeNull();
  });
});

describe("solving Bridges", () => {
  it("finds the one answer by counting on the easy board, and needs the joining rule on the other", () => {
    const easy = boardOf(EASY, 3)!;
    expect(countSolutions(easy)).toBe(1);
    expect(levelOf(easy)).toBe("easy");
    const join = boardOf(JOIN, 3)!;
    expect(countSolutions(join)).toBe(1);
    const counting = openOptions(join);
    expect(glance(join, counting, false)).toBe(true);
    expect(settled(counting)).toBe(false);
    const joining = openOptions(join);
    expect(glance(join, joining)).toBe(true);
    expect(settled(joining)).toBe(true);
    expect(levelOf(join)).toBe("medium");
  });

  it("says a board with two answers is no puzzle", () => {
    // Four 2s in a square: a ring of single bridges, since two doubles either way would leave two pairs apart.
    const square = boardOf("2.2" + "..." + "2.2", 3)!;
    expect(countSolutions(square)).toBe(1);
    // Four 3s in a square has two: doubles across and singles down, or the other way round.
    const threes = boardOf("3.3" + "..." + "3.3", 3)!;
    expect(countSolutions(threes)).toBe(2);
    expect(solutionOf(threes)).toBeNull();
    expect(levelOf(threes)).toBeNull();
  });

  it("makes each level what it says, by what it takes to finish", () => {
    for (const seed of [1, 2, 3]) {
      for (const level of PUZZLE_LEVEL_LIST) expect(levelOf(boardOf(generateBridges(9, level, seed).givens, 9)!)).toBe(level);
    }
  });
});

describe("generating Bridges", () => {
  const spec = PUZZLE_SPECS.bridges;

  for (const size of spec.sizes) {
    for (const level of PUZZLE_LEVEL_LIST) {
      it(`${size}×${size} ${level} has exactly one answer, at its level, and the check passes it`, () => {
        for (const seed of [1, 2, 3]) {
          const puzzle = generateBridges(size, level, seed);
          const board = boardOf(puzzle.givens, size)!;
          expect(countSolutions(board)).toBe(1);
          expect(levelOf(board)).toBe(level);
          expect(checkBridges(size, puzzle.givens, puzzle.solution)).toEqual({ ok: true });
          expect(checkSolution("bridges", size, puzzle.givens, puzzle.solution, level)).toEqual({ ok: true });
          // No two islands side by side: every bridge stands on water.
          for (const island of board.islands) {
            const beside = [island.cell + 1, island.cell - 1, island.cell + size, island.cell - size].filter((cell) => cell >= 0 && cell < size * size);
            for (const cell of beside) {
              const row = Math.floor(cell / size);
              if (Math.abs(row - island.row) + Math.abs((cell % size) - island.col) !== 1) continue;
              expect(board.islandAt[cell], `islands side by side at ${island.cell} and ${cell}`).toBe(-1);
            }
          }
        }
      });
    }
  }

  it("makes the same puzzle from the same seed, and a different one from another", () => {
    const one = generateBridges(9, "medium", 4242);
    expect(generateBridges(9, "medium", 4242)).toEqual(one);
    expect(generateBridges(9, "medium", 4243).givens).not.toBe(one.givens);
  });

  it("makes the boards up to 13×13 as they were first made, so a seed kept, raced or linked still makes the puzzle it did", () => {
    expect(generateBridges(7, "easy", 1).givens).toBe("3..3..1.3...4.........1.....4....4........3.2....");
    expect(generateBridges(13, "hard", 2).givens).toBe(
      ".............3.........3.2.......2.4.1.3.........1.3.1.......6.3.............13.4......6.4...........1......2..3.3..14.7..3....2......2.3.3..4.2.2......3..3.............",
    );
  });

  it("makes the three biggest in a browser's time, at every level, over whatever seeds it is given", () => {
    for (const size of [17, 21, 25]) {
      for (const level of PUZZLE_LEVEL_LIST) {
        const started = performance.now();
        for (let seed = 200; seed < 210; seed += 1) generateBridges(size, level, seed);
        expect((performance.now() - started) / 10, `${size}×${size} ${level}`).toBeLessThan(500);
      }
    }
  });

  it("is checked by the server in one pass over a 25×25's 625 cells", () => {
    const puzzle = generateBridges(25, "medium", 12);
    expect(PUZZLE_SPECS.bridges.mostCells).toBeGreaterThanOrEqual(puzzle.givens.length);
    const started = performance.now();
    for (let again = 0; again < 20; again += 1) expect(checkBridges(25, puzzle.givens, puzzle.solution)).toEqual({ ok: true });
    expect((performance.now() - started) / 20).toBeLessThan(10);
    const board = boardOf(puzzle.givens, 25)!;
    expect(board.islands.length).toBeGreaterThan(80);
  });

  it("makes a hard 13×13 in the time a browser can spare", () => {
    const started = performance.now();
    for (const seed of [31, 32, 33, 34, 35]) generateBridges(13, "hard", seed);
    expect((performance.now() - started) / 5).toBeLessThan(500);
  });
});

describe("checking a Bridges answer", () => {
  const right = "1.1" + "|.|" + "2-2";

  it("passes the answer", () => {
    expect(checkBridges(3, JOIN, right)).toEqual({ ok: true });
    expect(checkBridges(3, EASY, "1-3" + "..H" + "..2")).toEqual({ ok: true });
  });

  it("refuses an island short of its number, a bridge that stops on water, an island moved or added, and islands not all joined", () => {
    expect(checkBridges(3, JOIN, "1.1" + "|.|" + "2.2").ok).toBe(false);
    expect(checkBridges(3, JOIN, "1.1" + "|-|" + "2-2").ok).toBe(false);
    expect(checkBridges(3, JOIN, "1.1" + "|..").ok).toBe(false);
    expect(checkBridges(3, JOIN, "2.1" + "|.|" + "2-2").ok).toBe(false);
    expect(checkBridges(3, JOIN, "1.1" + "|3|" + "2-2").ok).toBe(false);
    expect(checkBridges(3, JOIN, JOIN).ok).toBe(false);
    // Two pairs, each full, joined to nothing else: every number met, and still no answer.
    expect(checkBridges(3, "1.1" + "..." + "1.1", "1-1" + "..." + "1-1")).toEqual({ ok: false, reason: "the islands are not all joined into one" });
  });
});

describe("Check, Show and Hint on Bridges", () => {
  const board = boardOf(JOIN, 3)!;
  const answer = solutionOf(board)!;
  const top = spanBetween(board, 0, 1)!;
  const bottom = spanBetween(board, 2, 3)!;

  it("counts bridges too many and still to draw, and marks the wrong ones", () => {
    const drawn = answer.map(() => 0);
    drawn[top] = 1;
    drawn[bottom] = 2;
    expect(bridgesChecked(drawn, answer)).toEqual({ wrong: 2, missing: 2 });
    expect(bridgesWrong(drawn, answer).sort()).toEqual([top, bottom].sort());
  });

  it("hints the wrong bridge first, then one the answer has, and nothing once it is right", () => {
    const drawn = answer.map(() => 0);
    drawn[top] = 1;
    expect(bridgeHint(board, drawn, answer)).toBe(top);
    const first = bridgeHint(board, answer.map(() => 0), answer)!;
    expect(answer[first]).toBeGreaterThan(0);
    expect(bridgeHint(board, answer, answer)).toBeNull();
  });
});
