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
      /*
       * `take` is honoured, because the store asks for exactly two rows to learn
       * that a name means more than one person. A mock that ignored it would
       * make that test pass over code that had fetched the lot.
       */
      findMany: async ({ where, take }: { where: { name?: { equals?: string } }; take?: number }) => {
        const wanted = (where.name?.equals ?? "").trim().toLowerCase();
        const found = rows.filter((row) => row.name.trim().toLowerCase() === wanted);
        return take === undefined ? found : found.slice(0, take);
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

const { claimOrVerifyPhraseFor, clearPhrase, phraseStatus, setPhrase, verifyPhraseFor } = await import("./phraseStore");

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

describe("four words given at a seat", () => {
  /*
   * The half that was missing, and the whole point of the feature. John: "We
   * don't sign in. She is signed in. We are providing the words to be
   * associated with my account. That's the point." Verification alone could
   * only serve somebody who had already set words from a device signed in as
   * them — which is the one thing this exists to avoid needing.
   *
   * WHO IS TAPPED, NOT TYPED, so every case here claims by member id — the shape
   * the seat actually sends, off the list in `seatPick.ts`. The name shape is
   * exercised at the bottom, where what is being tested is its refusal.
   */
  it("binds the words to an account that has none, and says it did", async () => {
    rows = [member({ id: HANAKO, name: "Hanako M." })];

    const claim = await claimOrVerifyPhraseFor({ memberId: HANAKO }, WORDS);

    expect(claim.ok).toBe(true);
    if (!claim.ok) return;
    expect(claim.memberId).toBe(HANAKO);
    expect(claim.bound, "the screen has to be able to say these are your words now").toBe(true);
    expect(rows[0].phraseHash, "the words were not written").not.toBeNull();
  });

  it("hands back the name ON THE ROW, which is what the seat is stamped with", async () => {
    rows = [member({ id: HANAKO, name: "Hanako M." })];

    const claim = await claimOrVerifyPhraseFor({ memberId: HANAKO }, WORDS);

    expect(claim.ok).toBe(true);
    if (!claim.ok) return;
    // The rating is filed against the seat's name, so it must be the member's
    // own and not a spelling that arrived with the request.
    expect(claim.name).toBe("Hanako M.");
  });

  it("lets those same words back in afterwards, which is what makes them a login", async () => {
    rows = [member({ id: HANAKO, name: "Hanako M." })];
    await claimOrVerifyPhraseFor({ memberId: HANAKO }, WORDS);

    const again = await claimOrVerifyPhraseFor({ memberId: HANAKO }, WORDS);

    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.bound, "the second time is a sign-in, not a claim").toBe(false);
  });

  it("refuses different words once an account has some — first words win, and only once", async () => {
    rows = [member({ id: HANAKO, name: "Hanako M." })];
    await claimOrVerifyPhraseFor({ memberId: HANAKO }, WORDS);

    const other = await claimOrVerifyPhraseFor({ memberId: HANAKO }, ["stove", "punch", "vivid", "cargo"]);

    expect(other.ok, "an account with words is not up for grabs").toBe(false);
  });

  it("NEVER binds words to the operator, whose account is the one where low risk stops being true", async () => {
    process.env.ADMIN_EMAILS = "boss@example.test";
    rows = [member({ id: "operator1xxxxxxx", name: "The Operator", email: "boss@example.test" })];

    const claim = await claimOrVerifyPhraseFor({ memberId: "operator1xxxxxxx" }, WORDS);

    expect(claim.ok).toBe(false);
    expect(rows[0].phraseHash, "the operator's account took words from a seat").toBeNull();
  });

  /*
   * The rows `seatPick.ts` leaves off the list. Both halves are checked because
   * they are one rule read from two ends: a name that can never work must not be
   * offered, AND must be refused if it arrives anyway — a list is a screen, and a
   * screen is not a lock.
   */
  it("binds nothing to a banned member, a kept record, or a computer player", async () => {
    rows = [
      member({ id: "banned0xxxxxxxxx", name: "Gone", bannedAt: new Date() }),
      member({ id: "kept000xxxxxxxxx", name: "Kept", unclaimableBecause: "a record from elsewhere" }),
      member({ id: "program0xxxxxxxx", name: "Kyu", botTier: "kyu" }),
    ];

    for (const row of rows) {
      expect((await claimOrVerifyPhraseFor({ memberId: row.id }, WORDS)).ok, `${row.name} was claimable`).toBe(false);
    }
    for (const row of rows) expect(row.phraseHash).toBeNull();
  });

  it("says nothing different for a member id nobody here holds", async () => {
    rows = [member({ id: HANAKO, name: "Hanako M." })];

    expect((await claimOrVerifyPhraseFor({ memberId: "nobodyatallxxxxx" }, WORDS)).ok).toBe(false);
    expect((await claimOrVerifyPhraseFor({ memberId: "" }, WORDS)).ok).toBe(false);
  });

  /*
   * THE REASON THE SEAT PICKS BY ID AT ALL, and the case that cannot be got
   * right any other way. Display names here are not unique, are not indexed, and
   * — since a name is advice about how you appear to others rather than an
   * identifier — never will be. Two members called the same thing are two rows a
   * person chooses between; the id says which, and nothing has to guess.
   */
  describe("two members with the same name", () => {
    const OTHER = "j0hn2ndjdxxxxxxx";

    beforeEach(() => {
      rows = [
        member({ id: "j0hn1stjdxxxxxxx", name: "John Morris" }),
        member({ id: OTHER, name: "john morris" }),
      ];
    });

    it("reaches the one whose id was tapped, and binds words to that row alone", async () => {
      const claim = await claimOrVerifyPhraseFor({ memberId: OTHER }, WORDS);

      expect(claim.ok).toBe(true);
      if (!claim.ok) return;
      expect(claim.memberId).toBe(OTHER);
      expect(rows[1].phraseHash, "the tapped row got no words").not.toBeNull();
      expect(rows[0].phraseHash, "somebody else's account was written to").toBeNull();
    });

    it("REFUSES the name, rather than picking whichever row came back first", async () => {
      // Not a stopgap for a constraint that is coming: no constraint is coming,
      // and this is the only thing standing between an ambiguous name and an
      // authentication path guessing. It must not be removed as redundant.
      expect((await claimOrVerifyPhraseFor({ name: "John Morris" }, WORDS)).ok).toBe(false);
      expect(await verifyPhraseFor("John Morris", WORDS)).toBeNull();
      for (const row of rows) expect(row.phraseHash, "an ambiguous name bound words").toBeNull();
    });

    it("still answers a name that means exactly one person", async () => {
      rows = [member({ id: HANAKO, name: "Hanako M." })];

      const claim = await claimOrVerifyPhraseFor({ name: "hanako m." }, WORDS);

      expect(claim.ok, "an unambiguous name is still answerable").toBe(true);
    });
  });
});
