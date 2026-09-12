import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * WHO A NEW GAME IS AGAINST — asked directly, rather than by posting a request
 * and reading what `createLiveGame` was called with.
 *
 * Six ways to arrive at a seat, and the three things that fall out of which one
 * it was: whether the other seat is an offer or a binding, whether the board is
 * one screen, and what the game a position came out of carries. Every one of
 * those has been a bug — somebody seated in a game they never agreed to, a
 * challenger handed their opponent's seat key, a rated scratch board.
 *
 * `prisma`, the session and the ignore list are mocked, so these are statements
 * about the decision and not about a database.
 */

/** The row every case reads as the game being forked or replayed. */
const ORIGIN = {
  id: "origin-1",
  status: "finished",
  size: 9,
  variant: "freestyle",
  obstacles: "none",
  opening: "free",
  handicap: null,
  seed: 4242,
  opener: "black",
  winLength: 3,
  drawLimit: "none",
  moveTimeMs: 3 * 24 * 60 * 60_000,
  clockMode: "move",
  timeoutPenalty: "game",
  allowResign: false,
  rated: false,
  moveCount: 4,
  blackName: "One",
  whiteName: "Two",
  blackMemberId: null as string | null,
  whiteMemberId: null as string | null,
};

let origin: Record<string, unknown> = { ...ORIGIN };
let members: Record<string, { id: string; name: string; email: string | null }> = {};
let session: { email: string; name?: string } | null = null;
let mine: string | null = null;
let ignoring = false;

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: { findUnique: async () => origin },
    member: {
      findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id !== undefined) return members[where.id] ?? null;
        return Object.values(members).find((one) => one.email === where.email) ?? null;
      },
    },
  },
}));
vi.mock("@/lib/auth/currentSession", () => ({
  currentSession: async () => session,
  currentMemberId: async () => mine,
}));
vi.mock("@/lib/social/ignores", () => ({ isIgnoring: async () => ignoring }));
vi.mock("@/lib/bots/botMembers", () => ({ ensureBotMembers: async () => {} }));

const { resolveAgainst } = await import("./liveAgainst");
const { liveGameSchema } = await import("./liveRequest");

function asked(body: Record<string, unknown>) {
  return { data: liveGameSchema.parse(body), said: new Set(Object.keys(body)) };
}

/** The decision, or a thrown assertion — so no case can pass by being refused. */
async function against(body: Record<string, unknown>) {
  const settled = await resolveAgainst(asked(body));
  if ("refused" in settled) {
    throw new Error(`refused ${settled.refused.status}: ${settled.refused.error}`);
  }
  return settled.against;
}

async function refusal(body: Record<string, unknown>) {
  const settled = await resolveAgainst(asked(body));
  if (!("refused" in settled)) throw new Error("expected a refusal, got a game");
  return settled.refused;
}

beforeEach(() => {
  origin = { ...ORIGIN };
  members = {
    them: { id: "them", name: "Them", email: "them@example.com" },
    me: { id: "me", name: "Me", email: "me@example.com" },
    // A computer player is a member with no address, because it never signs in.
    kyu: { id: "kyu", name: "Kyu", email: null },
  };
  session = null;
  mine = null;
  ignoring = false;
});

describe("resolveAgainst — nobody in particular", () => {
  it("leaves both seats empty for a game against whoever turns up", async () => {
    const settled = await against({});

    expect(settled.seats).toEqual({});
    expect(settled.hotSeat).toBe(false);
    expect(settled.offeredSeat).toBeNull();
    expect(settled.source, "nothing was carried, because there is no game behind it").toEqual({});
  });

  /*
   * A poster was once a stranger to their own game: with no member id on either
   * seat, the rule that stops somebody answering their own posted invitation had
   * nobody to recognise, so they could sit their own open seat and play both
   * colours — and the result went to the ladder as a game between two people.
   */
  it("binds the creator to a seat posted for anyone, so the rule has an id to compare", async () => {
    mine = "me";
    session = { email: "me@example.com" };

    expect((await against({ open: true })).seats.blackMemberId).toBe("me");
  });

  it("binds nobody to a posted seat when there is no account behind it", async () => {
    expect((await against({ open: true })).seats.blackMemberId).toBeUndefined();
  });
});

describe("resolveAgainst — asking somebody", () => {
  beforeEach(() => {
    mine = "me";
    session = { email: "me@example.com", name: "Me" };
  });

  /*
   * A GAME PROPOSED TO A PERSON IS AN OFFER, NOT A BINDING. All three ways of
   * asking used to write the other person's member id straight onto their seat,
   * which is how somebody came to be in a game they had never agreed to.
   */
  it("offers a person their seat rather than binding them to it", async () => {
    const settled = await against({ challengeId: "them" });

    expect(settled.seats.blackMemberId).toBe("me");
    expect(settled.seats.whiteMemberId, "lifted off and put on the offer").toBeUndefined();
    expect(settled.seats.whiteName, "their name stays, so both sides can see who it is with").toBe("Them");
    expect(settled.offeredSeat).toBe("white");
    expect(settled.offer).toMatchObject({ offeredToMemberId: "them" });
  });

  it("finds the same person by address as by id", async () => {
    const byAddress = await against({ challenge: "them@example.com" });

    expect(byAddress.offer).toMatchObject({ offeredToMemberId: "them" });
    expect(byAddress.seats.whiteName).toBe("Them");
  });

  /*
   * A COMPUTER IS SEATED, NOT ASKED. It has nothing to accept with and never
   * signs in, so a game waiting for it to agree would wait for ever.
   */
  it("seats a computer player outright and offers it nothing", async () => {
    const settled = await against({ challengeId: "kyu" });

    expect(settled.seats.whiteMemberId).toBe("kyu");
    expect(settled.offeredSeat).toBeNull();
    expect(settled.offer).toEqual({});
  });

  it("takes the names the caller typed over the accounts' own", async () => {
    const settled = await against({ challengeId: "kyu", blackName: "Chalk", whiteName: "Cheese" });

    expect(settled.seats.blackName).toBe("Chalk");
    expect(settled.seats.whiteName).toBe("Cheese");
  });

  it("refuses somebody who is not taking games from you", async () => {
    ignoring = true;

    expect(await refusal({ challengeId: "them" })).toMatchObject({ status: 403 });
  });

  it("refuses a member who is not there", async () => {
    expect(await refusal({ challengeId: "nobody" })).toMatchObject({
      status: 404,
      error: "No such member.",
    });
  });

  it("refuses a stranger with no account asking anybody for a game", async () => {
    session = null;
    mine = null;

    expect(await refusal({ challengeId: "them" })).toMatchObject({ status: 401 });
  });
});

describe("resolveAgainst — playing that game again", () => {
  beforeEach(() => {
    mine = "me";
    session = { email: "me@example.com", name: "Me" };
    origin = { ...ORIGIN, blackMemberId: "me", whiteMemberId: "them" };
  });

  /*
   * COLOURS SWAP: black moves first and in a five-in-a-row that is an advantage
   * worth measuring, so two people playing a series where one is always black
   * are not really playing a series.
   */
  it("swaps the colours and carries everything the game was played under", async () => {
    const settled = await against({ rematch: "origin-1" });

    expect(settled.seats.blackName, "they had black, so now I do — the other way round").toBe("Them");
    expect(settled.seats.whiteName).toBe("Me");
    expect(settled.source.moveTimeMs, "the pace is as much the game as the board is").toBe(
      ORIGIN.moveTimeMs,
    );
    expect(settled.source.winLength).toBe(ORIGIN.winLength);
  });

  it("asks rather than imposes: the other side said nothing about a second game", async () => {
    const settled = await against({ rematch: "origin-1" });

    expect(settled.offer).toMatchObject({ offeredToMemberId: "them" });
    // Whichever seat the swap gave them.
    expect(settled.offeredSeat).toBe("black");
  });

  it("seats a computer player again outright, with nothing to accept", async () => {
    origin = { ...ORIGIN, blackMemberId: "me", whiteMemberId: "kyu" };
    const settled = await against({ rematch: "origin-1" });

    expect(settled.seats.blackMemberId).toBe("kyu");
    expect(settled.offeredSeat).toBeNull();
  });

  it("refuses a game still being played", async () => {
    origin = { ...ORIGIN, status: "active", blackMemberId: "me", whiteMemberId: "them" };

    expect(await refusal({ rematch: "origin-1" })).toMatchObject({
      status: 400,
      error: "That game is still being played.",
    });
  });

  it("refuses a game the caller was not in", async () => {
    origin = { ...ORIGIN, blackMemberId: "someone", whiteMemberId: "them" };

    expect(await refusal({ rematch: "origin-1" })).toMatchObject({
      status: 403,
      error: "You did not play that game.",
    });
  });
});

describe("resolveAgainst — continuing a position", () => {
  it("takes the board, the rules and the seed from the game the position is in", async () => {
    const settled = await against({ from: { id: "origin-1", move: 2 } });

    expect(settled.source.size).toBe(ORIGIN.size);
    expect(settled.source.seed).toBe(ORIGIN.seed);
    expect(settled.source.winLength).toBe(ORIGIN.winLength);
    expect(settled.source.blackName, "and the names that were in it").toBe("One");
  });

  /*
   * AND YIELDS THE PACE TO A CALLER THAT HAS SETTLED ONE, keyed on what they
   * actually NAMED. Without this a fork's setup screen would offer a clock, a
   * penalty and a friendly game and have all three thrown away on the way in.
   */
  it("drops a carried pace setting the caller named for itself", async () => {
    const settled = await against({ from: { id: "origin-1", move: 2 }, moveTimeMs: 5 * 60_000 });

    expect("moveTimeMs" in settled.source, "the caller settled it, so nothing is carried").toBe(false);
    expect(settled.source.winLength, "but the position's own rules still come with it").toBe(3);
  });

  it("keeps the carried pace where the caller said nothing about it", async () => {
    const settled = await against({ from: { id: "origin-1", move: 2 } });

    expect(settled.source.moveTimeMs).toBe(ORIGIN.moveTimeMs);
  });

  it("becomes a game at one screen where there is nobody to play it with", async () => {
    const settled = await against({ from: { id: "origin-1", move: 2 } });

    expect(settled.hotSeat).toBe(true);
    expect(settled.seats).toEqual({});
  });

  it("offers the position to the person who was in it", async () => {
    mine = "me";
    session = { email: "me@example.com", name: "Me" };
    origin = { ...ORIGIN, blackMemberId: "me", whiteMemberId: "them" };

    const settled = await against({ from: { id: "origin-1", move: 2 } });

    expect(settled.hotSeat, "there is somebody to play, so it is not one screen").toBe(false);
    expect(settled.offer).toMatchObject({ offeredToMemberId: "them" });
  });

  /*
   * A FORK OF A GAME AGAINST A COMPUTER PLAYER IS A GAME AGAINST THAT COMPUTER
   * PLAYER, and it used to be two people at one screen.
   *
   * The other seat was bound from the opponent's EMAIL, and a computer player has
   * none — it never signs in. So a fork of any game played against one found
   * nobody to play and fell through to a board at one screen, while the setup
   * screen, which asks `personNamed` and gets the program back, said "Against the
   * same opponent" and offered a rating the route then refused. Three screens
   * describing three different games, and the one a person got was the one nobody
   * had been shown.
   *
   * By ID now, which is the form that always works and exactly what a fresh game
   * against a computer already uses (`against=<bot id>` becomes `challengeId`).
   */
  it("seats the computer player the position was played against, rather than one screen", async () => {
    mine = "me";
    session = { email: "me@example.com", name: "Me" };
    origin = { ...ORIGIN, blackMemberId: "me", whiteMemberId: "kyu" };

    const settled = await against({ from: { id: "origin-1", move: 2 } });

    expect(settled.hotSeat, "there is a program to play, so it is not one screen").toBe(false);
    expect(settled.seats.whiteMemberId, "the seat it had").toBe("kyu");
    expect(settled.seats.blackMemberId).toBe("me");
    expect(settled.offeredSeat, "a program has nothing to accept with").toBeNull();
    expect(settled.computerSeated, "so it may have a move to make at once").toBe(true);
  });

  /*
   * AND THE BOT TAKES THE SEAT IT HAD, which is not always white.
   *
   * A fork continues a position and a position belongs to the colours that were
   * in it — `seatsFor` promises the forker `fork.colour` on the doorstep, and
   * `rematch.ts` says it outright: "A fork is not a rematch and does not swap."
   * The route seated whoever asked as BLACK whatever they had played, so forking
   * a game you played white in handed you the other side of your own position.
   */
  it("keeps the colours the position was played in, both ways round", async () => {
    mine = "me";
    session = { email: "me@example.com", name: "Me" };
    origin = { ...ORIGIN, blackMemberId: "kyu", whiteMemberId: "me" };

    const settled = await against({ from: { id: "origin-1", move: 2 } });

    expect(settled.seats.whiteMemberId, "I played white, so I still do").toBe("me");
    expect(settled.seats.blackMemberId).toBe("kyu");
    expect(settled.seats.whiteName).toBe("Me");
    expect(settled.seats.blackName).toBe("Kyu");
  });

  it("keeps the colours for a person too, and offers them the seat they had", async () => {
    mine = "me";
    session = { email: "me@example.com", name: "Me" };
    origin = { ...ORIGIN, blackMemberId: "them", whiteMemberId: "me" };

    const settled = await against({ from: { id: "origin-1", move: 2 } });

    expect(settled.seats.whiteMemberId).toBe("me");
    expect(settled.seats.blackMemberId, "lifted off: they are asked, not seated").toBeUndefined();
    expect(settled.seats.blackName).toBe("Them");
    expect(settled.offeredSeat, "the seat they played, not the one a challenge would give").toBe("black");
  });

  /*
   * A CHALLENGE STILL SEATS WHOEVER ASKS AS BLACK. Only a position settles the
   * colours, and nothing else on this route carries one — so the change above
   * must not leak into the ordinary ask.
   */
  it("still seats the asker black where no position says otherwise", async () => {
    mine = "me";
    session = { email: "me@example.com", name: "Me" };

    const settled = await against({ challengeId: "kyu" });

    expect(settled.seats.blackMemberId).toBe("me");
    expect(settled.seats.whiteMemberId).toBe("kyu");
  });

  it("leaves a fork by somebody who was not in the game at one screen", async () => {
    mine = "stranger";
    session = { email: "stranger@example.com", name: "Stranger" };

    const settled = await against({ from: { id: "origin-1", move: 2 } });

    expect(settled.hotSeat).toBe(true);
    expect(settled.computerSeated).toBe(false);
  });

  it("refuses a position the game never reached", async () => {
    expect(await refusal({ from: { id: "origin-1", move: ORIGIN.moveCount + 1 } })).toMatchObject({
      status: 400,
      error: "That game has fewer moves.",
    });
  });

  it("refuses a game that is not there", async () => {
    origin = null as unknown as Record<string, unknown>;

    expect(await refusal({ from: { id: "origin-1", move: 0 } })).toMatchObject({
      status: 404,
      error: "No such game.",
    });
  });
});
