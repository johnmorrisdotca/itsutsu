import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Who may write to the board through the API: the operator's session, or a
 * terminal holding `BOARD_TOKEN` and naming itself. See boardActor.ts for
 * why this exists — before it, nothing here could be held by an agent at
 * all.
 */

let sessionActor: { name?: string; email?: string } | null = null;

vi.mock("@/lib/auth/requireAdmin", () => ({
  currentAdmin: async () => sessionActor,
}));

const { boardActor } = await import("./boardActor");
const { CLAIMED_BY_MAX } = await import("./backlog.constants");

function request(headers: Record<string, string> = {}): Request {
  return new Request("https://itsutsu.com/api/backlog", { headers });
}

function withEnv(vars: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  sessionActor = null;
  withEnv({ BOARD_TOKEN: undefined });
});

describe("the session wins outright", () => {
  it("is the operator, whatever the request carries, when a session is present", async () => {
    sessionActor = { name: "John", email: "john@spxis.com" };
    withEnv({ BOARD_TOKEN: "right-token" });
    const actor = await boardActor(request({ Authorization: "Bearer wrong", "X-Board-Actor": "somebody else" }));
    expect(actor).toEqual({ name: "John", via: "session" });
  });

  it("falls back to the email when the session carries no name", async () => {
    sessionActor = { email: "john@spxis.com" };
    const actor = await boardActor(request());
    expect(actor).toEqual({ name: "john@spxis.com", via: "session" });
  });
});

describe("no session: the board token", () => {
  it("is a token actor when the token is right and a name is given", async () => {
    withEnv({ BOARD_TOKEN: "right-token" });
    const actor = await boardActor(request({ Authorization: "Bearer right-token", "X-Board-Actor": "Claude" }));
    expect(actor).toEqual({ name: "Claude", via: "token" });
  });

  it("is null when the token is right but no name is given", async () => {
    withEnv({ BOARD_TOKEN: "right-token" });
    const actor = await boardActor(request({ Authorization: "Bearer right-token" }));
    expect(actor).toBeNull();
  });

  it("is null when the token is wrong", async () => {
    withEnv({ BOARD_TOKEN: "right-token" });
    const actor = await boardActor(request({ Authorization: "Bearer wrong-token", "X-Board-Actor": "Claude" }));
    expect(actor).toBeNull();
  });

  it("is null with no Authorization header at all", async () => {
    withEnv({ BOARD_TOKEN: "right-token" });
    const actor = await boardActor(request({ "X-Board-Actor": "Claude" }));
    expect(actor).toBeNull();
  });

  it("is null when BOARD_TOKEN is not set, whatever the request sends", async () => {
    withEnv({ BOARD_TOKEN: undefined });
    const actor = await boardActor(request({ Authorization: "Bearer anything", "X-Board-Actor": "Claude" }));
    expect(actor).toBeNull();
  });

  it("is null when BOARD_TOKEN is set to an empty string", async () => {
    withEnv({ BOARD_TOKEN: "" });
    const actor = await boardActor(request({ Authorization: "Bearer ", "X-Board-Actor": "Claude" }));
    expect(actor).toBeNull();
  });

  it("is null for a name over the claim column's cap", async () => {
    withEnv({ BOARD_TOKEN: "right-token" });
    const actor = await boardActor(
      request({ Authorization: "Bearer right-token", "X-Board-Actor": "x".repeat(CLAIMED_BY_MAX + 1) }),
    );
    expect(actor).toBeNull();
  });

  it("accepts a name at exactly the cap, and trims one that only reads as too long", async () => {
    withEnv({ BOARD_TOKEN: "right-token" });
    const atCap = await boardActor(request({ Authorization: "Bearer right-token", "X-Board-Actor": "x".repeat(CLAIMED_BY_MAX) }));
    expect(atCap?.name.length).toBe(CLAIMED_BY_MAX);

    const paddedName = `  ${"y".repeat(CLAIMED_BY_MAX)}  `;
    const trimmed = await boardActor(request({ Authorization: "Bearer right-token", "X-Board-Actor": paddedName }));
    expect(trimmed).toEqual({ name: "y".repeat(CLAIMED_BY_MAX), via: "token" });
  });

  it("is null for a blank actor name", async () => {
    withEnv({ BOARD_TOKEN: "right-token" });
    const actor = await boardActor(request({ Authorization: "Bearer right-token", "X-Board-Actor": "   " }));
    expect(actor).toBeNull();
  });
});
