import { describe, expect, it } from "vitest";

import { HANDICAP_RULES, NO_HANDICAP, OBSTACLE_LAYOUTS, OPENING_RULES, STONES } from "@/lib/gomoku/gomoku.constants";
import { NO_HANDICAP_ASKED, SET_UP_PARAMS } from "@/lib/gomoku/slugs";
import { beginLink, changeLink, draftParams } from "./setUpAddress";
import type { RulesDraft } from "./rulesDraft";
import { readSetUpAsked } from "./setUpAsked";

/**
 * THE ADDRESS IS THE WHOLE STATE, AND THIS IS THE TEST THAT SAYS SO.
 *
 * The doorstep states a game and then creates it; "change something" hands the
 * same game back to the screen that chose it. Both rest on one property: writing
 * a draft into an address and reading it back gives the same draft. Nothing else
 * holds the draft — no cookie, no store — so if that property fails, a reader
 * agrees to one game and plays another, and nothing anywhere reports it.
 *
 * So the round trip is tested directly rather than through either page. It is
 * also the only honest way to test it: a page test proves one path, and the
 * failure this guards against is a field quietly dropped on some other one.
 */

const draft: RulesDraft = {
  variant: "renju",
  size: 15,
  obstacles: OBSTACLE_LAYOUTS.none,
  opening: OPENING_RULES.pro,
  moveTimeMs: 300_000,
  timeoutPenalty: "game",
  clockMode: "game",
  rated: false,
  allowResign: false,
  open: false,
  handicap: NO_HANDICAP,
};

/** The query of an address, as the pages receive one. */
function queryOf(link: string): Record<string, string> {
  const query = new URLSearchParams(link.slice(link.indexOf("?") + 1));
  return Object.fromEntries(query.entries());
}

/** The draft an address would open a screen with, given the draft it was written from. */
function roundTrip(rules: RulesDraft): Record<string, unknown> {
  const asked = readSetUpAsked(queryOf(beginLink(rules)));
  return {
    variant: asked.rules.variant,
    size: asked.board,
    obstacles: asked.rules.obstacles,
    opening: asked.rules.opening,
    moveTimeMs: asked.pace?.ms ?? "nothing was said",
    timeoutPenalty: asked.rules.timeoutPenalty,
    clockMode: asked.rules.clockMode,
    rated: asked.rules.rated,
    allowResign: asked.rules.allowResign,
    handicap: asked.rules.handicap,
  };
}

describe("a settled game written into an address and read back", () => {
  it("comes back as the same game", () => {
    expect(roundTrip(draft)).toEqual({
      variant: "renju",
      size: 15,
      obstacles: OBSTACLE_LAYOUTS.none,
      opening: OPENING_RULES.pro,
      moveTimeMs: 300_000,
      timeoutPenalty: "game",
      clockMode: "game",
      rated: false,
      allowResign: false,
      handicap: NO_HANDICAP,
    });
  });

  /*
   * The two fields where silence and an answer are different things, and where an
   * absent parameter would therefore be read as somebody's choice being reversed.
   */
  it("says NO CLOCK out loud, rather than by leaving the pace out", () => {
    const link = beginLink({ ...draft, moveTimeMs: null });
    expect(queryOf(link)[SET_UP_PARAMS.pace]).toBe("none");
    expect(readSetUpAsked(queryOf(link)).pace).toEqual({ ms: null });
  });

  it("says NO HANDICAP out loud, so taking one off survives the way back", () => {
    /*
     * The bug this exists for: a rematch of a handicapped game, the handicap taken
     * off on the doorstep, then Change something. An absent parameter means "nobody
     * said", and the screen answers that by falling back to the handicap the old
     * game carried — handing straight back the thing that had just been removed.
     */
    const link = beginLink({ ...draft, handicap: NO_HANDICAP });
    expect(queryOf(link)[SET_UP_PARAMS.handicap]).toBe(NO_HANDICAP_ASKED);
    expect(readSetUpAsked(queryOf(link)).rules.handicap).toEqual(NO_HANDICAP);
  });

  it("carries a whole handicap, colour, restrictions and centre alike", () => {
    const handicap = {
      ...NO_HANDICAP,
      stone: STONES.white,
      doubleThree: true,
      overline: true,
      secondStoneExclusion: 3,
    };
    const link = beginLink({ ...draft, handicap });
    expect(queryOf(link)[SET_UP_PARAMS.handicap]).toBe("white-doubleThree-overline-3");
    expect(readSetUpAsked(queryOf(link)).rules.handicap).toEqual(handicap);
  });

  it("writes every rule, so there is nothing for a fallback to fill in", () => {
    /*
     * Counted rather than eyeballed. A rule added to the draft and not to the
     * address would be carried by neither link, and the way that shows is a choice
     * silently reset on the way back — which nothing else here would catch.
     */
    const names = draftParams(draft).map(([name]) => name);
    expect(new Set(names).size, "a parameter written twice").toBe(names.length);
    for (const field of ["game", "board", "blocks", "opening", "pace", "clock", "penalty", "rated", "resign", "handicap"]) {
      expect(names, `the address says nothing about ${field}`).toContain(field);
    }
  });

  it("refuses a handicap it cannot read in full, rather than keeping half of one", () => {
    // Half a handicap is a game neither player agreed to; "nobody said" is safe.
    expect(readSetUpAsked({ handicap: "black-notARule" }).rules.handicap).toBeNull();
    expect(readSetUpAsked({ handicap: "green-overline" }).rules.handicap).toBeNull();
    expect(readSetUpAsked({ handicap: "black-7" }).rules.handicap).toBeNull();
    // And every rule the engine has is readable, so none of them is only writable.
    for (const rule of HANDICAP_RULES) {
      expect(readSetUpAsked({ handicap: `black-${rule}` }).rules.handicap?.[rule]).toBe(true);
    }
  });

  it("refuses a board the game being asked for does not have", () => {
    /*
     * Read as "nothing was said" rather than as a board. Reversi is 8×8 and
     * nothing else, so an address naming 19 has not chosen a board — it has named
     * one that does not exist, and a page stating it would state a game the
     * creation route would then refuse.
     */
    expect(readSetUpAsked({ board: "nineteen" }).board).toBeNull();
    expect(readSetUpAsked({ board: "-4" }).board).toBeNull();
  });
});

describe("the way back from the doorstep", () => {
  it("goes where the game is still a choice, carrying the one that was chosen", () => {
    /*
     * /games/new rather than /games/renju/new, because choosing the game is the
     * last thing this reader did and so the likeliest thing they want to change. It
     * arrives chosen, in the query, along with everything else — nothing is lost by
     * offering it.
     */
    const link = changeLink(draft);
    expect(link.startsWith("/games/new?")).toBe(true);
    expect(queryOf(link)[SET_UP_PARAMS.game]).toBe("renju");
  });

  it("keeps a fork's game in the path, because a position belongs to its game", () => {
    /*
     * The exception, and it is a rule rather than a flag: replaying a Reversi
     * position onto a Halma board is not that position, so the creation route
     * throws such a change away — and a control whose answer is discarded is worse
     * than no control.
     */
    const link = changeLink(draft, { from: { id: "g_old", move: 12 } });
    expect(link.startsWith("/games/renju/new?")).toBe(true);
    expect(queryOf(link)[SET_UP_PARAMS.from]).toBe("g_old");
    expect(queryOf(link)[SET_UP_PARAMS.move]).toBe("12");
  });

  it("carries who the game is against, so nothing is asked twice", () => {
    const link = changeLink(draft, { against: "mem_1" });
    expect(queryOf(link)[SET_UP_PARAMS.against]).toBe("mem_1");
    expect(readSetUpAsked(queryOf(link)).against).toBe("mem_1");
  });

  it("does not carry a seat, a rematch or a fork that was never named", () => {
    const query = queryOf(changeLink(draft));
    expect(query[SET_UP_PARAMS.against]).toBeUndefined();
    expect(query[SET_UP_PARAMS.rematch]).toBeUndefined();
    expect(query[SET_UP_PARAMS.sit]).toBeUndefined();
    expect(query[SET_UP_PARAMS.from]).toBeUndefined();
  });
});

describe("the doorstep's own address", () => {
  it("puts the game in the path, because by then it is settled", () => {
    expect(beginLink(draft).startsWith("/games/renju/begin?")).toBe(true);
  });

  it("names a game by its slug rather than by its variant key", () => {
    // An address is read by people, and the slug table is what keeps a renamed
    // variant key from moving a page somebody has linked to.
    const link = beginLink({ ...draft, variant: "misereFive" });
    expect(link.startsWith("/games/misere-five/begin?")).toBe(true);
    expect(queryOf(link)[SET_UP_PARAMS.game]).toBe("misere-five");
    expect(readSetUpAsked(queryOf(link)).rules.variant).toBe("misereFive");
  });

  it("carries a seat somebody is already waiting at", () => {
    const link = beginLink(draft, { sit: "g_open" });
    expect(queryOf(link)[SET_UP_PARAMS.sit]).toBe("g_open");
    expect(readSetUpAsked(queryOf(link)).sit).toBe("g_open");
  });
});
