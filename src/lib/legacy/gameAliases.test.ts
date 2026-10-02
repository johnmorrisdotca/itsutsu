import { describe, expect, it } from "vitest";

import { RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import { SUGOROKU_LENGTHS, isSugorokuKind } from "@/lib/party/sugoroku/sugoroku.constants";
import { ALIAS_POINTS, aliasQuery, aliasedVariant } from "./gameAliases";

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

  it("links Checkers to our Checkers, and Halma 10x10 to our Halma rather than to a board", () => {
    expect(aliasedVariant("Checkers")).toBe(RULE_VARIANTS.checkers);
    expect(aliasedVariant("Halma 10x10")).toBe(RULE_VARIANTS.halma);
  });

  it("does not alias a game from an unrelated family, even with a matching prefix", () => {
    // "Anti-Checkers" is Checkers, not a flipping game — must not fall out
    // of "Anti-" matching Anti-Reversi's name.
    expect(aliasedVariant("Anti-Checkers")).toBeNull();
  });

  it("leads every backgammon name of the two sites to the game it is, with the match length its name carries", () => {
    expect(aliasedVariant("Backgammon")).toBe("backgammon");
    expect(aliasedVariant("Pro Backgammon-9")).toBe("backgammon");
    expect(aliasedVariant("Pro Backgammon Race")).toBe("backgammonRace");
    expect(aliasedVariant("Anti-Backgammon")).toBe("antiBackgammon");
    expect(aliasedVariant("Pro Nackgammon")).toBe("nackgammon");
    expect(aliasedVariant("Long Gammon (7 Point)")).toBe("longGammon");
    expect(aliasedVariant("Hypergammon (3 Point)")).toBe("hypergammon");
    expect(aliasedVariant("Tabula")).toBe("tabula");
    expect(aliasQuery("Pro Backgammon-9")).toBe("points=9");
    expect(aliasQuery("Pro Backgammon")).toBe("points=5");
    expect(aliasQuery("Casual Backgammon")).toBe("");
    expect(aliasQuery("Flipversi")).toBe("");
  });

  it("only carries a match length the game it leads to is played to", () => {
    for (const [name, points] of Object.entries(ALIAS_POINTS)) {
      const game = aliasedVariant(name);
      expect(game !== null && isSugorokuKind(game) && SUGOROKU_LENGTHS[game].includes(points), name).toBe(true);
    }
  });

  it("leaves a game with no Itsutsu equivalent unmapped, rather than guessing", () => {
    expect(aliasedVariant("Chess")).toBeNull();
    expect(aliasedVariant("nonexistent game")).toBeNull();
  });
});
