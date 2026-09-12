import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The operator's picker, from the route in.
 *
 * What is worth pinning here is not the pick — `pickTicket.test.ts` owns that —
 * but WHOSE pick it is. The member's own draw route ties the ticket to the
 * caller; this one ties it to the member named in the path and lets only the
 * operator ask. Those two sentences are the whole difference between the two
 * files, and a route that got either half wrong would work perfectly for the
 * operator while being a way to set somebody's password.
 *
 * It also refuses a row that is nobody's account BEFORE offering any words, so
 * that an operator is never four words deep into a pick that cannot be saved.
 */

type Target = { id: string; name: string; email: string | null; mayHavePhrase: boolean; set: boolean; setAt: Date | null };

const currentAdmin = vi.fn<() => Promise<{ email?: string } | null>>(async () => ({ email: "op@example.com" }));
const phraseTarget = vi.fn<(id: string) => Promise<Target | null>>(async (id) => ({
  id,
  name: "Hanako",
  email: "hanako@example.com",
  mayHavePhrase: true,
  set: false,
  setAt: null,
}));
const freshTicket = vi.fn((member: string) => ({ member, slots: [null, null, null, null], offered: ["acid"] }));
const readTicket = vi.fn<(token: string, member: string) => Promise<{ member: string } | null>>(async (token, member) => ({
  member,
}));
const logOperatorAction = vi.fn<(who: string | null | undefined, what: string) => void>(() => undefined);

vi.mock("@/lib/api/rateLimit", () => ({ overLimit: () => null, RATE_LIMITS: { phraseDraw: { windowMs: 1, maxRequests: 1 } } }));
vi.mock("@/lib/auth/requireAdmin", () => ({ currentAdmin: () => currentAdmin() }));
vi.mock("@/lib/auth/operatorLog", () => ({
  logOperatorAction: (...args: Parameters<typeof logOperatorAction>) => logOperatorAction(...args),
}));
vi.mock("@/lib/phrase/operatorPhrase", () => ({ phraseTarget: (id: string) => phraseTarget(id) }));
vi.mock("@/lib/phrase/pickTicket", () => ({
  freshTicket: (member: string) => freshTicket(member),
  readTicket: (...args: Parameters<typeof readTicket>) => readTicket(...args),
  keep: (state: object) => ({ ...state, kept: true }),
  drop: (state: object) => ({ ...state, dropped: true }),
  reroll: (state: object) => ({ ...state, rerolled: true }),
  sealTicket: async () => "a-signed-ticket",
  completedPhrase: () => null,
}));

const { POST } = await import("./route");

function post(body: unknown, id = "hanako") {
  return POST(
    new Request(`https://itsutsu.com/api/admin/members/${id}/phrase/draw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

beforeEach(() => {
  currentAdmin.mockReset().mockResolvedValue({ email: "op@example.com" });
  phraseTarget.mockReset().mockImplementation(async (id) => ({
    id,
    name: "Hanako",
    email: "hanako@example.com",
    mayHavePhrase: true,
    set: false,
    setAt: null,
  }));
  freshTicket.mockClear();
  readTicket.mockReset().mockImplementation(async (token, member) => ({ member }));
  logOperatorAction.mockClear();
});

describe("only the operator may draw for somebody else", () => {
  it("answers 404 to a caller who is not the operator, and offers no words", async () => {
    currentAdmin.mockResolvedValue(null);
    const response = await post({});
    expect(response.status).toBe(404);
    expect(freshTicket, "four words were drawn for a caller who is not the operator").not.toHaveBeenCalled();
    expect(phraseTarget, "a member row was read for a caller who is not the operator").not.toHaveBeenCalled();
  });
});

describe("the pick belongs to the member in the path", () => {
  it("starts a fresh pick tied to that member", async () => {
    await post({}, "hanako");
    expect(freshTicket).toHaveBeenCalledWith("hanako");
  });

  it("reads a ticket back against that member, not against the operator", async () => {
    await post({ ticket: "a-signed-ticket" }, "hanako");
    expect(readTicket).toHaveBeenCalledWith("a-signed-ticket", "hanako");
  });

  it("answers 409 to a ticket signed for a different member", async () => {
    readTicket.mockResolvedValue(null);
    expect((await post({ ticket: "someone-elses" })).status).toBe(409);
  });

  it("says who the pick is for, with the words state as of now", async () => {
    const when = new Date("2026-03-03T10:00:00.000Z");
    phraseTarget.mockResolvedValue({
      id: "hanako",
      name: "Hanako",
      email: "hanako@example.com",
      mayHavePhrase: true,
      set: true,
      setAt: when,
    });
    const payload = (await (await post({})).json()) as { member: { set: boolean; setAt: string | null } };
    /*
     * So the modal can ask the replace question BEFORE four words are chosen,
     * against the server's answer rather than a members list that may be
     * minutes old.
     */
    expect(payload.member).toEqual({ id: "hanako", name: "Hanako", set: true, setAt: when.toISOString() });
  });
});

describe("a row that is nobody's account", () => {
  it("is refused before a single word is offered", async () => {
    phraseTarget.mockResolvedValue({
      id: "chibi",
      name: "Chibi",
      email: null,
      mayHavePhrase: false,
      set: false,
      setAt: null,
    });
    const response = await post({}, "chibi");
    expect(response.status).toBe(422);
    expect(freshTicket, "an operator was taken four words into a pick that could never be saved").not.toHaveBeenCalled();
  });

  it("is 404 for no such member", async () => {
    phraseTarget.mockResolvedValue(null);
    expect((await post({}, "ghost")).status).toBe(404);
  });
});

describe("what is recorded", () => {
  /*
   * Opening a pick for somebody is the act worth a line — an operator reaching
   * for another person's credential, whether or not they go through with it.
   * Every reroll after that is the same act continuing.
   */
  it("logs the opening of a pick, once, naming the member and no word of the offer", async () => {
    await post({});
    expect(logOperatorAction).toHaveBeenCalledTimes(1);
    const [who, what] = logOperatorAction.mock.calls[0];
    expect(who).toBe("op@example.com");
    expect(what).toContain("hanako");
    expect(what).not.toContain("acid");
  });

  it("says nothing more as the pick goes on", async () => {
    await post({ ticket: "a-signed-ticket" });
    await post({ ticket: "a-signed-ticket", keep: 0 });
    expect(logOperatorAction).not.toHaveBeenCalled();
  });
});

describe("one instruction at a time", () => {
  it("refuses keeping and dropping in one request", async () => {
    expect((await post({ ticket: "a-signed-ticket", keep: 0, drop: 1 })).status).toBe(400);
  });

  it("refuses a body that is not JSON", async () => {
    const response = await POST(
      new Request("https://itsutsu.com/api/admin/members/hanako/phrase/draw", { method: "POST", body: "{" }),
      { params: Promise.resolve({ id: "hanako" }) },
    );
    expect(response.status).toBe(400);
  });
});
