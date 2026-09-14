import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE RULES OF A GAME ARE ASKED IN ONE FORM.
 *
 * Play apart — the panel beside a scratch board that turns it into a game two
 * devices can share — drew its own clock, penalty, rating and switches beside
 * `RulesForm` for months. By the time anybody compared the two they had
 * already drifted: other hints, another order, other test ids. Nothing failed,
 * because both copies worked; there were simply two places a rule could be
 * described, and the next rule added would have been added to one of them.
 *
 * Crude on purpose, in the manner of `doorstep.coverage.test.ts`: it reads the
 * source for the moves that would bring the copy back. A panel may still
 * create a game directly (see `MAY_CREATE` there); it may not word the rules
 * itself.
 */

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path));
    else if (/\.tsx?$/.test(entry.name) && !/\.(test|coverage)\.tsx?$/.test(entry.name)) {
      out.push(path);
    }
  }
  return out;
}

describe("Play apart asks the rules through RulesForm", () => {
  const source = readFileSync("src/components/live/StartSharedGame.tsx", "utf8");

  it("renders the form every other way into a game uses", () => {
    expect(source, "StartSharedGame.tsx no longer renders RulesForm").toContain("<RulesForm");
  });

  it("and leaves the game, the board and the opening to the board beside it", () => {
    expect(source).toMatch(/\bsettledByBoard\b/);
  });

  it("and declares no rule control of its own", () => {
    for (const control of [
      "<Field",
      "<Select",
      "<Toggle",
      "MOVE_TIME_OPTIONS",
      "TIMEOUT_PENALTIES",
      "penaltyName",
      "describeMoveTime",
    ]) {
      expect(
        source.includes(control),
        `StartSharedGame.tsx uses ${control} — a rule control belongs in RulesForm, and a need this panel has that the form lacks is a prop on the form.`,
      ).toBe(false);
    }
  });
});

describe("and the rating choice is worded in one file", () => {
  it("is RulesForm", () => {
    /*
     * The option text is the fingerprint of a copied form: the old panel carried
     * these exact words, and any new copy would too. The member's own defaults
     * and the open-seat filters are other forms about other things, and word
     * nothing like it.
     */
    const wording = filesUnder("src")
      .filter((path) => readFileSync(path, "utf8").includes("Game will affect ratings"))
      .map((path) => path.split("/").pop());
    expect(wording).toEqual(["RulesForm.tsx"]);
  });
});
