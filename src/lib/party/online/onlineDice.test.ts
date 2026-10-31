import { describe, expect, it } from "vitest";

import { DICE_TABLE_RULES } from "../diceTable/diceTableRules";
import { pachisiComputerMove } from "../pachisi/pachisiComputer";
import type { PachisiGame } from "../pachisi/pachisi.types";
import { yachtComputerMove } from "../yacht/yachtComputer";
import type { YachtGame } from "../yacht/yacht.types";
import type { LiarsGame } from "../liarsDice/liarsDice.types";
import { DICE_TABLES_ONLINE, DICE_WAR_ONLINE, PACHISI_ONLINE, YACHT_ONLINE, seenByLiar } from "./onlineDice";
import { readSeen } from "./onlineSeen";
import type { OnlineRules } from "./online.types";

/**
 * THE DICE GAMES ON SEVERAL DEVICES, with no database: a browser can neither choose a
 * die nor see one coming, and at Liar's Dice it cannot see another cup.
 */

function playedOn<S, M>(rules: OnlineRules<S, M>, choose: (game: S) => M, start: S, steps: number, each: (game: S) => void): S {
  let game = start;
  for (let step = 0; step < steps && rules.toPlay(game) !== null; step += 1) {
    each(game);
    const next = rules.play(game, choose(game));
    if (next === null) throw new Error("the rules refused a computer's own move");
    game = next;
  }
  return game;
}

describe("a table's seed", () => {
  it("is the server's: two tables started alike do not fall alike, and the set-up has no say", () => {
    const seeds = new Set(Array.from({ length: 20 }, () => (DICE_TABLES_ONLINE.pig.start(100, 2, { setup: { seed: 7 } }) as { seed: number }).seed));
    expect(seeds.size).toBeGreaterThan(15);
  });

  it.each([
    ["yacht", YACHT_ONLINE],
    ["pachisi", PACHISI_ONLINE],
    ["pig", DICE_TABLES_ONLINE.pig],
    ["tenThousand", DICE_TABLES_ONLINE.tenThousand],
    ["liarsDice", DICE_TABLES_ONLINE.liarsDice],
    ["sayu", DICE_TABLES_ONLINE.sayu],
  ] as const)("never reaches a seat at %s, nor do the moves, and the text reads back in a browser", (_name, row) => {
    const rules = row as unknown as OnlineRules<{ seed: number; moves: unknown[] }, unknown>;
    const size = rules.sizes[0]!;
    const game = rules.start(size, 2)!;
    expect(game.seed).toBeGreaterThan(0);
    const sent = rules.seatState!(rules.encode(game), 0);
    expect(sent).not.toContain(String(game.seed));
    const read = rules.decode(sent)!;
    expect(read.seed).toBe(0);
    expect(read.moves).toEqual([]);
    expect(rules.toPlay(read)).toBe(rules.toPlay(game));
  });

  it("never reaches a seat at diceWar", () => {
    const table = DICE_WAR_ONLINE.start(10, 2)!;
    const sent = DICE_WAR_ONLINE.seatState!(DICE_WAR_ONLINE.encode(table), 1);
    expect(sent).not.toContain(table.game.seed);
    expect(DICE_WAR_ONLINE.decode(sent)!.game.seed).toBe("");
  });
});

describe("a browser cannot choose a die", () => {
  it("Dice War's press reads as a press whatever else was sent", () => {
    expect(DICE_WAR_ONLINE.readMove({ kind: "roll", faces: { "0": [6] } })).toEqual({ kind: "roll" });
    expect(DICE_WAR_ONLINE.readMove({ faces: { "0": [6] } })).toBeNull();
  });

  it("Pig, Ten Thousand and Sayu keep nothing of a throw but that it was a throw", () => {
    expect(DICE_TABLES_ONLINE.pig.readMove({ kind: "roll", die: 6 })).toEqual({ kind: "roll" });
    expect(DICE_TABLES_ONLINE.tenThousand.readMove({ kind: "roll", dice: [1, 1, 1, 1, 1, 1] })).toEqual({ kind: "roll" });
    expect(DICE_TABLES_ONLINE.sayu.readMove({ kind: "roll", dice: [4, 4, 4] })).toEqual({ kind: "roll" });
    expect(YACHT_ONLINE.readMove({ kind: "roll", hold: 0, dice: [6, 6, 6, 6, 6] })).toEqual({ kind: "roll", hold: 0 });
    expect(PACHISI_ONLINE.readMove({ kind: "roll", dice: [6, 6] })).toEqual({ kind: "roll" });
  });

  it("refuses what is not a move in the game", () => {
    expect(DICE_TABLES_ONLINE.pig.readMove({ kind: "bid" })).toBeNull();
    expect(DICE_TABLES_ONLINE.tenThousand.readMove({ kind: "keep", mask: 64 })).toBeNull();
    expect(DICE_TABLES_ONLINE.liarsDice.readMove({ kind: "bid", count: 2, face: 1 })).toBeNull();
    expect(YACHT_ONLINE.readMove({ kind: "roll", hold: 99 })).toBeNull();
    expect(PACHISI_ONLINE.readMove({ kind: "move", pawn: 9, use: 0 })).toBeNull();
    expect(DICE_TABLES_ONLINE.pig.readMove(null)).toBeNull();
  });
});

describe("Dice War's dice fall when the last person has pressed", () => {
  it("waits on each person in turn, throws from the server's seed, and counts every press as a move", () => {
    const table = DICE_WAR_ONLINE.start(5, 3, { computers: [2] })!;
    expect(DICE_WAR_ONLINE.toPlay(table)).toBe(0);
    const one = DICE_WAR_ONLINE.play(table, { kind: "roll" })!;
    expect(one.game.throws).toHaveLength(0);
    expect(DICE_WAR_ONLINE.toPlay(one)).toBe(1);
    expect(DICE_WAR_ONLINE.moveCount(one)).toBe(1);
    const two = DICE_WAR_ONLINE.play(one, { kind: "roll" })!;
    expect(two.game.throws).toHaveLength(1);
    expect(two.game.throws[0]!.rolls.map((roll) => roll.seat)).toEqual([0, 1, 2]);
    expect(two.pressed).toEqual([]);
    expect(DICE_WAR_ONLINE.moveCount(two)).toBe(2);
  });

  it("reads back exactly from what is stored, and takes no goal or dice the set-up does not offer", () => {
    const table = DICE_WAR_ONLINE.start(5, 2, { setup: { dice: 2, sides: 8, goal: "rounds", to: 10 } })!;
    expect(table.game.dice).toBe(2);
    expect(table.game.goal).toBe("rounds");
    const pressed = DICE_WAR_ONLINE.play(table, { kind: "roll" })!;
    expect(DICE_WAR_ONLINE.decode(DICE_WAR_ONLINE.encode(pressed))).toEqual(pressed);
    expect(DICE_WAR_ONLINE.start(5, 2, { setup: { dice: 99 } })).toBeNull();
    expect(DICE_WAR_ONLINE.start(5, 2, { setup: { goal: "rounds", to: 7 } })).toBeNull();
  });
});

describe("Liar's Dice: a seat is sent no cup but its own", () => {
  const rules = DICE_TABLES_ONLINE.liarsDice as unknown as OnlineRules<LiarsGame, unknown>;

  it("sends a seat its own dice, and the others' as empty dice of the same number", () => {
    const game = rules.start(5, 3)!;
    const sent = readSeen<LiarsGame>("liarsDice", rules.seatState!(rules.encode(game), 1))!;
    expect(sent.cups[1]).toEqual(game.cups[1]);
    expect(sent.cups[0]).toEqual([0, 0, 0, 0, 0]);
    expect(sent.cups[2]).toEqual([0, 0, 0, 0, 0]);
  });

  it("chooses the same computer's move from its own seat's view as from the whole game, at every position", () => {
    const computer = DICE_TABLE_RULES.liarsDice.computer as (game: LiarsGame) => unknown;
    playedOn(rules, computer as (game: LiarsGame) => unknown, rules.start(5, 4)!, 200, (game) => {
      expect(computer(seenByLiar(game, game.toPlay))).toEqual(computer(game));
    });
  });
});

describe("a computer works from what its seat was sent", () => {
  it("Yacht's chooses the same from the seat's view", () => {
    playedOn(YACHT_ONLINE, yachtComputerMove, YACHT_ONLINE.start(13, 2)!, 60, (game) => {
      expect(yachtComputerMove(YACHT_ONLINE.decode(YACHT_ONLINE.seatState!(YACHT_ONLINE.encode(game), game.toPlay)) as YachtGame)).toEqual(yachtComputerMove(game));
    });
  });

  it("Pachisi's chooses the same from the seat's view", () => {
    playedOn(PACHISI_ONLINE, pachisiComputerMove, PACHISI_ONLINE.start(68, 3)!, 120, (game) => {
      expect(pachisiComputerMove(PACHISI_ONLINE.decode(PACHISI_ONLINE.seatState!(PACHISI_ONLINE.encode(game), game.toPlay)) as PachisiGame)).toEqual(pachisiComputerMove(game));
    });
  });

  it.each(["pig", "tenThousand", "sayu"] as const)("%s's chooses the same from the seat's view", (kind) => {
    const rules = DICE_TABLES_ONLINE[kind] as unknown as OnlineRules<{ toPlay: number }, unknown>;
    const computer = DICE_TABLE_RULES[kind].computer as (game: unknown) => unknown;
    playedOn(rules, computer, rules.start(rules.sizes[0]!, 3)!, 100, (game) => {
      expect(computer(rules.decode(rules.seatState!(rules.encode(game), game.toPlay)))).toEqual(computer(game));
    });
  });

  it("plays a table of them to the end by the stored text alone", () => {
    for (const kind of ["pig", "tenThousand", "liarsDice", "sayu"] as const) {
      const rules = DICE_TABLES_ONLINE[kind] as unknown as OnlineRules<{ toPlay: number; phase: string }, unknown>;
      const computer = DICE_TABLE_RULES[kind].computer as (game: unknown) => unknown;
      let text = rules.encode(rules.start(rules.sizes[0]!, 2, { computers: [0, 1] })!);
      let steps = 0;
      for (;;) {
        const game = rules.decode(text)!;
        if (rules.toPlay(game) === null) break;
        const seen = rules.decode(rules.seatState!(text, game.toPlay))!;
        text = rules.encode(rules.play(game, computer(seen))!);
        steps += 1;
        if (steps > 5000) throw new Error(`${kind} did not end`);
      }
      expect(rules.winners(rules.decode(text)!).length).toBeGreaterThan(0);
    }
  });
});
