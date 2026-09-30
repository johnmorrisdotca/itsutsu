import { describe, expect, it } from "vitest";

import { HITOTSU_PARTY } from "./constants.ts";
import { encodeHitotsu, decodeHitotsu } from "./codec.ts";
import { playHitotsu } from "./rules.ts";
import { namedTable, readTableMove, readTableSetUp, startTable, tableComputerMove, tableToPlay } from "./table.ts";

describe("hitotsu: a table on several devices", () => {
  it("reads a set-up, and takes jumping in off whatever was sent", () => {
    expect(readTableSetUp({ seed: 42, options: HITOTSU_PARTY })).toEqual({ seed: 42, options: { ...HITOTSU_PARTY, jumpIn: false } });
    expect(readTableSetUp({ seed: 0, options: HITOTSU_PARTY })).toBeNull();
    expect(readTableSetUp({ seed: 1.5, options: HITOTSU_PARTY })).toBeNull();
    expect(readTableSetUp({ seed: 42, options: { ...HITOTSU_PARTY, deal: 6 } })).toBeNull();
    expect(readTableSetUp("seed")).toBeNull();
  });

  it("starts a table of blank seats with the computers where asked, and writes names in", () => {
    const game = startTable(200, 3, { seed: 7, options: HITOTSU_PARTY }, [2])!;
    expect(game.players).toEqual(["", "", ""]);
    expect(game.computers).toEqual([false, false, true]);
    expect(game.options.jumpIn).toBe(false);
    expect(namedTable(game, ["Ann", undefined, "Computer"]).players).toEqual(["Ann", "", "Computer"]);
    expect(startTable(200, 9, { seed: 7, options: HITOTSU_PARTY })).toBeNull();
    expect(startTable(300, 3, { seed: 7, options: HITOTSU_PARTY })).toBeNull();
  });

  it("never reads a jump as a move", () => {
    expect(readTableMove({ jump: "R50", seat: 1 })).toBeNull();
    expect(readTableMove({ draw: true })).toEqual({ draw: true });
    expect(readTableMove({ play: "R50", colour: "X" })).toBeNull();
  });

  it("lets the computer move only for the seat the table waits on, and plays a table out that way", () => {
    let game = startTable(1, 4, { seed: 11, options: HITOTSU_PARTY }, [0, 1, 2, 3])!;
    const waiting = tableToPlay(game)!;
    expect(tableComputerMove(game, (waiting + 1) % 4)).toBeNull();
    for (let step = 0; step < 5_000 && tableToPlay(game) !== null; step += 1) {
      const move = tableComputerMove(game, tableToPlay(game)!)!;
      game = playHitotsu(game, move)!;
      expect(game).not.toBeNull();
    }
    expect(tableToPlay(game)).toBeNull();
    expect(decodeHitotsu(encodeHitotsu(game))).toEqual(game);
  });
});
