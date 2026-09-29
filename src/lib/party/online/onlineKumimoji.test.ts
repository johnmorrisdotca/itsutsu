import { beforeAll, describe, expect, it } from "vitest";

import { generateKumimoji } from "../../puzzles/kumimoji/generate";
import { seatPlay } from "../../puzzles/kumimoji/party";
import type { PartyGame, PartySettings } from "../../puzzles/kumimoji/party.types";
import { trade } from "../../puzzles/kumimoji/play";
import { KUMIMOJI_HANDS } from "../../puzzles/kumimoji/tiles.constants";
import { loadTileWords } from "../../puzzles/kumimoji/tileWords";
import { encodeGrid } from "../../puzzles/kumimoji/grid";

import { computerPlayOf } from "./onlineComputerMoves";
import { KUMIMOJI_ONLINE, seatOf, withSeat, type KumimojiMove } from "./onlineKumimoji";
import { standingOf } from "./onlineSeats";

/**
 * KUMIMOJI ON SEVERAL DEVICES: the server takes the browser's word for the
 * words (John, 2026-09-29), and checks everything else it can for nothing —
 * the bag a set-up dealt, and that every tile a turn leaves was in the seat's
 * hand, on its table, or drawn from the pool.
 */

const HAND = KUMIMOJI_HANDS.quick;
const rules = KUMIMOJI_ONLINE;

beforeAll(async () => {
  await loadTileWords("english");
});

function setUp(seed: number, players: number) {
  const settings: PartySettings = { size: HAND, level: "medium", seed, gameLength: "medium", language: "english", doubleSet: false, diagonals: false, hints: false };
  const bag = generateKumimoji(HAND, "medium", seed, { gameLength: "medium" }).givens;
  return { settings, bag, players };
}

function started(seed = 4242, players = 3, computers: number[] = []): PartyGame {
  const { settings, bag } = setUp(seed, players);
  const game = rules.start(HAND, players, { setup: { settings, bag }, computers });
  if (game === null) throw new Error("a real bag did not start");
  return game;
}

const done = (game: PartyGame, spells = true): KumimojiMove => ({ stages: [{ seat: seatOf(game), then: "done", sound: true, spells }] });

describe("a Kumimoji table's start", () => {
  it("deals from the bag the set-up's browser dealt, to as many as sit, computers named by the deal", () => {
    const game = started(4242, 3, [2]);
    expect(game.players).toHaveLength(3);
    expect(game.players[2]!.computer).toBe(true);
    expect(game.players[0]!.hand).toHaveLength(HAND);
    expect(rules.moveCount(game)).toBe(0);
    expect(rules.toPlay(game)).toBe(0);
  });

  it("refuses a bag that is not the game's: nothing sent, a tile of no set, the wrong length, or another hand size", () => {
    const { settings, bag } = setUp(4242, 3);
    expect(rules.start(HAND, 3)).toBeNull();
    expect(rules.start(HAND, 3, { setup: { settings, bag: `${bag.slice(1)}9` } })).toBeNull();
    expect(rules.start(HAND, 3, { setup: { settings, bag: bag.slice(1) } })).toBeNull();
    expect(rules.start(KUMIMOJI_HANDS.classic, 3, { setup: { settings, bag } })).toBeNull();
    expect(rules.start(HAND, 3, { setup: { settings: { ...settings, level: "extreme" }, bag } })).toBeNull();
  });
});

describe("the seat a turn leaves", () => {
  it("is taken as it is when nothing moved, and the turn passes on the browser's word", () => {
    const game = started();
    const next = rules.play(game, done(game))!;
    expect(next).not.toBeNull();
    expect(rules.toPlay(next)).toBe(1);
    expect(rules.moveCount(next)).toBe(1);
  });

  it("takes a trade: one tile given back and three taken from the pool", () => {
    const game = started();
    const traded = trade(seatPlay(game), 0);
    const seat = { hand: traded.hand.join(""), grid: encodeGrid(traded.tiles), returned: traded.returned, taken: traded.taken };
    expect(withSeat(game, seat)).not.toBeNull();
    const next = rules.play(game, { stages: [{ seat, then: "done", sound: true, spells: true }] })!;
    expect(rules.moveCount(next)).toBe(1 + 3);
  });

  it("refuses a tile the seat never had, a tile gone missing, and more taken than trades allow", () => {
    const game = started();
    const seat = seatOf(game);
    expect(withSeat(game, { ...seat, hand: `${seat.hand}e` })).toBeNull();
    expect(withSeat(game, { ...seat, hand: seat.hand.slice(1) })).toBeNull();
    // Four tiles taken off the pool for one given back.
    const line = game.bag + game.returned + seat.hand[0];
    const four = [...line.slice(game.taken, game.taken + 4)].join("");
    expect(withSeat(game, { ...seat, hand: seat.hand.slice(1) + four, returned: game.returned + seat.hand[0], taken: game.taken + 4 })).toBeNull();
    // The pool read backwards: its counter never goes back.
    expect(withSeat(game, { ...seat, taken: game.taken - 1 })).toBeNull();
  });

  it("refuses Done where the rules do: a hand that spells nothing, untraded", () => {
    const game = started();
    expect(rules.play(game, done(game, false))).toBeNull();
  });

  it("refuses a Draw with tiles still in hand, and any press but Draw before the last", () => {
    const game = started();
    expect(rules.play(game, { stages: [{ seat: seatOf(game), then: "draw", sound: true, spells: true }] })).toBeNull();
    expect(rules.play(game, { stages: [done(game).stages[0]!, done(game).stages[0]!] })).toBeNull();
  });

  it("reads a move's shape and nothing else", () => {
    expect(rules.readMove({ stages: [] })).toBeNull();
    expect(rules.readMove({ stages: [{ seat: { hand: "", grid: "", returned: "", taken: -1 }, then: "done", sound: true, spells: true }] })).toBeNull();
    expect(rules.readMove({ stages: [{ seat: { hand: "", grid: "", returned: "", taken: 0 }, then: "pass", sound: true, spells: true }] })).toBeNull();
    expect(rules.readMove(done(started()))).not.toBeNull();
  });
});

describe("a Kumimoji computer at a table", () => {
  it("plays its whole turn as presses the server's rules take, in the worker's code", async () => {
    let game = started(4242, 2, [0]);
    const computer = computerPlayOf("kumimoji")!;
    await computer.prepare?.(game);
    const move = computer.move(game, 0, "computer") as KumimojiMove | null;
    expect(move).not.toBeNull();
    const next = rules.play(game, move!);
    expect(next).not.toBeNull();
    game = next!;
    expect(rules.toPlay(game) === 1 || standingOf(rules, game).status === "finished").toBe(true);
    expect(rules.decode(rules.encode(game))).not.toBeNull();
  });
});
