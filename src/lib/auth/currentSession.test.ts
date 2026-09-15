import { describe, expect, it, vi } from "vitest";

const touchMember = vi.fn<(by: string, value: string) => Promise<{ banned: boolean }>>(async () => ({ banned: false }));
const memberRowFor = vi.fn(async () => null);
const verifySession = vi.fn();
const get = vi.fn(() => ({ value: "token" }));

vi.mock("next/headers", () => ({ cookies: async () => ({ get }) }));
vi.mock("./memberRow", () => ({ memberRowFor, touchMember }));
vi.mock("./session", () => ({ SESSION_COOKIE: "session", verifySession }));

const { currentSession } = await import("./currentSession");

/**
 * touchMember only ever ran inside the GET /api/session route handler, which
 * nothing on ordinary page navigation calls — a signed-in member's
 * "last seen" never moved past their first sign-in, so "who is here" quietly
 * read zero. This pins the wiring that fixes it: every call through
 * currentSession, which every page already makes, touches presence too.
 *
 * BY THE MEMBER THE SESSION NAMES: its id where it carries one, which every
 * session made now does — a member who came in with an invite code has no
 * address to be touched by — and the address on a Google cookie from before.
 */
describe("currentSession touches presence", () => {
  it("touches a member by the id their session carries", async () => {
    verifySession.mockResolvedValueOnce({ kind: "player", memberId: "m-guest", code: "tea-house" });
    touchMember.mockClear();

    const session = await currentSession();

    expect(session?.memberId).toBe("m-guest");
    expect(touchMember).toHaveBeenCalledWith("id", "m-guest");
  });

  it("touches an older Google cookie by its folded address", async () => {
    verifySession.mockResolvedValueOnce({ kind: "player", email: "Aki@Example.com" });
    touchMember.mockClear();

    const session = await currentSession();

    expect(session?.email).toBe("Aki@Example.com");
    expect(touchMember).toHaveBeenCalledWith("email", "aki@example.com");
  });

  it("touches nothing for a browser with no session, or one that names no member", async () => {
    verifySession.mockResolvedValueOnce(null);
    touchMember.mockClear();
    await currentSession();
    expect(touchMember).not.toHaveBeenCalled();

    // An invite cookie from before a code made a member: `/api/session` makes one on its next visit.
    verifySession.mockResolvedValueOnce({ kind: "player", code: "tea-house" });
    touchMember.mockClear();
    await currentSession();
    expect(touchMember).not.toHaveBeenCalled();
  });

  it("still returns the session even if touching presence fails", async () => {
    verifySession.mockResolvedValueOnce({ kind: "admin", email: "op@example.com" });
    touchMember.mockRejectedValueOnce(new Error("db is down"));

    await expect(currentSession()).resolves.toMatchObject({ email: "op@example.com" });
  });
});

/**
 * A ban is a fact about the account, not about the cookie: the signed cookie
 * still says who they are, and the next request is the one that stops working.
 */
describe("a shut account", () => {
  it("has no session, however good its cookie is", async () => {
    verifySession.mockResolvedValueOnce({ kind: "player", email: "gone@example.com" });
    touchMember.mockResolvedValueOnce({ banned: true });

    expect(await currentSession()).toBeNull();
  });

  it("is shut for a member who came in with an invite code, too", async () => {
    // It was not: presence and the ban were read by address, and this member has none.
    verifySession.mockResolvedValueOnce({ kind: "player", memberId: "m-guest", code: "tea-house" });
    touchMember.mockResolvedValueOnce({ banned: true });

    expect(await currentSession()).toBeNull();
  });
});
