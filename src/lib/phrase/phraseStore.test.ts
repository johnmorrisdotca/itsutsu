import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Setting, checking and clearing a member's phrase.
 *
 * THE ONE THING THESE TESTS EXIST FOR is that gaining a credential is PURELY
 * ADDITIVE. The bug fixed in 0.132.0 orphaned five games and a rating because a
 * record was found by NAME and the person renamed herself; the half-migration
 * before it did the same thing. So the cases below do not only check that a
 * phrase can be set — they check that setting one writes TWO COLUMNS on ONE ROW
 * found BY ID, creates nothing, and touches nothing else. A passing "it works"
 * over a `create` would be the same fault a third time.
 */

type Row = {
  id: string;
  email: string | null;
  name: string;
  phraseHash: string | null;
  phraseSetAt: Date | null;
  bannedAt: Date | null;
  unclaimableBecause: string | null;
  botTier: string | null;
};

let rows: Row[] = [];
/** Every write the store made, so a test can say what it did and did not touch. */
let writes: { where: unknown; data: Record<string, unknown> }[] = [];

function member(overrides: Partial<Row> & { id: string; name: string }): Row {
  return {
    email: null,
    phraseHash: null,
    phraseSetAt: null,
    bannedAt: null,
    unclaimableBecause: null,
    botTier: null,
    ...overrides,
  };
}

const create = vi.fn(async () => {
  throw new Error("The store must never create a member.");
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    member: {
      create,
      findUnique: async ({ where }: { where: { id?: string; email?: string } }) =>
        rows.find((row) => (where.id !== undefined ? row.id === where.id : row.email === where.email)) ?? null,
      findFirst: async ({ where }: { where: { name?: { equals?: string } } }) => {
        const wanted = (where.name?.equals ?? "").trim().toLowerCase();
        return rows.find((row) => row.name.trim().toLowerCase() === wanted) ?? null;
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        writes.push({ where, data });
        const row = rows.find((one) => one.id === where.id);
        if (row === undefined) throw new Error("No such member.");
        Object.assign(row, data);
        return row;
      },
    },
  },
}));

const { clearPhrase, phraseStatus, setPhrase, verifyPhraseFor } = await import("./phraseStore");

/** Hanako: an account that already exists and has already played. */
const HANAKO = "h4n4k0jdxxxxxxxx";
const WORDS = ["acid", "zebra", "mango", "flock"];

beforeEach(() => {
  rows = [
    member({ id: HANAKO, name: "Hanako M.", email: null }),
    member({ id: "j0hnjdxxxxxxxxxx", name: "John", email: "john@spxis.com" }),
  ];
  writes = [];
  create.mockClear();
});

describe("setPhrase", () => {
  it("sets a phrase on an account that already exists", async () => {
    expect(await setPhrase(HANAKO, WORDS)).toEqual({ ok: true });
    expect(rows[0].phraseHash).not.toBeNull();
    expect(rows[0].phraseSetAt).toBeInstanceOf(Date);
  });

  it("finds the member BY ID, never by name or address", async () => {
    await setPhrase(HANAKO, WORDS);
    expect(writes).toHaveLength(1);
    expect(writes[0].where).toEqual({ id: HANAKO });
  });

  it("writes the two phrase columns and nothing else", async () => {
    await setPhrase(HANAKO, WORDS);
    expect(Object.keys(writes[0].data).sort()).toEqual(["phraseHash", "phraseSetAt"]);
  });

  it("never creates a member", async () => {
    await setPhrase(HANAKO, WORDS);
    expect(create).not.toHaveBeenCalled();
  });

  it("leaves the id, the name and the address exactly as they were", async () => {
    const before = { ...rows[0] };
    await setPhrase(HANAKO, WORDS);
    expect(rows[0].id).toBe(before.id);
    expect(rows[0].name).toBe(before.name);
    expect(rows[0].email).toBe(before.email);
  });

  it("stores a hash and not the words", async () => {
    await setPhrase(HANAKO, WORDS);
    const stored = rows[0].phraseHash ?? "";
    for (const word of WORDS) expect(stored).not.toContain(word);
  });

  it("refuses words that are not a phrase, and writes nothing", async () => {
    expect(await setPhrase(HANAKO, ["acid", "zebra"])).toEqual({ ok: false, reason: "not-a-phrase" });
    expect(await setPhrase(HANAKO, ["acid", "zebra", "mango", "xyzzy"])).toEqual({
      ok: false,
      reason: "not-a-phrase",
    });
    expect(writes).toHaveLength(0);
  });

  it("refuses a member who is not there, rather than creating one", async () => {
    expect(await setPhrase("nobodyatallxxxxx", WORDS)).toEqual({ ok: false, reason: "no-member" });
    expect(create).not.toHaveBeenCalled();
    expect(writes).toHaveLength(0);
  });

  it("rerolls: setting a second phrase replaces the first and keeps the row", async () => {
    await setPhrase(HANAKO, WORDS);
    const first = rows[0].phraseHash;
    expect(await setPhrase(HANAKO, ["acorn", "brick", "cloud", "dress"])).toEqual({ ok: true });
    expect(rows[0].phraseHash).not.toBe(first);
    expect(rows[0].id).toBe(HANAKO);
    expect(await verifyPhraseFor("Hanako M.", WORDS)).toBeNull();
    expect(await verifyPhraseFor("Hanako M.", ["acorn", "brick", "cloud", "dress"])).toBe(HANAKO);
  });
});

describe("verifyPhraseFor", () => {
  it("names the member whose phrase it is", async () => {
    await setPhrase(HANAKO, WORDS);
    expect(await verifyPhraseFor("Hanako M.", WORDS)).toBe(HANAKO);
  });

  /*
   * The property John asked for, at the level that decides a seat: set in one
   * order, entered in another, and it is her.
   */
  it("accepts the same four words in any order", async () => {
    await setPhrase(HANAKO, WORDS);
    expect(await verifyPhraseFor("Hanako M.", ["flock", "mango", "zebra", "acid"])).toBe(HANAKO);
  });

  it("accepts the name however it was capitalised", async () => {
    await setPhrase(HANAKO, WORDS);
    expect(await verifyPhraseFor("hanako m.", WORDS)).toBe(HANAKO);
    expect(await verifyPhraseFor("  Hanako M.  ", WORDS)).toBe(HANAKO);
  });

  it("refuses the wrong words", async () => {
    await setPhrase(HANAKO, WORDS);
    expect(await verifyPhraseFor("Hanako M.", ["acid", "zebra", "mango", "acorn"])).toBeNull();
  });

  it("refuses a member who has not set a phrase", async () => {
    expect(await verifyPhraseFor("John", WORDS)).toBeNull();
  });

  it("refuses a name nobody here goes by", async () => {
    expect(await verifyPhraseFor("Nobody", WORDS)).toBeNull();
  });

  it("refuses a banned member, whatever they type", async () => {
    await setPhrase(HANAKO, WORDS);
    rows[0].bannedAt = new Date();
    expect(await verifyPhraseFor("Hanako M.", WORDS)).toBeNull();
  });

  it("refuses a row that may never be claimed by a login — a kept record or a seed", async () => {
    await setPhrase(HANAKO, WORDS);
    rows[0].unclaimableBecause = "kept-record";
    expect(await verifyPhraseFor("Hanako M.", WORDS)).toBeNull();
  });

  it("refuses a computer player", async () => {
    await setPhrase(HANAKO, WORDS);
    rows[0].botTier = "shodan";
    expect(await verifyPhraseFor("Hanako M.", WORDS)).toBeNull();
  });

  it("refuses a blank name without going near the database", async () => {
    expect(await verifyPhraseFor("", WORDS)).toBeNull();
    expect(await verifyPhraseFor("   ", WORDS)).toBeNull();
  });

  it("refuses words that are not a phrase at all", async () => {
    await setPhrase(HANAKO, WORDS);
    expect(await verifyPhraseFor("Hanako M.", ["acid"])).toBeNull();
    expect(await verifyPhraseFor("Hanako M.", [])).toBeNull();
  });
});

describe("phraseStatus", () => {
  it("says a phrase is set and when, and never what it is", async () => {
    await setPhrase(HANAKO, WORDS);
    const status = await phraseStatus(HANAKO);
    expect(status).not.toBeNull();
    expect(status?.set).toBe(true);
    expect(status?.setAt).toBeInstanceOf(Date);
    expect(JSON.stringify(status)).not.toContain("scrypt");
    for (const word of WORDS) expect(JSON.stringify(status)).not.toContain(word);
  });

  it("says plainly when there is none", async () => {
    const status = await phraseStatus(HANAKO);
    expect(status?.set).toBe(false);
    expect(status?.setAt).toBeNull();
  });

  it("says whether the phrase could be removed — an account keeps one way in", async () => {
    await setPhrase(HANAKO, WORDS);
    // Hanako has no address, so her words are the only way in.
    expect((await phraseStatus(HANAKO))?.mayRemovePhrase).toBe(false);
    rows[0].email = "hanako@example.com";
    expect((await phraseStatus(HANAKO))?.mayRemovePhrase).toBe(true);
  });

  it("is null for a member who is not there, rather than a hopeful default", async () => {
    expect(await phraseStatus("nobodyatallxxxxx")).toBeNull();
  });
});

describe("clearPhrase", () => {
  it("refuses to remove the only way into an account", async () => {
    await setPhrase(HANAKO, WORDS);
    expect(await clearPhrase(HANAKO)).toEqual({ ok: false, reason: "last-credential" });
    expect(rows[0].phraseHash).not.toBeNull();
  });

  it("removes it when an address is still there", async () => {
    rows[0].email = "hanako@example.com";
    await setPhrase(HANAKO, WORDS);
    expect(await clearPhrase(HANAKO)).toEqual({ ok: true });
    expect(rows[0].phraseHash).toBeNull();
    expect(rows[0].phraseSetAt).toBeNull();
  });

  it("refuses when there is no phrase to remove", async () => {
    rows[0].email = "hanako@example.com";
    expect(await clearPhrase(HANAKO)).toEqual({ ok: false, reason: "last-credential" });
  });

  it("clears by id, and touches only the two columns", async () => {
    rows[0].email = "hanako@example.com";
    await setPhrase(HANAKO, WORDS);
    writes = [];
    await clearPhrase(HANAKO);
    expect(writes).toHaveLength(1);
    expect(writes[0].where).toEqual({ id: HANAKO });
    expect(Object.keys(writes[0].data).sort()).toEqual(["phraseHash", "phraseSetAt"]);
  });

  it("is null-safe about a member who is not there", async () => {
    expect(await clearPhrase("nobodyatallxxxxx")).toEqual({ ok: false, reason: "no-member" });
  });
});
