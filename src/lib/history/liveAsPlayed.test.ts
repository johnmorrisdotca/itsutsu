import { describe, expect, it } from "vitest";

import type { Against } from "./liveAgainst";
import { settingsAsPlayed } from "./liveAsPlayed";
import { liveGameSchema, type CreationAsked } from "./liveRequest";

/**
 * THE GAME AS IT WILL ACTUALLY BE PLAYED — pure, so it can be asked.
 *
 * This rule has produced the same bug three times: the request, the game a
 * position came out of, and the variant's own spec disagree, and the order they
 * are asked in decides the game. It was a spread in the middle of a route
 * handler, where the only way to ask it was to post a request and read what
 * `createLiveGame` was called with. Every case below is a question about the
 * ordering, asked directly.
 */

/** The request as the route would hand it over: parsed, with the names beside it. */
function asked(body: Record<string, unknown>): CreationAsked {
  return { data: liveGameSchema.parse(body), said: new Set(Object.keys(body)) };
}

/** Against nobody: the shape a lobby game or a posted seat arrives in. */
const NOBODY: Against = {
  seats: {},
  source: {},
  hotSeat: false,
  offer: {},
  offeredSeat: null,
  computerSeated: false,
};

/** What a forked or rematched game of noughts and crosses carries with it. */
const CARRIED_NOUGHTS = {
  size: 3,
  variant: "tictactoe",
  obstacles: "none",
  opening: "free",
  handicap: null,
  seed: 11,
  opener: "black",
  winLength: 3,
  moveTimeMs: 3 * 24 * 60 * 60_000,
  clockMode: "move",
  timeoutPenalty: "game",
  allowResign: false,
  drawLimit: "none",
  rated: false,
};

describe("settingsAsPlayed — the position wins over the request", () => {
  it("plays the game the position was played on, not the one the request named", () => {
    const played = settingsAsPlayed({
      asked: asked({ variant: "reversi", size: 19, from: { id: "origin-1", move: 2 } }),
      against: { ...NOBODY, source: { ...CARRIED_NOUGHTS } },
    });

    expect(played.variant).toBe("tictactoe");
    expect(played.size).toBe(3);
    expect(played.seed, "the seed that scatters a variant's obstacles").toBe(11);
  });

  it("carries the position itself, as many moves as were asked for", () => {
    const played = settingsAsPlayed({
      asked: asked({ from: { id: "origin-1", move: 3 } }),
      against: { ...NOBODY, source: { ...CARRIED_NOUGHTS } },
    });

    expect(played.from).toEqual({ id: "origin-1", moves: 3 });
  });

  it("names no position where none was asked for", () => {
    expect(settingsAsPlayed({ asked: asked({}), against: NOBODY }).from).toBeUndefined();
  });
});

/**
 * JOHN'S UNWINNABLE BOARD, AND THE HALF OF IT THE FIRST FIX DID NOT REACH.
 *
 * A rematch sends its game's id and nothing else on purpose, so the request's
 * `variant` falls back to the schema's default of freestyle — whose spec says
 * null for the line length, because the length is a thing two players agree.
 * Read from the request, that is nothing at all, and the length fell through to
 * five: three in a row on a three-by-three board, needing five to win. John
 * found it playing his daughter — he put his winning move down and nothing
 * happened, because on that board nothing ever could.
 */
describe("settingsAsPlayed — the line length", () => {
  it("takes the length a variant fixes for itself, whatever anybody sent", () => {
    const played = settingsAsPlayed({
      asked: asked({ rematch: "origin-1", winLength: 5 }),
      against: { ...NOBODY, source: { ...CARRIED_NOUGHTS } },
    });

    expect(played.winLength, "noughts and crosses is three in a row and cannot be otherwise").toBe(3);
  });

  /*
   * THE SECOND HALF. Freestyle fixes no length, so the carried game is the only
   * thing that knows what these two people agreed — and a 9×9 freestyle game
   * agreed at THREE came back from a rematch needing five.
   */
  it("takes a variable length from the game it came out of, not from the request", () => {
    const played = settingsAsPlayed({
      asked: asked({ rematch: "origin-1" }),
      against: {
        ...NOBODY,
        source: { ...CARRIED_NOUGHTS, variant: "freestyle", size: 9, winLength: 3 },
      },
    });

    expect(played.variant).toBe("freestyle");
    expect(played.winLength).toBe(3);
  });

  it("takes the caller's length where nothing was carried and the variant fixes none", () => {
    expect(settingsAsPlayed({ asked: asked({ winLength: 4 }), against: NOBODY }).winLength).toBe(4);
  });

  it("falls back to the default only when nobody has said anything", () => {
    expect(settingsAsPlayed({ asked: asked({}), against: NOBODY }).winLength).toBe(5);
  });
});

describe("settingsAsPlayed — the rating", () => {
  /*
   * `rated` IS SPREAD AFTER `source` ON PURPOSE. `ratedAtCreation` has already
   * read what the source carried, so letting the source win again would undo
   * its last clause — the one that stops a fork minting a rated board at one
   * screen, which is the shape of the twelve rows found on production.
   */
  it("cannot be rated at one screen, however it is asked for or inherited", () => {
    const played = settingsAsPlayed({
      asked: asked({ from: { id: "origin-1", move: 2 }, rated: true }),
      against: { ...NOBODY, hotSeat: true, source: { ...CARRIED_NOUGHTS, rated: true } },
    });

    expect(played.hotSeat).toBe(true);
    expect(played.rated).toBe(false);
  });

  it("inherits the rating of the game a position came out of", () => {
    const played = settingsAsPlayed({
      asked: asked({ from: { id: "origin-1", move: 2 } }),
      against: { ...NOBODY, source: { ...CARRIED_NOUGHTS, rated: true } },
    });

    expect(played.rated).toBe(true);
  });

  it("says yes where nobody said anything, as a posted seat and a challenge always have", () => {
    expect(settingsAsPlayed({ asked: asked({ open: true }), against: NOBODY }).rated).toBe(true);
  });
});

describe("settingsAsPlayed — what reaches the row", () => {
  it("writes the seats it was given and never the fields that only addressed the request", () => {
    const played = settingsAsPlayed({
      asked: asked({ challengeId: "bot-kyu", rematch: "origin-1", from: { id: "o", move: 0 } }),
      against: { ...NOBODY, seats: { blackMemberId: "me", whiteMemberId: "them", whiteName: "Them" } },
    });

    expect(played.blackMemberId).toBe("me");
    expect(played.whiteMemberId).toBe("them");
    expect(played.whiteName).toBe("Them");
    // A game row has no column for who was asked or which game it came out of.
    expect("challenge" in played).toBe(false);
    expect("challengeId" in played).toBe(false);
    expect("rematch" in played).toBe(false);
  });

  it("carries the offer columns an offered seat makes, and nothing where nobody was asked", () => {
    const offeredAt = new Date("2026-09-12T00:00:00.000Z");
    const offered = settingsAsPlayed({
      asked: asked({ challengeId: "them" }),
      against: {
        ...NOBODY,
        seats: { blackMemberId: "me" },
        offer: { offeredToMemberId: "them", offeredAt },
        offeredSeat: "white",
      },
    });

    expect(offered.offeredToMemberId).toBe("them");
    expect(offered.offeredAt).toBe(offeredAt);
    expect("offeredToMemberId" in settingsAsPlayed({ asked: asked({}), against: NOBODY })).toBe(false);
  });

  /** No handicap is a handicap for nobody, and the row wants the whole shape. */
  it("writes a handicap for nobody where none was chosen", () => {
    const played = settingsAsPlayed({ asked: asked({}), against: NOBODY });

    expect(played.handicap.stone).toBeNull();
  });
});
