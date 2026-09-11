import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The board token door, from the PATCH route in.
 *
 * boardActor.test.ts pins the identity logic; this pins that the route asks
 * it instead of `currentAdmin()`, that the actor it resolves is the one
 * `changeItem` receives (so a move to In progress with the token claims the
 * row under the header's name, not "operator"), and that a `held` outcome
 * reaches the caller as 409.
 */

type ChangeOutcome =
  | { ok: true; item: { id: string; key: string; status: unknown; claimedBy: string } }
  | { ok: false; reason: "missing" }
  | { ok: false; reason: "illegal"; problems: string[] }
  | { ok: false; reason: "held"; heldBy: string };

const changeItem = vi.fn<(id: string, change: Record<string, unknown>, actor: string) => Promise<ChangeOutcome>>(
  async (id, change, actor) => ({
    ok: true,
    item: { id, key: "a-request", status: change.status ?? "open", claimedBy: actor },
  }),
);

vi.mock("@/lib/backlog/backlogStore", () => ({
  changeItem: (...args: Parameters<typeof changeItem>) => changeItem(...args),
}));
vi.mock("@/lib/api/rateLimit", () => ({ overLimit: () => null }));
vi.mock("@/lib/auth/requireAdmin", () => ({ currentAdmin: async () => null }));

const { PATCH } = await import("./route");

function patch(body: unknown, headers: Record<string, string> = {}) {
  return PATCH(
    new Request("https://itsutsu.com/api/backlog/item-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "item-1" }) },
  );
}

beforeEach(() => {
  changeItem.mockClear();
  process.env.BOARD_TOKEN = "right-token";
});

afterEach(() => {
  delete process.env.BOARD_TOKEN;
});

const AUTH = { Authorization: "Bearer right-token", "X-Board-Actor": "Claude (session abc)" };

describe("PATCH /api/backlog/[id] with a board token", () => {
  it("is 404 for a wrong token, and changes nothing", async () => {
    const response = await patch({ status: "inProgress" }, { Authorization: "Bearer wrong", "X-Board-Actor": "Claude" });
    expect(response.status).toBe(404);
    expect(changeItem).not.toHaveBeenCalled();
  });

  it("writes the header's actor name into the claim on a move to in progress", async () => {
    const response = await patch({ status: "inProgress" }, AUTH);
    expect(response.status).toBe(200);
    expect(changeItem).toHaveBeenCalledWith("item-1", { status: "inProgress" }, "Claude (session abc)");
  });

  it("passes a grade through under the same token actor", async () => {
    await patch({ priority: "high" }, AUTH);
    expect(changeItem).toHaveBeenCalledWith("item-1", { priority: "high" }, "Claude (session abc)");
  });

  it("answers 409 when the store refuses because somebody else holds it", async () => {
    changeItem.mockResolvedValueOnce({ ok: false, reason: "held", heldBy: "Someone Else" });
    const response = await patch({ status: "done" }, AUTH);
    expect(response.status).toBe(409);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain("Someone Else");
  });

  it("answers 404 when the store says the row is missing", async () => {
    changeItem.mockResolvedValueOnce({ ok: false, reason: "missing" });
    const response = await patch({ status: "open" }, AUTH);
    expect(response.status).toBe(404);
  });
});
