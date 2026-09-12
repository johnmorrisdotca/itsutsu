import { describe, expect, it } from "vitest";

import type { Against } from "./liveAgainst";
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

const NOBODY: Against = { seats: {}, source: {}, hotSeat: false, offer: {}, offeredSeat: null };

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
    const response = createdResponse({
      created: CREATED,
      asked: asked({}),
      against: NOBODY,
      caller: null,
    });

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
    const response = createdResponse({
      created: CREATED,
      asked: asked({ challengeId: "them" }),
      against: { ...NOBODY, seats: { blackMemberId: "me", whiteMemberId: "them" } },
      caller: "me",
    });

    expect(await response.json()).toEqual({ id: "game-1", blackToken: "black-token" });
  });

  /*
   * THEIR OWN SEAT, WHICHEVER COLOUR IT IS. A rematch swaps the colours, so the
   * caller is white about half the time, and returning black for every withheld
   * case would have handed them their opponent's token in exactly those games.
   */
  it("hands back the caller's own colour when a rematch has swapped them", async () => {
    const response = createdResponse({
      created: CREATED,
      asked: asked({ rematch: "origin-1" }),
      against: { ...NOBODY, seats: { blackMemberId: "them", whiteMemberId: "me" } },
      caller: "me",
    });

    expect(await response.json()).toEqual({ id: "game-1", whiteToken: "white-token" });
  });

  it("withholds a seat somebody has only been asked for", async () => {
    const response = createdResponse({
      created: CREATED,
      asked: asked({ challengeId: "them" }),
      against: {
        ...NOBODY,
        seats: { blackMemberId: "me" },
        offer: { offeredToMemberId: "them", offeredAt: new Date() },
        offeredSeat: "white",
      },
      caller: "me",
    });

    expect(await response.json()).toEqual({ id: "game-1", blackToken: "black-token" });
  });

  it("withholds a seat posted for whoever sits down", async () => {
    const response = createdResponse({
      created: CREATED,
      asked: asked({ open: true }),
      against: { ...NOBODY, seats: { blackMemberId: "me" } },
      caller: "me",
    });

    expect(await response.json()).toEqual({ id: "game-1", blackToken: "black-token" });
  });

  it("claims a hot-seat board for the browser that started it, and nothing else does", () => {
    const one = createdResponse({
      created: CREATED,
      asked: asked({ hotSeat: true }),
      against: { ...NOBODY, hotSeat: true },
      caller: null,
    });
    const seat = one.cookies.get("seat_game-1");

    expect(seat?.value).toBe("black-token");
    expect(seat?.httpOnly).toBe(true);
    expect(seat?.path).toBe("/");

    const shared = createdResponse({
      created: CREATED,
      asked: asked({}),
      against: NOBODY,
      caller: null,
    });
    expect(shared.cookies.get("seat_game-1")).toBeUndefined();
  });

  /** The address a match actually lives at, so a caller reading Location lands on it. */
  it("says where the game is, under the name the request gave it", () => {
    const response = createdResponse({
      created: CREATED,
      asked: asked({ variant: "reversi" }),
      against: NOBODY,
      caller: null,
    });

    expect(response.headers.get("Location")).toBe("/games/reversi/match/game-1");
  });
});
