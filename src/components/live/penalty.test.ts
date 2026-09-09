import { describe, expect, it } from "vitest";

import { TIMEOUT_PENALTIES } from "@/lib/history/gameSettingsSchema";
import { penaltyMeans, penaltyName } from "./penalty";

describe("what running out of time costs", () => {
  it("names each of the three, differently", () => {
    const names = TIMEOUT_PENALTIES.map(penaltyName);
    expect(new Set(names).size).toBe(TIMEOUT_PENALTIES.length);
  });

  it("keeps every name short enough to sit in a select", () => {
    /*
     * The bug this exists for: a select is as wide as its longest option, and
     * one of these was a 44-character sentence that took the control past the
     * edge of its panel. A name, not an explanation.
     */
    for (const penalty of TIMEOUT_PENALTIES) {
      expect(penaltyName(penalty).length).toBeLessThanOrEqual(24);
    }
  });

  it("still says what each one means, at length", () => {
    for (const penalty of TIMEOUT_PENALTIES) {
      expect(penaltyMeans(penalty).length).toBeGreaterThan(penaltyName(penalty).length);
    }
  });

  it("falls back to losing the turn for anything it does not know", () => {
    // Stored values outlive the code that wrote them; an unknown one reads as
    // the gentlest of the three rather than as a blank.
    expect(penaltyName("something-else")).toBe(penaltyName("turn"));
    expect(penaltyMeans("something-else")).toBe(penaltyMeans("turn"));
  });
});
