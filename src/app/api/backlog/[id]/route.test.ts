import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The board token door, from the PATCH route in.
 *
 * boardActor.test.ts pins the identity logic; this pins that the route asks
 * it instead of `currentAdmin()`, that the actor it resolves is the one
 * `changeItem` receives (so a move to In progress with the token claims the
 * row under the header's name, not "operator"), and that a `held` outcome
 * reaches the caller as 409.
 *
 * Board convergence ITS-04 adds a second door: `status: "done"` never
 * reaches `changeItem` at all — the route intercepts it, checks the actor
 * and the two release fields, and calls `finishItem` instead. That is
 * tested separately below, with `currentAdmin` made controllable so a
 * session actor's refusal can actually be exercised.
 */

type MoveOutcome =
  | { ok: true; item: { id: string; key: string; status: unknown; claimedBy: string | null; releasedIn?: string; releasedAt?: string } }
  | { ok: false; reason: "missing" }
  | { ok: false; reason: "illegal"; problems: string[] }
  | { ok: false; reason: "held"; heldBy: string };

const changeItem = vi.fn<(id: string, change: Record<string, unknown>, actor: string) => Promise<MoveOutcome>>(
  async (id, change, actor) => ({
    ok: true,
    item: { id, key: "a-request", status: change.status ?? "open", claimedBy: actor },
  }),
);

const finishItem = vi.fn<(id: string, release: { version: string; at: Date }, actor: string) => Promise<MoveOutcome>>(
  async (id, release) => ({
    ok: true,
    item: { id, key: "a-request", status: "done", claimedBy: null, releasedIn: release.version, releasedAt: release.at.toISOString() },
  }),
);

const currentAdmin = vi.fn<() => Promise<{ name?: string; email?: string } | null>>(async () => null);

vi.mock("@/lib/backlog/backlogStore", () => ({
  changeItem: (...args: Parameters<typeof changeItem>) => changeItem(...args),
  finishItem: (...args: Parameters<typeof finishItem>) => finishItem(...args),
}));
vi.mock("@/lib/api/rateLimit", () => ({ overLimit: () => null }));
vi.mock("@/lib/auth/requireAdmin", () => ({ currentAdmin: () => currentAdmin() }));

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
  finishItem.mockClear();
  currentAdmin.mockReset().mockResolvedValue(null);
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
    const response = await patch({ status: "dropped" }, AUTH);
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

/**
 * A body from which nothing can be composed used to be answered 200.
 *
 * `{ releasedIn: "1.2.3" }` with no status passed the schema — the field is
 * there for the release branch above — fell into `changeItem`'s edit rest,
 * met no rule that had an opinion about it, and composed `data = {}`. Prisma
 * was handed an empty update and the caller was told its change had landed,
 * with the row exactly as it was. So: refused, and the refusal reads out the
 * fields a change may name, because a caller that sent the wrong one needs to
 * know which the right ones are.
 *
 * The store is mocked here, so what these pin is the ROUTE's answer: the
 * refusal arrives without `changeItem` being called at all, which is the
 * property that matters — nothing reaches the database to be written as
 * nothing. `backlogStore.test.ts` pins the same rule from the other side, for
 * a caller that never met this route.
 */
describe("PATCH /api/backlog/[id] with nothing it can write", () => {
  it("answers 422 naming every field a change may carry, and writes nothing", async () => {
    const response = await patch({ releasedIn: "1.2.3", nonsense: true }, AUTH);
    expect(response.status).toBe(422);
    expect(changeItem).not.toHaveBeenCalled();

    const body = (await response.json()) as { error: string; details: string[] };
    for (const field of ["status", "title", "detail", "kind", "askedBy", "priority", "effort"]) {
      expect(body.error).toContain(field);
    }
    expect(body.details).toEqual([body.error]);
  });

  it("answers 422 to an empty body rather than 200", async () => {
    const response = await patch({}, AUTH);
    expect(response.status).toBe(422);
    expect(changeItem).not.toHaveBeenCalled();
  });

  it("applies the one field it accepts and ignores the rest, when a body carries both", async () => {
    const response = await patch({ priority: "low", releasedIn: "1.2.3", nonsense: true }, AUTH);
    expect(response.status).toBe(200);
    // The accepted field lands; nothing the board does not write goes to the store.
    expect(changeItem).toHaveBeenCalledWith("item-1", { priority: "low", releasedIn: "1.2.3" }, "Claude (session abc)");
  });
});

/**
 * Board convergence ITS-04: `done` is the release tool's alone. Every check
 * here runs before `finishItem` is ever called, matching `changeItem`'s own
 * "refused whole, not half-applied".
 */
describe("PATCH /api/backlog/[id] with status: done", () => {
  const RELEASE = { releasedIn: "0.150.1", releasedAt: "2026-09-12T00:00:00.000Z" };

  it("refuses a session actor even with both release fields present", async () => {
    currentAdmin.mockResolvedValue({ name: "John" });
    const response = await patch({ status: "done", ...RELEASE });
    expect(response.status).toBe(422);
    expect(finishItem).not.toHaveBeenCalled();
    expect(changeItem).not.toHaveBeenCalled();
  });

  it("refuses a token actor with neither release field", async () => {
    const response = await patch({ status: "done" }, AUTH);
    expect(response.status).toBe(422);
    expect(finishItem).not.toHaveBeenCalled();
  });

  it("refuses a token actor missing releasedAt alone", async () => {
    const response = await patch({ status: "done", releasedIn: "0.150.1" }, AUTH);
    expect(response.status).toBe(422);
    expect(finishItem).not.toHaveBeenCalled();
  });

  it("refuses releasedIn that is not a version", async () => {
    const response = await patch({ status: "done", releasedIn: "not-a-version", releasedAt: RELEASE.releasedAt }, AUTH);
    expect(response.status).toBe(422);
    expect(finishItem).not.toHaveBeenCalled();
  });

  it("refuses releasedAt that is not a date", async () => {
    const response = await patch({ status: "done", releasedIn: "0.150.1", releasedAt: "not-a-date" }, AUTH);
    expect(response.status).toBe(400);
    expect(finishItem).not.toHaveBeenCalled();
  });

  it("calls finishItem with the parsed version and date, for a token actor with both fields", async () => {
    const response = await patch({ status: "done", ...RELEASE }, AUTH);
    expect(response.status).toBe(200);
    expect(finishItem).toHaveBeenCalledTimes(1);
    const [id, release, actor] = finishItem.mock.calls[0]!;
    expect(id).toBe("item-1");
    expect(release.version).toBe("0.150.1");
    expect(release.at.toISOString()).toBe("2026-09-12T00:00:00.000Z");
    expect(actor).toBe("Claude (session abc)");
  });

  it("answers 409 when finishItem says the row is held by somebody else", async () => {
    finishItem.mockResolvedValueOnce({ ok: false, reason: "held", heldBy: "Someone Else" });
    const response = await patch({ status: "done", ...RELEASE }, AUTH);
    expect(response.status).toBe(409);
  });

  it("answers 404 when finishItem says the row is missing", async () => {
    finishItem.mockResolvedValueOnce({ ok: false, reason: "missing" });
    const response = await patch({ status: "done", ...RELEASE }, AUTH);
    expect(response.status).toBe(404);
  });

  it("answers 422 when finishItem refuses the row as not in progress", async () => {
    finishItem.mockResolvedValueOnce({ ok: false, reason: "illegal", problems: ['Only a row in progress may be marked done; this one is "open".'] });
    const response = await patch({ status: "done", ...RELEASE }, AUTH);
    expect(response.status).toBe(422);
  });
});
