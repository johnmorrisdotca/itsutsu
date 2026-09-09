import { describe, expect, it } from "vitest";

import { settingsLocks } from "./settingsLocks";
import { GAME_COPY } from "./game.constants";
import { createGame } from "@/lib/gomoku/engine";
import { RULE_VARIANT_LIST, VARIANT_SPECS } from "@/lib/gomoku/gomoku.constants";
import { advantageReadingFor } from "@/lib/gomoku/advantage";
import { UNREADABLE_DISPLAY } from "@/lib/gomoku/advantage.constants";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";

function locksFor(variant: RuleVariant) {
  return settingsLocks(createGame({ variant }).settings);
}

/**
 * The who-is-ahead control is locked by its own question, not by the line
 * reading's.
 *
 * These two had been the same lock, and the games in between paid for it: a
 * Reversi player was told there was no reading to be had, when discs on the
 * board is a reading anybody can do by eye, and a Hex player was told stones
 * move after they are placed, which in Hex they do not.
 */
describe("the who-is-ahead lock", () => {
  it("offers the control in every game that can be counted", () => {
    const counted = RULE_VARIANT_LIST.filter(
      (variant) => advantageReadingFor(VARIANT_SPECS[variant]).kind === "count",
    );
    // Reversi's family, the two races and checkers: worth asserting there are
    // some, so this cannot pass by finding none.
    expect(counted.length).toBeGreaterThan(5);
    for (const variant of counted) {
      expect(locksFor(variant).advantage, variant).toBeNull();
      // And these are exactly the games the line reading is right to refuse.
      expect(locksFor(variant).reading, variant).not.toBeNull();
    }
  });

  it("offers it in every game the threat reading covers", () => {
    for (const variant of RULE_VARIANT_LIST) {
      if (!VARIANT_SPECS[variant].analysis) continue;
      expect(locksFor(variant).advantage, variant).toBeNull();
    }
  });

  it("gives a locked game the reason that is true of that game", () => {
    for (const variant of RULE_VARIANT_LIST) {
      const reading = advantageReadingFor(VARIANT_SPECS[variant]);
      if (reading.kind !== "unreadable") continue;
      const lock = locksFor(variant).advantage;
      expect(lock, variant).toBe(UNREADABLE_DISPLAY[reading.reason].sentence);
      /*
       * The bug this replaces. Hex, Notakto, maker-breaker and the square
       * game all borrowed the line reading's sentence, which says stones move
       * after they are placed — false in every one of them.
       */
      const stonesMove =
        VARIANT_SPECS[variant].quadrantSize !== null || VARIANT_SPECS[variant].pieces !== null;
      if (!stonesMove) expect(lock, variant).not.toBe(GAME_COPY.noReading);
    }
  });
});
