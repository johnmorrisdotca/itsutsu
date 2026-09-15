import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BoardTicketView } from "@/lib/sumilabu/boardClient.types";

import { addItem, changeItem, readBoard } from "./backlogStore";

/*
 * The page's half of the board, against Sumilabu's routes with the network
 * stubbed. What matters here is what the page is told: rows, or an alert that
 * they could not be read; and a refusal in the board's words before any call
 * is made that the rules already answer.
 */

type Answer = { status: number; body: unknown } | Error;
const calls: { url: string; method: string; init: RequestInit }[] = [];

function answers(...queue: Answer[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, method: init.method ?? "GET", init });
      const next = queue.length > 1 ? queue.shift()! : queue[0]!;
      if (next instanceof Error) throw next;
      return new Response(JSON.stringify(next.body), { status: next.status });
    }),
  );
}

const BASE = "https://api.example.test/api/v1/projects/itsutsu-dev";
const view = (over: Partial<BoardTicketView> = {}): BoardTicketView => ({
  id: "cmf1",
  projectKey: "itsutsu-dev",
  key: "keyboard-shortcut-for-the-scrubber",
  title: "Keyboard shortcut for the scrubber",
  detail: null,
  area: null,
  kind: "feature",
  status: "open",
  priority: null,
  effort: null,
  askedBy: "John",
  claimedBy: null,
  claimedAt: null,
  heldNow: false,
  releasedIn: null,
  releasedEntry: null,
  releasedAt: null,
  createdAt: "2026-09-14T10:00:00.000Z",
  movedAt: "2026-09-14T10:00:00.000Z",
  ...over,
});

beforeEach(() => {
  calls.length = 0;
  vi.stubEnv("SUMILABU_BOARD_URL", "https://api.example.test");
  vi.stubEnv("SUMILABU_BOARD_DEV_TOKEN", "dev-board-secret");
  vi.stubEnv("SUMILABU_PROJECT_KEY", "");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("reading the board", () => {
  it("reads every row from the dev project", async () => {
    answers({ status: 200, body: { ok: true, tickets: [view()] } });
    const board = await readBoard();
    expect(board.ok && board.items.map((item) => item.key)).toEqual(["keyboard-shortcut-for-the-scrubber"]);
    expect(calls[0]!.url).toBe(`${BASE}/tickets`);
  });

  it("says the board could not be read, rather than handing the page an empty one", async () => {
    answers(new TypeError("fetch failed"));
    expect(await readBoard()).toMatchObject({ ok: false, problem: expect.stringMatching(/did not answer/) });
    answers({ status: 401, body: { ok: false, error: "unauthorized" } });
    const refused = await readBoard();
    expect(refused.ok).toBe(false);
    expect(!refused.ok && refused.problem).toMatch(/SUMILABU_BOARD_DEV_TOKEN/);
    expect(!refused.ok && refused.problem).not.toMatch(/secret/);
  });

  it("cannot reach the live board from a checkout, and says so instead of reading", async () => {
    vi.stubEnv("SUMILABU_PROJECT_KEY", "itsutsu");
    answers({ status: 200, body: { ok: true, tickets: [view()] } });
    expect((await readBoard()).ok).toBe(false);
    expect(calls).toEqual([]);
  });
});

describe("filing a request", () => {
  it("refuses a title too short to be a request without calling anybody", async () => {
    answers({ status: 201, body: { ok: true, ticket: view() } });
    expect(await addItem({ title: "fix it", detail: "", kind: "fix", askedBy: "" }, "operator@example.test")).toMatchObject({ ok: false });
    expect(calls).toEqual([]);
  });

  it("files under a key made from the title, in trimmed words, as the operator", async () => {
    answers({ status: 201, body: { ok: true, ticket: view() } });
    expect(await addItem({ title: "  Keyboard shortcut   for the scrubber ", detail: " More. ", kind: "feature", askedBy: "" }, "operator@example.test")).toEqual({ ok: true });
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({
      key: "keyboard-shortcut-for-the-scrubber",
      title: "Keyboard shortcut for the scrubber",
      detail: "More.",
      kind: "feature",
      askedBy: null,
    });
    expect((calls[0]!.init.headers as Record<string, string>)["x-board-actor"]).toBe("operator@example.test");
  });

  it("puts an unreachable board in the sentence beside the button", async () => {
    answers({ status: 503, body: "down" });
    const outcome = await addItem({ title: "Keyboard shortcut for the scrubber", detail: "", kind: "feature", askedBy: "" }, "operator@example.test");
    expect(!outcome.ok && outcome.problem).toMatch(/could not be reached/);
  });
});

describe("changing a row", () => {
  it("refuses done, and a change of kind, before reading anything", async () => {
    answers({ status: 200, body: { ok: true, ticket: view() } });
    expect(await changeItem("cmf1", { status: "done" }, "op")).toEqual({ ok: false, problem: "Only the release tool may mark a row done." });
    expect(await changeItem("cmf1", { kind: "fix" }, "op")).toMatchObject({ ok: false });
    expect(calls).toEqual([]);
  });

  it("reads the row and refuses a move its status does not allow, without writing", async () => {
    answers({ status: 200, body: { ok: true, ticket: view({ status: "dropped" }) } });
    expect(await changeItem("cmf1", { status: "inProgress" }, "op")).toMatchObject({ ok: false });
    expect(calls.map((call) => call.method)).toEqual(["GET"]);
  });

  it("moves and grades in one PATCH under the operator's name, and reports a live hold in words", async () => {
    answers({ status: 200, body: { ok: true, ticket: view() } }, { status: 200, body: { ok: true, ticket: view({ status: "inProgress", claimedBy: "op" }) } });
    expect(await changeItem("cmf1", { status: "inProgress", priority: "high" }, "op")).toEqual({ ok: true });
    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([`GET ${BASE}/tickets/cmf1`, `PATCH ${BASE}/tickets/cmf1`]);
    expect(JSON.parse(calls[1]!.init.body as string)).toEqual({ status: "inProgress", priority: "high" });

    calls.length = 0;
    answers({ status: 200, body: { ok: true, ticket: view() } }, { status: 409, body: { ok: false, error: "held", heldBy: "its-builder", ticket: view({ status: "inProgress" }) } });
    expect(await changeItem("cmf1", { status: "dropped" }, "op")).toEqual({ ok: false, problem: "Held by its-builder. Ask them to release it." });
  });
});
