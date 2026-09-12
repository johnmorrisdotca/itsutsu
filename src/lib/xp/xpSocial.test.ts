import { beforeEach, describe, expect, it, vi } from "vitest";

import { RULE_VARIANTS } from "@/lib/gomoku/gomoku.constants";
import { STONES } from "@/lib/gomoku/gomoku.constants";

/**
 * The awards that are about other people, driven through the writers that pay
 * them, over a fake that keeps the unique index the design rests on.
 *
 * Two things are being asserted and they are different questions. What COUNTS as
 * an ask, an answer or a buddy — which is pure, and is most of the file. And that
 * the writer pays it once: adding the same buddy twice is one row, answering the
 * same challenge twice is one row, a different buddy is a second.
 */

type Event = { memberId: string; type: string; points: number; subject: string; dayKey: string };

let events: Event[] = [];
let upserts = 0;
const members = new Map<
  string,
  { id: string; email: string | null; botTier: string | null; timeZone: string; xp: number; xpFlash: unknown; xpLastAt: Date | null }
>();

function keyOf(row: { memberId: string; type: string; subject: string }): string {
  return `${row.memberId}\0${row.type}\0${row.subject}`;
}

const prismaFake = {
  member: {
    findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
      if (where.id !== undefined) return members.get(where.id) ?? null;
      return [...members.values()].find((row) => row.email === where.email) ?? null;
    },
    findMany: async ({ where }: { where: { email: { in: string[] } } }) =>
      [...members.values()].filter((row) => row.email !== null && where.email.in.includes(row.email)),
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const row = members.get(where.id);
      if (row === undefined) throw new Error("no member");
      row.xp += (data.xp as { increment?: number } | undefined)?.increment ?? 0;
      if ("xpFlash" in data) row.xpFlash = data.xpFlash;
      return row;
    },
  },
  buddy: {
    upsert: async () => {
      upserts += 1;
      return {};
    },
  },
  xpEvent: {
    createMany: async ({ data, skipDuplicates }: { data: Event[]; skipDuplicates?: boolean }) => {
      let count = 0;
      for (const row of data) {
        if (events.some((held) => keyOf(held) === keyOf(row))) {
          if (skipDuplicates !== true) throw new Error("unique violation");
          continue;
        }
        events.push({ ...row });
        count += 1;
      }
      return { count };
    },
    groupBy: async ({ where }: { where: { memberId: string; dayKey: string; type: { in: string[] } } }) => {
      const counts = new Map<string, number>();
      for (const row of events) {
        if (row.memberId !== where.memberId || row.dayKey !== where.dayKey) continue;
        if (!where.type.in.includes(row.type)) continue;
        counts.set(row.type, (counts.get(row.type) ?? 0) + 1);
      }
      return [...counts.entries()].map(([type, count]) => ({ type, _count: { _all: count } }));
    },
    /** The ledger's own record of who asked for this game. See `awardAnsweredChallenge`. */
    findFirst: async ({ where }: { where: { memberId: string; subject: string; type: { in: string[] } } }) =>
      events.find(
        (row) =>
          row.memberId === where.memberId &&
          row.subject === where.subject &&
          where.type.in.includes(row.type),
      ) ?? null,
  },
  $transaction: async (input: unknown) =>
    typeof input === "function"
      ? (input as (tx: unknown) => Promise<unknown>)(prismaFake)
      : Promise.all(input as Promise<unknown>[]),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaFake }));

const {
  CREATED_GAME_KINDS,
  awardAnsweredChallenge,
  awardCreatedGame,
  createdGameKind,
  seatHasNotMoved,
} = await import("./xpSocial");
const { addBuddy } = await import("@/lib/social/buddies");

function member(id: string, email: string | null, extra: { botTier?: string } = {}) {
  members.set(id, {
    id,
    email,
    botTier: extra.botTier ?? null,
    timeZone: "",
    xp: 0,
    xpFlash: null,
    xpLastAt: null,
  });
}

function ledger(memberId: string): string[] {
  return events.filter((row) => row.memberId === memberId).map((row) => `${row.type} ${row.subject}`);
}

function paid(memberId: string, type: string): number {
  return events.filter((row) => row.memberId === memberId && row.type === type).length;
}

/** A game two members were asked to play: two seats, two tokens, never posted. */
function challenged(extra: Partial<Parameters<typeof awardAnsweredChallenge>[0]> = {}) {
  return {
    id: "asked-1",
    variant: RULE_VARIANTS.freestyle as string,
    blackToken: "b",
    whiteToken: "w",
    blackMemberId: "asker",
    whiteMemberId: "answerer",
    openedAt: null,
    moves: [{ stone: STONES.black }],
    ...extra,
  };
}

beforeEach(() => {
  events = [];
  upserts = 0;
  members.clear();
});

describe("which of the three a creation was", () => {
  it("names a rematch, a fork and a plain ask", () => {
    expect(createdGameKind({ rematch: "g1" })).toBe(CREATED_GAME_KINDS.rematch);
    expect(createdGameKind({ from: { id: "g1", move: 4 } })).toBe(CREATED_GAME_KINDS.fork);
    expect(createdGameKind({ challenge: "them@example.test" })).toBe(CREATED_GAME_KINDS.challenge);
    expect(createdGameKind({ challengeId: "m-them" })).toBe(CREATED_GAME_KINDS.challenge);
  });

  it("calls a fork a fork even though the route fills in a challenge for it", () => {
    // THE CASE THAT DECIDES THE ORDER. A fork against the same opponent sets
    // `challenge` on its way through the route — that is how the other seat gets
    // bound — so asking about the challenge first would pay a fork as an ask, and
    // asking about both would pay one action twice.
    expect(createdGameKind({ from: { id: "g1", move: 4 }, challenge: "them@example.test" })).toBe(
      CREATED_GAME_KINDS.fork,
    );
    expect(createdGameKind({ rematch: "g1", challenge: "them@example.test" })).toBe(
      CREATED_GAME_KINDS.rematch,
    );
  });

  it("names nothing for the lobby, a posted seat or a board at one screen", () => {
    // Nobody was asked, so nothing was sent. `awardCreatedGame` pays nothing at
    // all for a null rather than falling back to the cheapest award.
    expect(createdGameKind({})).toBeNull();
    expect(createdGameKind({ challenge: undefined, challengeId: undefined })).toBeNull();
  });

  it("pays the asker once per game, and again for the next one", async () => {
    member("asker", "asker@example.test");

    await awardCreatedGame({ memberId: "asker", gameId: "g1", kind: CREATED_GAME_KINDS.challenge });
    await awardCreatedGame({ memberId: "asker", gameId: "g1", kind: CREATED_GAME_KINDS.challenge });
    await awardCreatedGame({ memberId: "asker", gameId: "g2", kind: CREATED_GAME_KINDS.challenge });
    await awardCreatedGame({ memberId: "asker", gameId: "g3", kind: null });

    expect(ledger("asker")).toEqual(["challengeSent g1", "challengeSent g2"]);
  });

  it("pays a rematch and a fork their own awards", async () => {
    member("asker", "asker@example.test");

    await awardCreatedGame({ memberId: "asker", gameId: "r1", kind: CREATED_GAME_KINDS.rematch });
    await awardCreatedGame({ memberId: "asker", gameId: "f1", kind: CREATED_GAME_KINDS.fork });

    expect(ledger("asker")).toEqual(["rematchPlayed r1", "forkPlayed f1"]);
  });
});

describe("whether a seat has played yet", () => {
  it("reads the moves for the colour that seat plays", () => {
    const moves = [{ stone: STONES.black }, { stone: STONES.black }];
    expect(seatHasNotMoved({ variant: RULE_VARIANTS.freestyle, moves, stone: STONES.white })).toBe(true);
    expect(seatHasNotMoved({ variant: RULE_VARIANTS.freestyle, moves, stone: STONES.black })).toBe(false);
    expect(seatHasNotMoved({ variant: RULE_VARIANTS.freestyle, moves: [], stone: STONES.black })).toBe(true);
  });

  it("says it cannot tell where the record does not say who moved", () => {
    // Two kinds of game: where the mover chooses each stone's colour, and where
    // every stone is black whoever laid it. The stored move keeps the COLOUR
    // PLACED, so for those it cannot say whose move it was — and a rule that
    // cannot measure must not fire.
    const moves = [{ stone: STONES.black }];
    expect(seatHasNotMoved({ variant: RULE_VARIANTS.wildTicTacToe, moves, stone: STONES.white })).toBeNull();
    expect(seatHasNotMoved({ variant: RULE_VARIANTS.notakto, moves, stone: STONES.white })).toBeNull();
    expect(seatHasNotMoved({ variant: "shogi", moves, stone: STONES.white })).toBeNull();
  });
});

describe("answering a challenge", () => {
  beforeEach(() => {
    member("asker", "asker@example.test");
    member("answerer", "answerer@example.test");
  });

  /** The ask, as the creation would have recorded it. */
  function asked(gameId = "asked-1", by = "asker") {
    events.push({ memberId: by, type: "challengeSent", points: 5, subject: gameId, dayKey: "2026-09-09" });
  }

  it("pays the side that did not ask, on its first move", async () => {
    asked();
    await awardAnsweredChallenge(challenged(), STONES.white);
    expect(ledger("answerer")).toEqual(["challengeAnswered asked-1"]);
  });

  it("pays nothing to the side that asked", async () => {
    // Black's first move is the challenger starting their own game, which is not
    // answering anything.
    asked();
    await awardAnsweredChallenge(challenged({ moves: [] }), STONES.black);
    expect(ledger("asker")).toEqual(["challengeSent asked-1"]);
  });

  it("pays once, however many moves follow", async () => {
    asked();
    await awardAnsweredChallenge(challenged(), STONES.white);
    await awardAnsweredChallenge(challenged(), STONES.white);
    expect(paid("answerer", "challengeAnswered")).toBe(1);
  });

  it("pays nothing once that seat has played", async () => {
    asked();
    await awardAnsweredChallenge(
      challenged({ moves: [{ stone: STONES.black }, { stone: STONES.white }, { stone: STONES.black }] }),
      STONES.white,
    );
    expect(paid("answerer", "challengeAnswered")).toBe(0);
  });

  it("pays nothing when nobody asked", async () => {
    // No creation event for this game: it came from the lobby, or from a seat
    // somebody posted. There is no challenge to have answered.
    await awardAnsweredChallenge(challenged(), STONES.white);
    expect(paid("answerer", "challengeAnswered")).toBe(0);
  });

  it("pays nothing for a rematch the same member asked for themselves", async () => {
    // The ask has to be the OTHER member's. A game somebody created and then
    // played both sides of — which the seats make impossible, but the read is
    // keyed on the other member precisely so it stays impossible.
    events.push({ memberId: "answerer", type: "rematchPlayed", points: 10, subject: "asked-1", dayKey: "d" });
    await awardAnsweredChallenge(challenged(), STONES.white);
    expect(paid("answerer", "challengeAnswered")).toBe(0);
  });

  it("pays a rematch and a fork's first move too", async () => {
    // Both are games that appear in somebody's list without their asking, which
    // is what `challengeAnswered` is about. The creation event says which.
    events.push({ memberId: "asker", type: "rematchPlayed", points: 10, subject: "asked-1", dayKey: "d" });
    await awardAnsweredChallenge(challenged(), STONES.white);
    expect(paid("answerer", "challengeAnswered")).toBe(1);
  });

  it("pays nothing at one screen, on a posted seat, or with a loose seat", async () => {
    asked();
    // One token for both chairs: nobody was invited.
    await awardAnsweredChallenge(challenged({ blackToken: "same", whiteToken: "same" }), STONES.white);
    // Posted on the noticeboard: answered by sitting down, not by being asked.
    await awardAnsweredChallenge(challenged({ openedAt: new Date() }), STONES.white);
    // A seat nobody holds.
    await awardAnsweredChallenge(challenged({ whiteMemberId: null }), STONES.white);
    // The same member on both seats.
    await awardAnsweredChallenge(
      challenged({ blackMemberId: "answerer", whiteMemberId: "answerer" }),
      STONES.white,
    );
    expect(paid("answerer", "challengeAnswered")).toBe(0);
  });

  it("pays nothing in a game whose record cannot say who moved", async () => {
    asked("wild");
    await awardAnsweredChallenge(
      challenged({ id: "wild", variant: RULE_VARIANTS.wildTicTacToe }),
      STONES.white,
    );
    expect(paid("answerer", "challengeAnswered")).toBe(0);
  });
});

describe("keeping a buddy list", () => {
  it("pays the first buddy and the buddy, through addBuddy", async () => {
    member("me", "me@example.test");
    member("pal", "pal@example.test");

    await addBuddy("Me@example.test", "PAL@example.test");

    expect(upserts).toBe(1);
    expect(ledger("me")).toEqual(["firstBuddy ", "buddyAdded pal"]);
  });

  it("pays nothing the second time the same buddy is added", async () => {
    member("me", "me@example.test");
    member("pal", "pal@example.test");

    await addBuddy("me@example.test", "pal@example.test");
    await addBuddy("me@example.test", "pal@example.test");

    expect(paid("me", "buddyAdded")).toBe(1);
    expect(paid("me", "firstBuddy")).toBe(1);
  });

  it("pays a second buddy, and the first-buddy award only once", async () => {
    member("me", "me@example.test");
    member("pal", "pal@example.test");
    member("other", "other@example.test");

    await addBuddy("me@example.test", "pal@example.test");
    await addBuddy("me@example.test", "other@example.test");

    expect(paid("me", "buddyAdded")).toBe(2);
    expect(paid("me", "firstBuddy")).toBe(1);
  });

  it("pays nothing, and writes nothing, for somebody who is not a member", async () => {
    member("me", "me@example.test");

    expect(await addBuddy("me@example.test", "nobody@example.test")).toBe(false);

    expect(upserts).toBe(0);
    expect(ledger("me")).toEqual([]);
  });

  it("pays nothing for adding yourself", async () => {
    member("me", "me@example.test");
    expect(await addBuddy("me@example.test", "me@example.test")).toBe(false);
    expect(ledger("me")).toEqual([]);
  });
});
