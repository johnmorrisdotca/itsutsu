import { describe, expect, it } from "vitest";

import { readSetUpAsked } from "./setUpAsked";

/**
 * WHAT THE SETUP SCREEN BELIEVES ITS ADDRESS.
 *
 * Everything here can be typed into a browser bar, so the interesting cases are
 * the ones nobody would write on purpose. The rule they all check is one rule: a
 * field that cannot be read comes back as "nothing was said", never as a
 * plausible value — because a plausible value is a decision nobody made, written
 * onto the screen and indistinguishable from a real one.
 */
describe("reading what an address asked the setup screen for", () => {
  it("says nothing was asked when nothing was", () => {
    const asked = readSetUpAsked({});
    expect(asked).toEqual({ against: null, rematch: null, from: null, board: null, pace: null });
  });

  it("reads an opponent, a game to repeat and a position to carry", () => {
    expect(readSetUpAsked({ against: "mem_1" }).against).toBe("mem_1");
    expect(readSetUpAsked({ rematch: "g1" }).rematch).toBe("g1");
    expect(readSetUpAsked({ from: "g1", move: "12" }).from).toEqual({ id: "g1", move: 12 });
  });

  /*
   * A fork with no move is not a fork from move nought. That is a different
   * game and one somebody would notice, so it is no fork at all.
   */
  it("refuses a fork it was not told enough about", () => {
    expect(readSetUpAsked({ from: "g1" }).from).toBeNull();
    expect(readSetUpAsked({ from: "g1", move: "" }).from).toBeNull();
    expect(readSetUpAsked({ from: "g1", move: "half" }).from).toBeNull();
    expect(readSetUpAsked({ from: "g1", move: "1.5" }).from).toBeNull();
    expect(readSetUpAsked({ from: "g1", move: "-1" }).from).toBeNull();
    expect(readSetUpAsked({ from: "g1", move: "99999" }).from).toBeNull();
    expect(readSetUpAsked({ move: "4" }).from).toBeNull();
  });

  /*
   * THE PACE IS WRAPPED, and this is the case the wrapping exists for: "play
   * with no clock" and "nobody mentioned the clock" want opposite things from
   * the screen — keep it, or fall back to what this member usually plays at —
   * and a bare null would have to mean both.
   */
  it("tells no clock apart from nothing said about the clock", () => {
    expect(readSetUpAsked({ pace: "none" }).pace).toEqual({ ms: null });
    expect(readSetUpAsked({}).pace).toBeNull();
  });

  it("reads a pace the site actually offers", () => {
    expect(readSetUpAsked({ pace: String(5 * 60_000) }).pace).toEqual({ ms: 5 * 60_000 });
  });

  /*
   * A pace that is not one of the paces would put the clock select on a value
   * it is not offering, which shows as the first option — the address ignored,
   * without saying so.
   */
  it("ignores a pace it does not offer, rather than showing something else", () => {
    expect(readSetUpAsked({ pace: "7" }).pace).toBeNull();
    expect(readSetUpAsked({ pace: "quickly" }).pace).toBeNull();
    expect(readSetUpAsked({ pace: "-300000" }).pace).toBeNull();
  });

  it("reads a board, and ignores one that is not a whole positive number", () => {
    expect(readSetUpAsked({ board: "19" }).board).toBe(19);
    expect(readSetUpAsked({ board: "0" }).board).toBeNull();
    expect(readSetUpAsked({ board: "-9" }).board).toBeNull();
    expect(readSetUpAsked({ board: "big" }).board).toBeNull();
  });

  /*
   * A repeated parameter arrives as an array. There is no sensible way to
   * choose between two answers to one question, so neither is taken.
   */
  it("takes nothing from a parameter that was given twice", () => {
    expect(readSetUpAsked({ against: ["mem_1", "mem_2"] }).against).toBeNull();
  });

  it("takes nothing from an id longer than anything the site writes", () => {
    expect(readSetUpAsked({ against: "x".repeat(200) }).against).toBeNull();
  });

  it("trims, because an address pasted by hand carries spaces", () => {
    expect(readSetUpAsked({ against: "  mem_1  " }).against).toBe("mem_1");
    expect(readSetUpAsked({ against: "   " }).against).toBeNull();
  });
});
