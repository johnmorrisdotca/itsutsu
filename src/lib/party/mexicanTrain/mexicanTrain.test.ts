import { describe, expect, it } from "vitest";

import { endsOf, everyTile, isDouble, laidEnds, pipsOf, tileOf } from "./dominoes";
import { TRAIN_DEFAULT_OPTIONS, handSizeFor, roundsFor } from "./mexicanTrain.constants";
import { TRAIN_PHASES, legalPlays, mexicanOf, movesOf, openEnd, playTrain, replayTrain, startTrain, trainMoves, trainTotals } from "./mexicanTrain";
import type { TrainGame, TrainMove, TrainOptions } from "./mexicanTrain.types";
import { decodeTrain, encodeTrain } from "./trainCodec";
import { MEXICAN_TRAIN_RULES } from "./trainRules";

/**
 * Mexican Train's rules (`mexicanTrain`), one rule a case: the deal, where a
 * tile may go, the draw and the marker, the double that must be covered, the
 * chained-doubles house rule, the Mexican Train that opens only after your
 * own, the end of a round and the scores. Positions are made by setting a
 * dealt game's hands and trains directly, since a shuffle would never deal the
 * case asked about; every move is still made through `playTrain`.
 */

const TWO = ["Ann", "Ben"];

function dealt(options: TrainOptions = TRAIN_DEFAULT_OPTIONS, players = TWO): TrainGame {
  return startTrain(12, players, 7, options)!;
}

/** A dealt game with these hands, the boneyard given, and the first player to move. */
function position(game: TrainGame, hands: number[][], boneyard: number[] = []): TrainGame {
  return { ...game, hands, boneyard, toPlay: 0, drew: false, passes: 0, uncovered: [], chaining: false };
}

const play = (tile: number, train: number): TrainMove => ({ kind: "play", tile, train });

describe("the set and the deal", () => {
  it("has every tile once: 55, 91 and 136 of them", () => {
    expect(everyTile(9)).toHaveLength(55);
    expect(everyTile(12)).toHaveLength(91);
    expect(everyTile(15)).toHaveLength(136);
    expect(new Set(everyTile(15)).size).toBe(136);
  });

  it("reads a tile both ways round", () => {
    expect(tileOf(6, 3)).toBe(tileOf(3, 6));
    expect(endsOf(tileOf(12, 5))).toEqual([5, 12]);
    expect(isDouble(tileOf(4, 4))).toBe(true);
    expect(pipsOf(tileOf(15, 14))).toBe(29);
  });

  it("puts the set's highest double in the hub, and deals the rest: fifteen each to four on double-twelve", () => {
    const game = startTrain(12, ["A", "B", "C", "D"], 3)!;
    expect(game.engine).toBe(12);
    expect(game.hands.every((hand) => hand.length === handSizeFor(12, 4))).toBe(true);
    const all = [...game.hands.flat(), ...game.boneyard];
    expect(all).toHaveLength(90);
    expect(all).not.toContain(tileOf(12, 12));
    expect(new Set(all).size).toBe(90);
    expect(game.trains).toHaveLength(5);
    expect(game.trains[mexicanOf(game)].open).toBe(true);
    expect(game.trains.slice(0, 4).every((train) => !train.open)).toBe(true);
  });

  it("deals the same from the same seed, and differently from another", () => {
    expect(startTrain(12, TWO, 5)!.hands).toEqual(startTrain(12, TWO, 5)!.hands);
    expect(startTrain(12, TWO, 5)!.hands).not.toEqual(startTrain(12, TWO, 6)!.hands);
  });

  it("plays one round per double, or half as many in a short game", () => {
    expect(roundsFor(12, "full")).toBe(13);
    expect(roundsFor(12, "short")).toBe(7);
    expect(roundsFor(9, "full")).toBe(10);
    expect(startTrain(15, TWO, 1, { ...TRAIN_DEFAULT_OPTIONS, length: "short" })!.rounds).toBe(8);
  });

  it("refuses a table it does not offer", () => {
    expect(startTrain(12, ["Solo"])).toBeNull();
    expect(startTrain(12, new Array(9).fill(""))).toBeNull();
    expect(startTrain(10, TWO)).toBeNull();
  });
});

describe("laying a tile", () => {
  it("starts a train with a tile matching the hub's double, and goes on from its open end", () => {
    const game = position(dealt(), [[tileOf(12, 3), tileOf(3, 9), tileOf(1, 1)], [tileOf(0, 0)]]);
    expect(legalPlays(game)).toEqual(expect.arrayContaining([{ tile: tileOf(12, 3), train: 0 }, { tile: tileOf(12, 3), train: 2 }]));
    // Ben's own train is not open to Ann.
    expect(legalPlays(game).some((one) => one.train === 1)).toBe(false);
    const after = playTrain(game, play(tileOf(12, 3), 0))!;
    expect(laidEnds(after.trains[0].laid[0])).toEqual([12, 3]);
    expect(openEnd(after, 0)).toBe(3);
    expect(after.toPlay).toBe(1);
    expect(game.trains[0].laid).toEqual([]);
  });

  it("refuses a tile that does not match, or a train that is not open to the player", () => {
    const game = position(dealt(), [[tileOf(5, 3)], [tileOf(0, 0)]]);
    expect(playTrain(game, play(tileOf(5, 3), 0))).toBeNull();
    expect(playTrain(game, play(tileOf(0, 0), 2))).toBeNull();
  });
});

describe("drawing and the marker", () => {
  it("draws only with nothing to lay; lays the tile drawn, or passes with the marker out", () => {
    const game = position(dealt(), [[tileOf(1, 2)], [tileOf(12, 4), tileOf(0, 0)]], [tileOf(3, 4), tileOf(12, 7)]);
    expect(trainMoves(game)).toEqual([{ kind: "draw" }]);
    const drew = playTrain(game, { kind: "draw" })!;
    expect(drew.hands[0]).toContain(tileOf(3, 4));
    expect(trainMoves(drew)).toEqual([{ kind: "pass" }]);
    const passed = playTrain(drew, { kind: "pass" })!;
    expect(passed.trains[0].open).toBe(true);
    expect(passed.toPlay).toBe(1);
    // Ben may now lay on Ann's train, which is open to him.
    expect(legalPlays(passed)).toContainEqual({ tile: tileOf(12, 4), train: 0 });
  });

  it("takes the marker in when its owner lays on their own train", () => {
    const base = position(dealt(), [[tileOf(12, 5), tileOf(0, 0)], [tileOf(0, 1)]]);
    const game = { ...base, trains: base.trains.map((train, at) => (at === 0 ? { ...train, open: true } : train)) };
    expect(playTrain(game, play(tileOf(12, 5), 0))!.trains[0].open).toBe(false);
  });

  it("passes at once with nothing to draw", () => {
    const game = position(dealt(), [[tileOf(1, 2)], [tileOf(3, 4)]]);
    expect(trainMoves(game)).toEqual([{ kind: "pass" }]);
  });
});

describe("doubles", () => {
  it("must be covered, by the one who laid it, before anything else", () => {
    const base = position(dealt(), [[tileOf(12, 6), tileOf(6, 6), tileOf(6, 2), tileOf(12, 1)], [tileOf(0, 0)]]);
    const started = { ...base, trains: base.trains.map((train, at) => (at === 0 ? { laid: [12 * 16 + 6], open: false } : train)) };
    const game = { ...started, hands: [[tileOf(6, 6), tileOf(6, 2), tileOf(12, 1)], [tileOf(0, 0)]] };
    const doubled = playTrain(game, play(tileOf(6, 6), 0))!;
    expect(doubled.toPlay).toBe(0);
    expect(doubled.uncovered).toEqual([0]);
    // Only the cover: the 12–1 may not start the Mexican Train while the double is open.
    expect(trainMoves(doubled)).toEqual([play(tileOf(6, 2), 0)]);
    const covered = playTrain(doubled, play(tileOf(6, 2), 0))!;
    expect(covered.uncovered).toEqual([]);
    expect(covered.toPlay).toBe(1);
  });

  it("left uncovered, binds the next player to cover it, on a train not otherwise open to them", () => {
    const base = position(dealt(), [[tileOf(6, 6), tileOf(1, 1)], [tileOf(6, 9), tileOf(12, 0)]]);
    const game = { ...base, trains: base.trains.map((train, at) => (at === 0 ? { laid: [12 * 16 + 6], open: false } : train)) };
    const doubled = playTrain(game, play(tileOf(6, 6), 0))!;
    expect(trainMoves(doubled)).toEqual([{ kind: "pass" }]);
    const passed = playTrain(doubled, { kind: "pass" })!;
    expect(passed.toPlay).toBe(1);
    expect(trainMoves(passed)).toEqual([play(tileOf(6, 9), 0)]);
  });

  it("chained: another double may follow before covering, and the last laid is covered first", () => {
    const options: TrainOptions = { ...TRAIN_DEFAULT_OPTIONS, doubles: "chain" };
    const base = position(dealt(options), [[tileOf(12, 12 - 12), tileOf(0, 0), tileOf(12, 3), tileOf(3, 3), tileOf(3, 8), tileOf(0, 5), tileOf(9, 9)], [tileOf(1, 1)]]);
    const game = { ...base, trains: base.trains.map((train, at) => (at === 0 ? { laid: [12 * 16 + 0], open: false } : at === 2 ? { laid: [12 * 16 + 3], open: true } : train)) };
    const first = playTrain({ ...game, hands: [[tileOf(0, 0), tileOf(3, 3), tileOf(3, 8), tileOf(0, 5), tileOf(9, 9)], [tileOf(1, 1)]] }, play(tileOf(0, 0), 0))!;
    expect(first.chaining).toBe(true);
    expect(trainMoves(first)).toContainEqual(play(tileOf(3, 3), 2));
    const second = playTrain(first, play(tileOf(3, 3), 2))!;
    expect(second.uncovered).toEqual([0, 2]);
    // The last laid first: the 3–3 on the Mexican Train, then the 0–0.
    expect(trainMoves(second)).toEqual([play(tileOf(3, 8), 2)]);
    const one = playTrain(second, play(tileOf(3, 8), 2))!;
    expect(one.toPlay).toBe(0);
    expect(trainMoves(one)).toEqual([play(tileOf(0, 5), 0)]);
    const done = playTrain(one, play(tileOf(0, 5), 0))!;
    expect(done.uncovered).toEqual([]);
    expect(done.toPlay).toBe(1);
  });

  it("one at a time by default: no second double before the first is covered", () => {
    const base = position(dealt(), [[tileOf(0, 0), tileOf(3, 3), tileOf(0, 7)], [tileOf(1, 1)]]);
    const game = { ...base, trains: base.trains.map((train, at) => (at === 0 ? { laid: [12 * 16 + 0], open: false } : at === 2 ? { laid: [12 * 16 + 3], open: true } : train)) };
    const first = playTrain(game, play(tileOf(0, 0), 0))!;
    expect(trainMoves(first)).toEqual([play(tileOf(0, 7), 0)]);
  });
});

describe("the Mexican Train", () => {
  it("is open to everybody from the start, by default", () => {
    const game = position(dealt(), [[tileOf(12, 2)], [tileOf(0, 0)]]);
    expect(legalPlays(game)).toContainEqual({ tile: tileOf(12, 2), train: 2 });
  });

  it("under the house rule, only once your own train has been started", () => {
    const options: TrainOptions = { ...TRAIN_DEFAULT_OPTIONS, mexican: "ownFirst" };
    const game = position(dealt(options), [[tileOf(12, 2), tileOf(12, 4)], [tileOf(0, 0)]]);
    expect(legalPlays(game).some((one) => one.train === 2)).toBe(false);
    const started = { ...game, trains: game.trains.map((train, at) => (at === 0 ? { laid: [12 * 16 + 9], open: false } : train)) };
    expect(legalPlays(started)).toContainEqual({ tile: tileOf(12, 2), train: 2 });
  });
});

describe("the end of a round, and of the game", () => {
  it("ends the round when a hand is empty, scoring the pips left, and deals the next on Next", () => {
    const game = position(dealt(), [[tileOf(12, 1)], [tileOf(5, 6), tileOf(0, 2)]]);
    const out = playTrain(game, play(tileOf(12, 1), 0))!;
    expect(out.phase).toBe(TRAIN_PHASES.roundOver);
    expect(out.results[0]).toEqual({ engine: 12, pips: [0, 13], ending: "domino", out: 0 });
    expect(trainMoves(out)).toEqual([{ kind: "next" }]);
    const next = playTrain(out, { kind: "next" })!;
    expect(next.engine).toBe(11);
    expect(next.round).toBe(1);
    expect(next.toPlay).toBe(1);
    expect(next.trains.every((train) => train.laid.length === 0)).toBe(true);
  });

  it("ends a blocked round once everybody has passed with nothing to draw", () => {
    const game = position(dealt(), [[tileOf(1, 2)], [tileOf(3, 4)]]);
    const one = playTrain(game, { kind: "pass" })!;
    expect(one.phase).toBe(TRAIN_PHASES.playing);
    const both = playTrain(one, { kind: "pass" })!;
    expect(both.phase).toBe(TRAIN_PHASES.roundOver);
    expect(both.results[0]).toMatchObject({ ending: "blocked", out: null, pips: [3, 7] });
  });

  it("names the lowest total the winner after the last round, and shares a tie", () => {
    const game = { ...position(dealt(), [[tileOf(12, 1)], [tileOf(0, 1)]]), rounds: 1 };
    const over = playTrain(game, play(tileOf(12, 1), 0))!;
    expect(over.phase).toBe(TRAIN_PHASES.finished);
    expect(over.winners).toEqual([0]);
    expect(trainTotals(over)).toEqual([0, 1]);
    expect(trainMoves(over)).toEqual([]);
    const tied = { ...position(dealt(), [[tileOf(12, 1)], []]), rounds: 1, results: [{ engine: 13, pips: [0, 0], ending: "domino" as const, out: 0 }] };
    expect(trainTotals(tied)).toEqual([0, 0]);
  });
});

describe("keeping a game", () => {
  it("reads a kept game back exactly, and refuses one it cannot play out", () => {
    let game = startTrain(9, ["Ann", "Ben", "Cy"], 11, { length: "short", doubles: "chain", mexican: "ownFirst" }, [false, true, false])!;
    for (let step = 0; step < 40; step += 1) game = playTrain(game, trainMoves(game)[0])!;
    const text = encodeTrain(game);
    expect(decodeTrain(text)).toEqual(game);
    expect(decodeTrain(null)).toBeNull();
    expect(decodeTrain("not a game")).toBeNull();
    expect(decodeTrain(text.replace(/"moves":"/, '"moves":"x,x,x,'))).toBeNull();
    expect(replayTrain(9, ["Ann", "Ben", "Cy"], 11, game.options, game.computers, movesOf(game))).toEqual(game);
  });

  it("answers the party contract at the default table", () => {
    const game = MEXICAN_TRAIN_RULES.start(12, ["", "", "", ""], undefined, 42)!;
    expect(game.seed).toBe(42);
    expect(MEXICAN_TRAIN_RULES.moves(game).length).toBeGreaterThan(0);
    expect(MEXICAN_TRAIN_RULES.over(game)).toBe(false);
  });
});
