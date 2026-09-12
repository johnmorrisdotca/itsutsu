import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * The properties of the Words tab that a person cannot see in a diff, guarded
 * the way `sitAs.coverage.test.ts` guards the sibling screen: by reading the
 * source, because vitest here is node-only and the browser suite is one
 * somebody has to be holding the browser to run.
 */
const sources = {
  screen: readFileSync("src/components/mine/PhraseSetup.tsx", "utf8"),
  tiles: readFileSync("src/components/mine/WordTiles.tsx", "utf8"),
  candidates: readFileSync("src/components/mine/WordCandidates.tsx", "utf8"),
  drag: readFileSync("src/components/mine/useTileDrag.ts", "utf8"),
};
const whole = Object.values(sources).join("\n");

describe("nothing on the words tab is typed", () => {
  /*
   * THE PICKER IS THE SECURITY DESIGN. Four words are offered and one is kept,
   * so the phrase is as strong as random however deliberately a person felt
   * they were choosing — and a text box, added for convenience, would make it
   * exactly as strong as a person's taste in words. The one input on the screen
   * is the box that says the words have been written down, which types nothing.
   */
  it("has no text box of any kind", () => {
    expect(whole, "a text box came back to a screen built without one").not.toMatch(/<input(?![^>]*type="checkbox")/);
    expect(whole).not.toMatch(/<textarea/);
    expect(whole, "INPUT_CLASS is the shared look of a text box").not.toContain("INPUT_CLASS");
    expect(whole).not.toMatch(/contentEditable/i);
  });

  it("has exactly one change handler, on that checkbox, and none on a tile", () => {
    expect(sources.screen.match(/onChange/g)).toHaveLength(1);
    expect(sources.tiles).not.toMatch(/onChange/);
    expect(sources.candidates).not.toMatch(/onChange/);
  });

  /*
   * THE ORDER NEVER REACHES THE SERVER. The words come out of the signed
   * ticket, and the boxes a person arranged them into are the browser's
   * business alone — see phraseArrangement.ts. A save that sent the
   * arrangement would be a browser naming words, which is the one thing the
   * ticket exists to make impossible.
   */
  it("saves from the signed ticket alone, never from what the browser arranged", () => {
    expect(sources.screen).toContain("JSON.stringify({ ticket, acknowledged: true })");
    expect(sources.screen).not.toMatch(/JSON\.stringify\([^)]*arranged/);
  });
});

describe("every control on it is a fingertip target", () => {
  /*
   * John, twice, on this feature: the buttons are too small. This is the
   * screen his daughter uses, so it uses the forty-eight-pixel button and
   * never the mouse-sized one, and the boxes and the offer are drawn larger
   * still.
   */
  it("uses the tap-sized button class and never the mouse-sized one", () => {
    expect(sources.screen).toContain("BUTTON_TAP");
    expect(whole, "a mouse-sized button is on the screen a child taps").not.toContain("BUTTON_BASE");
  });

  it("draws the boxes and the offer at a size a child can hit, not a button's", () => {
    expect(sources.tiles).toContain("min-h-28");
    expect(sources.candidates).toContain("min-h-20");
  });

  it("gives the one control that is a link a hit area anyway", () => {
    const at = sources.screen.indexOf('data-testid="phrase-cancel"');
    expect(at, "the way out of the picker is gone").toBeGreaterThan(-1);
    expect(sources.screen.slice(at - 300, at)).toContain("min-h-12");
  });
});

describe("moving a word is reachable without a pointer", () => {
  /*
   * Drag and drop with no alternative is unreachable to anyone not using a
   * pointer, so the same move answers the arrow keys, and where the word went
   * is said out loud for a reader who cannot see it land.
   */
  it("answers the arrow keys as well as a drag", () => {
    expect(sources.drag).toContain("onPointerDown");
    expect(sources.tiles).toContain("ArrowLeft");
    expect(sources.tiles).toContain("ArrowRight");
  });

  it("tells a screen reader where the word went", () => {
    expect(sources.tiles).toContain('aria-live="polite"');
  });

  it("labels the refresh icon, which has no words of its own", () => {
    const at = sources.candidates.indexOf('data-testid="phrase-reroll"');
    expect(at, "the way to four other words is gone").toBeGreaterThan(-1);
    expect(sources.candidates.slice(at - 400, at + 50)).toContain("aria-label");
  });
});
