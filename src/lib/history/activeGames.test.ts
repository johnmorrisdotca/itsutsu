import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ACTIVE_GAME_LIMIT } from "./activeGames";

/**
 * The twenty-game cap.
 *
 * The count itself is a single `prisma.game.count`, so the cases here are
 * about the things a count cannot get wrong on its own: which seat a member is
 * checked by (both colours, not just black), and who is exempt — a computer
 * player is meant to carry far more than twenty at once, since a batch of games
 * started against one on purpose is the opposite of the pile this limit exists
 * to catch; and, outside production only, the operator the suite plays as.
 */

let counted: { memberId: string }[] = [];
/** Each member's address, for the one read that asks which seats are an operator's. */
let addresses: Record<string, string> = {};

const count = vi.fn(async ({ where }: { where: { OR: [{ blackMemberId: string }, { whiteMemberId: string }] } }) => {
  const [{ blackMemberId }, { whiteMemberId }] = where.OR;
  return counted.filter((row) => row.memberId === blackMemberId || row.memberId === whiteMemberId).length;
});

const findMany = vi.fn(async ({ where }: { where: { id: { in: string[] }; email: { in: string[] } } }) =>
  where.id.in.filter((id) => where.email.in.includes(addresses[id] ?? "")).map((id) => ({ id })),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: { count: (args: never) => count(args) },
    member: { findMany: (args: never) => findMany(args) },
  },
}));

const { activeGameCount, activeLimitRefusal, memberOverActiveLimit } = await import("./activeGames");

/** `n` active games recorded against one member, alternating which seat holds them. */
function gamesFor(memberId: string, n: number): void {
  for (let i = 0; i < n; i++) counted.push({ memberId });
}

beforeEach(() => {
  counted = [];
  addresses = {};
  count.mockClear();
  findMany.mockClear();
  // Nobody is an operator unless a case says so, whatever this machine's environment holds.
  vi.stubEnv("ADMIN_EMAILS", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("activeGameCount", () => {
  it("counts a member seated in either colour", async () => {
    gamesFor("alice", 3);
    expect(await activeGameCount("alice")).toBe(3);
  });

  it("is nought for a member holding nothing", async () => {
    gamesFor("alice", 3);
    expect(await activeGameCount("bob")).toBe(0);
  });
});

describe("memberOverActiveLimit", () => {
  it("says nobody, below the limit", async () => {
    gamesFor("alice", ACTIVE_GAME_LIMIT - 1);
    expect(await memberOverActiveLimit(["alice", "bob"])).toBeNull();
  });

  it("finds a member exactly at the limit", async () => {
    gamesFor("alice", ACTIVE_GAME_LIMIT);
    expect(await memberOverActiveLimit(["alice", "bob"])).toMatchObject({ memberId: "alice" });
  });

  it("checks the other seat too, not only the first", async () => {
    /*
     * A creation can hand a new board to both seats. The member on the second
     * seat can be the one buried, and the caller has no reason to put them
     * second in the array — this proves the order given is not the order that
     * matters.
     */
    gamesFor("bob", ACTIVE_GAME_LIMIT + 5);
    expect(await memberOverActiveLimit(["alice", "bob"])).toMatchObject({ memberId: "bob" });
  });

  it("leaves a computer player out of it, however many games it is carrying", async () => {
    gamesFor("dan", ACTIVE_GAME_LIMIT * 3);
    expect(await memberOverActiveLimit(["dan", null])).toBeNull();
    // Never even asked the database about a bot's count.
    expect(count).not.toHaveBeenCalled();
  });

  it("has nothing to say about a game with no member on either seat", async () => {
    expect(await memberOverActiveLimit([undefined, null])).toBeNull();
    expect(count).not.toHaveBeenCalled();
  });

  it("does not count the same member twice for a hot-seat-style pair", async () => {
    gamesFor("alice", ACTIVE_GAME_LIMIT);
    await memberOverActiveLimit(["alice", "alice"]);
    expect(count).toHaveBeenCalledTimes(1);
  });
});

/**
 * One knob used to govern both the rate limits and this cap, which made the cap
 * four hundred on every server the suite drives and put it out of reach of any
 * browser test. These hold the split: the relief moves nothing here, and the
 * only account let past the cap is an operator's, outside production.
 */
describe("the cap is twenty, and who alone is let past it", () => {
  it("is not moved by the relief the suite sets for the rate limits", async () => {
    vi.stubEnv("RATE_LIMIT_RELIEF", "20");
    gamesFor("alice", ACTIVE_GAME_LIMIT);
    expect(await memberOverActiveLimit(["alice"])).toEqual({
      memberId: "alice",
      count: ACTIVE_GAME_LIMIT,
      limit: ACTIVE_GAME_LIMIT,
    });
  });

  it("lets an operator past it outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("ADMIN_EMAILS", "operator@example.test");
    addresses = { op: "operator@example.test" };
    gamesFor("op", ACTIVE_GAME_LIMIT * 20);
    expect(await memberOverActiveLimit(["op"])).toBeNull();
    expect(count, "an operator's pile is never counted").not.toHaveBeenCalled();
  });

  it("holds an operator to it in production, and asks nothing about addresses there", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_EMAILS", "operator@example.test");
    addresses = { op: "operator@example.test" };
    gamesFor("op", ACTIVE_GAME_LIMIT);
    expect(await memberOverActiveLimit(["op"])).toMatchObject({ memberId: "op", limit: ACTIVE_GAME_LIMIT });
    expect(findMany).not.toHaveBeenCalled();
  });

  it("lets nobody else past it on the operator's account", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("ADMIN_EMAILS", "operator@example.test");
    addresses = { op: "operator@example.test", alice: "alice@example.test" };
    gamesFor("op", ACTIVE_GAME_LIMIT * 20);
    gamesFor("alice", ACTIVE_GAME_LIMIT);
    expect(await memberOverActiveLimit(["op", "alice"])).toMatchObject({ memberId: "alice" });
  });

  it("asks nothing about addresses when no operator is configured", async () => {
    vi.stubEnv("NODE_ENV", "test");
    gamesFor("alice", ACTIVE_GAME_LIMIT - 1);
    expect(await memberOverActiveLimit(["alice"])).toBeNull();
    expect(findMany).not.toHaveBeenCalled();
  });
});

/**
 * The refusal, which now has to say the member's own number.
 *
 * "Twenty games at once is the limit here" was the whole of it, and a bare
 * refusal reads as a fault: somebody told only the rule cannot tell a cap
 * they have met from a site that has miscounted, and the only way to check
 * was to go and count boards. Their own total is what answers that, so the
 * count is carried out of the check rather than fetched again beside it.
 */
describe("what the member is told", () => {
  it("carries the count and the limit out with the answer", async () => {
    gamesFor("alice", ACTIVE_GAME_LIMIT);
    expect(await memberOverActiveLimit(["alice"])).toEqual({
      memberId: "alice",
      count: ACTIVE_GAME_LIMIT,
      limit: ACTIVE_GAME_LIMIT,
    });
  });

  it("counts what they are actually holding, not the limit they tripped", async () => {
    /*
     * A member can be past the limit rather than exactly on it — games are
     * only ever counted at a door, so nothing stops the total drifting above
     * it. Saying "you have 20" to somebody holding 23 is the bare refusal
     * again with a number painted on.
     */
    gamesFor("alice", ACTIVE_GAME_LIMIT + 3);
    const over = await memberOverActiveLimit(["alice"]);
    expect(over?.count).toBe(ACTIVE_GAME_LIMIT + 3);
    expect(activeLimitRefusal(over!)).toContain(String(ACTIVE_GAME_LIMIT + 3));
  });

  it("says their number and the limit, and what to do about it", () => {
    const message = activeLimitRefusal({ memberId: "alice", count: 20, limit: 20 });
    expect(message).toContain("You have 20 games");
    expect(message).toContain("20 at once is the limit");
    expect(message).toMatch(/finish or resign/i);
  });

  it("quotes the limit it was handed, not a number written into the words", () => {
    // The sentence and the check must not be able to disagree about the number.
    const message = activeLimitRefusal({ memberId: "alice", count: 7, limit: 7 });
    expect(message).toContain("7 at once");
    expect(message).not.toMatch(/twenty|\b20\b/i);
  });
});
