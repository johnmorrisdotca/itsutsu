import { afterEach, describe, expect, it, vi } from "vitest";

import { KEY_MAX } from "../backlog/backlog.constants";
import { keyFromTitle, neighbourKey } from "../backlog/backlogKey";

import {
  BoardUnreachable,
  addTicket,
  boardTakesKeys,
  importTickets,
  listTicketViews,
  itemFromTicket,
  listTickets,
  moveTicket,
  patchTicket,
  shipTicket,
  ticketByKey,
  ticketsPath,
} from "./boardClient";
import type { BoardTicketView } from "./boardClient.types";
import type { SumilabuTarget } from "./sumilabuProject.types";

const target: SumilabuTarget = {
  projectKey: "itsutsu-dev",
  scope: "board",
  url: "https://api.example.test",
  host: "api.example.test",
  token: "dev-board-secret",
  tokenEnv: "SUMILABU_BOARD_DEV_TOKEN",
};
const BASE = "https://api.example.test/api/v1/projects/itsutsu-dev";

const view = (over: Partial<BoardTicketView> = {}): BoardTicketView => ({
  id: "cmf1",
  projectKey: "itsutsu-dev",
  key: "its-xp-history",
  title: "Show a player's XP history",
  detail: null,
  area: null,
  kind: "feature",
  status: "open",
  priority: null,
  effort: null,
  askedBy: null,
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

const sent = (index: number) => JSON.parse(calls[index]!.init.body as string) as Record<string, unknown>;
const header = (index: number, name: string) => (calls[index]!.init.headers as Record<string, string>)[name];

afterEach(() => {
  calls.length = 0;
  vi.unstubAllGlobals();
});

describe("the board's rows in Itsutsu's words", () => {
  it("reads nulls as the empty strings a BacklogItem carries, and a keyless ticket by its id", () => {
    expect(itemFromTicket(view())).toMatchObject({ key: "its-xp-history", detail: "", askedBy: "", status: "open", kind: "feature" });
    expect(itemFromTicket(view({ key: null })).key).toBe("cmf1");
  });

  it("reads a word the contract does not have as open, a feature and ungraded", () => {
    expect(itemFromTicket(view({ status: "shipped", kind: "bug", priority: "urgent", effort: "huge" }))).toMatchObject({
      status: "open",
      kind: "feature",
      priority: null,
      effort: null,
    });
  });

  it("makes keys Sumilabu accepts, and a numbered neighbour inside the cap", () => {
    expect(keyFromTitle("Show a player's XP history!")).toBe("show-a-player-s-xp-history");
    expect(neighbourKey("its-xp-history", 2)).toBe("its-xp-history-2");
    const long = neighbourKey("k".repeat(KEY_MAX), 12);
    expect(long).toHaveLength(KEY_MAX);
    expect(long).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});

describe("reading the board", () => {
  it("lists what is unfinished with the project's token, and a key by GET ?key=", async () => {
    answers({ status: 200, body: { ok: true, tickets: [view()] } });
    expect((await listTickets(target, { unfinished: true }))[0]!.key).toBe("its-xp-history");
    expect(calls[0]!.url).toBe(`${BASE}/tickets?unfinished=1`);
    expect(header(0, "authorization")).toBe("Bearer dev-board-secret");

    answers({ status: 200, body: { ok: true, ticket: view() } });
    expect((await ticketByKey(target, "its-xp-history"))!.id).toBe("cmf1");
    expect(calls[1]!.url).toBe(`${BASE}/tickets?key=its-xp-history`);

    answers({ status: 404, body: { ok: false, error: "missing" } });
    expect(await ticketByKey(target, "nobody-has-this")).toBeNull();
  });

  it("lists the rows at some statuses by GET ?status=, and everything only when no filter is named", async () => {
    answers({ status: 200, body: { ok: true, tickets: [view({ status: "done" })] } });
    expect((await listTickets(target, { statuses: ["done"] }))[0]!.status).toBe("done");
    await listTickets(target, { statuses: ["done", "dropped"] });
    await listTickets(target);
    expect(calls.map((call) => call.url)).toEqual([`${BASE}/tickets?status=done`, `${BASE}/tickets?status=done,dropped`, `${BASE}/tickets`]);
    // Unfinished wins where both are given, so the service is only ever sent one filter.
    expect(ticketsPath({ unfinished: true, statuses: ["done"] })).toBe("/tickets?unfinished=1");
    expect(ticketsPath({ statuses: [] })).toBe("/tickets");
  });

  it("never reads an unreachable board as an empty one, and never prints the token", async () => {
    answers({ status: 401, body: { ok: false, error: "unauthorized" } });
    const refused = await listTickets(target).catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(BoardUnreachable);
    expect((refused as Error).message).toMatch(/SUMILABU_BOARD_DEV_TOKEN/);
    expect((refused as Error).message).not.toMatch(/secret/);

    answers(new TypeError("fetch failed"));
    await expect(listTickets(target)).rejects.toBeInstanceOf(BoardUnreachable);
    answers({ status: 503, body: "down" });
    await expect(ticketByKey(target, "its-xp-history")).rejects.toBeInstanceOf(BoardUnreachable);
  });
});

describe("writing to the board", () => {
  it("files under the key, taking a numbered neighbour when the key is taken", async () => {
    answers(
      { status: 409, body: { ok: false, error: "key_taken", ticketId: "a" } },
      { status: 409, body: { ok: false, error: "key_taken", ticketId: "b" } },
      { status: 201, body: { ok: true, ticket: view({ key: "its-xp-history-3" }) } },
    );
    const added = await addTicket(target, { key: "its-xp-history", title: "Show a player's XP history", detail: "", kind: "fix", askedBy: "" }, "john");
    expect(added.ok && added.item.key).toBe("its-xp-history-3");
    expect(calls.map((_, index) => sent(index).key)).toEqual(["its-xp-history", "its-xp-history-2", "its-xp-history-3"]);
    expect(sent(0)).toMatchObject({ detail: null, askedBy: null, kind: "fix" });
    expect(header(0, "x-board-actor")).toBe("john");
  });

  it("hands back a refusal in words a person can act on", async () => {
    answers({ status: 422, body: { ok: false, error: "Say what is wanted in at least 8 characters.", problems: ["Say what is wanted in at least 8 characters."] } });
    expect(await addTicket(target, { key: "go", title: "Go", detail: "", kind: "feature", askedBy: "" }, null)).toEqual({
      ok: false,
      reason: "refused",
      problems: ["Say what is wanted in at least 8 characters."],
      heldBy: null,
    });
    answers({ status: 409, body: { ok: false, error: "done", ticket: view({ status: "done" }) } });
    expect(await patchTicket(target, "cmf1", { title: "Renamed after it shipped" }, "john")).toMatchObject({ ok: false, reason: "done" });
    answers({ status: 409, body: { ok: false, error: "illegal", ticket: view({ status: "dropped" }) } });
    const illegal = await patchTicket(target, "cmf1", { status: "inProgress" }, "john");
    expect(!illegal.ok && illegal.problems[0]).toMatch(/dropped now/);
  });

  it("takes over a lapsed hold as open then in progress, and stops at a live one", async () => {
    const held = itemFromTicket(view({ status: "inProgress", claimedBy: "its-old-session", claimedAt: "2026-09-13T00:00:00.000Z" }));
    answers({ status: 200, body: { ok: true, ticket: view() } }, { status: 200, body: { ok: true, ticket: view({ status: "inProgress", claimedBy: "john" }) } });
    const taken = await moveTicket(target, held, "inProgress", "john");
    expect(taken.ok && taken.item.claimedBy).toBe("john");
    expect(calls.map((_, index) => sent(index).status)).toEqual(["open", "inProgress"]);

    calls.length = 0;
    answers({ status: 409, body: { ok: false, error: "held", heldBy: "its-old-session", ticket: view({ status: "inProgress" }) } });
    expect(await moveTicket(target, held, "inProgress", "john")).toMatchObject({ ok: false, reason: "held", heldBy: "its-old-session" });
    expect(calls).toHaveLength(1);

    calls.length = 0;
    expect(await moveTicket(target, { ...held, claimedBy: "john" }, "inProgress", "john")).toMatchObject({ ok: true });
    expect(calls).toHaveLength(0);
  });

  it("ships with the version and the instant, under the release tool's name", async () => {
    answers({ status: 200, body: { ok: true, ticket: view({ status: "done", releasedIn: "0.197.0" }) } });
    const shipped = await shipTicket(target, "cmf1", { version: "0.197.0", releasedAt: "2026-09-15T01:00:00.000Z" }, "release:take");
    expect(shipped.ok && shipped.item.releasedIn).toBe("0.197.0");
    expect(calls[0]!.url).toBe(`${BASE}/tickets/cmf1/ship`);
    expect(sent(0)).toEqual({ version: "0.197.0", releasedAt: "2026-09-15T01:00:00.000Z" });
  });
});

describe("the one-time import's calls", () => {
  it("reads a whole list as no keys, one ticket or a 404 for the probe as keys, and anything else as not knowing", async () => {
    answers({ status: 200, body: { ok: true, api_version: "v1", tickets: [] } });
    expect(await boardTakesKeys(target)).toBe(false);
    expect(calls[0]!.url).toBe(`${BASE}/tickets?key=board-export-key-probe`);

    answers({ status: 404, body: { ok: false, error: "missing" } });
    expect(await boardTakesKeys(target)).toBe(true);
    answers({ status: 200, body: { ok: true, ticket: view() } });
    expect(await boardTakesKeys(target)).toBe(true);
    answers({ status: 400, body: { ok: false, error: "invalid_key" } });
    await expect(boardTakesKeys(target)).rejects.toThrow(/could not tell/i);
  });

  it("imports under the actor, hands a refusal back by row, and lists the service's own fields for the diff", async () => {
    answers({ status: 422, body: { ok: false, error: "a: already belongs to project itsutsu.", problems: ["a: already belongs to project itsutsu."] } });
    expect(await importTickets(target, [], "board-export")).toEqual({ ok: false, status: 422, problems: ["a: already belongs to project itsutsu."] });
    expect(calls[0]!.url).toBe(`${BASE}/tickets/import`);
    expect(header(0, "x-board-actor")).toBe("board-export");

    answers({ status: 200, body: { ok: true, imported: 3 } });
    expect(await importTickets(target, [], "board-export")).toEqual({ ok: true, imported: 3 });

    answers({ status: 200, body: { ok: true, tickets: [view({ key: null })] } });
    expect((await listTicketViews(target))[0]).toMatchObject({ key: null, detail: null });
  });
});
