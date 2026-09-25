import { describe, expect, it } from "vitest";

import { xpForLevel } from "@/lib/xp/xpCurve";

import { FEED_KINDS, FEED_OUTCOMES } from "./feed.constants";
import { feedDays, gameEntry, orderFeed, outcomeFor, puzzleEntries, xpEntries } from "./feed";
import type { FeedEntry, FeedGameRow, FeedPerson } from "./feed.types";

const READER = "m-reader";
const BUDDY = "m-buddy";
const OTHER = "m-other";

function game(overrides: Partial<FeedGameRow> = {}): FeedGameRow {
  return {
    id: "g1",
    variant: "freestyle",
    status: "finished",
    result: "black",
    winner: "black",
    playedAt: new Date("2026-09-20T10:00:00Z"),
    lastMoveAt: new Date("2026-09-20T11:00:00Z"),
    black: { memberId: READER, name: "Rea Der", hidden: false },
    white: { memberId: OTHER, name: "Oth Er", hidden: false },
    ...overrides,
  };
}

const NOBODY = new Set<string>();
const FOLLOWED = new Set([BUDDY]);

describe("how a finished game went", () => {
  it("is won by the colour the result names, lost by the other, and drawn by both on a draw", () => {
    expect(outcomeFor("black", "black")).toBe(FEED_OUTCOMES.won);
    expect(outcomeFor("black", "white")).toBe(FEED_OUTCOMES.lost);
    expect(outcomeFor("draw", "white")).toBe(FEED_OUTCOMES.drawn);
  });
});

describe("a game as a line", () => {
  it("tells the reader's own game from the reader's side, dated when it ended", () => {
    const entry = gameEntry(game({ result: "white" }), NOBODY, READER);
    expect(entry).toMatchObject({ kind: FEED_KINDS.game, you: true, outcome: FEED_OUTCOMES.lost, gameId: "g1" });
    expect(entry?.who.memberId).toBe(READER);
    expect(entry?.at).toBe("2026-09-20T11:00:00.000Z");
  });

  it("dates a game with no move by when it began", () => {
    const entry = gameEntry(game({ lastMoveAt: null }), NOBODY, READER);
    expect(entry?.at).toBe("2026-09-20T10:00:00.000Z");
  });

  it("tells a buddy's game from the buddy's side", () => {
    const row = game({ black: { memberId: OTHER, name: "Oth Er", hidden: false }, white: { memberId: BUDDY, name: "Bud Dy", hidden: false } });
    const entry = gameEntry(row, FOLLOWED, READER);
    expect(entry).toMatchObject({ you: false, outcome: FEED_OUTCOMES.lost });
    expect(entry?.who.memberId).toBe(BUDDY);
  });

  it("tells a game between two buddies once, from the winner's side", () => {
    const row = game({
      result: "white",
      black: { memberId: "m-aki", name: "Aki", hidden: false },
      white: { memberId: BUDDY, name: "Bud", hidden: false },
    });
    const entry = gameEntry(row, new Set(["m-aki", BUDDY]), READER);
    expect(entry?.who.memberId).toBe(BUDDY);
    expect(entry).toMatchObject({ outcome: FEED_OUTCOMES.won });
  });

  it("has no line for a game nobody the reader follows played", () => {
    const row = game({ black: { memberId: OTHER, name: "O", hidden: false }, white: { memberId: "m-x", name: "X", hidden: false } });
    expect(gameEntry(row, FOLLOWED, READER)).toBeNull();
  });

  it("does not follow a buddy into a game they hid from their own list", () => {
    const row = game({ black: { memberId: BUDDY, name: "B", hidden: true }, white: { memberId: OTHER, name: "O", hidden: false } });
    expect(gameEntry(row, FOLLOWED, READER)).toBeNull();
  });

  it("keeps the reader's own hidden game in the reader's own feed", () => {
    const row = game({ black: { memberId: READER, name: "R", hidden: true } });
    expect(gameEntry(row, NOBODY, READER)).not.toBeNull();
  });

  it("has no line for an abandoned game: nobody played it", () => {
    expect(gameEntry(game({ result: "abandoned", winner: null }), NOBODY, READER)).toBeNull();
  });

  it("has no line for a hot seat, both seats one member", () => {
    const row = game({ white: { memberId: READER, name: "R", hidden: false } });
    expect(gameEntry(row, NOBODY, READER)).toBeNull();
  });

  it("says a game still being played has begun, dated when it began", () => {
    const entry = gameEntry(game({ status: "active", result: "abandoned", winner: null }), NOBODY, READER);
    expect(entry).toMatchObject({ kind: FEED_KINDS.started, at: "2026-09-20T10:00:00.000Z" });
    expect(entry?.kind === FEED_KINDS.started ? entry.other?.memberId : undefined).toBe(OTHER);
  });

  it("says nobody is in the other seat yet rather than naming a blank", () => {
    const row = game({ status: "active", result: "abandoned", white: { memberId: null, name: "", hidden: false } });
    const entry = gameEntry(row, NOBODY, READER);
    expect(entry?.kind === FEED_KINDS.started ? entry.other : "not started").toBeNull();
  });

  it("keeps a name a seat was played under with nobody behind it", () => {
    const row = game({ white: { memberId: null, name: "Grandma", hidden: false } });
    const entry = gameEntry(row, NOBODY, READER);
    expect(entry?.kind === FEED_KINDS.game ? entry.other : null).toEqual({ memberId: null, name: "Grandma" });
  });
});

describe("experience as lines", () => {
  const people = new Map<string, FeedPerson>([[READER, { memberId: READER, name: "Rea" }]]);
  const day = (dayKey: string, points: number, imported = false) => ({
    memberId: READER,
    dayKey,
    points,
    imported,
    lastAt: new Date(`${dayKey}T12:00:00Z`),
  });

  it("is one line per day earned, and one for a day credited, apart", () => {
    const entries = xpEntries([day("2026-09-20", 175), day("2026-09-20", 500, true)], new Map(), people, READER);
    expect(entries.map((entry) => entry.kind).sort()).toEqual([FEED_KINDS.credited, FEED_KINDS.xp]);
    expect(entries.find((entry) => entry.kind === FEED_KINDS.xp)).toMatchObject({ points: 175, you: true });
  });

  it("draws nothing for a day that earned nothing", () => {
    expect(xpEntries([day("2026-09-20", 0)], new Map(), people, READER)).toEqual([]);
  });

  it("finds the day a level was reached by walking back from today's total", () => {
    const two = xpForLevel(2);
    // Today's total sits a little past level 2; yesterday's award crossed it.
    const totals = new Map([[READER, two + 10]]);
    const entries = xpEntries([day("2026-09-21", 10), day("2026-09-20", 30)], totals, people, READER);
    const levels = entries.filter((entry) => entry.kind === FEED_KINDS.level);
    expect(two).toBeGreaterThan(30);
    expect(levels).toHaveLength(1);
    expect(levels[0]).toMatchObject({ level: 2, id: `level:${READER}:2026-09-20` });
  });

  it("says nothing about levels when the ledger and the total disagree", () => {
    const totals = new Map([[READER, 5]]);
    const entries = xpEntries([day("2026-09-20", 5000)], totals, people, READER);
    expect(entries.filter((entry) => entry.kind === FEED_KINDS.level)).toEqual([]);
  });

  it("says nothing about levels for a member whose total was not read", () => {
    const entries = xpEntries([day("2026-09-20", 5000)], new Map(), people, READER);
    expect(entries.filter((entry) => entry.kind === FEED_KINDS.level)).toEqual([]);
  });
});

describe("puzzles as lines", () => {
  const solve = (id: string, kind: string, at: string, memberId = READER) => ({ id, memberId, kind, finishedAt: new Date(at) });

  it("gathers one member's solves of one kind on one day into one line", () => {
    const entries = puzzleEntries(
      [solve("a", "numberPlace", "2026-09-20T09:00:00Z"), solve("b", "numberPlace", "2026-09-20T15:00:00Z"), solve("c", "jigsaw", "2026-09-20T16:00:00Z")],
      "UTC",
      new Map(),
      READER,
    );
    const place = entries.find((entry) => entry.kind === FEED_KINDS.puzzles && entry.variant === "numberPlace");
    expect(place).toMatchObject({ count: 2, at: "2026-09-20T15:00:00.000Z", you: true });
    expect(entries).toHaveLength(2);
  });

  it("keeps two days apart in the reader's own zone", () => {
    // 23:00 and 01:00 UTC are one evening in Vancouver and two days in UTC.
    const rows = [solve("a", "numberPlace", "2026-09-20T23:00:00Z"), solve("b", "numberPlace", "2026-09-21T01:00:00Z")];
    expect(puzzleEntries(rows, "UTC", new Map(), READER)).toHaveLength(2);
    expect(puzzleEntries(rows, "America/Vancouver", new Map(), READER)).toHaveLength(1);
  });
});

describe("the order of the feed", () => {
  const line = (id: string, at: string, kind: FeedEntry["kind"] = FEED_KINDS.xp): FeedEntry =>
    ({ kind, id, at, who: { memberId: READER, name: "R" }, you: true, points: 1 }) as FeedEntry;

  it("is newest first, and cut at the most it shows", () => {
    const ordered = orderFeed([line("a", "2026-09-19T00:00:00.000Z"), line("b", "2026-09-21T00:00:00.000Z"), line("c", "2026-09-20T00:00:00.000Z")], 2);
    expect(ordered.map((entry) => entry.id)).toEqual(["b", "c"]);
  });

  it("breaks a tie the same way every time", () => {
    const at = "2026-09-20T00:00:00.000Z";
    const lines = [line("z", at, FEED_KINDS.level), line("y", at, FEED_KINDS.xp), line("x", at, FEED_KINDS.xp)];
    expect(orderFeed(lines, 10).map((entry) => entry.id)).toEqual(["x", "y", "z"]);
    expect(orderFeed([...lines].reverse(), 10).map((entry) => entry.id)).toEqual(["x", "y", "z"]);
  });

  it("gathers lines under the reader's days", () => {
    const days = feedDays(
      [line("a", "2026-09-21T02:00:00.000Z"), line("b", "2026-09-20T23:00:00.000Z"), line("c", "2026-09-19T12:00:00.000Z")],
      "America/Vancouver",
    );
    expect(days.map((day) => [day.day, day.entries.map((entry) => entry.id)])).toEqual([
      ["2026-09-20", ["a", "b"]],
      ["2026-09-19", ["c"]],
    ]);
  });
});
