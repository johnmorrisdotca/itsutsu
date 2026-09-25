import { describe, expect, it } from "vitest";

import { createGame, movePiece, pieceMoves } from "@/lib/gomoku/engine";
import type { GameState, Point, RuleVariant, Stone } from "@/lib/gomoku/gomoku.types";
import type { GameMove } from "@/lib/history/gameHistory.types";
import { pdnFileName, pdnOffered, pdnSquare, writePdn } from "./pdn";
import type { SgfSource } from "./sgf.types";

const p = (row: number, col: number): Point => ({ row, col });

/** A finished record of this game, as the replay page holds it. */
function recordOf(variant: RuleVariant, size: number, opener: Stone, slides: { from: Point; to: Point; stone: Stone }[], result = "black"): SgfSource {
  const moves: GameMove[] = slides.map((slide, at) => ({
    number: at + 1,
    row: slide.to.row,
    col: slide.to.col,
    stone: slide.stone,
    kind: "move",
    createdAt: "2026-09-25T00:00:00.000Z",
    from: slide.from,
  }));
  return {
    variant,
    size,
    winLength: 5,
    obstacles: "none",
    opener,
    opening: "free",
    handicap: null,
    headStart: null,
    seed: 0,
    drawLimit: "none",
    status: "won",
    result,
    blackName: "Hanako",
    whiteName: "Taro",
    moveTimeMs: null,
    moves,
  } as unknown as SgfSource;
}

function written(source: SgfSource): string {
  const file = writePdn(source, "2026-09-25");
  if (file.kind !== "written") throw new Error("refused");
  return file.text;
}

describe("PDN, the draughts family's file", () => {
  it("numbers the dark squares as every checkers diagram does: 1 in Black's top row, 32 in White's bottom corner", () => {
    expect(pdnSquare(8, p(0, 1), false)).toBe("1");
    expect(pdnSquare(8, p(2, 5), false)).toBe("11");
    expect(pdnSquare(8, p(7, 6), false)).toBe("32");
    expect(pdnSquare(10, p(9, 0), false)).toBe("46");
    expect(pdnSquare(8, p(5, 2), true)).toBe("c3");
  });

  it("writes checkers' textbook opening as 1. 11-15 23-19, with the tags and the starting position", () => {
    const text = written(
      recordOf("checkers", 8, "black", [
        { from: p(2, 5), to: p(3, 4), stone: "black" },
        { from: p(5, 4), to: p(4, 5), stone: "white" },
      ]),
    );
    expect(text).toContain('[GameType "21"]');
    expect(text).toContain('[Black "Hanako"]');
    expect(text).toContain('[White "Taro"]');
    expect(text).toContain('[Date "2026.09.25"]');
    expect(text).toContain('[Result "0-1"]');
    expect(text).toContain('[FEN "B:W21,22,23,24,25,26,27,28,29,30,31,32:B1,2,3,4,5,6,7,8,9,10,11,12"]');
    expect(text).toContain("1. 11-15 23-19 0-1");
  });

  it("writes international draughts' 32-28 for White, who opens, on the 1–50 board", () => {
    const text = written(recordOf("internationalDraughts", 10, "white", [{ from: p(6, 3), to: p(5, 4), stone: "white" }], "draw"));
    expect(text).toContain('[GameType "20"]');
    expect(text).toContain('[Result "1-1"]');
    expect(text).toMatch(/\[FEN "W:W31,.*,50:B1,.*,20"\]/);
    expect(text).toContain("1. 32-28 1-1");
  });

  it("writes Russian draughts in algebraic squares: 1. c3-d4", () => {
    const text = written(recordOf("russianDraughts", 8, "white", [{ from: p(5, 2), to: p(4, 3), stone: "white" }], "white"));
    expect(text).toContain('[GameType "25"]');
    expect(text).toContain('[Result "2-0"]');
    expect(text).toContain("1. c3-d4 2-0");
  });

  it("writes a capture with an x, the engine's own capture from a played game", () => {
    // Play the first legal move each turn until somebody captures: a real capture, found by the engine.
    let game: GameState = createGame({ variant: "checkers", firstPlayer: "black" });
    const slides: { from: Point; to: Point; stone: Stone }[] = [];
    for (let ply = 0; ply < 80 && !slides.some((_, at) => game.moves[at]?.captured !== undefined); ply += 1) {
      const from = game.board
        .map((cell, index) => ({ cell, point: p(Math.floor(index / 8), index % 8) }))
        .find(({ cell, point }) => cell === game.toPlay && pieceMoves(game, point).length > 0)?.point;
      if (from === undefined) break;
      const to = pieceMoves(game, from)[0]!;
      slides.push({ from, to, stone: game.toPlay });
      game = movePiece(game, from, to);
    }
    const captured = game.moves.find((move) => move.captured !== undefined);
    expect(captured, "the engine found no capture to write").toBeDefined();
    const from = pdnSquare(8, captured!.from!, false);
    const to = pdnSquare(8, captured!, false);
    expect(written(recordOf("checkers", 8, "black", slides, "abandoned"))).toContain(`${from}x${to}`);
  });

  it("is offered for the six draughts games and nothing else, and names its file like the SGF one", () => {
    for (const variant of ["checkers", "poolCheckers", "internationalDraughts", "canadianCheckers", "russianDraughts", "brazilianDraughts"]) {
      expect(pdnOffered(variant), variant).toBe(true);
    }
    expect(pdnOffered("chineseCheckers")).toBe(false);
    expect(pdnOffered("freestyle")).toBe(false);
    expect(writePdn(recordOf("freestyle" as RuleVariant, 15, "black", []), null).kind).toBe("refused");
    expect(pdnFileName({ variant: "checkers", blackName: "Hanako", whiteName: "Taro" }, "2026-09-25")).toBe("checkers-Hanako-vs-Taro-2026-09-25.pdn");
  });
});
