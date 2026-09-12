import { describe, expect, it } from "vitest";

import type { Against } from "./liveAgainst";
import { settingsAsPlayed } from "./liveAsPlayed";
import { createdResponse, refusalResponse } from "./liveResponse";
import { liveGameSchema, type CreationAsked } from "./liveRequest";

/**
 * WHAT THE CALLER IS TOLD, INCLUDING WHICH SEAT KEYS THE ANSWER MAY HOLD.
 *
 * A seat key is the whole credential for playing that colour — `stoneForToken`
 * is what every seat-bound endpoint identifies a player by — so which of them a
 * 201 carries is a security decision. The rule is `withholdsASeat` and is tested
 * on its own in `seatTokens.test.ts`; these are about the answer being assembled
 * from it correctly, which is the step that used to be four hundred lines down a
 * route handler.
 */

function asked(body: Record<string, unknown>): CreationAsked {
  return { data: liveGameSchema.parse(body), said: new Set(Object.keys(body)) };
}

const CREATED = { id: "game-1", blackToken: "black-token", whiteToken: "white-token" };

const NOBODY: Against = {
  seats: {},
  source: {},
  hotSeat: false,
  offer: {},
  offeredSeat: null,
  computerSeated: false,
};

/**
 * A 201 for one creation, with the settings the row would be written from
 * worked out the way the route works them out.
 *
 * `played` IS NOT A LITERAL HERE, ON PURPOSE. The answer names the game the row
 * is, and a test that typed that name in by hand would agree just as readily
 * with a header built from the REQUEST — which is the bug this file now pins.
 * `settingsAsPlayed` is the same function the route calls, on the same pair, so
 * what these cases assert about is the real merge.
 */
function answer(
  body: Record<string, unknown>,
  against: Against = NOBODY,
  caller: string | null = null,
) {
  const asking = asked(body);
  return createdResponse({
    created: CREATED,
    asked: asking,
    against,
    played: settingsAsPlayed({ asked: asking, against }),
    caller,
  });
}

describe("refusalResponse", () => {
  /*
   * THE HEADER DIFFERENCE IS INHERITED, NOT CHOSEN. `badRequest` and
   * `unprocessable` set no `Cache-Control`; every other refusal on this path
   * sets `no-store`. Pinned here because smoothing it over would be a change to
   * the wire that nothing asked for and nothing else would catch.
   */
  it("answers a 400 the way badRequest always has", async () => {
    const response = refusalResponse({ status: 400, error: "That game has fewer moves." });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "That game has fewer moves." });
    expect(response.headers.get("Cache-Control")).toBeNull();
  });

  it("answers a 422 with the schema's own account of what was wrong", async () => {
    const response = refusalResponse({
      status: 422,
      error: "That game could not be started.",
      issues: [{ path: ["variant"] }],
    });

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      error: "That game could not be started.",
      details: [{ path: ["variant"] }],
    });
  });

  it("answers every other refusal with its status and no-store", async () => {
    for (const status of [401, 403, 404] as const) {
      const response = refusalResponse({ status, error: "No such member." });
      expect(response.status).toBe(status);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(await response.json()).toEqual({ error: "No such member." });
    }
  });
});

describe("createdResponse", () => {
  it("hands both keys back where both seats are the caller's to give", async () => {
    const response = answer({});

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(CREATED);
    expect(response.headers.get("Location")).toBe("/games/gomoku/match/game-1");
  });

  /*
   * A SEAT THAT IS SOMEBODY ELSE'S IS NOT YOURS TO HOLD THE TOKEN FOR. The
   * challenger was once handed their opponent's token and could resign on their
   * behalf, crediting themselves a rated win and writing a loss that person
   * never played onto a permanent public record.
   */
  it("keeps the other person's key when a seat is bound to them", async () => {
    const response = answer(
      { challengeId: "them" },
      { ...NOBODY, seats: { blackMemberId: "me", whiteMemberId: "them" } },
      "me",
    );

    expect(await response.json()).toEqual({ id: "game-1", blackToken: "black-token" });
  });

  /*
   * THEIR OWN SEAT, WHICHEVER COLOUR IT IS. A rematch swaps the colours, so the
   * caller is white about half the time, and returning black for every withheld
   * case would have handed them their opponent's token in exactly those games.
   */
  it("hands back the caller's own colour when a rematch has swapped them", async () => {
    const response = answer(
      { rematch: "origin-1" },
      { ...NOBODY, seats: { blackMemberId: "them", whiteMemberId: "me" } },
      "me",
    );

    expect(await response.json()).toEqual({ id: "game-1", whiteToken: "white-token" });
  });

  it("withholds a seat somebody has only been asked for", async () => {
    const response = answer(
      { challengeId: "them" },
      {
        ...NOBODY,
        seats: { blackMemberId: "me" },
        offer: { offeredToMemberId: "them", offeredAt: new Date() },
        offeredSeat: "white",
      },
      "me",
    );

    expect(await response.json()).toEqual({ id: "game-1", blackToken: "black-token" });
  });

  it("withholds a seat posted for whoever sits down", async () => {
    const response = answer({ open: true }, { ...NOBODY, seats: { blackMemberId: "me" } }, "me");

    expect(await response.json()).toEqual({ id: "game-1", blackToken: "black-token" });
  });

  it("claims a hot-seat board for the browser that started it, and nothing else does", () => {
    const one = answer({ hotSeat: true }, { ...NOBODY, hotSeat: true });
    const seat = one.cookies.get("seat_game-1");

    expect(seat?.value).toBe("black-token");
    expect(seat?.httpOnly).toBe(true);
    expect(seat?.path).toBe("/");

    const shared = answer({});
    expect(shared.cookies.get("seat_game-1")).toBeUndefined();
  });

  /** The address a match actually lives at, so a caller reading Location lands on it. */
  it("says where the game is, under the name the request gave it where nothing carries another", () => {
    expect(answer({ variant: "reversi" }).headers.get("Location")).toBe("/games/reversi/match/game-1");
  });

  /*
   * AND UNDER THE NAME IT WILL BE PLAYED AS, WHERE THAT IS A DIFFERENT NAME.
   *
   * This is the case the header got wrong, and it is not a contrived one. A fork
   * continues a POSITION, so the game that position was played on comes with it
   * and overrules whatever the request named: `settingsToCarry` puts the
   * origin's variant into `source`, and `settingsAsPlayed` spreads the source
   * OVER the request, because replaying the copied moves onto any other board
   * would not be the same position. `route.test.ts` posts this very body — a
   * fork sent `variant: "reversi"` — to pin that the row ignores it. A rematch
   * is the same thing one step further along: it sends no variant at all, so the
   * schema's default of freestyle is the whole of what the request has to say.
   *
   * So the row here is a game of gomoku, the request said Reversi, and the
   * answer used to hand the caller `/games/reversi/match/game-1` — an address
   * naming a game that row is not. The two are asserted to DIFFER first, because
   * a Location built from the request would satisfy the line below just as
   * happily if they agreed.
   */
  it("says where the game is under the name it will be PLAYED as, not the one asked for", () => {
    const body = { variant: "reversi", from: { id: "origin-1", move: 2 } };
    const forked: Against = { ...NOBODY, source: { variant: "freestyle", winLength: 5 } };

    expect(asked(body).data.variant, "the game the caller asked for").toBe("reversi");
    expect(settingsAsPlayed({ asked: asked(body), against: forked }).variant, "the game the row is").toBe(
      "freestyle",
    );

    // Freestyle gomoku lives at /games/gomoku — the slugs are a table, see `slugs.ts`.
    expect(answer(body, forked).headers.get("Location")).toBe("/games/gomoku/match/game-1");
  });
});
