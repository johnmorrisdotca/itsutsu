import { describe, expect, it } from "vitest";

import { speaker } from "@/lib/i18n/i18n";
import { DRAW_LIMIT_DISPLAY, DRAW_LIMIT_LIST, DRAW_LIMIT_SHARE } from "./gomoku.constants";

// The rule is Narabe's (its own repository, `src/rules/drawLimit.test.ts`); the words for it are the site's.
describe("the words for a draw limit", () => {
  it.each(DRAW_LIMIT_LIST)("%s has a label, a name in kanji and a sentence", (limit) => {
    const copy = DRAW_LIMIT_DISPLAY[limit];
    expect(copy.label.length).toBeGreaterThan(2);
    expect(copy.kanji.length).toBeGreaterThan(0);
    expect(speaker("en").say(copy.blurb).length).toBeGreaterThan(20);
  });

  it("keeps the rule and the words apart, and in step", () => {
    // VARIANT_SPECS and RULE_VARIANT_DISPLAY are kept apart the same way: one
    // decides what happens, the other only says it. They must cover the same
    // set, or a limit exists that nothing can name.
    expect(Object.keys(DRAW_LIMIT_SHARE).sort()).toEqual(Object.keys(DRAW_LIMIT_DISPLAY).sort());
  });
});
