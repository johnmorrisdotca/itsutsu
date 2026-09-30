import { describe, expect, it } from "vitest";

import { goFishMoves, goFishWinners, playGoFish, startGoFish } from "./goFish.ts";
import { goFishComputer, goFishMemory } from "./goFishComputer.ts";
import type { GoFishGame } from "./goFish.types.ts";

function started(players = 3, seed = 3): GoFishGame {
  return startGoFish(1, new Array<string>(players).fill(""), undefined, seed)!;
}

function at(hands: string[][], stock: string[], extra: Partial<GoFishGame> = {}): GoFishGame {
  return { ...started(hands.length), hands, stock, books: hands.map(() => []), toPlay: 0, log: [], ...extra };
}

describe("go fish", () => {
  it("deals seven each to two or three, five each to four or more", () => {
    expect(started(3).stock).toHaveLength(52 - 21);
    expect(started(5).stock).toHaveLength(52 - 25);
  });

  it("asks only for a rank the asker holds, of somebody else", () => {
    const game = at([["5C", "9S"], ["5D"], ["KH"]], ["2C"]);
    expect(goFishMoves(game)).toEqual([
      { ask: 1, rank: 5 },
      { ask: 1, rank: 9 },
      { ask: 2, rank: 5 },
      { ask: 2, rank: 9 },
    ]);
    expect(playGoFish(game, { ask: 1, rank: 13 })).toBeNull();
    expect(playGoFish(game, { ask: 0, rank: 5 })).toBeNull();
  });

  it("hands over every card of the rank asked, and the asker asks again", () => {
    const game = at([["5C", "9S"], ["5D", "5H", "KH"], ["KS"]], ["2C"]);
    const after = playGoFish(game, { ask: 1, rank: 5 })!;
    expect(after.hands[0]).toEqual(["5C", "5D", "5H", "9S"]);
    expect(after.hands[1]).toEqual(["KH"]);
    expect(after.toPlay).toBe(0);
  });

  it("goes fishing on a miss: drawing the rank asked earns another ask, anything else ends the turn", () => {
    const miss = playGoFish(at([["5C", "9S"], ["KH"], ["KS"]], ["2C", "3C"]), { ask: 1, rank: 5 })!;
    expect(miss.hands[0]).toContain("2C");
    expect(miss.toPlay).toBe(1);
    const caught = playGoFish(at([["5C", "9S"], ["KH"], ["KS"]], ["5S", "3C"]), { ask: 1, rank: 5 })!;
    expect(caught.toPlay).toBe(0);
    expect(caught.log.at(-1)).toMatchObject({ kind: "ask", fished: "caught" });
  });

  it("lays down four of a rank as a book, and ends when all thirteen are down, the most books winning", () => {
    const books = [[1, 2, 3, 4, 6, 7], [8, 9, 10, 11, 12, 13]] as GoFishGame["books"];
    const game = at([["5C", "5D", "5H"], ["5S"]], [], { books: [...books, []] as GoFishGame["books"] });
    const end = playGoFish({ ...game, hands: [...game.hands, []] }, { ask: 1, rank: 5 })!;
    expect(end.books[0]).toContain(5);
    expect(end.phase).toBe("over");
    expect(goFishWinners(end)).toEqual([0]);
  });

  it("a player with no cards draws one when their turn comes, while the pond lasts", () => {
    const after = playGoFish(at([["5C"], [], ["KS"]], ["7D", "8D"]), { ask: 2, rank: 5 })!;
    expect(after.toPlay).toBe(1);
    expect(after.hands[1]).toEqual(["8D"]);
    expect(after.log.at(-1)).toEqual({ kind: "draw", seat: 1 });
    // With the pond empty, a player with no cards sits out.
    const dry = playGoFish(at([["5C"], [], ["KS"]], ["7D"]), { ask: 2, rank: 5 })!;
    expect(dry.toPlay).toBe(2);
  });

  it("the computer remembers who asked for what", () => {
    const log: GoFishGame["log"] = [{ kind: "ask", seat: 2, asked: 1, rank: 9, got: 0, fished: "missed" }];
    const memory = goFishMemory(log, 3);
    expect(memory.holds[2].has(9)).toBe(true);
    expect(memory.lacks[1].has(9)).toBe(true);
    const game = at([["9C", "5D", "5S"], ["KH", "QH"], ["9S", "2D"]], ["3C"], { log });
    // It holds more fives, but it knows seat 2 has a nine.
    expect(goFishComputer(game)).toEqual({ ask: 2, rank: 9 });
  });

  it("the computer forgets what a player lacked once they draw unseen", () => {
    const memory = goFishMemory(
      [
        { kind: "ask", seat: 0, asked: 1, rank: 9, got: 0, fished: "missed" },
        { kind: "ask", seat: 1, asked: 0, rank: 4, got: 0, fished: "missed" },
      ],
      2,
    );
    expect(memory.lacks[1].has(9)).toBe(false);
    expect(memory.holds[1].has(4)).toBe(true);
  });
});
