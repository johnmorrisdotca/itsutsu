import { describe, expect, it } from "vitest";

import { emptyArrangement, reconcileArrangement, swapBoxes } from "./phraseArrangement";

describe("emptyArrangement", () => {
  it("is four empty boxes", () => {
    expect(emptyArrangement()).toEqual([null, null, null, null]);
  });
});

describe("reconcileArrangement", () => {
  it("puts a newly kept word into the first empty box", () => {
    expect(reconcileArrangement(emptyArrangement(), ["acid", null, null, null])).toEqual(["acid", null, null, null]);
    expect(reconcileArrangement([null, "acid", null, null], ["acid", "zebra", null, null])).toEqual([
      "zebra",
      "acid",
      null,
      null,
    ]);
  });

  it("keeps a word where the person put it when the ticket changes", () => {
    // Moved to the last box by hand; the ticket still holds it first.
    const shown = ["acid", null, null, "zebra"];
    const kept = ["acid", "zebra", "mango", null];
    expect(reconcileArrangement(shown, kept)).toEqual(["acid", "mango", null, "zebra"]);
  });

  it("empties the box of a word taken out and leaves the others where they are", () => {
    const shown = ["acid", "zebra", "mango", null];
    const kept = ["acid", null, "mango", null];
    expect(reconcileArrangement(shown, kept)).toEqual(["acid", null, "mango", null]);
  });

  it("changes nothing for a reroll", () => {
    const shown = ["zebra", null, "acid", null];
    expect(reconcileArrangement(shown, ["acid", "zebra", null, null])).toEqual(shown);
  });

  /*
   * The picker never offers a kept word twice, but canonicalPhrase accepts a
   * repeat and nothing on this path may quietly read four words as three.
   */
  it("counts a repeated word twice, never once", () => {
    expect(reconcileArrangement(emptyArrangement(), ["zoom", "zoom", null, null])).toEqual(["zoom", "zoom", null, null]);
    expect(reconcileArrangement(["zoom", null, null, "zoom"], ["zoom", "zoom", null, null])).toEqual([
      "zoom",
      null,
      null,
      "zoom",
    ]);
    expect(reconcileArrangement(["zoom", null, null, "zoom"], ["zoom", null, null, null])).toEqual([
      "zoom",
      null,
      null,
      null,
    ]);
  });

  it("never shows a word the ticket does not hold", () => {
    expect(reconcileArrangement(["acid", "xyzzy", null, null], ["acid", null, null, null])).toEqual([
      "acid",
      null,
      null,
      null,
    ]);
  });

  it("leaves its input untouched", () => {
    const shown = ["acid", null, null, null];
    const kept = ["acid", "zebra", null, null];
    reconcileArrangement(shown, kept);
    expect(shown).toEqual(["acid", null, null, null]);
    expect(kept).toEqual(["acid", "zebra", null, null]);
  });
});

describe("swapBoxes", () => {
  it("moves a word into an empty box, leaving its old box empty", () => {
    expect(swapBoxes(["acid", null, null, null], 0, 3)).toEqual([null, null, null, "acid"]);
  });

  it("changes places with the word already there", () => {
    expect(swapBoxes(["acid", "zebra", null, null], 0, 1)).toEqual(["zebra", "acid", null, null]);
  });

  it("hands back the same list for a move that means nothing", () => {
    const shown = ["acid", null, null, null];
    expect(swapBoxes(shown, 0, 0)).toBe(shown);
    expect(swapBoxes(shown, 0, 4)).toBe(shown);
    expect(swapBoxes(shown, -1, 0)).toBe(shown);
    expect(swapBoxes(shown, 0.5, 1)).toBe(shown);
    // An empty box is not carried anywhere.
    expect(swapBoxes(shown, 1, 0)).toBe(shown);
  });

  it("leaves its input untouched", () => {
    const shown = ["acid", "zebra", null, null];
    swapBoxes(shown, 0, 3);
    expect(shown).toEqual(["acid", "zebra", null, null]);
  });
});
