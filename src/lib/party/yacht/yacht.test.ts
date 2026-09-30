import { describe, expect, it } from "vitest";

import { YACHT_BONUS, YACHT_BOXES, YACHT_SHEET } from "./yacht.constants";
import { YACHT_PHASES, playYacht, replayYacht, startYacht, yachtMoves } from "./yacht";
import { decodeYacht, encodeYacht } from "./yachtCodec";
import { YACHT_RULES } from "./yachtRules";
import { boxScore, sheetTotal, upperBonus } from "./yachtScore";
import type { YachtBox, YachtGame, YachtMove } from "./yacht.types";

const box = (key: YachtBox) => YACHT_BOXES.indexOf(key);
const roll = (hold = 0): YachtMove => ({ kind: "roll", hold });
const score = (key: YachtBox): YachtMove => ({ kind: "score", box: box(key) });

function played(game: YachtGame, ...moves: YachtMove[]): YachtGame {
  let at = game;
  for (const move of moves) {
    const next = playYacht(at, move);
    if (next === null) throw new Error(`refused ${JSON.stringify(move)}`);
    at = next;
  }
  return at;
}

describe("yacht: what a throw scores", () => {
  it("scores the upper half as the total of its number", () => {
    expect(boxScore("threes", [3, 3, 1, 3, 6])).toBe(9);
    expect(boxScore("sixes", [1, 2, 3, 4, 5])).toBe(0);
  });

  it("scores three and four of a kind as all five dice, and nothing short of them", () => {
    expect(boxScore("threeKind", [4, 4, 4, 2, 1])).toBe(15);
    expect(boxScore("fourKind", [4, 4, 4, 2, 1])).toBe(0);
    expect(boxScore("fourKind", [5, 5, 5, 5, 2])).toBe(22);
    expect(boxScore("threeKind", [6, 6, 6, 6, 6])).toBe(30);
  });

  it("scores a full house only for three of one and two of another", () => {
    expect(boxScore("fullHouse", [2, 2, 5, 5, 5])).toBe(25);
    expect(boxScore("fullHouse", [2, 2, 2, 2, 5])).toBe(0);
    expect(boxScore("fullHouse", [3, 3, 3, 3, 3])).toBe(0);
  });

  it("scores straights of four and five in a row, wherever they sit", () => {
    expect(boxScore("smallStraight", [1, 2, 3, 4, 6])).toBe(30);
    expect(boxScore("smallStraight", [6, 3, 5, 4, 3])).toBe(30);
    expect(boxScore("smallStraight", [1, 2, 3, 5, 6])).toBe(0);
    expect(boxScore("largeStraight", [2, 3, 4, 5, 6])).toBe(40);
    expect(boxScore("largeStraight", [1, 2, 3, 4, 6])).toBe(0);
  });

  it("scores a Yacht for five alike, and Chance for anything", () => {
    expect(boxScore("yacht", [4, 4, 4, 4, 4])).toBe(50);
    expect(boxScore("yacht", [4, 4, 4, 4, 1])).toBe(0);
    expect(boxScore("chance", [1, 2, 3, 4, 6])).toBe(16);
  });

  it("adds the upper bonus once the upper half reaches 63, and not a point before", () => {
    const sheet = [3, 6, 9, 12, 15, 17, null, null, null, null, null, null, null];
    expect(upperBonus(sheet)).toBe(0);
    expect(sheetTotal(sheet)).toBe(62);
    const made = [3, 6, 9, 12, 15, 18, 0, 0, 0, 0, 0, 0, 0];
    expect(upperBonus(made)).toBe(YACHT_BONUS);
    expect(sheetTotal(made)).toBe(63 + YACHT_BONUS);
  });
});

describe("yacht: a turn", () => {
  const fresh = () => startYacht(["Ann", "Ben"], 42)!;

  it("opens with nothing but the first roll, which holds nothing", () => {
    const game = fresh();
    expect(yachtMoves(game)).toEqual([roll()]);
    expect(playYacht(game, roll(3))).toBeNull();
    expect(playYacht(game, score("chance"))).toBeNull();
  });

  it("keeps held dice where they lie and throws the rest", () => {
    const first = played(fresh(), roll());
    expect(first.dice.every((die) => die >= 1 && die <= 6)).toBe(true);
    const second = played(first, roll(0b10101));
    expect(second.dice[0]).toBe(first.dice[0]);
    expect(second.dice[2]).toBe(first.dice[2]);
    expect(second.dice[4]).toBe(first.dice[4]);
    expect(second.held).toBe(0b10101);
  });

  it("allows three rolls and no more, and never a roll holding all five", () => {
    const first = played(fresh(), roll());
    expect(playYacht(first, roll(0b11111))).toBeNull();
    const third = played(first, roll(), roll());
    expect(third.rolls).toBe(3);
    expect(yachtMoves(third).every((move) => move.kind === "score")).toBe(true);
    expect(playYacht(third, roll())).toBeNull();
  });

  it("writes the dice into an empty box, passes the dice on, and refuses a box already filled", () => {
    const rolled = played(fresh(), roll());
    const expected = boxScore("chance", rolled.dice);
    const written = played(rolled, score("chance"));
    expect(written.sheets[0][box("chance")]).toBe(expected);
    expect(written.toPlay).toBe(1);
    expect(written.rolls).toBe(0);
    expect(written.last).toEqual({ seat: 0, move: score("chance"), score: expected });
    const again = played(written, roll(), score("chance"), roll());
    expect(playYacht(again, score("chance"))).toBeNull();
  });

  it("is over when every sheet is full, and the highest total wins", () => {
    let game = fresh();
    while (game.phase === YACHT_PHASES.playing) {
      game = played(game, roll());
      const open = game.sheets[game.toPlay].findIndex((one) => one === null);
      game = played(game, { kind: "score", box: open });
    }
    expect(game.sheets.every((sheet) => sheet.every((one) => one !== null))).toBe(true);
    expect(yachtMoves(game)).toEqual([]);
    const totals = game.sheets.map(sheetTotal);
    expect(game.winners).toEqual(totals.flatMap((total, seat) => (total === Math.max(...totals) ? [seat] : [])));
  });

  it("throws the same dice from the same seed, and different dice from another", () => {
    expect(played(fresh(), roll()).dice).toEqual(played(fresh(), roll()).dice);
    const others = Array.from({ length: 20 }, (_, seed) => played(startYacht(["A", "B"], seed + 1)!, roll()).dice.join(""));
    expect(new Set(others).size).toBeGreaterThan(10);
  });

  it("throws every face about as often as every other", () => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (let seed = 1; seed <= 2000; seed += 1) for (const die of played(startYacht(["A"], seed)!, roll()).dice) counts[die] += 1;
    for (let face = 1; face <= 6; face += 1) {
      expect(counts[face]).toBeGreaterThan(1500);
      expect(counts[face]).toBeLessThan(1850);
    }
  });
});

describe("yacht: the table", () => {
  it("seats one person alone, but the party rules ask for a table of two", () => {
    const alone = startYacht(["Ann"], 3)!;
    expect(alone.players).toEqual(["Ann"]);
    expect(YACHT_RULES.start(YACHT_SHEET, ["Ann"])).toBeNull();
    expect(YACHT_RULES.start(YACHT_SHEET, ["Ann", "Ben"])).not.toBeNull();
    expect(startYacht(new Array<string>(9).fill(""))).toBeNull();
    expect(startYacht(["A", "B"], 1, [false, false], 12)).toBeNull();
  });

  it("a game alone is kept and read back exactly, and plays out to the end", () => {
    let game = startYacht(["Ann"], 11, [false])!;
    for (let turn = 0; turn < YACHT_SHEET; turn += 1) game = played(game, roll(), roll(0b00011), { kind: "score", box: turn });
    expect(game.phase).toBe(YACHT_PHASES.finished);
    expect(game.winners).toEqual([0]);
    expect(decodeYacht(encodeYacht(game))).toEqual(game);
  });

  it("is kept as its table and moves, and refuses a kept game its moves cannot make", () => {
    const game = played(startYacht(["Ann", "Ben"], 5, [false, true])!, roll(), roll(1), score("chance"), roll());
    const text = encodeYacht(game);
    expect(JSON.parse(text).moves).toBe("r0,r1,s12,r0");
    expect(decodeYacht(text)).toEqual(game);
    expect(decodeYacht(text.replace("r0,r1,s12,r0", "r0,s12,s12"))).toBeNull();
    expect(decodeYacht(text.replace('"v":1', '"v":9'))).toBeNull();
    expect(replayYacht(["A", "B"], 5, [false, false], [score("chance")])).toBeNull();
  });
});
