import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The board token door, from the route in.
 *
 * boardActor.test.ts pins the identity logic on its own; this pins that the
 * route actually asks it instead of `currentAdmin()`, and that a token
 * actor's name lands where a session actor's name used to: `askedBy` when
 * the caller did not say one.
 */

const addItem = vi.fn(async (draft: { title: string; detail: string; kind: string; askedBy: string }, addedBy: string | null) => ({
  ok: true as const,
  item: { id: "item-1", key: "a-request", ...draft, addedBy, status: "open" },
}));

vi.mock("@/lib/backlog/backlogStore", () => ({
  addItem: (...args: Parameters<typeof addItem>) => addItem(...args),
  fetchBoard: async () => [],
}));
vi.mock("@/lib/api/rateLimit", () => ({ overLimit: () => null, RATE_LIMITS: { read: {} } }));
// No browser session in any of these: every case here is about the token.
vi.mock("@/lib/auth/requireAdmin", () => ({ currentAdmin: async () => null }));

const { GET, POST } = await import("./route");

function req(init: { method?: string; headers?: Record<string, string>; body?: unknown } = {}) {
  const { body, ...rest } = init;
  return new Request("https://itsutsu.com/api/backlog", {
    ...rest,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  addItem.mockClear();
  process.env.BOARD_TOKEN = "right-token";
});

afterEach(() => {
  delete process.env.BOARD_TOKEN;
});

describe("GET /api/backlog with a board token", () => {
  it("is 404 with no Authorization header at all", async () => {
    const response = await GET(req());
    expect(response.status).toBe(404);
  });

  it("is 404 for a wrong token even with a name", async () => {
    const response = await GET(req({ headers: { Authorization: "Bearer nope", "X-Board-Actor": "Claude" } }));
    expect(response.status).toBe(404);
  });

  it("reads the board for the right token with a name", async () => {
    const response = await GET(req({ headers: { Authorization: "Bearer right-token", "X-Board-Actor": "Claude" } }));
    expect(response.status).toBe(200);
  });
});

describe("POST /api/backlog with a board token", () => {
  it("creates a row whose askedBy is the header actor's name, when the body sends none", async () => {
    const response = await POST(
      req({
        method: "POST",
        headers: { Authorization: "Bearer right-token", "X-Board-Actor": "Claude (session abc)", "Content-Type": "application/json" },
        body: { title: "A request filed from a terminal" },
      }),
    );
    expect(response.status).toBe(201);
    expect(addItem).toHaveBeenCalledWith(expect.objectContaining({ askedBy: "Claude (session abc)" }), null);
  });

  it("still lets an explicit askedBy in the body win over the actor's name", async () => {
    await POST(
      req({
        method: "POST",
        headers: { Authorization: "Bearer right-token", "X-Board-Actor": "Claude", "Content-Type": "application/json" },
        body: { title: "A request filed on somebody's behalf", askedBy: "John" },
      }),
    );
    expect(addItem).toHaveBeenCalledWith(expect.objectContaining({ askedBy: "John" }), null);
  });

  it("is 404 for a wrong token, and adds nothing", async () => {
    const response = await POST(
      req({
        method: "POST",
        headers: { Authorization: "Bearer wrong", "X-Board-Actor": "Claude", "Content-Type": "application/json" },
        body: { title: "Should never be added" },
      }),
    );
    expect(response.status).toBe(404);
    expect(addItem).not.toHaveBeenCalled();
  });
});
