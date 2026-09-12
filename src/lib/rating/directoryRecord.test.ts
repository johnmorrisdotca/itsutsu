import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The Players page, and the zeros John actually saw.
 *
 * "Why does Hanachan has 0 games played???" — 0.129.1. She had seven games and
 * a rating of 1519, and the directory printed nought beside her name.
 *
 * `toDirectory` asked for each member's record under `playerKey(member.name)`,
 * their name TODAY. A rating is keyed by the name it was EARNED under, and
 * that key does not move when somebody renames — so a renamed member reads as
 * having never played. Her row was one column away the whole time: `memberId`
 * is on it and indexed, and has been since 0.73.0.
 *
 * Tested here rather than only at `fetchPlayerRecord`, because they are two
 * different lookups on two different pages, and fixing one while leaving the
 * other is how half a migration happens twice.
 */

type PlayerRow = {
  key: string;
  memberId: string | null;
  name: string;
  rating: number;
  ratedGames: number;
  wins: number;
  losses: number;
  draws: number;
  computerRating: number;
  computerRatedGames: number;
  computerWins: number;
  computerLosses: number;
  computerDraws: number;
};

type MemberRow = {
  id: string;
  email: string | null;
  name: string;
  picture: string | null;
  lastSeenAt: Date;
  createdAt: Date;
  country: string;
  botTier: string | null;
  unclaimableBecause: string | null;
};

let players: PlayerRow[] = [];
let members: MemberRow[] = [];

const playerFindMany = vi.fn(
  async ({ where }: { where: { key?: { in: string[] }; memberId?: { in: string[] } } }) =>
    players.filter((row) =>
      where.memberId !== undefined
        ? row.memberId !== null && where.memberId.in.includes(row.memberId)
        : where.key !== undefined && where.key.in.includes(row.key),
    ),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    member: { findMany: async () => members },
    player: { findMany: (args: never) => playerFindMany(args) },
  },
}));

const { fetchDirectory } = await import("./directoryRows");

const HER = "964k9atpbhzja6d9";

function member(id: string, name: string): MemberRow {
  return {
    id,
    email: `${id}@example.test`,
    name,
    picture: null,
    lastSeenAt: new Date(),
    createdAt: new Date(),
    country: "",
    botTier: null,
    unclaimableBecause: null,
  };
}

/** A record earned under one name, carrying the member it belongs to. */
function record(key: string, memberId: string | null, name: string): PlayerRow {
  return {
    key,
    memberId,
    name,
    rating: 1519,
    ratedGames: 5,
    wins: 0,
    losses: 5,
    draws: 0,
    computerRating: 1600,
    computerRatedGames: 0,
    computerWins: 0,
    computerLosses: 0,
    computerDraws: 0,
  };
}

beforeEach(() => {
  players = [];
  members = [];
  playerFindMany.mockClear();
});

describe("the directory, for a member who has renamed", () => {
  it("finds the record their old name earned", async () => {
    members = [member(HER, "Hanachan")];
    players = [record("hanako morris", HER, "Hanako Morris")];

    const [entry] = await fetchDirectory(10);

    expect(entry.profile, "a renamed member read as having never played").not.toBeNull();
    expect(entry.profile?.ratedGames).toBe(5);
    expect(entry.profile?.rating).toBe(1519);
  });

  it("shows them under the name they go by now", async () => {
    // The record is hers; the name on the page is the one she chose. She
    // renamed BECAUSE this site said that was how to take her surname down.
    members = [member(HER, "Hanachan")];
    players = [record("hanako morris", HER, "Hanako Morris")];

    const [entry] = await fetchDirectory(10);

    expect(entry.name).toBe("Hanachan");
  });
});

describe("the directory, for everybody else", () => {
  it("still finds a record by name when no member is attached to it", async () => {
    /*
     * The fallback, and it is most of this table: a kept record from another
     * site, or a name typed into a game at one screen. It has no account to be
     * found by and must go on working exactly as before.
     */
    members = [member("someone", "Tester Nobody")];
    players = [record("tester nobody", null, "Tester Nobody")];

    const [entry] = await fetchDirectory(10);

    expect(entry.profile?.ratedGames).toBe(5);
  });

  it("prefers the member's own row when a name matches somebody else's", async () => {
    /*
     * A name is not an identity. If a record exists under the name somebody
     * has just taken, the one bound to them by id is theirs and the other is
     * not — reading the name first would hand them a stranger's rating.
     */
    members = [member(HER, "Hanachan")];
    players = [
      { ...record("hanako morris", HER, "Hanako Morris"), rating: 1519 },
      { ...record("hanachan", "somebody-else", "Hanachan"), rating: 1234 },
    ];

    const [entry] = await fetchDirectory(10);

    expect(entry.profile?.rating).toBe(1519);
  });
});
