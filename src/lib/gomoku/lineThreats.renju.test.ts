import { describe, expect, it } from "vitest";

import { RULE_VARIANTS } from "./gomoku.constants";
import { finderAgreement } from "./lineThreats.test-support";

describe("the finders of forced wins on a line board, at renju", () => {
  it("answer as the finders on copies answer, position after position of real games", () => {
    const { compared, found } = finderAgreement(RULE_VARIANTS.renju);
    expect(compared).toBeGreaterThan(40);
    // The comparison means little if neither ever found anything.
    expect(found).toBeGreaterThan(2);
  }, 600_000);
});
