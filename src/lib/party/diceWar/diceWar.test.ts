import { DICE_WAR_LIMITS, decodeDiceWar, diceWarOver, diceWarPeopleToRoll, diceWarWinners, encodeDiceWar, playDiceWar, seededSource } from "@johnmorrisdotca/korokoro";
import { describe, expect, it } from "vitest";

import { PARTY_SPECS } from "../party.constants";

import { DICE_WAR_DEFAULTS, DICE_WAR_DICE, DICE_WAR_LIMITS_HERE, DICE_WAR_POINT_GOALS, DICE_WAR_ROUND_GOALS, DICE_WAR_SIDES, diceWarSeatName } from "./diceWar.constants";
import { DICE_WAR_RULES } from "./diceWarRules";
import { lastThrow, throwDiceWar, waitsOnPerson } from "./diceWarThrow";
import { diceWarEnding, diceWarNext, diceWarRoundLine, diceWarSaid, namesInLine } from "./diceWarWords";
import { speaker } from "@/lib/i18n/i18n";

/** The English speaker: these tests read the English words. */
const EN = speaker("en");

/**
 * DICE WAR (diceWar), as the site seats it: the rules are Korokoro's, so what is
 * tested here is what the site decides — which tables it offers, how a throw is
 * made and kept, and what the table says — plus the rule that makes it the game:
 * a tie for the highest is war, and the stake grows.
 */
const name = (seat: number) => ["Ann", "Ben", "Cy", "Dee"][seat] ?? `P${seat}`;

describe("diceWar: the tables the site offers", () => {
  it("keeps the set-up's numbers inside what the package allows", () => {
    expect(DICE_WAR_LIMITS_HERE.fewestPlayers).toBe(DICE_WAR_LIMITS.fewestPlayers);
    expect(DICE_WAR_LIMITS_HERE.mostPlayers).toBe(DICE_WAR_LIMITS.mostPlayers);
    expect(DICE_WAR_LIMITS_HERE.mostDice).toBe(DICE_WAR_LIMITS.mostDice);
    expect(DICE_WAR_LIMITS_HERE.mostPoints).toBe(DICE_WAR_LIMITS.mostPoints);
    expect(DICE_WAR_LIMITS_HERE.mostRounds).toBe(DICE_WAR_LIMITS.mostRounds);
    for (const dice of DICE_WAR_DICE) expect(dice).toBeLessThanOrEqual(DICE_WAR_LIMITS.mostDice);
    for (const sides of DICE_WAR_SIDES) expect(sides).toBeLessThanOrEqual(DICE_WAR_LIMITS_HERE.mostSides);
    for (const to of DICE_WAR_POINT_GOALS) expect(to).toBeLessThanOrEqual(DICE_WAR_LIMITS.mostPoints);
    for (const to of DICE_WAR_ROUND_GOALS) expect(to).toBeLessThanOrEqual(DICE_WAR_LIMITS.mostRounds);
  });

  it("starts a table of two to eight, never one or nine, to any score it offers, and every table it offers is playable with every dice and sides it offers", () => {
    expect(DICE_WAR_RULES.start(10, [""], undefined, 1)).toBeNull();
    expect(DICE_WAR_RULES.start(10, new Array<string>(9).fill(""), undefined, 1)).toBeNull();
    for (const size of PARTY_SPECS.diceWar.sizes) expect(DICE_WAR_RULES.start(size, ["", ""], undefined, 1)).not.toBeNull();
    for (const dice of DICE_WAR_DICE) for (const sides of DICE_WAR_SIDES) expect(DICE_WAR_RULES.startWith({ players: ["", ""], dice, sides })).not.toBeNull();
    for (const to of DICE_WAR_ROUND_GOALS) expect(DICE_WAR_RULES.startWith({ players: ["", ""], goal: "rounds", to })).not.toBeNull();
  });

  it("opens on a person and a computer with one six-sided die each, first to 10", () => {
    expect(PARTY_SPECS.diceWar.defaultPlayers).toBe(2);
    expect(PARTY_SPECS.diceWar.defaultSize).toBe(10);
    // The package opens at five points; the site's own defaults are what the set-up passes.
    const game = DICE_WAR_RULES.startWith({ players: ["Ann", ""], computers: [false, true], dice: DICE_WAR_DEFAULTS.dice, sides: DICE_WAR_DEFAULTS.sides, goal: DICE_WAR_DEFAULTS.goal, to: DICE_WAR_DEFAULTS.to })!;
    expect([game.dice, game.sides, game.goal, game.to]).toEqual([1, 6, "points", 10]);
  });

  it("names a seat as typed, or Computer 2 / Player 1 when nothing was typed", () => {
    expect(diceWarSeatName(["Ann", "", " "], [false, true, false], 0, EN)).toBe("Ann");
    expect(diceWarSeatName(["Ann", "", " "], [false, true, false], 1, EN)).toBe("Computer 2");
    expect(diceWarSeatName(["Ann", "", " "], [false, true, false], 2, EN)).toBe("Player 3");
  });
});

describe("diceWar: a throw", () => {
  it("throws every person's dice from the source, the right number of dice of the right size, and kept with the game", () => {
    const game = DICE_WAR_RULES.startWith({ players: ["Ann", "Ben", ""], computers: [false, false, true], dice: 3, sides: 20, seed: "s" })!;
    const next = throwDiceWar(game, seededSource("table"))!;
    const made = lastThrow(next)!;
    expect(made.rolls.map((one) => one.seat)).toEqual([0, 1, 2]);
    for (const one of made.rolls) {
      expect(one.faces).toHaveLength(3);
      for (const face of one.faces) expect(face >= 1 && face <= 20).toBe(true);
      expect(one.total).toBe(one.faces.reduce((sum, face) => sum + face, 0));
    }
    // The same source throws the same dice; the game reads back as it was kept.
    expect(lastThrow(throwDiceWar(game, seededSource("table"))!)!.rolls).toEqual(made.rolls);
    expect(decodeDiceWar(encodeDiceWar(next))).toEqual(next);
  });

  it("leaves the computers' dice to the game: a throw among computers only needs no hand", () => {
    const game = DICE_WAR_RULES.startWith({ players: ["", ""], computers: [true, true], seed: "c" })!;
    expect(waitsOnPerson(game)).toBe(false);
    expect(throwDiceWar(game)).not.toBeNull();
    const people = DICE_WAR_RULES.startWith({ players: ["Ann", ""], computers: [false, true], seed: "c" })!;
    expect(waitsOnPerson(people)).toBe(true);
  });

  it("offers the throw a table would make, and plays it", () => {
    const game = DICE_WAR_RULES.start(5, ["", "", ""], undefined, 3)!;
    const [move] = DICE_WAR_RULES.moves(game);
    expect(DICE_WAR_RULES.moves(game)).toHaveLength(1);
    expect(DICE_WAR_RULES.play(game, move)).not.toBeNull();
  });
});

describe("diceWar: a tie for the highest is war, and the stake grows", () => {
  it("sends only the players who tied to roll again, at a stake one higher, and the winner takes it all", () => {
    let game = DICE_WAR_RULES.startWith({ players: ["Ann", "Ben", "Cy"], to: 10, seed: "w" })!;
    game = playDiceWar(game, { faces: { "0": [4], "1": [4], "2": [1] } })!;
    expect(game.rollers).toEqual([0, 1]);
    expect(diceWarPeopleToRoll(game)).toEqual([0, 1]);
    expect([game.wars, game.stake, game.scores]).toEqual([1, 2, [0, 0, 0]]);
    expect(diceWarSaid(game, name, EN)).toBe("Ann and Ben tied with 4: war!");
    expect(diceWarNext(game, name, EN)).toBe("Ann and Ben roll again, with 2 points at stake.");
    // Another tie raises it again.
    game = playDiceWar(game, { faces: { "0": [3], "1": [3] } })!;
    expect([game.wars, game.stake]).toEqual([2, 3]);
    game = playDiceWar(game, { faces: { "0": [2], "1": [6] } })!;
    expect(game.scores).toEqual([0, 3, 0]);
    expect([game.round, game.wars, game.stake, game.rollers]).toEqual([2, 0, 1, [0, 1, 2]]);
    expect(diceWarSaid(game, name, EN)).toBe("Ben won the war with 6 and takes 3 points.");
    // Dice that are not this table's, or from a person who is not to roll, are refused.
    expect(playDiceWar(game, { faces: { "0": [7], "1": [1], "2": [1] } })).toBeNull();
  });

  it("scores one point for an outright win, and the first to the score wins", () => {
    let game = DICE_WAR_RULES.startWith({ players: ["Ann", "Ben"], to: 3 })!;
    expect(diceWarRoundLine(game, EN)).toBe("Round 1, first to 3 points");
    for (let round = 0; round < 3; round += 1) game = playDiceWar(game, { faces: { "0": [6], "1": [1] } })!;
    expect(diceWarOver(game)).toBe(true);
    expect(diceWarWinners(game)).toEqual([0]);
    expect(diceWarEnding(game, [0], name, EN)).toBe("Ann reached 3 points.");
    expect(DICE_WAR_RULES.moves(game)).toEqual([]);
  });

  it("played for rounds, ends when they are up, the most points winning and level players sharing", () => {
    let game = DICE_WAR_RULES.startWith({ players: ["Ann", "Ben"], goal: "rounds", to: 2 })!;
    expect(diceWarRoundLine(game, EN)).toBe("Round 1 of 2");
    game = playDiceWar(game, { faces: { "0": [6], "1": [1] } })!;
    game = playDiceWar(game, { faces: { "0": [1], "1": [6] } })!;
    expect(diceWarOver(game)).toBe(true);
    expect(diceWarWinners(game)).toEqual([0, 1]);
    expect(diceWarEnding(game, [0, 1], name, EN)).toBe("Ann and Ben share the most points after 2 rounds.");
  });

  it("lists names in a line", () => {
    expect(namesInLine(["Ann"], EN)).toBe("Ann");
    expect(namesInLine(["Ann", "Ben"], EN)).toBe("Ann and Ben");
    expect(namesInLine(["Ann", "Ben", "Cy"], EN)).toBe("Ann, Ben and Cy");
  });
});
