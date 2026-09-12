import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The list of names a person taps at a seat.
 *
 * THE LIST AND THE REFUSALS ARE ONE RULE READ FROM TWO ENDS, and that is what
 * these cases are for. `claimOrVerifyPhraseFor` turns away a banned member, a row
 * marked unclaimable and a computer player; a name that can never work must never
 * be offered, or the screen invites somebody to fail. `phraseStore.test.ts` has
 * the other end — that each of them is still refused if it arrives anyway,
 * because a list is a screen and a screen is not a lock.
 */

type Row = {
  id: string;
  name: string;
  bannedAt: Date | null;
  unclaimableBecause: string | null;
  botTier: string | null;
};

let rows: Row[] = [];
/** What the query asked for, so a test can say the filtering is the database's. */
let asked: { where?: Record<string, unknown> } = {};

function member(overrides: Partial<Row> & { id: string; name: string }): Row {
  return { bannedAt: null, unclaimableBecause: null, botTier: null, ...overrides };
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    member: {
      findMany: async (args: { where?: Record<string, unknown> }) => {
        asked = args;
        const where = args.where ?? {};
        return rows
          .filter((row) => (where.bannedAt === null ? row.bannedAt === null : true))
          .filter((row) => (where.unclaimableBecause === null ? row.unclaimableBecause === null : true))
          .filter((row) => (where.botTier === null ? row.botTier === null : true))
          .map((row) => ({ id: row.id, name: row.name }));
      },
    },
  },
}));

const { seatPickList } = await import("./seatPick");

beforeEach(() => {
  rows = [];
  asked = {};
});

describe("seatPickList", () => {
  it("offers the members who could actually sit down", async () => {
    rows = [
      member({ id: "hanakojdxxxxxxxx", name: "Hanako Morris" }),
      member({ id: "j0hnjdxxxxxxxxxx", name: "John Morris" }),
    ];

    expect(await seatPickList()).toEqual([
      { id: "hanakojdxxxxxxxx", shown: "Hanako M." },
      { id: "j0hnjdxxxxxxxxxx", shown: "John M." },
    ]);
  });

  /*
   * A tap carries the id, which is the whole reason this list exists: two
   * members called the same thing are two rows to choose between rather than one
   * string the server would have to guess at. They print identically and that is
   * fine — John: "If we pick the wrong user, obviously it's not going to work."
   */
  it("gives two members with the same name two separate rows, each with its own id", async () => {
    rows = [
      member({ id: "j0hn1stjdxxxxxxx", name: "John Morris" }),
      member({ id: "j0hn2ndjdxxxxxxx", name: "john morris" }),
    ];

    const list = await seatPickList();

    expect(list).toHaveLength(2);
    expect(list.map((one) => one.id).sort()).toEqual(["j0hn1stjdxxxxxxx", "j0hn2ndjdxxxxxxx"]);
  });

  it("prints a first name and an initial, never a full name", async () => {
    rows = [member({ id: "hanakojdxxxxxxxx", name: "Hanako Morris" })];

    const list = await seatPickList();

    expect(list[0]?.shown).toBe("Hanako M.");
    expect(JSON.stringify(list), "a surname reached the browser").not.toContain("Morris");
  });

  it("leaves out a banned member, a kept record and a computer player", async () => {
    rows = [
      member({ id: "hanakojdxxxxxxxx", name: "Hanako Morris" }),
      member({ id: "banned0xxxxxxxxx", name: "Gone Away", bannedAt: new Date() }),
      member({ id: "kept000xxxxxxxxx", name: "Kept Record", unclaimableBecause: "kept-record" }),
      member({ id: "program0xxxxxxxx", name: "Hidemasa Tamenoki", botTier: "shodan" }),
    ];

    expect((await seatPickList()).map((one) => one.id)).toEqual(["hanakojdxxxxxxxx"]);
  });

  /*
   * Filtered in the query and not afterwards. A development database is small
   * and a filter in JavaScript would pass every test on it while reading every
   * member row on a database that is not — the exact shape AGENTS.md warns about
   * under "a JS filter as SQL".
   */
  it("asks the database to do the leaving out", async () => {
    await seatPickList();

    expect(asked.where).toMatchObject({ bannedAt: null, unclaimableBecause: null, botTier: null });
  });

  it("leaves out a row with nothing to print, which nobody could recognise or tap", async () => {
    rows = [
      member({ id: "blank00xxxxxxxxx", name: "" }),
      member({ id: "spaces0xxxxxxxxx", name: "   " }),
      member({ id: "hanakojdxxxxxxxx", name: "Hanako Morris" }),
    ];

    expect((await seatPickList()).map((one) => one.id)).toEqual(["hanakojdxxxxxxxx"]);
  });

  /*
   * In the order it is PRINTED. The column holds full names and the screen shows
   * first names, so ordering by the column would leave the list looking
   * unordered — and a list nobody can scan is the failure this approach exists to
   * avoid, since there is no search box to fall back on.
   */
  it("is in the order a person reads it in", async () => {
    rows = [
      member({ id: "sorajdxxxxxxxxxx", name: "Sora Tanaka" }),
      member({ id: "hanakojdxxxxxxxx", name: "Hanako Morris" }),
      member({ id: "kayajdxxxxxxxxxx", name: "Kaya Ito" }),
    ];

    expect((await seatPickList()).map((one) => one.shown)).toEqual(["Hanako M.", "Kaya I.", "Sora T."]);
  });

  it("is an empty list, not a refusal, when nobody can sit down", async () => {
    expect(await seatPickList()).toEqual([]);
  });
});
