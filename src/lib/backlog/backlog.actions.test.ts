import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const admin = vi.hoisted(() => ({ me: null as { name: string | null; email: string | null } | null }));

vi.mock("@/lib/auth/requireAdmin", () => ({ currentAdmin: async () => admin.me }));

import { addBacklogItem, changeBacklogItem } from "./backlog.actions";

/*
 * The page's two writes decide who is asking from the session and never from
 * an argument. Anybody but the operator is answered as a stranger is, and
 * nothing reaches Sumilabu for them.
 */

const calls: string[] = [];

beforeEach(() => {
  calls.length = 0;
  vi.stubEnv("SUMILABU_BOARD_URL", "https://api.example.test");
  vi.stubEnv("SUMILABU_BOARD_DEV_TOKEN", "dev-board-secret");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push(`${init.method ?? "GET"} ${url} as ${(init.headers as Record<string, string>)["x-board-actor"] ?? "nobody"}`);
      return new Response(JSON.stringify({ ok: true, ticket: { id: "cmf1", key: "k", title: "A request for the board", detail: null, kind: "feature", status: "open", priority: null, effort: null, askedBy: null, claimedBy: null, claimedAt: null, releasedIn: null, releasedAt: null, createdAt: "", movedAt: "" } }), { status: 201 });
    }),
  );
});

afterEach(() => {
  admin.me = null;
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("the board's writes from a page", () => {
  it("answers anybody but the operator as a stranger, and asks Sumilabu nothing", async () => {
    expect(await addBacklogItem({ title: "A request for the board", detail: "", kind: "feature", askedBy: "" })).toEqual({ ok: false, problem: "No such thing." });
    expect(await changeBacklogItem("cmf1", { status: "dropped" })).toEqual({ ok: false, problem: "No such thing." });
    expect(calls).toEqual([]);
  });

  it("writes as the operator's name, or their address when there is no name", async () => {
    admin.me = { name: null, email: "operator@example.test" };
    expect(await addBacklogItem({ title: "A request for the board", detail: "", kind: "feature", askedBy: "" })).toEqual({ ok: true });
    expect(calls).toEqual(["POST https://api.example.test/api/v1/projects/itsutsu-dev/tickets as operator@example.test"]);
  });
});
