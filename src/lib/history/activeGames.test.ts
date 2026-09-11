import { beforeEach, describe, expect, it, vi } from "vitest";

import { ACTIVE_GAME_LIMIT } from "./activeGames";

/**
 * The twenty-game cap.
 *
 * The count itself is a single `prisma.game.count`, so the cases here are
 * about the two things a count cannot get wrong on its own: which seat a
 * member is checked by (both colours, not just black), and who is exempt —
 * a computer player is meant to carry far more than twenty at once, since a
 * batch of games started against one on purpose is the opposite of the pile
 * this limit exists to catch.
 */

let counted: { memberId: string }[] = [];

const count = vi.fn(async ({ where }: { where: { OR: [{ blackMemberId: string }, { whiteMemberId: string }] } }) => {
  const [{ blackMemberId }, { whiteMemberId }] = where.OR;
  return counted.filter((row) => row.memberId === blackMemberId || row.memberId === whiteMemberId).length;
});

vi.mock("@/lib/prisma", () => ({ prisma: { game: { count: (args: never) => count(args) } } }));

const { activeGameCount, activeGameLimit, activeLimitRefusal, memberOverActiveLimit } = await import(
  "./activeGames"
);

/** `n` active games recorded against one member, alternating which seat holds them. */
function gamesFor(memberId: string, n: number): void {
  for (let i = 0; i < n; i++) counted.push({ memberId });
}

beforeEach(() => {
  counted = [];
  count.mockClear();
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
     * A challenge hands a new board to both seats. The member on the
     * receiving end can be the one buried, and the caller has no reason to
     * put them second in the array — this proves the order given is not the
     * order that matters.
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
 * The relief, which exists because the suite is one member playing four
 * hundred games and the site is not.
 *
 * The two things it must never do are the point of these cases: it cannot
 * apply in production, where a relieved cap would be no cap, and a value
 * nobody set has to change nothing — a limit whose behaviour depends on an
 * unset variable is a limit nobody can reason about.
 */
describe("the limit as it applies here and now", () => {
  it("is the written number when nothing is set", () => {
    vi.stubEnv("RATE_LIMIT_RELIEF", "");
    expect(activeGameLimit()).toBe(ACTIVE_GAME_LIMIT);
    vi.unstubAllEnvs();
  });

  it("multiplies by the relief the suite sets", () => {
    vi.stubEnv("RATE_LIMIT_RELIEF", "20");
    expect(activeGameLimit()).toBe(ACTIVE_GAME_LIMIT * 20);
    vi.unstubAllEnvs();
  });

  it("ignores the relief in production, whatever escaped into the deployment", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RATE_LIMIT_RELIEF", "1000");
    expect(activeGameLimit()).toBe(ACTIVE_GAME_LIMIT);
    vi.unstubAllEnvs();
  });

  it("never lowers the cap, whatever nonsense it is given", () => {
    for (const value of ["0", "-5", "not a number"]) {
      vi.stubEnv("RATE_LIMIT_RELIEF", value);
      expect(activeGameLimit(), `${value} must not lower the cap`).toBe(ACTIVE_GAME_LIMIT);
    }
    vi.unstubAllEnvs();
  });

  it("is what the check actually reads, not a number kept beside it", async () => {
    // The relief is worthless if `memberOverActiveLimit` still reads the raw
    // constant — which is exactly the shape of bug that ships quietly.
    vi.stubEnv("RATE_LIMIT_RELIEF", "20");
    gamesFor("alice", ACTIVE_GAME_LIMIT + 5);
    expect(await memberOverActiveLimit(["alice"])).toBeNull();
    vi.unstubAllEnvs();
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
    expect(message).toMatch(/finish or resign/i);
  });

  it("quotes the limit it was actually checked against, not the word twenty", () => {
    /*
     * The suite relieves the cap, so the number in force is not always 20. A
     * message naming a constant the check is not using is a message that is
     * wrong exactly when somebody is trying to work out why they were
     * refused.
     */
    const message = activeLimitRefusal({ memberId: "alice", count: 400, limit: 400 });
    expect(message).toContain("400");
    expect(message).not.toMatch(/twenty/i);
  });
});
