import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The operator's door onto somebody else's four words, from the route in.
 *
 * `operatorPhrase.test.ts` pins the two refusals as rules. This pins that the
 * ROUTE asks them — that it proves the operator rather than a member, that it
 * reads the ticket against the member named in the PATH, that a status the
 * modal can act on comes back for each refusal, and that the words never appear
 * in a response or a log line.
 *
 * A member session is the case worth naming, because it is the one a mistake
 * would look most ordinary: `currentMemberId` is what every other phrase route
 * asks, and a route here that asked it would set the OPERATOR's own words from
 * a path naming somebody else.
 */

type Outcome =
  | { ok: true; replaced: boolean; target: { id: string; setAt: Date | null } }
  | { ok: false; reason: "no-member" }
  | { ok: false; reason: "not-claimable" | "needs-confirm" | "not-a-phrase"; target: { id: string; setAt: Date | null } };

const currentAdmin = vi.fn<() => Promise<{ email?: string } | null>>(async () => ({ email: "op@example.com" }));
const setPhraseAsOperator = vi.fn<
  (id: string, words: readonly string[], options: { replacing: boolean }) => Promise<Outcome>
>(async (id) => ({ ok: true, replaced: false, target: { id, setAt: null } }));
const readTicket = vi.fn<(token: string, member: string) => Promise<{ member: string; slots: (string | null)[] } | null>>(
  async (token, member) => ({ member, slots: [...FOUR] }),
);
const logOperatorAction = vi.fn<(who: string | null | undefined, what: string) => void>(() => undefined);

const FOUR = ["acid", "mango", "yo-yo", "zebra"] as const;

vi.mock("@/lib/api/rateLimit", () => ({ overLimit: () => null, RATE_LIMITS: { phraseDraw: {} } }));
vi.mock("@/lib/auth/requireAdmin", () => ({ currentAdmin: () => currentAdmin() }));
vi.mock("@/lib/auth/operatorLog", () => ({
  logOperatorAction: (...args: Parameters<typeof logOperatorAction>) => logOperatorAction(...args),
}));
vi.mock("@/lib/phrase/operatorPhrase", () => ({
  setPhraseAsOperator: (...args: Parameters<typeof setPhraseAsOperator>) => setPhraseAsOperator(...args),
}));
vi.mock("@/lib/phrase/pickTicket", () => ({
  readTicket: (...args: Parameters<typeof readTicket>) => readTicket(...args),
  /*
   * The real rule, not a stub: four words is a finished phrase and three is
   * not. Stubbing it true would let the "not finished" case below pass without
   * the route ever asking.
   */
  completedPhrase: (state: { slots: (string | null)[] }) => {
    const kept = state.slots.filter((word): word is string => word !== null);
    return kept.length === 4 ? kept : null;
  },
}));

const { PUT } = await import("./route");

function put(body: unknown, id = "hanako") {
  return PUT(
    new Request(`https://itsutsu.com/api/admin/members/${id}/phrase`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

const GOOD = { ticket: "a-signed-ticket", acknowledged: true };

beforeEach(() => {
  currentAdmin.mockReset().mockResolvedValue({ email: "op@example.com" });
  setPhraseAsOperator
    .mockReset()
    .mockImplementation(async (id) => ({ ok: true, replaced: false, target: { id, setAt: null } }));
  readTicket.mockReset().mockImplementation(async (token, member) => ({ member, slots: [...FOUR] }));
  logOperatorAction.mockClear();
});

describe("only the operator gets in", () => {
  it("answers 404 to anybody who is not the operator, and writes nothing", async () => {
    currentAdmin.mockResolvedValue(null);
    const response = await put(GOOD);
    expect(response.status).toBe(404);
    expect(setPhraseAsOperator, "somebody's words were set by a caller who is not the operator").not.toHaveBeenCalled();
  });

  /*
   * The member session is the mistake to guard against by name. Every other
   * phrase route asks `currentMemberId`, and this one must not: `currentAdmin`
   * is the only function that can answer "may you act on somebody ELSE's
   * account". A member's cookie makes `currentAdmin` null, which is this case.
   */
  it("is not satisfied by an ordinary member's session", async () => {
    currentAdmin.mockResolvedValue(null);
    expect((await put(GOOD)).status).toBe(404);
  });

  it("never reads a ticket for a caller it has not admitted", async () => {
    currentAdmin.mockResolvedValue(null);
    await put(GOOD);
    expect(readTicket).not.toHaveBeenCalled();
  });
});

describe("the ticket belongs to the member in the path", () => {
  it("reads it against that member and not against the operator", async () => {
    await put(GOOD, "hanako");
    expect(readTicket).toHaveBeenCalledWith("a-signed-ticket", "hanako");
  });

  it("answers 409 to a ticket that was signed for somebody else", async () => {
    readTicket.mockResolvedValue(null);
    const response = await put(GOOD, "hanako");
    expect(response.status).toBe(409);
    expect(setPhraseAsOperator).not.toHaveBeenCalled();
  });

  it("refuses a pick that is not finished rather than hashing three words", async () => {
    readTicket.mockResolvedValue({ member: "hanako", slots: ["acid", "mango", "yo-yo", null] });
    const response = await put(GOOD, "hanako");
    expect(response.status).toBe(422);
    expect(setPhraseAsOperator).not.toHaveBeenCalled();
  });

  it("sends the store the words the ticket held, never anything off the body", async () => {
    await put({ ...GOOD, words: ["hack", "hack", "hack", "hack"] }, "hanako");
    expect(setPhraseAsOperator).toHaveBeenCalledWith("hanako", [...FOUR], { replacing: false });
  });
});

describe("the words have to have been written down", () => {
  it("refuses without the acknowledgement, and says what would fix it", async () => {
    const response = await put({ ticket: "a-signed-ticket" });
    expect(response.status).toBe(400);
    expect(((await response.json()) as { error: string }).error).toContain("Write the four words down");
    expect(setPhraseAsOperator).not.toHaveBeenCalled();
  });

  it("refuses an acknowledgement of false, which is not an answer", async () => {
    expect((await put({ ticket: "a-signed-ticket", acknowledged: false })).status).toBe(400);
  });

  it("refuses a body that is not JSON at all", async () => {
    const response = await PUT(
      new Request("https://itsutsu.com/api/admin/members/hanako/phrase", { method: "PUT", body: "{" }),
      { params: Promise.resolve({ id: "hanako" }) },
    );
    expect(response.status).toBe(400);
  });
});

describe("replacing words somebody already has", () => {
  it("is refused with 409 and the date, and the modal is told a confirm is what is missing", async () => {
    const when = new Date("2026-03-03T10:00:00.000Z");
    setPhraseAsOperator.mockResolvedValue({
      ok: false,
      reason: "needs-confirm",
      target: { id: "hanako", setAt: when },
    });

    const response = await put(GOOD);
    expect(response.status).toBe(409);
    const payload = (await response.json()) as { confirmNeeded?: boolean; phraseSetAt?: string; error: string };
    /*
     * The FLAG and not the status, because an expired ticket is also a 409 and
     * the two need two different things said. A modal branching on 409 alone
     * would ask "replace them?" about a pick that had simply timed out.
     */
    expect(payload.confirmNeeded).toBe(true);
    expect(payload.phraseSetAt).toBe(when.toISOString());
  });

  it("passes the confirm on when the operator has given it", async () => {
    await put({ ...GOOD, replacing: true });
    expect(setPhraseAsOperator).toHaveBeenCalledWith("hanako", [...FOUR], { replacing: true });
  });

  it("does not accept replacing: false as an answer to the question", async () => {
    expect((await put({ ...GOOD, replacing: false })).status).toBe(400);
  });
});

describe("a row that is nobody's account", () => {
  it("is refused with 422 and a sentence that says why", async () => {
    setPhraseAsOperator.mockResolvedValue({
      ok: false,
      reason: "not-claimable",
      target: { id: "chibi", setAt: null },
    });
    const response = await put(GOOD, "chibi");
    expect(response.status).toBe(422);
    expect(((await response.json()) as { error: string }).error).toContain("not an account anybody signs in to");
  });

  it("is 404 for no such member", async () => {
    setPhraseAsOperator.mockResolvedValue({ ok: false, reason: "no-member" });
    expect((await put(GOOD, "ghost")).status).toBe(404);
  });
});

describe("what is said afterwards", () => {
  it("answers ok and whether it replaced anything, and never the words or a hash", async () => {
    const response = await put(GOOD);
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(JSON.parse(body)).toMatchObject({ ok: true, replaced: false });
    for (const word of FOUR) {
      expect(body, "a word somebody will use as a password came back in the response").not.toContain(word);
    }
  });

  it("logs the operator, the member and that it replaced nothing — and no word of the phrase", async () => {
    await put(GOOD);
    expect(logOperatorAction).toHaveBeenCalledTimes(1);
    const [who, what] = logOperatorAction.mock.calls[0];
    expect(who).toBe("op@example.com");
    expect(what).toContain("hanako");
    expect(what).toContain("set");
    for (const word of FOUR) {
      expect(what, "a word of the phrase reached a log line").not.toContain(word);
    }
  });

  it("says REPLACED in the line when it replaced somebody's words, with the date they were set", async () => {
    const when = new Date("2026-03-03T10:00:00.000Z");
    setPhraseAsOperator.mockResolvedValue({ ok: true, replaced: true, target: { id: "hanako", setAt: when } });
    await put({ ...GOOD, replacing: true });
    const [, what] = logOperatorAction.mock.calls[0];
    expect(what).toContain("REPLACED");
    expect(what).toContain(when.toISOString());
  });

  it("logs nothing at all when it refused", async () => {
    setPhraseAsOperator.mockResolvedValue({
      ok: false,
      reason: "needs-confirm",
      target: { id: "hanako", setAt: new Date() },
    });
    await put(GOOD);
    expect(logOperatorAction).not.toHaveBeenCalled();
  });
});
