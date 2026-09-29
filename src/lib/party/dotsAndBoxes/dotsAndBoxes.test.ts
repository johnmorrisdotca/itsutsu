import { describe, expect, it } from "vitest";

import { PARTY_SPECS } from "../party.constants";

import {
  DOTS_NAME_MOST,
  DOTS_STATUS,
  canDraw,
  decodeDots,
  dotsAgain,
  dotsBoxCount,
  dotsBoxSides,
  dotsBoxesBeside,
  dotsLineCount,
  dotsLineEnds,
  dotsPlayerName,
  drawLine,
  drawsAgain,
  encodeDots,
  replayDots,
  startDots,
} from "./dotsAndBoxes";
import type { DotsGame } from "./dotsAndBoxes.types";

/** A game that must exist: the test is about what comes after, not whether it starts. */
function start(size: number, count: number, first = 0): DotsGame {
  const game = startDots(size, new Array<string>(count).fill(""), first);
  if (game === null) throw new Error(`no ${size}×${size} table for ${count}`);
  return game;
}

/** Draw each line in turn, failing loudly on one the rules refuse. */
function draw(game: DotsGame, ...lines: number[]): DotsGame {
  return lines.reduce((at, line) => {
    const next = drawLine(at, line);
    if (next === null) throw new Error(`line ${line} refused`);
    return next;
  }, game);
}

/** Every line of the board, in number order. */
function everyLine(size: number): number[] {
  return Array.from({ length: dotsLineCount(size) }, (_, line) => line);
}

describe("the board of dots and lines", () => {
  it("counts the lines and boxes every offered size has", () => {
    expect(dotsLineCount(3)).toBe(24);
    expect(dotsLineCount(6)).toBe(84);
    expect(dotsBoxCount(4)).toBe(16);
  });

  it("numbers the lines across first, then the lines down, each from dot to neighbouring dot", () => {
    // 3×3 boxes: four rows of three lines across (0–11), then three rows of four lines down (12–23).
    expect(dotsLineEnds(3, 0)).toEqual({ from: { row: 0, col: 0 }, to: { row: 0, col: 1 }, across: true });
    expect(dotsLineEnds(3, 11)).toEqual({ from: { row: 3, col: 2 }, to: { row: 3, col: 3 }, across: true });
    expect(dotsLineEnds(3, 12)).toEqual({ from: { row: 0, col: 0 }, to: { row: 1, col: 0 }, across: false });
    expect(dotsLineEnds(3, 23)).toEqual({ from: { row: 2, col: 3 }, to: { row: 3, col: 3 }, across: false });
    for (const size of PARTY_SPECS.dotsAndBoxes.sizes) {
      for (const line of everyLine(size)) {
        const ends = dotsLineEnds(size, line)!;
        // Neighbours: exactly one step apart, never diagonal, never off the board.
        expect(Math.abs(ends.to.row - ends.from.row) + Math.abs(ends.to.col - ends.from.col)).toBe(1);
        expect(Math.max(ends.to.row, ends.to.col)).toBeLessThanOrEqual(size);
      }
    }
  });

  it("knows no line that is not on the board", () => {
    expect(dotsLineEnds(3, -1)).toBeNull();
    expect(dotsLineEnds(3, 24)).toBeNull();
    expect(dotsLineEnds(3, 1.5)).toBeNull();
  });

  it("gives every box four different sides, and every side names that box among those it borders", () => {
    for (const size of PARTY_SPECS.dotsAndBoxes.sizes) {
      for (let box = 0; box < dotsBoxCount(size); box += 1) {
        const sides = dotsBoxSides(size, box);
        expect(new Set(sides).size).toBe(4);
        for (const side of sides) expect(dotsBoxesBeside(size, side)).toContain(box);
      }
    }
  });

  it("puts an edge line beside one box and an inside line beside two", () => {
    expect(dotsBoxesBeside(3, 0)).toEqual([0]); // the top edge
    expect(dotsBoxesBeside(3, 4)).toEqual([1, 4]); // across, between the first two rows of boxes
    expect(dotsBoxesBeside(3, 12)).toEqual([0]); // the left edge
    expect(dotsBoxesBeside(3, 13)).toEqual([0, 1]); // down, between the first two columns
  });
});

describe("a new game", () => {
  it("starts with nothing drawn, nothing held and the first seat to draw", () => {
    const game = start(4, 3);
    expect(game.lines).toEqual([]);
    expect(game.drawnBy.every((by) => by === null)).toBe(true);
    expect(game.owners.every((owner) => owner === null)).toBe(true);
    expect(game.scores).toEqual([0, 0, 0]);
    expect(game.toPlay).toBe(0);
    expect(game.status).toBe(DOTS_STATUS.playing);
  });

  it("is only made for a table the game is offered for", () => {
    expect(startDots(4, ["Ann"])).toBeNull();
    expect(startDots(4, new Array<string>(7).fill(""))).toBeNull();
    expect(startDots(2, ["Ann", "Ben"])).toBeNull();
    expect(startDots(7, ["Ann", "Ben"])).toBeNull();
    expect(startDots(4, ["Ann", "Ben"], 2)).toBeNull();
    for (const size of PARTY_SPECS.dotsAndBoxes.sizes) expect(startDots(size, ["Ann", "Ben"])).not.toBeNull();
  });

  it("tidies the names and reads a blank one as the seat's number", () => {
    const game = startDots(3, ["  Ann   Lee ", "", "x".repeat(40)])!;
    expect(game.players[0]).toBe("Ann Lee");
    expect(dotsPlayerName(game, 1)).toBe("Player 2");
    expect(game.players[2]).toHaveLength(DOTS_NAME_MOST);
  });
});

describe("drawing a line", () => {
  it("refuses a line already drawn, one off the board, and any once the game is over", () => {
    const game = draw(start(3, 2), 0);
    expect(canDraw(game, 0)).toBe(false);
    expect(drawLine(game, 0)).toBeNull();
    expect(drawLine(game, 99)).toBeNull();
    const over = draw(start(3, 2), ...everyLine(3));
    expect(over.status).toBe(DOTS_STATUS.finished);
    expect(canDraw(over, 0)).toBe(false);
  });

  it("passes the turn round the table when it closes nothing", () => {
    const game = draw(start(3, 3), 0, 1, 2);
    expect(game.toPlay).toBe(0);
    expect(game.drawnBy.slice(0, 3)).toEqual([0, 1, 2]);
    expect(game.lastClosed).toEqual([]);
    expect(drawsAgain(game)).toBe(false);
  });

  it("gives the box to whoever draws its fourth side, and they draw again", () => {
    // Box 0's sides are 0 (top), 3 (bottom), 12 (left) and 13 (right). Seats 0, 1, 2 draw three; seat 0 the fourth.
    const game = draw(start(3, 3), 0, 3, 12, 13);
    expect(game.owners[0]).toBe(0);
    expect(game.scores).toEqual([1, 0, 0]);
    expect(game.lastClosed).toEqual([0]);
    expect(game.toPlay).toBe(0);
    expect(drawsAgain(game)).toBe(true);
    // And a line after that which closes nothing hands the turn on as usual.
    const after = draw(game, 23);
    expect(after.toPlay).toBe(1);
    expect(drawsAgain(after)).toBe(false);
  });

  it("gives both boxes to the one line that closes two, and still only one more line", () => {
    // Boxes 0 and 1 share line 13. Draw every other side of both (0, 3, 12 and 1, 4, 14), then 13 closes both.
    const before = draw(start(3, 2), 0, 3, 12, 1, 4, 14);
    expect(before.toPlay).toBe(0);
    const game = draw(before, 13);
    expect(game.owners[0]).toBe(0);
    expect(game.owners[1]).toBe(0);
    expect(game.scores).toEqual([2, 0]);
    expect(game.lastClosed).toEqual([0, 1]);
    expect(game.toPlay).toBe(0);
  });

  it("leaves the game it was given untouched", () => {
    const game = start(3, 2);
    const snapshot = JSON.stringify(game);
    draw(game, 0, 3, 12, 13);
    expect(JSON.stringify(game)).toBe(snapshot);
  });
});

describe("the end", () => {
  it("comes with the last line, every box held, and the most boxes winning", () => {
    const game = draw(start(3, 2), ...everyLine(3));
    expect(game.status).toBe(DOTS_STATUS.finished);
    expect(game.owners.every((owner) => owner !== null)).toBe(true);
    expect(game.scores.reduce((sum, score) => sum + score, 0)).toBe(9);
    const most = Math.max(...game.scores);
    expect(game.winners).toEqual(game.scores.flatMap((score, seat) => (score === most ? [seat] : [])));
    expect(game.winners.length).toBeGreaterThan(0);
  });

  it("shares the win between everybody level on the most boxes", () => {
    // Two players on 4×4 hold sixteen boxes between them: play shuffled games until one ends eight all.
    let seed = 20260928;
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    let level: DotsGame | null = null;
    for (let tries = 0; tries < 500 && level === null; tries += 1) {
      const order = everyLine(4);
      for (let at = order.length - 1; at > 0; at -= 1) {
        const other = Math.floor(random() * (at + 1));
        [order[at], order[other]] = [order[other], order[at]];
      }
      const game = draw(start(4, 2), ...order);
      if (game.scores[0] === game.scores[1]) level = game;
    }
    expect(level, "no shuffled game ended level in 500 tries").not.toBeNull();
    expect(level!.scores).toEqual([8, 8]);
    expect(level!.winners).toEqual([0, 1]);
  });

  it("shares it three ways when three are level", () => {
    // Three players on 3×3, every line in number order: the nine boxes fall three each.
    const game = draw(start(3, 3), ...everyLine(3));
    expect(game.scores).toEqual([3, 3, 3]);
    expect(game.winners).toEqual([0, 1, 2]);
  });

  it("names one winner when one player holds the most", () => {
    // Two players on 3×3 hold nine boxes between them, so they can never be level.
    const game = draw(start(3, 2), ...everyLine(3));
    expect(game.scores[0] + game.scores[1]).toBe(9);
    expect(game.winners).toHaveLength(1);
    expect(game.scores[game.winners[0]]).toBe(Math.max(...game.scores));
  });

  it("says no winner while the game is on", () => {
    expect(draw(start(3, 2), 0, 1).winners).toEqual([]);
  });
});

describe("keeping a game, and reading it back", () => {
  it("reads back exactly the game it wrote, mid-game and finished", () => {
    const mid = draw(startDots(4, ["Ann", "Ben", "Cy"], 1)!, 0, 4, 20, 21, 5, 9);
    expect(decodeDots(encodeDots(mid))).toEqual(mid);
    const done = draw(start(3, 2), ...everyLine(3));
    expect(decodeDots(encodeDots(done))).toEqual(done);
  });

  it("keeps the table and the lines, never the board", () => {
    const kept = JSON.parse(encodeDots(draw(start(3, 2), 0, 3)));
    expect(Object.keys(kept).sort()).toEqual(["first", "lines", "players", "size", "v"]);
  });

  it("refuses anything that is not a game these rules can play out again", () => {
    expect(decodeDots(null)).toBeNull();
    expect(decodeDots("not json")).toBeNull();
    expect(decodeDots("[]")).toBeNull();
    const good = JSON.parse(encodeDots(draw(start(3, 2), 0, 3)));
    expect(decodeDots(JSON.stringify({ ...good, v: 2 }))).toBeNull();
    expect(decodeDots(JSON.stringify({ ...good, lines: [0, 0] }))).toBeNull();
    expect(decodeDots(JSON.stringify({ ...good, lines: [0, 400] }))).toBeNull();
    expect(decodeDots(JSON.stringify({ ...good, size: 9 }))).toBeNull();
    expect(decodeDots(JSON.stringify({ ...good, players: ["only one"] }))).toBeNull();
    expect(decodeDots(JSON.stringify({ ...good, players: [1, 2] }))).toBeNull();
  });

  it("replays a record the same way whether it is read back or drawn live", () => {
    const lines = [0, 3, 12, 13, 23, 1];
    expect(replayDots(3, ["", ""], 0, lines)).toEqual(draw(start(3, 2), ...lines));
  });
});

describe("the same table again", () => {
  it("starts from nothing with the same players, and the next seat round draws first", () => {
    const done = draw(startDots(3, ["Ann", "Ben", "Cy"], 2)!, ...everyLine(3));
    const again = dotsAgain(done);
    expect(again.players).toEqual(["Ann", "Ben", "Cy"]);
    expect(again.lines).toEqual([]);
    expect(again.first).toBe(0);
    expect(again.toPlay).toBe(0);
    expect(again.size).toBe(3);
  });
});
