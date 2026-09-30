import { describe, expect, it } from "vitest";

import { HITOTSU_CLASSIC, HITOTSU_DECK_SIZE, HITOTSU_PARTY, HITOTSU_SIZES } from "./constants.ts";
import { hitotsuJumpIns, hitotsuMatches, hitotsuMoves, hitotsuWinners, playHitotsu, startHitotsu } from "./rules.ts";
import type { HitotsuGame, HitotsuMove, HitotsuOptions } from "./types.ts";
import { HITOTSU_DECK, hitotsuPoints, hitotsuWords, isNumber } from "./deck.ts";
import { hitotsuComputer, hitotsuComputerJump } from "./computer.ts";
import { decodeHitotsu, encodeHitotsu, readHitotsuMove } from "./codec.ts";
import { seededRandom } from "./random.ts";

/** A hitotsu game in a given position: these hands and piles, the first seat to play, published rules unless others are given. */
function at(hands: string[][], discard: string[], stock: string[], extra: Partial<HitotsuGame> = {}, options: Partial<HitotsuOptions> = {}): HitotsuGame {
  const base = startHitotsu(500, new Array<string>(hands.length).fill(""), 3, { ...HITOTSU_CLASSIC, ...options })!;
  const top = discard[discard.length - 1]!;
  return { ...base, hands, discard, stock, colour: top[0] === "W" ? "R" : (top[0] as HitotsuGame["colour"]), toPlay: 0, ...extra };
}

const play = (game: HitotsuGame, move: HitotsuMove) => {
  const next = playHitotsu(game, move);
  expect(next, JSON.stringify(move)).not.toBeNull();
  return next!;
};

describe("hitotsu: the deck", () => {
  it("is 108 cards: a zero, two of each number and action in each colour, four wilds and four wild draw fours", () => {
    expect(HITOTSU_DECK).toHaveLength(HITOTSU_DECK_SIZE);
    expect(new Set(HITOTSU_DECK).size).toBe(108);
    expect(HITOTSU_DECK.filter((card) => card.startsWith("R0"))).toHaveLength(1);
    expect(HITOTSU_DECK.filter((card) => card.startsWith("GD"))).toHaveLength(2);
    expect(HITOTSU_DECK.filter((card) => card.startsWith("WF"))).toHaveLength(4);
    expect(["R7", "BS", "YD", "WW", "WF"].map((card) => hitotsuPoints(`${card}0`))).toEqual([7, 20, 20, 50, 50]);
    expect(hitotsuWords("BD1")).toBe("blue draw two");
  });
});

describe("hitotsu: the published rules", () => {
  it("deals seven each, five in party mode, and turns up a number card to start", () => {
    expect(startHitotsu(500, ["", "", ""])!.hands.map((hand) => hand.length)).toEqual([7, 7, 7]);
    expect(startHitotsu(1, ["", "", "", ""], 2, HITOTSU_PARTY)!.hands.map((hand) => hand.length)).toEqual([5, 5, 5, 5]);
    for (let seed = 1; seed < 40; seed += 1) expect(isNumber(startHitotsu(200, ["", ""], seed)!.discard[0]!)).toBe(true);
    expect(startHitotsu(500, [""])).toBeNull();
    expect(startHitotsu(500, new Array<string>(9).fill(""))).toBeNull();
    expect(startHitotsu(300, ["", ""])).toBeNull();
    expect(HITOTSU_SIZES).toContain(500);
  });

  it("matches the colour or the number, and a wild goes on anything", () => {
    const game = at([["R50"], ["G20"]], ["B51"], []);
    expect(hitotsuMatches(game, "B20")).toBe(true);
    expect(hitotsuMatches(game, "G50")).toBe(true);
    expect(hitotsuMatches(game, "WW0")).toBe(true);
    expect(hitotsuMatches(game, "RS0")).toBe(false);
  });

  it("a skip skips, a reverse turns the table round, and between two a reverse skips", () => {
    const three = at([["RS0", "R10", "R20"], ["G20"], ["Y20"]], ["R50"], ["B90"]);
    expect(play(three, { play: "RS0" }).toPlay).toBe(2);
    const turned = play(three, { play: "R10" }).toPlay === 1 ? play(at([["RR0", "R10", "R20"], ["G20"], ["Y20"]], ["R50"], ["B90"]), { play: "RR0" }) : null;
    expect(turned?.toPlay).toBe(2);
    expect(turned?.direction).toBe(-1);
    const two = play(at([["RR0", "R10", "R20"], ["G20"]], ["R50"], ["B90"]), { play: "RR0" });
    expect(two.toPlay).toBe(0);
  });

  it("a draw two makes the next player take two and lose their turn", () => {
    const after = play(at([["RD0", "R10", "R20"], ["G20"], ["Y20"]], ["R50"], ["B90", "B80", "B70"]), { play: "RD0" });
    expect(after.hands[1]).toHaveLength(3);
    expect(after.toPlay).toBe(2);
  });

  it("a wild calls the colour, and must call one", () => {
    const game = at([["WW0", "R10", "R20"], ["G20"]], ["B50"], ["B90"]);
    expect(playHitotsu(game, { play: "WW0" })).toBeNull();
    expect(play(game, { play: "WW0", colour: "G" }).colour).toBe("G");
  });

  it("a wild draw four may be challenged: a bluff takes the four back, an honest one costs the challenger six", () => {
    const bluff = play(at([["WF0", "B10", "R20"], ["G20"], ["Y20"]], ["B50"], new Array(12).fill(0).map((_, at) => `Y${at % 9 + 1}${at % 2}`)), { play: "WF0", colour: "R" });
    expect(bluff.challenge).toEqual({ by: 0, bluffed: true });
    expect(hitotsuMoves(bluff)).toEqual([{ take: true }, { challenge: true }]);
    const caught = play(bluff, { challenge: true });
    expect(caught.hands[0]).toHaveLength(6);
    expect(caught.toPlay).toBe(1);
    const honest = play(at([["WF0", "G10", "R20"], ["G20"], ["Y20"]], ["B50"], new Array(12).fill(0).map((_, at) => `Y${at % 9 + 1}${at % 2}`)), { play: "WF0", colour: "R" });
    const lost = play(honest, { challenge: true });
    expect(lost.hands[1]).toHaveLength(7);
    expect(lost.toPlay).toBe(2);
    expect(play(honest, { take: true }).hands[1]).toHaveLength(5);
  });

  it("draws one card when asked: a card that goes may be played or kept; one that does not ends the turn", () => {
    const game = at([["G50", "G60"], ["Y20"]], ["R90"], ["R30", "B10"]);
    const drew = play(game, { draw: true });
    expect(drew.drawn).toBe("R30");
    expect(hitotsuMoves(drew)).toEqual([{ play: "R30" }, { pass: true }]);
    const nothing = play(at([["G50"], ["Y20"]], ["R90"], ["B10"]), { draw: true });
    expect(nothing.toPlay).toBe(1);
  });

  it("going down to one card without calling it costs two cards", () => {
    const game = at([["R10", "R20"], ["G20"]], ["R50"], ["B90", "B80", "B70"]);
    expect(play(game, { play: "R10", call: true }).hands[0]).toHaveLength(1);
    const caught = play(game, { play: "R10" });
    expect(caught.hands[0]).toHaveLength(3);
    expect(caught.news).toContainEqual({ kind: "caught", seat: 0 });
  });

  it("the first out scores what the others hold; a draw card played last is still taken first", () => {
    const game = at([["RD0"], ["G20", "WW1"], ["Y90"]], ["R50"], ["B10", "B30"], { size: 500 });
    const after = play(game, { play: "RD0" });
    expect(after.results[0]).toEqual({ winners: [0], points: 2 + 50 + 1 + 3 + 9, blocked: false });
    expect(after.phase).toBe("playing");
    expect(after.hand).toBe(1);
  });

  it("a game of one hand is over after it, and a game to 200 when somebody reaches 200", () => {
    const one = play(at([["R10"], ["WW0", "WF0"]], ["R50"], [], { size: 1 }), { play: "R10" });
    expect(one.phase).toBe("over");
    expect(hitotsuWinners(one)).toEqual([0]);
    const two = play(at([["R10"], ["WW0", "WF0", "WW1", "WF1"]], ["R50"], [], { size: 200 }), { play: "R10" });
    expect(hitotsuWinners(two)).toEqual([0]);
  });

  it("a hand nobody can play or draw in is blocked, and the least held wins it", () => {
    let game = at([["G50"], ["B90"]], ["R10"], []);
    game = play(game, { pass: true });
    game = play(game, { pass: true });
    expect(game.results[0]).toEqual({ winners: [0], points: 9, blocked: true });
  });
});

describe("hitotsu: the variants", () => {
  const stock = new Array(20).fill(0).map((_, at) => `Y${(at % 9) + 1}${at % 2}`);

  it("stacking: a draw two on a draw two passes four on; the same card only, or any draw card", () => {
    const same = play(at([["RD0", "R10", "R20"], ["GD0", "WF0", "G30"], ["Y20"]], ["R50"], stock, {}, { stacking: "same" }), { play: "RD0" });
    expect(same.pending).toBe(2);
    expect(hitotsuMoves(same)).toEqual([{ play: "GD0" }, { take: true }]);
    const stacked = play(same, { play: "GD0" });
    expect(stacked.pending).toBe(4);
    expect(stacked.toPlay).toBe(2);
    expect(play(stacked, { take: true }).hands[2]).toHaveLength(5);
    const any = play(at([["RD0", "R10", "R20"], ["GD0", "WF0", "G30"], ["Y20"]], ["R50"], stock, {}, { stacking: "any" }), { play: "RD0" });
    expect(hitotsuMoves(any).filter((move) => "play" in move && move.play === "WF0")).toHaveLength(4);
  });

  it("jump-in: an identical card may be played out of turn, and play goes on from there", () => {
    const game = at([["R10", "R20"], ["G20", "G30"], ["R51", "Y30"]], ["R50"], stock, { toPlay: 1 }, { jumpIn: true });
    expect(hitotsuJumpIns(game)).toEqual([{ jump: "R51", seat: 2, call: true }, { jump: "R51", seat: 2 }]);
    const jumped = play(game, { jump: "R51", seat: 2, call: true });
    expect(jumped.toPlay).toBe(0);
    expect(jumped.news).toContainEqual({ kind: "jump", seat: 2 });
    expect(hitotsuJumpIns(at([["R10"], ["R51"]], ["R50"], stock))).toEqual([]);
  });

  it("sevens swap hands with the seat chosen, and zeros pass every hand on", () => {
    const seven = at([["R70", "B10", "B20"], ["G20"], ["Y20", "Y30"]], ["R50"], stock, {}, { sevenZero: true });
    expect(playHitotsu(seven, { play: "R70" })).toBeNull();
    const swapped = play(seven, { play: "R70", swap: 1 });
    expect(swapped.hands[0]).toEqual(["G20"]);
    expect(swapped.hands[1]).toEqual(["B10", "B20"]);
    const zero = play(at([["R00", "B10", "B20"], ["G20"], ["Y20", "Y30"]], ["R50"], stock, {}, { sevenZero: true }), { play: "R00" });
    expect(zero.hands).toEqual([["Y20", "Y30"], ["B10", "B20"], ["G20"]]);
  });

  it("draw until you can play: draws past what does not go, and offers the card that does", () => {
    const game = play(at([["G50"], ["Y20"]], ["R90"], ["B10", "Y30", "R30", "G90"], {}, { drawToMatch: true }), { draw: true });
    expect(game.hands[0]).toHaveLength(4);
    expect(game.drawn).toBe("R30");
  });

  it("no bluffing: a wild draw four only from a hand holding nothing of the colour, and never challenged", () => {
    const holding = at([["WF0", "B10", "R20"], ["G20"]], ["B50"], stock, {}, { wildFour: "strict" });
    expect(hitotsuMoves(holding).some((move) => "play" in move && move.play === "WF0")).toBe(false);
    const clear = play(at([["WF0", "G10", "R20"], ["G20"], ["Y20"]], ["B50"], stock, {}, { wildFour: "strict" }), { play: "WF0", colour: "G" });
    expect(clear.challenge).toBeNull();
    expect(clear.hands[1]).toHaveLength(5);
    expect(clear.toPlay).toBe(2);
  });
});

/** One game played to its end, each seat by its computer or at random, jumping in where the table would. */
function playOut(size: number, count: number, seed: number, options: HitotsuOptions, random: readonly boolean[]) {
  const pick = seededRandom(seed * 7 + 3);
  let game = startHitotsu(size, new Array<string>(count).fill(""), seed, options, random.map((chance) => !chance))!;
  for (let step = 0; game.phase !== "over"; step += 1) {
    if (step > 20_000) throw new Error("a game that does not end");
    const jump = options.jumpIn && pick() < 0.5 ? hitotsuJumpIns(game) : [];
    const offered = jump.length > 0 ? jump : hitotsuMoves(game);
    expect(offered.length).toBeGreaterThan(0);
    const seat = game.toPlay!;
    const any = () => offered[Math.floor(pick() * offered.length)]!;
    const move = jump.length > 0 || random[seat] ? any() : hitotsuComputer(game);
    game = play(game, move);
    const computerJump = hitotsuComputerJump(game);
    if (computerJump !== null) game = play(game, computerJump);
  }
  return game;
}

describe("hitotsu: played out", () => {
  const houses: [string, HitotsuOptions][] = [
    ["published", HITOTSU_CLASSIC],
    ["party", HITOTSU_PARTY],
    ["same-card stacking, no bluffing, draw to match", { ...HITOTSU_CLASSIC, stacking: "same", wildFour: "strict", drawToMatch: true }],
  ];

  it.each(houses)("by the %s rules, computers alone finish every game at every table, and every seat wins some", (_name, options) => {
    // A game of one hand and a game to 200: to 500 is more of the same hands, and the party gate plays it out at random.
    for (const size of [1, 200]) {
      for (let count = 2; count <= 8; count += 1) {
        const won = new Set<number>();
        for (let game = 0; game < Math.max(30, count * 12); game += 1) {
          const end = playOut(size, count, 1000 * size + 100 * count + game, options, new Array<boolean>(count).fill(false));
          hitotsuWinners(end).forEach((seat) => won.add(seat));
        }
        expect(won.size, `${size} for ${count}: a seat never won`).toBe(count);
      }
    }
  });

  it("a computer beats players choosing at random", () => {
    let wins = 0;
    const games = 80;
    for (let game = 0; game < games; game += 1) {
      const seat = game % 4;
      const end = playOut(200, 4, 50_000 + game, HITOTSU_CLASSIC, Array.from({ length: 4 }, (_, at) => at !== seat));
      if (hitotsuWinners(end).includes(seat)) wins += 1;
    }
    expect(wins / games, `the computer won ${wins} of ${games}`).toBeGreaterThan(1.5 / 4);
  });

  it("is kept and read back exactly, house rules and jumps and all, and refuses a move the rules would not take", () => {
    const end = playOut(500, 5, 99, HITOTSU_PARTY, new Array<boolean>(5).fill(false));
    expect(decodeHitotsu(encodeHitotsu(end))).toEqual(end);
    expect(end.moves.some((move) => "jump" in move)).toBe(true);
    const start = startHitotsu(500, ["Ann", "Ben"], 5, HITOTSU_CLASSIC, [false, true])!;
    expect(decodeHitotsu(encodeHitotsu(start))).toEqual(start);
    expect(decodeHitotsu(encodeHitotsu({ ...start, moves: [{ play: "WF0", colour: "R" }] }))).toBeNull();
    expect(decodeHitotsu("{}")).toBeNull();
    expect(decodeHitotsu(null)).toBeNull();
    expect(readHitotsuMove({ play: "R50", colour: "P" })).toBeNull();
    expect(readHitotsuMove({ jump: "R50", seat: 2 })).toEqual({ jump: "R50", seat: 2 });
  });
});
