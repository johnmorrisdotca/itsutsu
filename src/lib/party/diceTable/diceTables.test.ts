import { describe, expect, it } from "vitest";

import { PARTY_SPECS } from "../party.constants";
import { LIARS_DEFAULT_SIZE, LIARS_RULES, LIARS_SIZES, beatsBid, diceShowing } from "../liarsDice/liarsDice";
import { chanceOfAtLeast, liarsComputer } from "../liarsDice/liarsComputer";
import type { LiarsGame } from "../liarsDice/liarsDice.types";
import { PIG_DEFAULT_SIZE, PIG_RULES, PIG_SIZES } from "../pig/pig";
import type { PigGame } from "../pig/pig.types";
import { SAYU_DEFAULT_SIZE, SAYU_RULES, SAYU_SIZES, sayuFace } from "../sayu/sayu";
import { TEN_THOUSAND_DEFAULT_SIZE, TEN_THOUSAND_RULES, TEN_THOUSAND_SIZES } from "../tenThousand/tenThousand";
import { scoringMasks, tenThousandScore } from "../tenThousand/tenThousandScore";
import { throwDice } from "./diceTable";

/** A seed whose next throw falls this way for a game's `thrown`: the rules draw from the seed, so a test finds the seed that makes the case. */
function seedThrowing(thrown: number, count: number, wanted: (dice: number[]) => boolean): number {
  for (let seed = 1; seed < 100_000; seed += 1) if (wanted(throwDice(seed, thrown, count))) return seed;
  throw new Error("no such seed");
}

describe("the dice a game throws", () => {
  it("are decided by the seed and how many throws came before, the same every time", () => {
    expect(throwDice(7, 3, 5)).toEqual(throwDice(7, 3, 5));
    expect(throwDice(7, 3, 5)).not.toEqual(throwDice(7, 4, 5));
    expect(throwDice(8, 3, 5)).not.toEqual(throwDice(7, 3, 5));
  });

  it("fall evenly on all six faces", () => {
    const seen = new Array<number>(7).fill(0);
    for (let thrown = 0; thrown < 6000; thrown += 1) for (const die of throwDice(99, thrown, 1)) seen[die] = seen[die]! + 1;
    for (let face = 1; face <= 6; face += 1) expect(seen[face]).toBeGreaterThan(850);
  });
});

describe("each spec is its rules' own", () => {
  it("offers the sizes the rules play", () => {
    expect(PARTY_SPECS.pig.sizes).toEqual(PIG_SIZES);
    expect(PARTY_SPECS.pig.defaultSize).toBe(PIG_DEFAULT_SIZE);
    expect(PARTY_SPECS.tenThousand.sizes).toEqual(TEN_THOUSAND_SIZES);
    expect(PARTY_SPECS.tenThousand.defaultSize).toBe(TEN_THOUSAND_DEFAULT_SIZE);
    expect(PARTY_SPECS.liarsDice.sizes).toEqual(LIARS_SIZES);
    expect(PARTY_SPECS.liarsDice.defaultSize).toBe(LIARS_DEFAULT_SIZE);
    expect(PARTY_SPECS.sayu.sizes).toEqual(SAYU_SIZES);
    expect(PARTY_SPECS.sayu.defaultSize).toBe(SAYU_DEFAULT_SIZE);
  });
});

describe("pig", () => {
  const started = (seed: number) => PIG_RULES.start(50, ["A", "B"], undefined, seed, [false, false])!;

  it("adds a throw to the turn, and a 1 loses the turn and passes the die", () => {
    const seed = seedThrowing(0, 1, ([die]) => die === 5);
    const once = PIG_RULES.play(started(seed), { kind: "roll" })!;
    expect(once.turnPoints).toBe(5);
    expect(once.toPlay).toBe(0);
    const bust = seedThrowing(0, 1, ([die]) => die === 1);
    const lost = PIG_RULES.play(started(bust), { kind: "roll" })!;
    expect(lost.turnPoints).toBe(0);
    expect(lost.toPlay).toBe(1);
    expect(lost.banked).toEqual([0, 0]);
  });

  it("will not bank nothing, and banking keeps the turn for good", () => {
    expect(PIG_RULES.play(started(1), { kind: "bank" })).toBeNull();
    const seed = seedThrowing(0, 1, ([die]) => die === 6);
    const banked = PIG_RULES.play(PIG_RULES.play(started(seed), { kind: "roll" })!, { kind: "bank" })!;
    expect(banked.banked).toEqual([6, 0]);
    expect(banked.toPlay).toBe(1);
  });

  it("is won the moment a bank reaches the score", () => {
    const close: PigGame = { ...started(1), banked: [48, 0], turnPoints: 3 };
    const won = PIG_RULES.play(close, { kind: "bank" })!;
    expect(won.phase).toBe("over");
    expect(won.winners).toEqual([0]);
    expect(PIG_RULES.play(won, { kind: "roll" })).toBeNull();
  });

  it("has a computer that banks at twenty, and at once when banking wins", () => {
    expect(PIG_RULES.computer({ ...started(1), turnPoints: 12 })).toEqual({ kind: "roll" });
    expect(PIG_RULES.computer({ ...started(1), turnPoints: 20 })).toEqual({ kind: "bank" });
    expect(PIG_RULES.computer({ ...started(1), banked: [47, 0], turnPoints: 3 })).toEqual({ kind: "bank" });
    expect(PIG_RULES.computer({ ...started(1), banked: [0, 45], turnPoints: 22 })).toEqual({ kind: "roll" });
  });
});

describe("tenThousand's scores", () => {
  it.each([
    [[1], 100],
    [[5], 50],
    [[1, 1], 200],
    [[1, 5], 150],
    [[1, 1, 1], 1000],
    [[2, 2, 2], 200],
    [[6, 6, 6], 600],
    [[5, 5, 5], 500],
    [[3, 3, 3, 3], 1000],
    [[3, 3, 3, 3, 3], 2000],
    [[3, 3, 3, 3, 3, 3], 3000],
    [[1, 2, 3, 4, 5, 6], 1500],
    [[2, 2, 3, 3, 4, 4], 1500],
    [[2, 2, 2, 4, 4, 4], 2500],
    [[2, 2, 2, 1], 300],
  ])("%j scores %i", (dice, score) => {
    expect(tenThousandScore(dice)).toBe(score);
  });

  it("refuses dice that do not all score", () => {
    for (const dice of [[], [2], [3, 4], [1, 2], [2, 2], [2, 2, 2, 3]]) expect(tenThousandScore(dice)).toBeNull();
  });

  it("offers nothing to set aside on a throw that scores nothing", () => {
    expect(scoringMasks([2, 3, 4, 6, 2, 3])).toEqual([]);
    expect(scoringMasks([1, 2, 3, 4, 6, 6])).toEqual([1]);
  });
});

describe("tenThousand's turns", () => {
  const started = (seed: number) => TEN_THOUSAND_RULES.start(2000, ["A", "B"], undefined, seed, [false, false])!;

  it("loses the turn on a throw that scores nothing, and passes on", () => {
    const seed = seedThrowing(0, 6, (dice) => scoringMasks(dice).length === 0);
    const bust = TEN_THOUSAND_RULES.play(started(seed), { kind: "roll" })!;
    expect(bust.toPlay).toBe(1);
    expect(bust.stage).toBe("roll");
    expect(bust.last).toMatchObject({ kind: "bust" });
  });

  it("makes a throw set something aside before it may bank, and sets aside only what scores", () => {
    const seed = seedThrowing(0, 6, (dice) => dice[0] === 1 && dice[1] !== 1 && dice[1] !== 5);
    const thrown = TEN_THOUSAND_RULES.play(started(seed), { kind: "roll" })!;
    expect(thrown.stage).toBe("keep");
    expect(TEN_THOUSAND_RULES.play(thrown, { kind: "bank" })).toBeNull();
    expect(TEN_THOUSAND_RULES.play(thrown, { kind: "roll" })).toBeNull();
    expect(TEN_THOUSAND_RULES.play(thrown, { kind: "keep", mask: 2 })).toBeNull();
    const kept = TEN_THOUSAND_RULES.play(thrown, { kind: "keep", mask: 1 })!;
    expect(kept.turnPoints).toBe(100);
    expect(kept.dice).toHaveLength(5);
    expect(kept.aside).toEqual([1]);
    const banked = TEN_THOUSAND_RULES.play(kept, { kind: "bank" })!;
    expect(banked.banked).toEqual([100, 0]);
    expect(banked.toPlay).toBe(1);
  });

  it("gives hot dice: all six set aside, all six thrown again, the turn's points kept", () => {
    const seed = seedThrowing(0, 6, (dice) => tenThousandScore(dice) !== null);
    const thrown = TEN_THOUSAND_RULES.play(started(seed), { kind: "roll" })!;
    const hot = TEN_THOUSAND_RULES.play(thrown, { kind: "keep", mask: 63 })!;
    expect(hot.dice).toEqual([]);
    expect(hot.last).toMatchObject({ kind: "kept", hot: true });
    const score = hot.turnPoints;
    // Whichever seed makes the second throw score, so the turn's points are seen to carry on.
    const carried = seedThrowing(1, 6, (dice) => scoringMasks(dice).length > 0);
    const again = TEN_THOUSAND_RULES.play({ ...hot, seed: carried }, { kind: "roll" })!;
    expect(again.thrown).toBe(2);
    expect(again.stage).toBe("keep");
    expect(again.dice).toHaveLength(6);
    expect(again.aside).toEqual([]);
    expect(again.turnPoints).toBe(score);
  });

  it("gives everybody else one more turn once somebody reaches the score", () => {
    const game = { ...started(1), stage: "more" as const, turnPoints: 2000, dice: [2, 3], aside: [1, 1, 1, 5] };
    const reached = TEN_THOUSAND_RULES.play(game, { kind: "bank" })!;
    expect(reached.phase).toBe("playing");
    expect(reached.lastRoundFrom).toBe(0);
    expect(reached.toPlay).toBe(1);
    const passed = TEN_THOUSAND_RULES.play({ ...reached, stage: "more", turnPoints: 2500, dice: [2] }, { kind: "bank" })!;
    expect(passed.phase).toBe("over");
    expect(passed.winners).toEqual([1]);
  });

  it("has a computer that presses on in the last round until it has passed the leader", () => {
    const behind = { ...started(1), stage: "more" as const, toPlay: 1, banked: [2500, 100], lastRoundFrom: 0, turnPoints: 1000, dice: [2] };
    expect(TEN_THOUSAND_RULES.computer(behind)).toEqual({ kind: "roll" });
    expect(TEN_THOUSAND_RULES.computer({ ...behind, turnPoints: 2500 })).toEqual({ kind: "bank" });
  });
});

describe("liarsDice", () => {
  const started = (seed: number): LiarsGame => LIARS_RULES.start(5, ["A", "B", "C"], undefined, seed, [false, false, false])!;

  it("counts ones as any face", () => {
    expect(diceShowing([[1, 2, 3], [4, 4, 1]], 4)).toBe(4);
    expect(diceShowing([[1, 2, 3], [4, 4, 1]], 6)).toBe(2);
  });

  it("takes only a higher bid: more dice, or as many of a higher number", () => {
    const bid = { count: 3, face: 4, seat: 0 };
    expect(beatsBid(bid, 3, 5)).toBe(true);
    expect(beatsBid(bid, 4, 2)).toBe(true);
    expect(beatsBid(bid, 3, 4)).toBe(false);
    expect(beatsBid(bid, 2, 6)).toBe(false);
  });

  it("refuses a bid on ones, past the dice on the table, or a call with no bid", () => {
    expect(LIARS_RULES.play(started(1), { kind: "bid", count: 2, face: 1 })).toBeNull();
    expect(LIARS_RULES.play(started(1), { kind: "bid", count: 16, face: 2 })).toBeNull();
    expect(LIARS_RULES.play(started(1), { kind: "call" })).toBeNull();
  });

  it("takes a die from the bidder when the bid falls short, and from the caller when it stands, and the loser opens", () => {
    const game = LIARS_RULES.play(started(5), { kind: "bid", count: 15, face: 6 });
    const short = LIARS_RULES.play(game!, { kind: "call" })!;
    expect(short.called).toMatchObject({ caller: 1, bidder: 0, loser: 0 });
    expect(short.cups.map((cup) => cup.length)).toEqual([4, 5, 5]);
    expect(short.toPlay).toBe(0);
    expect(short.round).toBe(1);
    const certain: LiarsGame = { ...started(5), cups: [[2, 2], [2, 3], [4, 4]] };
    const stands = LIARS_RULES.play(LIARS_RULES.play(certain, { kind: "bid", count: 3, face: 2 })!, { kind: "call" })!;
    expect(stands.called).toMatchObject({ caller: 1, bidder: 0, found: 3, loser: 1 });
    expect(stands.cups.map((cup) => cup.length)).toEqual([2, 1, 2]);
    expect(stands.toPlay).toBe(1);
  });

  it("lifts every cup at a call, and throws new dice for the next round", () => {
    const game = LIARS_RULES.play(started(5), { kind: "bid", count: 15, face: 6 })!;
    const after = LIARS_RULES.play(game, { kind: "call" })!;
    expect(after.called!.cups).toEqual(game.cups);
    expect(after.cups.flat()).not.toEqual(game.cups.flat().slice(1));
  });

  it("ends when one player has dice left", () => {
    const last: LiarsGame = { ...started(1), cups: [[2], [2], []], bid: { count: 2, face: 6, seat: 0 }, toPlay: 1 };
    const over = LIARS_RULES.play({ ...last, cups: [[3], [3], []] }, { kind: "call" })!;
    expect(over.phase).toBe("over");
    expect(over.winners).toEqual([1]);
    expect(LIARS_RULES.moves(over)).toEqual([]);
  });

  it("passes over a player who is out", () => {
    const game: LiarsGame = { ...started(1), cups: [[2], [], [3]], toPlay: 0 };
    expect(LIARS_RULES.play(game, { kind: "bid", count: 1, face: 2 })!.toPlay).toBe(2);
  });

  it("has a computer that reads only its own cup", () => {
    const game: LiarsGame = { ...started(3), toPlay: 1, bid: { count: 2, face: 3, seat: 0 } };
    const others = [game.cups[0]!.map(() => 6), game.cups[1]!, game.cups[2]!.map(() => 2)];
    expect(liarsComputer({ ...game, cups: others })).toEqual(liarsComputer(game));
  });

  it("calls a bid no dice could make likely, and works out chances properly", () => {
    expect(chanceOfAtLeast(0, 5)).toBe(1);
    expect(chanceOfAtLeast(6, 5)).toBe(0);
    expect(chanceOfAtLeast(1, 1)).toBeCloseTo(1 / 3);
    expect(chanceOfAtLeast(2, 2)).toBeCloseTo(1 / 9);
    const game: LiarsGame = { ...started(3), cups: [[2, 2], [3, 3]], players: ["A", "B"], computers: [false, false], toPlay: 1, bid: { count: 4, face: 6, seat: 0 } };
    expect(liarsComputer(game)).toEqual({ kind: "call" });
  });
});

describe("sayu", () => {
  const started = (seed: number) => SAYU_RULES.start(3, ["A", "B", "C"], undefined, seed, [false, false, false])!;

  it("reads a die as a direction", () => {
    expect([1, 2, 3, 4, 5, 6].map(sayuFace)).toEqual(["left", "right", "pot", "keep", "keep", "keep"]);
  });

  it("starts everybody level, and a throw moves counters and loses none", () => {
    const game = started(4);
    expect(game.counters).toEqual([3, 3, 3]);
    const after = SAYU_RULES.play(game, { kind: "roll" })!;
    expect(after.counters.reduce((sum, held) => sum + held, after.pot)).toBe(9);
    expect(after.dice).toHaveLength(3);
  });

  it("sends each die's counter where it says", () => {
    const seed = seedThrowing(0, 3, (dice) => dice[0] === 1 && dice[1] === 2 && dice[2] === 3);
    const after = SAYU_RULES.play(started(seed), { kind: "roll" })!;
    expect(after.counters).toEqual([0, 4, 4]);
    expect(after.pot).toBe(1);
  });

  it("throws as many dice as counters, three at most, and passes over a seat with none", () => {
    const game = { ...started(4), counters: [1, 0, 5], toPlay: 0 };
    const keeps = seedThrowing(0, 1, ([die]) => die === 5);
    const after = SAYU_RULES.play({ ...game, seed: keeps }, { kind: "roll" })!;
    expect(after.dice).toHaveLength(1);
    expect(after.toPlay).toBe(2);
  });

  it("ends when one player alone holds counters, and they win", () => {
    const seed = seedThrowing(0, 1, ([die]) => die === 3);
    const after = SAYU_RULES.play({ ...started(seed), counters: [1, 2, 0], toPlay: 0 }, { kind: "roll" })!;
    expect(after.phase).toBe("over");
    expect(after.winners).toEqual([1]);
    expect(SAYU_RULES.moves(after)).toEqual([]);
  });
});
