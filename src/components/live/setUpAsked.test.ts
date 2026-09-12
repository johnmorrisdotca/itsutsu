import { describe, expect, it } from "vitest";

import { boardAsked, readSetUpAsked } from "./setUpAsked";

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
    expect(asked).toEqual({
      against: null,
      rematch: null,
      from: null,
      board: null,
      pace: null,
      sit: null,
      /*
       * Every rule separately absent, rather than a draft with defaults in it.
       * Asserted field by field on purpose: a default appearing here would be a
       * choice nobody made, arriving at the screen indistinguishable from one
       * somebody did make, and this is the test that would notice.
       */
      rules: {
        variant: null,
        obstacles: null,
        opening: null,
        clockMode: null,
        timeoutPenalty: null,
        rated: null,
        allowResign: null,
        handicap: null,
      },
    });
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

/**
 * WHETHER THE BOARD ON THE SCREEN IS A CHOICE OR A DEFAULT.
 *
 * The distinction is the whole of it, and getting it wrong put a reader on the
 * wrong board. `matchSeat` moves a DEFAULT board onto whichever seat somebody is
 * already waiting on, so that asking for a game sits down with them rather than
 * posting a second seat beside theirs — correct, and it must never do it to a
 * board somebody settled.
 *
 * The bug was that an address settling one could not say so: `?board=19` reached
 * the screen as a size in the draft and nothing else, so a lone 9×9 seat on the
 * noticeboard overruled it and the picker opened at 9. Nothing here is about
 * preferences: a member with none has the site's standing 15×15, and the 9 in
 * that report came from the noticeboard.
 */
describe("the board an address settled, at the game being set up", () => {
  const asked = (query: Record<string, string>) => readSetUpAsked(query);

  it("is the size the address named, where this game offers it", () => {
    expect(boardAsked(asked({ board: "19" }), "freestyle")).toBe(19);
    expect(boardAsked(asked({ board: "9" }), "freestyle")).toBe(9);
  });

  /*
   * THE BARE MEMBER, which is the case CI's fresh database always had and this
   * machine never did. Nothing is remembered about them — no preferences, no
   * standing board, no games played — so the address is the only thing that has
   * said anything about the board, and it must be heard. A null here is what let
   * the noticeboard answer instead.
   */
  it("is heard for somebody the site remembers nothing about", () => {
    expect(
      boardAsked(asked({ board: "19", pace: "86400000" }), "freestyle"),
      "a first link followed by a new member settles the board as surely as a click",
    ).toBe(19);
  });

  /*
   * SILENCE, NOT A SNAP. A size this game does not offer is an address that
   * said nothing readable, and the answer to that is the member's own standing
   * board — never this game's first one, which would move somebody from their
   * usual 15×15 to 9×9 because a link had a typo in it.
   */
  it("says nothing about a size this game does not offer", () => {
    expect(boardAsked(asked({ board: "19" }), "reversi"), "Reversi is 8×8").toBeNull();
    expect(boardAsked(asked({ board: "12" }), "freestyle"), "not a board on offer").toBeNull();
    expect(boardAsked(asked({ board: "8" }), "freestyle")).toBeNull();
  });

  it("says nothing where the address said nothing", () => {
    expect(boardAsked(asked({}), "freestyle")).toBeNull();
    expect(boardAsked(asked({ against: "mem_1" }), "freestyle")).toBeNull();
    expect(boardAsked(asked({ board: "big" }), "freestyle")).toBeNull();
  });

  /*
   * A game with ONE board still answers where the address named it. The screen
   * does not offer a picker there, so nothing can be followed onto it either —
   * but "the address named the only board" is still a true thing to report, and
   * a null would be this function guessing at what the caller does with it.
   */
  it("answers for a game played on one board only", () => {
    expect(boardAsked(asked({ board: "8" }), "reversi")).toBe(8);
  });
});
