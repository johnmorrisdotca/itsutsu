import { describe, expect, it, vi } from "vitest";

const touchMember = vi.fn(async () => ({ banned: false }));
const verifySession = vi.fn();
const get = vi.fn(() => ({ value: "token" }));

vi.mock("next/headers", () => ({ cookies: async () => ({ get }) }));
vi.mock("./members", () => ({ touchMember }));
vi.mock("./session", () => ({ SESSION_COOKIE: "session", verifySession }));

const { currentSession } = await import("./currentSession");

/**
 * touchMember only ever ran inside the GET /api/session route handler, which
 * nothing on ordinary page navigation calls — a signed-in member's
 * "last seen" never moved past their first sign-in, so "who is here" quietly
 * read zero. This pins the wiring that fixes it: every call through
 * currentSession, which every page already makes, touches presence too.
 */
describe("currentSession touches presence", () => {
  it("touches the signed-in member, so a page load counts as being here", async () => {
    verifySession.mockResolvedValueOnce({ kind: "player", email: "aki@example.com" });
    touchMember.mockClear();

    const session = await currentSession();

    expect(session?.email).toBe("aki@example.com");
    expect(touchMember).toHaveBeenCalledWith("aki@example.com");
  });

  it("touches nothing for a browser with no session, or one with no email", async () => {
    verifySession.mockResolvedValueOnce(null);
    touchMember.mockClear();
    await currentSession();
    expect(touchMember).not.toHaveBeenCalled();

    verifySession.mockResolvedValueOnce({ kind: "player" });
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
});

