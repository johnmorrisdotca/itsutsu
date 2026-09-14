import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * A SOLE OPTION IS DRAWN AS A CHOSEN OPTION IS.
 *
 * John, with Checkers' one 8×8 beside Go's checked 19×19: "if there is only
 * one board, it should be checked... like boards with > 1 game type." The
 * board picker had dropped the check from a lone block, and the opening
 * picker had drawn a lone opening as a plain card with no radio at all — two
 * pickers on one screen, each deciding for itself that "one" meant "nothing
 * to mark", beside a game picker that marks its sole game like any other.
 *
 * So the rule is one, and this reads the source to hold the three to it:
 * every option is a label with a radio, every option carries the check
 * (`PickMark`, which shows when its radio is checked), and no picker has a
 * branch that draws its only option some other way. The rated picker's plain
 * card is not an option at all — it is a REFUSAL, the game cannot be rated —
 * and is not held here.
 */

const PICKERS = {
  "src/components/live/BoardPicker.tsx": "the board",
  "src/components/live/OpeningPicker.tsx": "the opening",
  "src/components/live/GamePicker.tsx": "the game",
} as const;

function code(source: string): string {
  const blank = (text: string) => text.replace(/[^\n]/g, " ");
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, blank)
    .replace(/(^|[^\w:])\/\/[^\n]*/g, (match, lead: string) => lead + blank(match.slice(lead.length)));
}

describe.each(Object.entries(PICKERS))("%s picks with one treatment for one option and for several", (path, what) => {
  const source = code(readFileSync(path, "utf8"));

  it("has the picker to check", () => {
    expect(source.length).toBeGreaterThan(500);
  });

  it(`draws every ${what} option as a label holding a radio`, () => {
    expect(source).toMatch(/<label[\s\S]*?<input\s[\s\S]*?type="radio"/);
  });

  it("carries the check on every option, never only on some", () => {
    expect(source).toContain("<PickMark");
    // The fault, as it was written: the mark withheld from the only option.
    expect(source).not.toMatch(/only\s*\?\s*null\s*:\s*<PickMark/);
  });

  it("has no plain-card branch for its only option", () => {
    // `PICK_FACT` is the rated picker's refusal card; an option is never one.
    expect(source).not.toContain("PICK_FACT");
    // A sole option is the same element as any other, only saying it is sole.
    expect(source).not.toMatch(/<div[^>]*data-only="true"/);
  });
});
