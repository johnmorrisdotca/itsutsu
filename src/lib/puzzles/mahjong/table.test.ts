import { describe, expect, it } from "vitest";

import { seededRandom } from "../random";
import { computerPair } from "./computer";
import { generateMahjong } from "./generate";
import { MAHJONG_LAYOUTS } from "./layouts";
import { MAHJONG_TABLE, decodeTable, playAtTable, encodeTable, readTable, seatName, startTable, tablePairs, tablePlayersAsked, takeAtTable, undoAtTable } from "./table";
import type { MahjongTable } from "./table.types";
import { pairGoesAgain, pairPoints } from "./tiles";

/**
 * Mahjong at the table: two to four taking turns on one layout, a pair a turn,
 * scored by what the pair is, a flower or season going again. The simulation
 * plays seeded games at every offered layout and table size to their end.
 */
/* Dealing is most of a test's time (a Turtle's is a few hundred milliseconds), so each deal is made once; games differ by their play. */
const DEALS = new Map<string, ReturnType<typeof generateMahjong>>();
function dealOf(size: number, seed: number) {
  const key = `${size}:${seed}`;
  if (!DEALS.has(key)) DEALS.set(key, generateMahjong(size, "medium", seed));
  return DEALS.get(key)!;
}

function table(size: number, players: number, seed: number): MahjongTable {
  const deal = dealOf(size, seed);
  return startTable(deal, Array.from({ length: players }, (_, at) => ({ name: at === 0 ? "Aiko" : "" })));
}

describe("a game at the table", () => {
  it("seats two to four, named or by their wind", () => {
    expect(tablePlayersAsked("3")).toBe(3);
    expect(tablePlayersAsked("5")).toBe(1);
    expect(tablePlayersAsked(undefined)).toBe(1);
    const game = startTable(generateMahjong(4, "easy", 1), [{ name: "  Aiko  " }, { name: "", computer: true }, { name: "" }]);
    expect(game.seats).toHaveLength(3);
    expect(seatName(game.seats, 0)).toBe("Aiko");
    expect(seatName(game.seats, 1)).toBe("Computer 1");
    expect(seatName(game.seats, 2)).toBe("West");
    expect(startTable(generateMahjong(4, "easy", 1), [{ name: "solo" }]).seats).toHaveLength(MAHJONG_TABLE.least);
  });

  it("scores each pair to whoever took it, passes the turn, and gives a bonus pair another turn", () => {
    for (let seed = 1; seed < 20; seed += 1) {
      let game = table(8, 2, seed);
      let state = readTable(game)!;
      for (let step = 0; step < 80 && !state.over; step += 1) {
        const [a, b] = tablePairs(game, state)[0]!;
        const code = state.cells[a]!;
        const mover = state.turn;
        const before = state.scores[mover]!;
        game = takeAtTable(game, a, b)!;
        state = readTable(game)!;
        expect(state.scores[mover]).toBe(before + pairPoints(code));
        if (!state.over) expect(state.turn).toBe(pairGoesAgain(code) ? mover : (mover + 1) % 2);
      }
      expect(state.over).toBe(true);
    }
  });

  it("refuses a pair that is not free, and leaves the table it was given alone", () => {
    const game = table(15, 2, 3);
    const state = readTable(game)!;
    const covered = state.cells.length - 1; // the Turtle's top tile covers the four under it
    expect(takeAtTable(game, 0, covered - 1)).toBeNull();
    const [a, b] = tablePairs(game, state)[0]!;
    const next = takeAtTable(game, a, b)!;
    expect(game.takes).toHaveLength(0);
    expect(next.takes).toEqual([[a, b]]);
    expect(undoAtTable(next)).toEqual(game);
    expect(undoAtTable(game)).toBeNull();
  });

  it("is kept as its pairs and read back exactly, and refuses a kept game it cannot replay", () => {
    let game = table(9, 3, 8);
    for (let step = 0; step < 6; step += 1) {
      const pair = computerPair(game)!;
      game = takeAtTable(game, pair[0], pair[1])!;
    }
    expect(decodeTable(encodeTable(game))).toEqual(game);
    expect(readTable(decodeTable(encodeTable(game))!)).toEqual(readTable(game));
    expect(decodeTable(encodeTable({ ...game, takes: [...game.takes, [0, 0]] }))).toBeNull();
    expect(decodeTable("{")).toBeNull();
    expect(decodeTable(null)).toBeNull();
  });
});

describe("the table plays out", () => {
  const offered = MAHJONG_LAYOUTS.filter((layout) => layout.size !== 4);

  it.each(offered.map((layout) => [layout.key, layout.size] as const))("at the %s: every game ends, names its winners, and every seat wins some", (_, size) => {
    for (let players = MAHJONG_TABLE.least; players <= MAHJONG_TABLE.most; players += 1) {
      const wins = new Array<number>(players).fill(0);
      for (let game = 0; game < 12; game += 1) {
        const random = seededRandom(size * 1000 + players * 100 + game);
        let current = table(size, players, game % 4);
        let state = readTable(current)!;
        for (let step = 0; step < 400 && !state.over; step += 1) {
          const pairs = tablePairs(current, state);
          expect(pairs.length, "a game that is not over offers a pair").toBeGreaterThan(0);
          const [a, b] = pairs[Math.floor(random() * pairs.length)]!;
          ({ table: current, state } = playAtTable(current, a, b, state)!);
        }
        expect(state.over).toBe(true);
        expect(tablePairs(current, state)).toEqual([]);
        expect(state.winners.length).toBeGreaterThan(0);
        expect(state.pairs.reduce((sum, count) => sum + count, 0)).toBe(state.taken.length);
        for (const seat of state.winners) wins[seat]! += 1;
      }
      expect(wins.every((count) => count > 0), `${players} players at ${size}: ${wins.join(" ")}`).toBe(true);
    }
  });

  it("a computer beats a player who takes pairs at random, more often than not", () => {
    let computerWins = 0;
    const games = 24;
    for (let game = 0; game < games; game += 1) {
      const random = seededRandom(500 + game);
      let current = table(9, 2, game % 6);
      let state = readTable(current)!;
      // The computer sits first in even games and second in odd ones.
      const computerSeat = game % 2;
      while (!state.over) {
        const pairs = tablePairs(current, state);
        const pair = state.turn === computerSeat ? computerPair(current)! : pairs[Math.floor(random() * pairs.length)]!;
        ({ table: current, state } = playAtTable(current, pair[0], pair[1], state)!);
      }
      expect(readTable(current)).toEqual(state);
      if (state.winners.includes(computerSeat)) computerWins += 1;
    }
    expect(computerWins).toBeGreaterThan(games * 0.6);
  });
});
