import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * The two properties of the seat panel that a person cannot see in a diff, both
 * of which John has asked for in his own words, and neither of which any other
 * test in this project can guard.
 *
 * It reads the source, the way `gameLinks.coverage.test.ts` and
 * `playerLinks.coverage.test.ts` do, because vitest here is node-only — there is
 * no renderer to mount a component in, and the browser suite that drives this
 * screen is one somebody has to be holding the browser to run. A rule that is
 * only checked by a suite nobody may start today is a rule that will be broken
 * by somebody who never learns they broke it.
 */
const PANEL = "src/components/live/SitAsPanel.tsx";
const source = readFileSync(PANEL, "utf8");

describe("nothing on the seat panel is typed", () => {
  /*
   * "let them find their name. Once they find their name, the four words will
   * match up with them. And everyone doesn't have to type anything when finding
   * their name." — John, settling how somebody says who they are here.
   *
   * The panel had exactly one text box, for the name, and removing it is the
   * whole of that answer. It is also what closes a hole nobody had noticed: this
   * feature exists so a twelve-year-old can claim her seat on a borrowed iPad,
   * and the word picker was built with no text box on purpose. A keyboard in the
   * middle of it was the one step she could not do.
   */
  it("has no text box of any kind", () => {
    expect(source, "a text box came back to the one screen built without one").not.toMatch(/<input/);
    expect(source).not.toMatch(/<textarea/);
    expect(source, "INPUT_CLASS is the shared look of a text box").not.toContain("INPUT_CLASS");
    expect(source).not.toMatch(/contentEditable/i);
  });

  /*
   * NO CONTROL HERE HAS A CHANGE HANDLER, which is the same rule stated where it
   * can actually be checked: a text box, a search-as-you-type filter and a select
   * all announce themselves as `onChange`, and a panel made only of buttons has
   * none. So this catches a search box wearing a list as well as a text box —
   * filtering as you type is a keyboard again, and if the list ever grows past
   * what a person can scan the answer is grouping or paging, not a keyboard.
   */
  it("has no change handler, because every control on it is a button", () => {
    expect(source).not.toMatch(/onChange/);
  });

  /*
   * A TAP CARRIES THE MEMBER'S ID. The list prints a first name and an initial,
   * which two people can perfectly well share; the id is what says which row was
   * meant, and it is the reason display names here never needed to be unique.
   */
  it("sends the member's id, not the name it printed", () => {
    expect(source).toContain("memberId: who.id");
  });
});

describe("every control on it is a fingertip target", () => {
  /*
   * John has said twice that the buttons on this feature are too small, and this
   * is the screen his daughter uses: dozens of taps, on glass, to find four words
   * and her own name. `BUTTON_BASE` is the mouse-sized control — about thirty
   * pixels tall — and `BUTTON_TAP` is the forty-eight-pixel one. This screen uses
   * only the second.
   *
   * ONE EXCEPTION, NAMED RATHER THAN ASSUMED: Cancel is a quiet underlined link,
   * because it is the way out and must not compete with "Sit down" for the eye.
   * It carries `min-h-12` of its own so its hit area is a finger's and not the
   * height of its own text.
   */
  it("uses the tap-sized button class and never the mouse-sized one", () => {
    expect(source).toContain("BUTTON_TAP");
    expect(source, "a mouse-sized button is on the screen a child taps").not.toContain("BUTTON_BASE");
  });

  it("gives the one control that is a link a hit area anyway", () => {
    const at = source.indexOf('data-testid="sit-as-cancel"');
    expect(at, "the way out of this panel is gone").toBeGreaterThan(-1);
    // Its own className and nothing else's: bounded both sides, so a `min-h-12`
    // somewhere else on the screen cannot pass this for it.
    expect(source.slice(at - 300, at)).toContain("min-h-12");
  });
});
