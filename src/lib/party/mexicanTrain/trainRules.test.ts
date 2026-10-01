import { describe, expect, it } from "vitest";

import { MEXICAN_TRAIN_RULES } from "./trainRules";

// Mexican Train's rules are Domino's (`@johnmorrisdotca/domino`), tested there; this is the site's own adapter.
describe("Mexican Train at a party table", () => {
  it("answers the party contract at the default table", () => {
    const game = MEXICAN_TRAIN_RULES.start(12, ["", "", "", ""], undefined, 42)!;
    expect(game.seed).toBe(42);
    expect(MEXICAN_TRAIN_RULES.moves(game).length).toBeGreaterThan(0);
    expect(MEXICAN_TRAIN_RULES.over(game)).toBe(false);
  });
});
