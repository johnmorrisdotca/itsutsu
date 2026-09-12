import { describe, expect, it } from "vitest";

import { NO_HANDICAP, STONES } from "@/lib/gomoku/gomoku.constants";
import type { RulesDraft } from "./rulesDraft";
import type { SetUpAgain, SetUpFork, SetUpOpponent } from "./setUp.types";
import { creationFor, sameRules } from "./setUpStart";

const draft: RulesDraft = {
  variant: "freestyle",
  size: 9,
  obstacles: "none",
  opening: "free",
  moveTimeMs: null,
  timeoutPenalty: "turn",
  clockMode: "move",
  rated: true,
  allowResign: true,
  open: false,
  handicap: NO_HANDICAP,
};

const them: SetUpOpponent = { id: "mem_them", name: "Bob", computer: false };
const again: SetUpAgain = { id: "g_old", colour: STONES.white };
const fork: SetUpFork = { id: "g_old", move: 12, alone: false };
/** The line length and the seed, which no row on this form asks about. */
const carry = { winLength: 3, seed: 7, opener: "black", drawLimit: "none" };

describe("what pressing Start asks for", () => {
  it("posts a seat for anyone when nobody is named", () => {
    const { body, repeat } = creationFor({
      rules: draft,
      source: null,
      opponent: null,
      again: null,
      fork: null,
      carry: {},
    });
    expect(body.open).toBe(true);
    expect(body.challengeId).toBeUndefined();
    expect(repeat).toBe(false);
  });

  it("challenges the person who is named, and does not also advertise the seat", () => {
    const { body } = creationFor({
      rules: draft,
      source: null,
      opponent: them,
      again: null,
      fork: null,
      carry: {},
    });
    expect(body.challengeId).toBe("mem_them");
    // A game that is both a challenge and an advertisement is two games.
    expect(body.open).toBe(false);
  });

  /*
   * A REMATCH IS ONLY A REMATCH WHILE IT IS UNCHANGED, which is the whole point
   * of this module. The creation route takes everything about a rematch from the
   * game being repeated and nothing from the request, deliberately — so while
   * the form still describes that game, asking for the rematch itself is what
   * carries the seed, the line length and the swapped colours.
   */
  it("asks for the rematch itself while nothing has been changed", () => {
    const { body, repeat } = creationFor({
      rules: draft,
      source: draft,
      opponent: them,
      again,
      fork: null,
      carry,
    });
    expect(body).toEqual({ rematch: "g_old" });
    expect(repeat).toBe(true);
  });

  /*
   * And the moment something IS changed it stops claiming to be one. This is
   * John's case: "I want to definitely play Bob at Reversi, but I want to try
   * that variant, and change some rules." Asking for a rematch and a different
   * variant in one request would be a way of quietly not being a rematch, which
   * the route is right to refuse; so it asks for what it actually is.
   */
  it("becomes an ordinary challenge once a rule is changed", () => {
    const { body, repeat } = creationFor({
      rules: { ...draft, variant: "reversi", size: 8 },
      source: draft,
      opponent: them,
      again,
      fork: null,
      carry,
    });
    expect(repeat).toBe(false);
    expect(body.rematch).toBeUndefined();
    expect(body.variant).toBe("reversi");
    expect(body.challengeId).toBe("mem_them");
  });

  /*
   * The line length is the reason `carry` exists. A freestyle game agreed at
   * three in a row is a real game somebody played, and a changed rematch of one
   * that came back needing five would be unwinnable on the board it was played
   * on — the shape of bug John found in a rematched game of noughts and crosses.
   */
  it("carries what the form has no row for, when it is no longer a plain rematch", () => {
    const { body } = creationFor({
      rules: { ...draft, moveTimeMs: 300_000 },
      source: draft,
      opponent: them,
      again,
      fork: null,
      carry,
    });
    expect(body.winLength).toBe(3);
    expect(body.seed).toBe(7);
    // And the change that stopped it being a rematch survives the carrying.
    expect(body.moveTimeMs).toBe(300_000);
  });

  /*
   * A FORK NAMES NO OPPONENT AND MUST NOT. The route finds the other player in
   * the game being forked, and falls back to a board at one screen when nobody
   * held the seat — a fallback that only watches for an ADDRESS. Sending an id
   * as well would bind a seat and mark the game a hot seat at the same time,
   * which is not a state anything here means.
   */
  it("asks for the position and leaves the opponent to the route", () => {
    const { body } = creationFor({
      rules: draft,
      source: draft,
      opponent: them,
      again: null,
      fork,
      carry,
    });
    expect(body.from).toEqual({ id: "g_old", move: 12 });
    expect(body.challengeId).toBeUndefined();
    expect(body.open).toBe(false);
  });

  /* A fork is never a rematch, however unchanged the form is. */
  it("never claims a fork is a repeat", () => {
    expect(
      creationFor({ rules: draft, source: draft, opponent: them, again: null, fork, carry }).repeat,
    ).toBe(false);
  });
});

describe("whether two drafts describe the same game", () => {
  it("agrees with itself", () => {
    expect(sameRules(draft, draft)).toBe(true);
  });

  it("notices every rule this form can change", () => {
    expect(sameRules(draft, { ...draft, variant: "renju" })).toBe(false);
    expect(sameRules(draft, { ...draft, size: 19 })).toBe(false);
    expect(sameRules(draft, { ...draft, obstacles: "hoshi" })).toBe(false);
    expect(sameRules(draft, { ...draft, opening: "swap" })).toBe(false);
    expect(sameRules(draft, { ...draft, moveTimeMs: 300_000 })).toBe(false);
    expect(sameRules(draft, { ...draft, timeoutPenalty: "game" })).toBe(false);
    expect(sameRules(draft, { ...draft, clockMode: "game" })).toBe(false);
    expect(sameRules(draft, { ...draft, rated: false })).toBe(false);
    expect(sameRules(draft, { ...draft, allowResign: false })).toBe(false);
  });

  /*
   * The handicap included, because it is the one field that is an object. A
   * shallow comparison would have called a rematch unchanged after somebody
   * chose to give their opponent a start, which is the single most deliberate
   * change anybody makes on this screen.
   */
  it("notices a handicap, colour and toggles alike", () => {
    const handicapped = { ...draft, handicap: { ...NO_HANDICAP, stone: STONES.black } };
    expect(sameRules(draft, handicapped)).toBe(false);
    expect(
      sameRules(handicapped, {
        ...handicapped,
        handicap: { ...handicapped.handicap, doubleThree: true },
      }),
    ).toBe(false);
    expect(
      sameRules(handicapped, {
        ...handicapped,
        handicap: { ...handicapped.handicap, secondStoneExclusion: 3 },
      }),
    ).toBe(false);
  });

  /*
   * Where the seat is advertised is not a rule of the game: the screen decides
   * that from who is being played, and a rematch is never posted.
   */
  it("does not count where the seat is advertised", () => {
    expect(sameRules(draft, { ...draft, open: true })).toBe(true);
  });
});
