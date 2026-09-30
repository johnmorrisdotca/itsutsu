import { beforeAll, describe, expect, it } from "vitest";

import { bestLaying, judgeTiles, tradeChoice } from "./computerPlay";
import { afterComputerTurn, COMPUTER_STEPS_MOST, planComputerTurn } from "./computerTurn";
import { generateKumimoji } from "./generate";
import { lettersOf, squareAt } from "./grid";
import { partyTilesLeft, seatPlay, startParty } from "./party";
import type { PartyGame, PartySettings } from "./party.types";
import { encodeParty, holdsItsBag } from "./partyKept";
import { joinParty, leaveParty } from "./partySeats";
import { deal, type TilePlay } from "./play";
import { KUMIMOJI_HANDS } from "./tiles.constants";
import { loadTileWords, type TileWords } from "./tileWords";

let english: TileWords;
let japanese: TileWords;
beforeAll(async () => {
  english = await loadTileWords("english");
  japanese = await loadTileWords("japanese");
});

const settingsFor = (language: "english" | "japanese", seed: number, size: number = KUMIMOJI_HANDS.quick, diagonals = false): PartySettings => ({
  size,
  level: "medium",
  seed,
  gameLength: "short",
  language,
  doubleSet: false,
  diagonals,
  hints: false,
});
const COMPUTER = { name: "", computer: true };

/** A game of computers only, on the seed's own bag. */
function computersOnly(language: "english" | "japanese", seed: number, players = 2, diagonals = false): PartyGame {
  const bag = generateKumimoji(KUMIMOJI_HANDS.quick, "medium", seed, { language, diagonals }).givens;
  return startParty(settingsFor(language, seed, KUMIMOJI_HANDS.quick, diagonals), bag, Array.from({ length: players }, () => COMPUTER));
}

/** Every tile a player holds, as a tally of the set's tiles (a wild being any wild). */
const holding = (game: PartyGame, at: number, words: TileWords) => lettersOf([...game.players[at]!.hand, ...game.players[at]!.tiles.values()].map((tile) => words.familyKey(tile)!));

/**
 * One whole game of computers, turn by turn, checking after every step of
 * every turn that the bag is whole, that the player who moved has a sound
 * table (or none), and that nobody else's table was touched.
 */
function playOut(game: PartyGame, words: TileWords, turnsMost = 400): { game: PartyGame; turns: number } {
  let now = game;
  let turns = 0;
  while (now.ending === null && turns < turnsMost) {
    const steps = planComputerTurn(now, words);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.length).toBeLessThanOrEqual(COMPUTER_STEPS_MOST + 3);
    for (const step of steps) {
      expect(holdsItsBag(step.game, words.familyKey)).toBe(true);
      const tiles = step.game.players[now.turn]!.tiles;
      // Judged by the game's own rules: with Diagonals, along its diagonals too.
      if (tiles.size > 0) expect(judgeTiles(tiles, words, { diagonals: now.settings.diagonals }).sound).toBe(true);
      now.players.forEach((player, at) => {
        if (at !== now.turn) expect(step.game.players[at]!.tiles).toEqual(player.tiles);
      });
    }
    const next = steps.at(-1)!.game;
    // Every turn ends: Done, a resignation, or the end of the game — never the same turn to play again.
    expect(next.turns > now.turns || next.ending !== null).toBe(true);
    now = next;
    turns += 1;
  }
  return { game: now, turns };
}

describe("what a computer lays", () => {
  const play = (hand: string, tiles: [number, number, string][] = []): TilePlay => ({
    ...deal("", 0),
    hand: [...hand],
    tiles: new Map(tiles.map(([row, col, letter]) => [squareAt(row, col), letter])),
  });

  it("starts an empty table with the longest word its hand spells, across", () => {
    const laid = bestLaying(play("tacqz"), english)!;
    expect(laid).not.toBeNull();
    expect(laid.word).toHaveLength(3);
    expect([...laid.play.tiles.keys()]).toEqual(["0,0", "0,1", "0,2"]);
    expect(english.allowed.has(laid.word)).toBe(true);
    expect(laid.play.hand.slice().sort()).toEqual(["q", "z"]);
  });

  it("crosses what is down with its own tiles only, and leaves the grid sound", () => {
    const before = play("oge", [
      [0, 0, "c"],
      [0, 1, "a"],
      [0, 2, "t"],
    ]);
    const laid = bestLaying(before, english)!;
    expect(laid).not.toBeNull();
    expect(judgeTiles(laid.play.tiles, english).sound).toBe(true);
    // What went down came out of its hand, and what was down is still there.
    const added = [...laid.play.tiles].filter(([square]) => !before.tiles.has(square)).map(([, letter]) => letter);
    expect(added.length + laid.play.hand.length).toBe(3);
    for (const [square, letter] of before.tiles) expect(laid.play.tiles.get(square)).toBe(letter);
  });

  it("plays a wild as the letter a word needs, its own letters first", () => {
    const laid = bestLaying(play("ca*"), english)!;
    expect(laid).not.toBeNull();
    const wild = [...laid.play.tiles.values()].find((tile) => english.isWild(tile));
    expect(wild).toMatch(/^[A-Z]$/);
    expect(english.familyKey(wild!)).toBe("*");
    // Four tiles make a longer word than three, so the wild goes down too — but as the one letter the hand lacks.
    const longer = bestLaying(play("cat*"), english)!;
    const down = [...longer.play.tiles.values()];
    expect(down).toHaveLength(4);
    expect(down.filter((tile) => english.isWild(tile))).toHaveLength(1);
    expect(down.filter((tile) => !english.isWild(tile)).sort()).toEqual(["a", "c", "t"]);
  });

  it("lays nothing it cannot, and nothing on a table that is not sound", () => {
    expect(bestLaying(play("qqx"), english)).toBeNull();
    expect(bestLaying(play("at", [[0, 0, "q"], [0, 1, "q"]]), english)).toBeNull();
  });

  it("trades its rarest letter, and never a wild", () => {
    expect(tradeChoice([..."eqs"], english)).toBe(1);
    expect(tradeChoice([..."*e"], english)).toBe(1);
    expect(tradeChoice(["*"], english)).toBeNull();
  });

  it("spells Japanese in the kana tiles", () => {
    const bag = generateKumimoji(KUMIMOJI_HANDS.quick, "hard", 5, { language: "japanese" }).givens;
    const laid = bestLaying(deal(bag, KUMIMOJI_HANDS.quick), japanese);
    expect(laid).not.toBeNull();
    expect(judgeTiles(laid!.play.tiles, japanese).sound).toBe(true);
    expect(japanese.allowed.has(japanese.wordOf(laid!.word)!)).toBe(true);
  });
});

describe("a computer's turn", () => {
  it("is the same turn every time it is planned, so a reload replays it exactly", () => {
    const game = computersOnly("english", 3);
    expect(planComputerTurn(game, english).map((step) => encodeParty(step.game))).toEqual(planComputerTurn(game, english).map((step) => encodeParty(step.game)));
  });

  it("lays its own tiles on its own table, ends with Done, and passes to the next seat", () => {
    const bag = generateKumimoji(KUMIMOJI_HANDS.quick, "medium", 21).givens;
    const game = startParty(settingsFor("english", 21), bag, [COMPUTER, "Aiko"]);
    const steps = planComputerTurn(game, english);
    const after = steps.at(-1)!.game;
    expect(steps.some((step) => step.said.kind === "laid")).toBe(true);
    expect(steps.at(-1)!.said.kind).toBe("done");
    expect(after.players[0]!.tiles.size).toBeGreaterThan(0);
    expect(after.turn).toBe(1);
    expect(after.passedBy).toBe(0);
    // Aiko's own hand only grew, by the Draws the computer called.
    const draws = steps.filter((step) => step.said.kind === "drew").length;
    expect(after.players[1]!.hand).toEqual([...game.players[1]!.hand, ...after.players[1]!.hand.slice(KUMIMOJI_HANDS.quick)]);
    expect(after.players[1]!.hand).toHaveLength(KUMIMOJI_HANDS.quick + draws);
    expect(after.players[1]!.tiles.size).toBe(0);
  });

  it("plays nothing on a person's turn or a finished game", () => {
    const bag = generateKumimoji(KUMIMOJI_HANDS.quick, "medium", 21).givens;
    const game = startParty(settingsFor("english", 21), bag, ["Aiko", COMPUTER]);
    expect(planComputerTurn(game, english)).toEqual([]);
    expect(afterComputerTurn(game, english)).toBe(game);
    expect(planComputerTurn({ ...game, turn: 1, ending: "out" }, english)).toEqual([]);
  });

  it("trades a hand that lays nothing, and resigns only when the bag cannot give a trade", () => {
    const bag = generateKumimoji(KUMIMOJI_HANDS.quick, "medium", 21).givens;
    const base = startParty(settingsFor("english", 21), bag, [COMPUTER, "Aiko"]);
    const stuck = (hand: string, taken: number): PartyGame => ({ ...base, taken, players: base.players.map((player, at) => (at === 0 ? { ...player, hand: [...hand] } : player)) });
    const trading = planComputerTurn(stuck("qqx", base.taken), english);
    expect(trading[0]!.said.kind).toBe("traded");
    expect(trading.at(-1)!.said.kind).not.toBe("resigned");
    // One trade a turn, for a computer as for anybody.
    expect(trading.filter((step) => step.said.kind === "traded")).toHaveLength(1);
    const cornered = planComputerTurn(stuck("qqx", bag.length - 2), english);
    expect(cornered.map((step) => step.said.kind)).toEqual(["resigned"]);
    expect(cornered[0]!.game.resigned).toEqual([0]);
  });

  it("plays whole games against itself to the end, in English and Japanese, two to four at a table", () => {
    for (const [language, seed, players] of [
      ["english", 1, 2],
      ["english", 2, 3],
      ["english", 4, 4],
      ["japanese", 1, 2],
      ["japanese", 3, 3],
    ] as const) {
      const words = language === "english" ? english : japanese;
      const { game, turns } = playOut(computersOnly(language, seed, players), words);
      expect(game.ending, `${language} ${seed}`).not.toBeNull();
      expect(turns).toBeLessThan(60);
    }
  });

  it("goes out first, against itself, in about half of quick English games", () => {
    let outs = 0;
    const games = 12;
    for (let seed = 101; seed < 101 + games; seed += 1) if (playOut(computersOnly("english", seed), english).game.ending === "out") outs += 1;
    // Measured at 23 of 40 on seeds 1–40; the rest end tied with both stuck on a tile or three.
    expect(outs).toBeGreaterThanOrEqual(3);
  });

  it("keeps going after players join and leave", () => {
    let game = computersOnly("english", 7, 3);
    game = afterComputerTurn(game, english);
    game = joinParty(game, COMPUTER);
    game = leaveParty(game, 0);
    const { game: end } = playOut(game, english);
    expect(end.ending).not.toBeNull();
    expect(holding(end, 0, english).size).toBeGreaterThan(0);
    expect(partyTilesLeft(end)).toBeGreaterThanOrEqual(0);
  });

  it("never lays an unsound diagonal at a table set up with Diagonals, where the same hand without them would", () => {
    const DIAGONALS = { diagonals: true };
    // Tables a computer reached without Diagonals, at the moment before a word it laid left a diagonal of three that is not a word.
    const tempted: TilePlay[] = [];
    for (let seed = 1; seed <= 12 && tempted.length < 5; seed += 1) {
      let now = computersOnly("english", seed, 2);
      for (let turn = 0; turn < 40 && now.ending === null; turn += 1) {
        let before = now;
        for (const step of planComputerTurn(now, english)) {
          const seat = before.turn;
          const tiles = step.game.players[seat]!.tiles;
          if (step.said.kind === "laid" && judgeTiles(tiles, english).sound && !judgeTiles(tiles, english, DIAGONALS).sound) tempted.push(seatPlay(before));
          before = step.game;
        }
        now = before;
      }
    }
    expect(tempted.length, "a computer without Diagonals left a diagonal that is not a word").toBeGreaterThan(0);
    for (const play of tempted) {
      const laid = bestLaying(play, english, DIAGONALS);
      if (laid !== null) expect(judgeTiles(laid.play.tiles, english, DIAGONALS).sound).toBe(true);
    }
    // And whole games of computers at Diagonals tables, every step judged along the diagonals (`playOut`).
    for (const [language, seed] of [
      ["english", 5],
      ["japanese", 2],
    ] as const) {
      const { game } = playOut(computersOnly(language, seed, 2, true), language === "english" ? english : japanese);
      expect(game.settings.diagonals).toBe(true);
      expect(game.ending, `${language} ${seed}`).not.toBeNull();
    }
  });
});
