import { beforeEach, describe, expect, it, vi } from "vitest";

import { STONES } from "@/lib/gomoku/gomoku.constants";

/**
 * CHANGING THE RULES OF A GAME NOBODY HAS ANSWERED YET — AND THE ONE RULE
 * THAT IS NOT A RULE.
 *
 * A posted seat is genuinely still being set up: one seat taken, the other on
 * the noticeboard, nobody to disagree with. `rulesAreSettled` says so, and the
 * clock, the board, the opening and the ratings may all still move.
 *
 * The game itself may not, and the reason is not about fairness — it is that
 * the game is in the ADDRESS. `/games/reversi/match/<id>` names it, so do the
 * seat links that were handed out, so does every history row and every link
 * anybody has already sent. A variant change turns all of them into pointers
 * at a game that is no longer there, which is a different kind of damage from
 * a clock somebody did not expect: the clock is visible on the board, and a
 * stale address is a lie nobody can see.
 *
 * Redirecting is what we do about the ones already in the wild, and it is a
 * repair rather than a licence. So the rule this file holds:
 *
 *   The game is decided before the seat is posted and cannot change afterwards.
 *   Everything else about a game nobody has answered still can.
 */

type Row = Record<string, unknown> & { id: string };

let row: Row | null = null;
let updates: Record<string, unknown>[] = [];

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: {
      findUnique: async () => row,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        updates.push(data);
        if (row !== null) Object.assign(row, data);
        return row;
      },
    },
  },
}));

// The detail read back after a successful write. Nothing here asserts on it;
// what matters is whether the write happened at all.
vi.mock("./gameHistory", () => ({ fetchGameDetail: async () => ({ id: "g1" }) }));

const { changesTheGame, updateLiveGameSettings } = await import("./liveGameSettings");

/**
 * A game with the white seat posted on the noticeboard: black is somebody's,
 * white is nobody's, no stone is down. The case `rulesAreSettled` deliberately
 * leaves open.
 */
function postedSeat(over: Partial<Row> = {}): Row {
  return {
    id: "g1",
    status: "active",
    variant: "freestyle",
    size: 15,
    winLength: 5,
    obstacles: "none",
    opening: "free",
    handicap: null,
    seed: 1,
    blackName: "Poster",
    whiteName: "",
    moveTimeMs: null,
    timeoutPenalty: "turn",
    drawLimit: "none",
    allowResign: true,
    clockMode: "move",
    rated: true,
    openSeat: STONES.white,
    openedAt: new Date(),
    blackClaimedAt: new Date(),
    whiteClaimedAt: null,
    blackToken: "black-token",
    whiteToken: "white-token",
    blackMemberId: "poster",
    whiteMemberId: null,
    offeredAt: null,
    moves: [],
    ...over,
  };
}

beforeEach(() => {
  row = postedSeat();
  updates = [];
});

describe("changesTheGame", () => {
  const held = { variant: "freestyle" };

  it("is true only of a variant that differs from the game's own", () => {
    expect(changesTheGame({ variant: "reversi" }, held)).toBe(true);
    expect(changesTheGame({ variant: "freestyle" }, held)).toBe(false);
  });

  it("is false when the payload says nothing about the game", () => {
    /*
     * The distinction the whole rule rests on. Silence is not a change, and
     * `named()` in the route is what turns a schema default back into silence —
     * without this, a payload about the clock would refuse itself.
     */
    expect(changesTheGame({}, held)).toBe(false);
    expect(changesTheGame({ variant: undefined }, held)).toBe(false);
  });
});

describe("a posted seat is still being set up", () => {
  it("lets the clock be fixed", async () => {
    const outcome = await updateLiveGameSettings("g1", "black-token", { moveTimeMs: 30_000 });
    expect(outcome.ok, JSON.stringify(outcome)).toBe(true);
    expect(updates).toHaveLength(1);
    expect(updates[0]?.moveTimeMs).toBe(30_000);
  });

  it("lets the board, the opening, the pace and the ratings be fixed", async () => {
    /*
     * Named one at a time rather than in one payload, because the refusal
     * below must not be able to pass by refusing changes wholesale — these
     * four are the reason the form is not simply closed on a posted seat.
     */
    const asked = [
      { size: 19 },
      { opening: "swap2" },
      { clockMode: "game" as const, moveTimeMs: 600_000 },
      { rated: false },
    ];
    for (const one of asked) {
      row = postedSeat();
      updates = [];
      const outcome = await updateLiveGameSettings("g1", "black-token", one);
      expect(outcome.ok, `${JSON.stringify(one)} → ${JSON.stringify(outcome)}`).toBe(true);
      for (const [key, value] of Object.entries(one)) expect(updates[0]?.[key], key).toBe(value);
    }
  });

  it("lets a rule change that names the game it already is through", async () => {
    /*
     * The panel and the CLI both send whole payloads, and a whole payload
     * carries the variant whether or not anybody touched it. Refusing on the
     * key being PRESENT would refuse every change there is; the question is
     * whether the value differs from the game's own.
     */
    const outcome = await updateLiveGameSettings("g1", "black-token", {
      variant: "freestyle",
      moveTimeMs: 30_000,
    });
    expect(outcome.ok, JSON.stringify(outcome)).toBe(true);
    expect(updates[0]?.moveTimeMs).toBe(30_000);
  });
});

describe("the game itself is not one of the rules that can move", () => {
  it("refuses a variant change on a posted seat, and writes nothing", async () => {
    const outcome = await updateLiveGameSettings("g1", "black-token", { variant: "reversi" });
    expect(outcome).toEqual({ ok: false, reason: "different-game" });
    // The whole point: the row is untouched, so the address still names it.
    expect(updates).toEqual([]);
    expect(row?.variant).toBe("freestyle");
  });

  it("refuses it in the same breath as a change that would be allowed alone", async () => {
    /*
     * The shape the board's own form would have sent, and the shape a script
     * reaching the route would send: one payload, one allowed field, one that
     * is not. The allowed one must not carry the other in with it.
     */
    const outcome = await updateLiveGameSettings("g1", "black-token", {
      moveTimeMs: 30_000,
      variant: "reversi",
    });
    expect(outcome).toEqual({ ok: false, reason: "different-game" });
    expect(updates).toEqual([]);
    expect(row?.moveTimeMs).toBeNull();
  });

  it("refuses it from EITHER seat, including the one nobody is in yet", async () => {
    // The posted seat's token is mintable by whoever is sent it; the rule is
    // about the address, so it does not depend on which chair asks.
    const outcome = await updateLiveGameSettings("g1", "white-token", { variant: "reversi" });
    expect(outcome).toEqual({ ok: false, reason: "different-game" });
    expect(updates).toEqual([]);
  });

  it("refuses it on a private game whose other seat went out as a link", async () => {
    /*
     * The other game `rulesAreSettled` leaves open: no posted seat, one member
     * and a null, the second seat's link sent to one person. Its clock may move
     * for the same reason a posted seat's may — and the link that was sent
     * carries the game's name in it, so its address is in the same wild.
     */
    row = postedSeat({ openSeat: null, openedAt: null, blackClaimedAt: null });
    const outcome = await updateLiveGameSettings("g1", "black-token", { variant: "reversi" });
    expect(outcome).toEqual({ ok: false, reason: "different-game" });
    expect(updates).toEqual([]);

    // And its clock still moves, so this is not the settled refusal in disguise.
    row = postedSeat({ openSeat: null, openedAt: null, blackClaimedAt: null });
    expect((await updateLiveGameSettings("g1", "black-token", { moveTimeMs: 30_000 })).ok).toBe(
      true,
    );
  });
});

describe("a game two people are in refuses everything, as before", () => {
  it("refuses a clock change once the other seat is bound", async () => {
    row = postedSeat({ openSeat: null, whiteMemberId: "answerer", whiteClaimedAt: new Date() });
    const outcome = await updateLiveGameSettings("g1", "black-token", { moveTimeMs: 30_000 });
    expect(outcome).toEqual({ ok: false, reason: "settled" });
    expect(updates).toEqual([]);
  });

  it("still says `started` once a stone is down", async () => {
    row = postedSeat({ moves: [{ number: 1 }] });
    const outcome = await updateLiveGameSettings("g1", "black-token", { variant: "reversi" });
    expect(outcome).toEqual({ ok: false, reason: "started" });
    expect(updates).toEqual([]);
  });

  it("keeps its own refusals ahead of this one", async () => {
    /*
     * Order matters for what a caller is told. A variant change to a game that
     * does not exist is `not-found`, not `different-game`: the second would
     * imply there is a game there whose address this would spoil.
     */
    row = null;
    expect(await updateLiveGameSettings("g1", "black-token", { variant: "reversi" })).toEqual({
      ok: false,
      reason: "not-found",
    });

    row = postedSeat({ status: "finished" });
    expect(await updateLiveGameSettings("g1", "black-token", { variant: "reversi" })).toEqual({
      ok: false,
      reason: "finished",
    });

    row = postedSeat();
    expect(await updateLiveGameSettings("g1", "nobody's-token", { variant: "reversi" })).toEqual({
      ok: false,
      reason: "wrong-token",
    });
  });
});
