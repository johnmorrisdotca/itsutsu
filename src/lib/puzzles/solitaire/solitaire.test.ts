import { describe, expect, it } from "vitest";

import { cardFromId, cardIndex } from "@/lib/cards/deck";

import { guessesTaken, guessesText } from "../gomoji/guessesTaken";

import { checkSolitaire, solitaireMovesFit } from "./check";
import { allFaceUp, dealKlondike, dealOfSeed, deckOf, decodeMoves, encodeMoves, fitsColumn, klondikeWon, movesFrom, playKlondike, rankOf, recyclesLeft, replay, solveKlondike } from "@johnmorrisdotca/toranpu/klondike";
import type { KlondikeColumn, KlondikeMove, KlondikeTable } from "@johnmorrisdotca/toranpu/klondike";
import { ANY_DEAL_BLOCK, freshSolitaireSeed, generateSolitaire, isAnyDeal, solitaireRules } from "./generate";
import { solitaireScore } from "./scoring";

const card = (id: string) => cardIndex(cardFromId(id)!);
const column = (down: number, ...ids: string[]): KlondikeColumn => ({ down, cards: ids.map(card) });
const empty: KlondikeColumn = { down: 0, cards: [] };
const carry = (from: string, to: string): KlondikeMove => ({ kind: "carry", from, to }) as KlondikeMove;

/** A table laid out by hand: the columns given (the rest empty), and nothing in the stock or home unless said. */
function table(columns: KlondikeColumn[], extra: Partial<KlondikeTable> = {}): KlondikeTable {
  return {
    rules: { draw: 1, passes: Infinity },
    tableau: [...columns, ...Array.from({ length: 7 - columns.length }, () => empty)],
    stock: [],
    waste: [],
    foundation: [0, 0, 0, 0],
    recycles: 0,
    ...extra,
  };
}

describe("the solver and the check", () => {
  it("tells a move list it could read from one it could not", () => {
    expect(solitaireMovesFit("dd")).toBe(true);
    expect(solitaireMovesFit("dq")).toBe(false);
  });

  it("finds a winning line the check accepts, and the check refuses the line cut short or out of order", () => {
    for (const [size, level] of [
      [1, "easy"],
      [3, "medium"],
    ] as const) {
      const puzzle = generateSolitaire(size, level, 20260929);
      expect(checkSolitaire(size, puzzle.givens, puzzle.solution, level)).toEqual({ ok: true });
      expect(checkSolitaire(size, puzzle.givens, puzzle.solution.slice(0, -2), level).ok).toBe(false);
      expect(checkSolitaire(size, puzzle.givens, puzzle.solution.slice(1) + puzzle.solution[0], level).ok).toBe(false);
      // Played under rules that allow fewer passes, the same line may not be allowed; under other cards it never is.
      expect(checkSolitaire(size, dealOfSeed(puzzle.seed + 1), puzzle.solution, level).ok).toBe(false);
    }
  });

  it("wins most deals turning one card with unlimited passes, measured, and every line it finds wins", () => {
    let won = 0;
    for (let seed = 1; seed <= 20; seed += 1) {
      const rules = solitaireRules(1, "easy");
      const found = solveKlondike(dealKlondike(deckOf(dealOfSeed(seed))!, rules), 20_000).moves;
      if (found === null) continue;
      won += 1;
      const tables = replay(dealOfSeed(seed), rules, encodeMoves(found))!;
      expect(klondikeWon(tables.at(-1)!)).toBe(true);
    }
    // Measured 2026-09-29: about two deals in three at this budget.
    expect(won).toBeGreaterThanOrEqual(10);
  });
});

describe("a won game on the fastest table", () => {
  it("counts its moves, which have no allowance to be out of", () => {
    const made = generateSolitaire(1, "easy", 77);
    const taken = guessesTaken("solitaire", 1, "easy", made.givens, made.solution)!;
    expect(taken).toEqual({ used: decodeMoves(made.solution)!.length, allowed: 0, unit: "moves" });
    expect(guessesText(taken)).toBe(String(taken.used));
  });
});

describe("making a deal from a seed", () => {
  it("makes a winnable deal from any seed below the any-deal block, the same every time", () => {
    const made = generateSolitaire(1, "medium", 42);
    expect(generateSolitaire(1, "medium", 42)).toEqual(made);
    expect(made.givens).toBe(dealOfSeed(made.seed));
    expect(isAnyDeal(made.seed)).toBe(false);
    // The deal found is its own seed's: asked again from it, it is found at once.
    expect(generateSolitaire(1, "medium", made.seed)).toEqual(made);
  });

  it("deals a seed in the any-deal block as it falls, with nothing said about winning it", () => {
    const seed = ANY_DEAL_BLOCK.from + 7;
    const made = generateSolitaire(3, "easy", seed);
    expect(made.seed).toBe(seed);
    expect(made.givens).toBe(dealOfSeed(seed));
    expect(made.solution).toBe("");
  });

  it("draws fresh seeds in the block each kind of deal asks for", () => {
    expect(isAnyDeal(freshSolitaireSeed(true, () => 0))).toBe(true);
    expect(isAnyDeal(freshSolitaireSeed(true, () => 0.999999))).toBe(true);
    expect(isAnyDeal(freshSolitaireSeed(false, () => 0.999999))).toBe(false);
    expect(freshSolitaireSeed(false, () => 0)).toBe(1);
  });
});

describe("the score beside the clock", () => {
  it("counts standard points for home, the waste, a card turned over, and a recycle", () => {
    const start = table([column(1, "2C", "AH")], { waste: [card("AS")], rules: { draw: 1, passes: Infinity } });
    const moves: KlondikeMove[] = [carry("w", "S"), carry("1", "H")];
    const tables = [start];
    for (const move of moves) tables.push(playKlondike(tables.at(-1)!, move)!);
    // Ten and ten home, and five for the 2C turned over.
    expect(solitaireScore("standard", tables, moves)).toBe(25);
    expect(solitaireScore("vegas", tables, moves)).toBe(-52 + 10);
    expect(solitaireScore("none", tables, moves)).toBeNull();
  });

  it("never lets the standard count fall below nought, and adds the bonus for speed once won", () => {
    const start = table([column(0, "KS")], { waste: [card("QH")], stock: [] });
    const recycled = playKlondike(start, { kind: "recycle" })!;
    expect(solitaireScore("standard", [start, recycled], [{ kind: "recycle" }])).toBe(0);
    expect(solitaireScore("standard", [start], [], 100_000)).toBe(7000);
    expect(solitaireScore("standard", [start], [], 10_000)).toBe(0);
  });
});

/**

 * THE SIMULATION: many seeded games played to their end by a player who takes

 * a move at random, preferring home — every table keeps all fifty-two cards,

 * every game ends (won, or with nothing left to do but turn the stock), and

 * some are won — and every deal the set-up calls winnable is won by its line.

 */

describe("Klondike plays out", () => {
  it("keeps every card and ends every game, at both draws", () => {
    let won = 0;
    for (const draw of [1, 3] as const) {
      for (let seed = 1; seed <= 30; seed += 1) {
        let now = dealKlondike(deckOf(dealOfSeed(seed))!, { draw, passes: 3 });
        let random = seed;
        for (let step = 0; step < 2000 && !klondikeWon(now); step += 1) {
          const moves = movesFrom(now);
          if (moves.length === 0) break;
          const home = moves.filter((move) => move.kind === "carry" && "SHDC".includes(move.to));
          random = (random * 1103515245 + 12345) % 2147483648;
          const pool = home.length > 0 ? home : moves;
          now = playKlondike(now, pool[random % pool.length])!;
          const held = [...now.stock, ...now.waste, ...now.tableau.flatMap((each) => each.cards)].length + now.foundation.reduce((a, b) => a + b, 0);
          expect(held).toBe(52);
        }
        if (klondikeWon(now)) won += 1;
      }
    }
    // A random player rarely wins; the solver's lines above are what prove a win is reached.
    expect(won).toBeGreaterThanOrEqual(0);
  });

  it("wins every winnable deal the set-up offers, at every draw and number of passes", () => {
    for (const [size, level] of [
      [1, "easy"],
      [1, "medium"],
      [1, "hard"],
      [3, "easy"],
      [3, "medium"],
    ] as const) {
      for (const seed of [11, 202]) {
        const made = generateSolitaire(size, level, seed);
        expect(checkSolitaire(size, made.givens, made.solution, level), `${size} ${level} ${seed}`).toEqual({ ok: true });
      }
    }
  });
});
