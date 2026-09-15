import { beforeEach, describe, expect, it, vi } from "vitest";

import { UNCLAIMABLE_REASONS } from "./memberId";

/**
 * CLAIMING A KEPT HISTORY: every refusal, and exactly what a claim moves.
 *
 * The database is a small in-memory one that reads the where-clauses the claim
 * actually writes — equality, null, `not`, `in`, a case-insensitive `equals` and
 * `contains`, `AND`, `OR` — and throws on anything else, so a query the module
 * starts asking in a new shape fails here rather than matching everything.
 *
 * What a real transaction adds, a rollback, cannot be shown without Postgres;
 * the overtaken case pins the half that can be: a write finding less than was
 * decided keeps no log row and answers the refusal a fresh look would give.
 */

type Row = Record<string, unknown>;

function matches(row: Row, where: Row | undefined): boolean {
  if (where === undefined) return true;
  return Object.entries(where).every(([field, test]) => {
    if (field === "AND") return (test as Row[]).every((one) => matches(row, one));
    if (field === "OR") return (test as Row[]).some((one) => matches(row, one));
    const value = row[field];
    if (test === null) return value === null;
    if (typeof test !== "object" || test instanceof Date) return value === test;
    const asked = test as Row;
    if ("equals" in asked && asked.mode === "insensitive") {
      return typeof value === "string" && value.toLowerCase() === String(asked.equals).toLowerCase();
    }
    if ("contains" in asked && asked.mode === "insensitive") {
      return typeof value === "string" && value.toLowerCase().includes(String(asked.contains).toLowerCase());
    }
    // SQL's reading, which is Prisma's: a null column is never "not" anything but null.
    if ("not" in asked) return asked.not === null ? value !== null : value !== null && value !== asked.not;
    if ("in" in asked) return (asked.in as unknown[]).includes(value);
    throw new Error(`The fake database cannot read ${field}: ${JSON.stringify(test)}`);
  });
}

function picked(row: Row | undefined, select: Row | undefined): Row | null {
  if (row === undefined) return null;
  if (select === undefined) return { ...row };
  return Object.fromEntries(Object.keys(select).map((field) => [field, row[field]]));
}

function table(rows: () => Row[], id: (row: Row, where: Row) => boolean) {
  return {
    findUnique: async ({ where, select }: { where: Row; select?: Row }) => picked(rows().find((row) => id(row, where)), select),
    findMany: async ({ where, select }: { where?: Row; select?: Row }) =>
      rows()
        .filter((row) => matches(row, where))
        .map((row) => picked(row, select)),
    count: async ({ where }: { where?: Row }) => rows().filter((row) => matches(row, where)).length,
    updateMany: async ({ where, data }: { where: Row; data: Row }) => {
      const hit = rows().filter((row) => matches(row, where));
      if (overtake.table !== null && rows() === overtake.table()) {
        overtake.table = null;
        return { count: 0 };
      }
      for (const row of hit) Object.assign(row, data);
      return { count: hit.length };
    },
    update: async ({ where, data }: { where: Row; data: Row }) => {
      const row = rows().find((one) => id(one, where));
      if (row === undefined) throw new Error("no such row");
      Object.assign(row, data);
      return row;
    },
  };
}

let members: Row[] = [];
let players: Row[] = [];
let standings: Row[] = [];
let games: Row[] = [];
let actions: Row[] = [];
/** A concurrent write, simulated: the next updateMany on this table finds nothing left. */
const overtake: { table: (() => Row[]) | null } = { table: null };
const asked = { memberLookups: 0 };

const db = {
  member: {
    ...table(() => members, (row, where) => row.id === where.id),
    findUnique: async (args: { where: Row; select?: Row }) => {
      asked.memberLookups += 1;
      return picked(members.find((row) => row.id === args.where.id), args.select);
    },
  },
  player: table(() => players, (row, where) => row.key === where.key),
  playerVariantRating: table(() => standings, () => false),
  game: table(() => games, (row, where) => row.id === where.id),
  operatorAction: { create: async ({ data }: { data: Row }) => (actions.push(data), data) },
  $transaction: async <T>(work: (tx: unknown) => Promise<T>) => work(db),
};

vi.mock("@/lib/prisma", () => ({
  get prisma() {
    return db;
  },
}));
// The recount lives beside the ending that pays XP; nothing here finishes a game.
vi.mock("@/lib/xp/xpGameServer", () => ({ awardFinishedGameXp: async () => undefined }));

const { claimRecord, previewClaim } = await import("./claimRecord");

const RECORD = "Little Hana";
const OPERATOR = { memberId: "op1dxxxxxxxxxxxx", email: "operator@example.test" };

function member(overrides: Row & { id: string }): Row {
  return {
    name: "Hanako",
    email: `${overrides.id}@example.test`,
    botTier: null,
    unclaimableBecause: null,
    played: 0,
    won: 0,
    lost: 0,
    drawn: 0,
    playedStreakKind: null,
    playedStreakCount: 0,
    ...overrides,
  };
}

function game(overrides: Row & { id: string }): Row {
  return {
    status: "finished",
    result: "black",
    winner: "black",
    declinedAt: null,
    withdrawnAt: null,
    blackName: RECORD,
    whiteName: "Rival",
    blackMemberId: null,
    whiteMemberId: null,
    playedAt: new Date("2026-01-01T00:00:00Z"),
    lastMoveAt: null,
    ...overrides,
  };
}

const rating = (overrides: Row = {}): Row => ({ key: "little hana", name: RECORD, memberId: null, ...overrides });
const standing = (variant: string, overrides: Row = {}): Row => ({ key: "little hana", variant, name: RECORD, memberId: null, ...overrides });

const HANAKO = "hanako0000xxxxxx";

beforeEach(() => {
  members = [member({ id: HANAKO })];
  players = [];
  standings = [];
  games = [];
  actions = [];
  overtake.table = null;
  asked.memberLookups = 0;
});

describe("what a claim refuses", () => {
  it("refuses a blank name without asking the database", async () => {
    expect(await previewClaim("   ", HANAKO)).toEqual({ ok: false, reason: "no-name" });
    expect(asked.memberLookups).toBe(0);
  });

  it("refuses a member who is not there", async () => {
    players = [rating()];
    expect(await previewClaim(RECORD, "nobody")).toEqual({ ok: false, reason: "no-member" });
  });

  /*
   * John, 2026-09-09: a row marked unclaimable stands as it is. It is never the
   * row a record is attached to either — a kept record, a seed or a program
   * takes nothing on.
   */
  for (const reason of Object.values(UNCLAIMABLE_REASONS)) {
    it(`attaches nothing to a member marked ${reason}`, async () => {
      members = [member({ id: HANAKO, unclaimableBecause: reason })];
      players = [rating()];
      expect(await previewClaim(RECORD, HANAKO)).toEqual({ ok: false, reason: "member-unclaimable" });
    });
  }

  it("attaches nothing to a computer player, marked or not", async () => {
    members = [member({ id: HANAKO, botTier: "dan" })];
    players = [rating()];
    expect(await previewClaim(RECORD, HANAKO)).toEqual({ ok: false, reason: "member-unclaimable" });
  });

  it("refuses a member with no name, since a claimed rating is shown under it", async () => {
    members = [member({ id: HANAKO, name: "  " })];
    players = [rating()];
    expect(await previewClaim(RECORD, HANAKO)).toEqual({ ok: false, reason: "member-nameless" });
  });

  it("never claims a name kept for a remembered or honorary player", async () => {
    expect(await previewClaim("Chibi", HANAKO)).toEqual({ ok: false, reason: "record-unclaimable" });
  });

  for (const [marked, row] of [
    ["a kept record", { unclaimableBecause: UNCLAIMABLE_REASONS.keptRecord }],
    ["a seed", { unclaimableBecause: UNCLAIMABLE_REASONS.seed }],
    ["a computer player", { botTier: "meijin", unclaimableBecause: UNCLAIMABLE_REASONS.computer }],
  ] as const) {
    it(`never claims a name that belongs to ${marked}`, async () => {
      members.push(member({ id: "namesakexxxxxxxx", name: RECORD, ...row }));
      players = [rating()];
      games = [game({ id: "g1" })];
      expect(await previewClaim(RECORD, HANAKO)).toEqual({ ok: false, reason: "record-unclaimable" });
    });
  }

  it("refuses a name another member goes by, however it is spaced or cased", async () => {
    members.push(member({ id: "otherxxxxxxxxxxx", name: "little   HANA" }));
    players = [rating()];
    expect(await previewClaim(RECORD, HANAKO)).toEqual({ ok: false, reason: "name-held" });
  });

  it("refuses a record whose rating already belongs to somebody", async () => {
    players = [rating({ memberId: "otherxxxxxxxxxxx" })];
    expect(await previewClaim(RECORD, HANAKO)).toEqual({ ok: false, reason: "already-claimed" });
  });

  it("refuses a record with a per-game standing that already belongs to somebody", async () => {
    players = [rating()];
    standings = [standing("renju", { memberId: "otherxxxxxxxxxxx" })];
    expect(await previewClaim(RECORD, HANAKO)).toEqual({ ok: false, reason: "already-claimed" });
  });

  it("refuses a record with a seat under the name that already carries somebody's id", async () => {
    games = [game({ id: "g1" }), game({ id: "g2", whiteName: RECORD, blackName: "Rival", whiteMemberId: "otherxxxxxxxxxxx" })];
    expect(await previewClaim(RECORD, HANAKO)).toEqual({ ok: false, reason: "already-claimed" });
  });

  it("refuses a name with nothing under it", async () => {
    expect(await previewClaim(RECORD, HANAKO)).toEqual({ ok: false, reason: "nothing-to-claim" });
  });

  it("refuses when everything under the name is this member's already", async () => {
    players = [rating({ memberId: HANAKO })];
    games = [game({ id: "g1", blackMemberId: HANAKO })];
    expect(await previewClaim(RECORD, HANAKO)).toEqual({ ok: false, reason: "nothing-to-claim" });
  });

  it("refuses a second rating for a member who already has one", async () => {
    players = [rating(), { key: "hanako", name: "Hanako", memberId: HANAKO }];
    expect(await previewClaim(RECORD, HANAKO)).toEqual({ ok: false, reason: "has-standing" });
  });

  it("refuses a second standing at a game the member already stands at", async () => {
    standings = [standing("renju"), { key: "hanako", variant: "renju", name: "Hanako", memberId: HANAKO }];
    expect(await previewClaim(RECORD, HANAKO)).toEqual({ ok: false, reason: "has-standing" });
  });
});

describe("what a claim would move", () => {
  it("takes a standing at a game the member has none at, beside one they do", async () => {
    standings = [standing("renju"), { key: "hanako", variant: "freestyle", name: "Hanako", memberId: HANAKO }];
    expect(await previewClaim(RECORD, HANAKO)).toMatchObject({ ok: true, plan: { rating: false, standings: 1 } });
  });

  it("goes to a member who goes by the name themselves", async () => {
    members = [member({ id: HANAKO, name: "Little Hana" })];
    players = [rating()];
    expect(await previewClaim(RECORD, HANAKO)).toMatchObject({ ok: true, member: { id: HANAKO, name: "Little Hana" } });
  });

  it("counts the games under the name that are already the member's, and binds only the rest", async () => {
    games = [game({ id: "g1" }), game({ id: "g2", blackMemberId: HANAKO })];
    expect(await previewClaim(RECORD, HANAKO)).toEqual({
      ok: true,
      member: { id: HANAKO, name: "Hanako" },
      plan: { games: 2, seats: 1, rating: false, standings: 0 },
    });
  });

  it("writes nothing when it only looks", async () => {
    players = [rating()];
    games = [game({ id: "g1" })];
    await previewClaim(RECORD, HANAKO);
    expect(players[0].memberId).toBeNull();
    expect(games[0].blackMemberId).toBeNull();
    expect(actions).toEqual([]);
  });
});

describe("the claim", () => {
  const at = (day: number) => new Date(Date.UTC(2026, 0, day));

  function world() {
    players = [rating()];
    standings = [standing("freestyle"), standing("renju")];
    games = [
      game({ id: "own", blackName: "Hanako", blackMemberId: HANAKO, winner: "black", lastMoveAt: at(1) }),
      game({ id: "won", winner: "black", lastMoveAt: at(2) }),
      game({ id: "lost", blackName: "Rival", whiteName: "LITTLE HANA", winner: "black", lastMoveAt: at(3) }),
      game({ id: "abandoned", result: "abandoned", winner: null, lastMoveAt: at(4) }),
      game({ id: "active", status: "active", result: "abandoned", winner: null }),
      game({ id: "refused", result: "abandoned", winner: null, declinedAt: at(5) }),
      game({ id: "elsewhere", blackName: "Somebody Else" }),
    ];
  }

  it("moves the rating, the standings and the open seats, and counts the member's figures again", async () => {
    world();
    const outcome = await claimRecord({ name: RECORD, memberId: HANAKO, by: OPERATOR });
    expect(outcome).toEqual({
      ok: true,
      member: { id: HANAKO, name: "Hanako" },
      plan: { games: 3, seats: 3, rating: true, standings: 2 },
    });

    // Theirs, and shown under their name, as a rename shows them.
    expect(players).toEqual([rating({ memberId: HANAKO, name: "Hanako" })]);
    expect(standings.map((one) => [one.variant, one.memberId, one.name])).toEqual([
      ["freestyle", HANAKO, "Hanako"],
      ["renju", HANAKO, "Hanako"],
    ]);

    const seat = (id: string) => games.find((one) => one.id === id);
    expect(seat("won")?.blackMemberId).toBe(HANAKO);
    expect(seat("lost")?.whiteMemberId).toBe(HANAKO);
    expect(seat("abandoned")?.blackMemberId).toBe(HANAKO);
    // Still in play, refused, or somebody else's: none of these is the record's.
    expect(seat("active")?.blackMemberId).toBeNull();
    expect(seat("refused")?.blackMemberId).toBeNull();
    expect(seat("elsewhere")?.blackMemberId).toBeNull();
    // The games keep the names they were played under.
    expect(seat("won")?.blackName).toBe(RECORD);

    // Their own win, the record's win and the record's loss; the abandoned game is not a result.
    expect(members[0]).toMatchObject({ played: 3, won: 2, lost: 1, drawn: 0, playedStreakKind: "loss", playedStreakCount: 1 });
  });

  it("keeps the act in the operator log, in counts and never the name", async () => {
    world();
    await claimRecord({ name: RECORD, memberId: HANAKO, by: OPERATOR });
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      actorMemberId: OPERATOR.memberId,
      actorEmail: OPERATOR.email,
      action: "recordClaimed",
      subjectId: HANAKO,
      detail: "attached a record: 3 finished games, 3 seats bound, a rating, 2 per-game standings",
    });
    expect(JSON.stringify(actions[0]).toLowerCase()).not.toContain("little hana");
  });

  it("changes nothing and keeps nothing when it refuses", async () => {
    world();
    members.push(member({ id: "otherxxxxxxxxxxx", name: RECORD }));
    expect(await claimRecord({ name: RECORD, memberId: HANAKO, by: OPERATOR })).toEqual({ ok: false, reason: "name-held" });
    expect(players[0].memberId).toBeNull();
    expect(games.every((one) => one.blackMemberId === null || one.id === "own")).toBe(true);
    expect(members[0].played).toBe(0);
    expect(actions).toEqual([]);
  });

  it("answers already-claimed and keeps no log row when a concurrent write took part of the record first", async () => {
    world();
    overtake.table = () => players;
    expect(await claimRecord({ name: RECORD, memberId: HANAKO, by: OPERATOR })).toEqual({ ok: false, reason: "already-claimed" });
    expect(actions).toEqual([]);
  });

  it("cannot be made twice", async () => {
    world();
    await claimRecord({ name: RECORD, memberId: HANAKO, by: OPERATOR });
    expect(await claimRecord({ name: RECORD, memberId: HANAKO, by: OPERATOR })).toEqual({ ok: false, reason: "nothing-to-claim" });
    expect(actions).toHaveLength(1);
  });
});
