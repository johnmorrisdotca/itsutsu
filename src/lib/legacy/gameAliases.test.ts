import { describe, expect, it } from "vitest";

import { RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import { aliasedVariant } from "./gameAliases";

describe("game aliases", () => {
  it("maps a source site's name to the Itsutsu game it actually is", () => {
    expect(aliasedVariant("Flipversi")).toBe(RULE_VARIANTS.reversi);
    expect(aliasedVariant("Go-Moku")).toBe(RULE_VARIANTS.freestyle);
    expect(aliasedVariant("Pente")).toBe(RULE_VARIANTS.ninuki);
    expect(aliasedVariant("Keryo Pente")).toBe(RULE_VARIANTS.sannuki);
  });

  it("matches GoldToken's Four In a Row family by mechanic, not just name", () => {
    expect(aliasedVariant("Cylindrical Four (Only) In a Row")).toBe(RULE_VARIANTS.ringDrop);
    expect(aliasedVariant("Wormhole Four in a Row")).toBe(RULE_VARIANTS.wormDrop);
    expect(aliasedVariant("Zero G Four in a Row")).toBe(RULE_VARIANTS.edgeDrop);
  });

  it("does not alias a game from an unrelated family, even with a matching prefix", () => {
    // "Anti-Checkers" is Checkers, not a flipping game — must not fall out
    // of "Anti-" matching Anti-Reversi's name.
    expect(aliasedVariant("Anti-Checkers")).toBeNull();
  });

  it("leaves a game with no Itsutsu equivalent unmapped, rather than guessing", () => {
    expect(aliasedVariant("Backgammon")).toBeNull();
    expect(aliasedVariant("Chess")).toBeNull();
    expect(aliasedVariant("nonexistent game")).toBeNull();
  });
});
