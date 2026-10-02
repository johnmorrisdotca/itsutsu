import { describe, expect, it } from "vitest";

import { withResignation } from "../resign";

import { TENKA_SAVE_VERSION, isOldTenkaSave } from "./tenkaOldSave";
import { decodeTenka, encodeTenka } from "./tenkaKeep";
import { startTenka } from "./tenkaStart";

/** A game kept before Tenka's maps became the classic boards' cannot be played out again, and the site must know it for what it is. */

const OLD = JSON.stringify({ v: 1, seed: 7, players: ["Ann", "Ben"], rounds: 60, placing: "auto", moves: [["p", 3, 2]] });

describe("a Tenka game kept by an earlier version of the rules", () => {
  it("is refused by the rules and known for what it is", () => {
    expect(decodeTenka(OLD)).toBeNull();
    expect(isOldTenkaSave(OLD)).toBe(true);
    // With a resignation after it, as a table that was resigned from is kept.
    expect(isOldTenkaSave(withResignation(OLD, { resignedBy: 1 }))).toBe(true);
  });

  it("is not claimed for a game the rules read, for nothing kept, or for text that is no game", () => {
    const game = startTenka(60, ["Ann", "Ben"], 11)!;
    const now = encodeTenka(game);
    expect(decodeTenka(now)).not.toBeNull();
    expect(isOldTenkaSave(now)).toBe(false);
    for (const other of [null, undefined, "", "not json", "[]", "null", '{"seed":1}', '{"v":"1"}']) expect(isOldTenkaSave(other)).toBe(false);
  });

  it("follows the version the package keeps games at: a new one fails here until the old ones are told apart again", () => {
    expect((JSON.parse(encodeTenka(startTenka(60, ["Ann", "Ben"], 11)!)) as { v: number }).v).toBe(TENKA_SAVE_VERSION);
  });
});
