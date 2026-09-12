import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The two refusals that stand between an operator and somebody else's
 * credential.
 *
 * Neither is about phrases, which is why they are here rather than in the
 * store: one asks whether a ROW is an account at all, and the other asks
 * whether the operator has been told what they are about to take away. The
 * store still owns the hashing and is called exactly once, by the one path
 * that gets past both.
 */

type Row = {
  id: string;
  name: string;
  email: string | null;
  unclaimableBecause: string | null;
  phraseHash: string | null;
  phraseSetAt: Date | null;
};

let rows: Row[] = [];

function member(overrides: Partial<Row> & { id: string }): Row {
  return {
    name: "Somebody",
    email: "somebody@example.com",
    unclaimableBecause: null,
    phraseHash: null,
    phraseSetAt: null,
    ...overrides,
  };
}

const setPhrase = vi.fn(async () => ({ ok: true }) as { ok: true } | { ok: false; reason: string });

vi.mock("@/lib/prisma", () => ({
  prisma: {
    member: {
      findUnique: async (args: { where: { id: string } }) =>
        rows.find((row) => row.id === args.where.id) ?? null,
    },
  },
}));
vi.mock("./phraseStore", () => ({ setPhrase: (...args: unknown[]) => setPhrase(...(args as [])) }));

const { phraseTarget, setPhraseAsOperator } = await import("./operatorPhrase");

const FOUR = ["acid", "mango", "yo-yo", "zebra"] as const;

beforeEach(() => {
  rows = [];
  setPhrase.mockClear().mockResolvedValue({ ok: true });
});

describe("phraseTarget", () => {
  it("is null for a member who is not there, rather than a target that can do nothing", async () => {
    expect(await phraseTarget("nobody")).toBeNull();
  });

  it("is null for a blank id without asking the database", async () => {
    rows = [member({ id: "hanako" })];
    expect(await phraseTarget("   ")).toBeNull();
  });

  it("says a plain account may hold words, and that it has none yet", async () => {
    rows = [member({ id: "hanako", name: "Hanako" })];
    expect(await phraseTarget("hanako")).toEqual({
      id: "hanako",
      name: "Hanako",
      email: "somebody@example.com",
      mayHavePhrase: true,
      set: false,
      setAt: null,
    });
  });

  it("reports the date words were set, and never the hash", async () => {
    const when = new Date("2026-03-03T10:00:00.000Z");
    rows = [member({ id: "hanako", phraseHash: "scrypt$whatever", phraseSetAt: when })];
    const target = await phraseTarget("hanako");
    expect(target?.set).toBe(true);
    expect(target?.setAt).toEqual(when);
    expect(JSON.stringify(target), "a hash reached the operator's screen").not.toContain("scrypt");
  });

  /*
   * An empty hash is not a phrase. It is the same "a value in range that also
   * means nothing" trap the store already guards: a row written with "" would
   * otherwise be reported as having words nobody can use, and the operator
   * would be asked to confirm replacing something that is not there.
   */
  it("counts an empty hash as no phrase", async () => {
    rows = [member({ id: "hanako", phraseHash: "" })];
    expect((await phraseTarget("hanako"))?.set).toBe(false);
  });
});

describe("a row that is nobody's account", () => {
  /*
   * A phrase is a way IN. `unclaimableBecause` says this row may never be
   * claimed by a login, so writing one would invent a credential for an account
   * that has no person behind it — a kept record could be walked into by
   * whoever held the four words.
   */
  for (const reason of ["kept-record", "seed", "computer"]) {
    it(`refuses ${reason} and writes nothing`, async () => {
      rows = [member({ id: "chibi", unclaimableBecause: reason })];
      const outcome = await setPhraseAsOperator("chibi", FOUR, { replacing: true });
      expect(outcome).toEqual({ ok: false, reason: "not-claimable", target: expect.anything() });
      expect(setPhrase, "the store was reached for a row nobody signs in to").not.toHaveBeenCalled();
    });
  }

  it("says no-member for a row that is not there at all, which is a different answer", async () => {
    const outcome = await setPhraseAsOperator("ghost", FOUR, { replacing: true });
    expect(outcome).toEqual({ ok: false, reason: "no-member" });
    expect(setPhrase).not.toHaveBeenCalled();
  });
});

describe("replacing four words somebody is already using", () => {
  it("refuses without the confirm, and hands back the date so the question can be asked", async () => {
    const when = new Date("2026-03-03T10:00:00.000Z");
    rows = [member({ id: "hanako", phraseHash: "scrypt$whatever", phraseSetAt: when })];

    const outcome = await setPhraseAsOperator("hanako", FOUR, { replacing: false });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe("needs-confirm");
    expect(outcome.reason === "needs-confirm" ? outcome.target.setAt : null).toEqual(when);
    expect(setPhrase, "somebody's way into their own account was replaced unasked").not.toHaveBeenCalled();
  });

  it("writes once the operator has said to, and says that it replaced them", async () => {
    rows = [member({ id: "hanako", phraseHash: "scrypt$whatever", phraseSetAt: new Date() })];

    const outcome = await setPhraseAsOperator("hanako", FOUR, { replacing: true });

    expect(outcome).toEqual({ ok: true, replaced: true, target: expect.anything() });
    expect(setPhrase).toHaveBeenCalledWith("hanako", FOUR);
  });

  /*
   * The confirm is about words that EXIST. Asking for one on a first phrase
   * would train the operator to press through a question that means something
   * on other rows, which is how a confirm stops being read.
   */
  it("asks nothing on an account with no words, whatever the flag says", async () => {
    rows = [member({ id: "hanako" })];
    expect(await setPhraseAsOperator("hanako", FOUR, { replacing: false })).toEqual({
      ok: true,
      replaced: false,
      target: expect.anything(),
    });
    expect(setPhrase).toHaveBeenCalledWith("hanako", FOUR);
  });
});

describe("what the store says still decides", () => {
  it("passes on a refusal about the words themselves rather than reporting success", async () => {
    rows = [member({ id: "hanako" })];
    setPhrase.mockResolvedValue({ ok: false, reason: "not-a-phrase" });
    const outcome = await setPhraseAsOperator("hanako", ["acid"], { replacing: false });
    expect(outcome.ok).toBe(false);
    expect(outcome.ok ? null : outcome.reason).toBe("not-a-phrase");
  });

  /*
   * The row was read a moment ago, so this cannot happen — and if it does, the
   * answer must be "there is no such member" rather than "those are not four
   * words", which would be a lie about which thing went wrong.
   */
  it("keeps no-member as no-member when the row goes between the read and the write", async () => {
    rows = [member({ id: "hanako" })];
    setPhrase.mockResolvedValue({ ok: false, reason: "no-member" });
    const outcome = await setPhraseAsOperator("hanako", FOUR, { replacing: false });
    expect(outcome).toEqual({ ok: false, reason: "no-member" });
  });
});
