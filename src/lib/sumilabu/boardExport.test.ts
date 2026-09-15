import { describe, expect, it } from "vitest";

import { BACKLOG_STATUSES } from "../backlog/backlog.constants";

import { SUMILABU_KEY_PATTERN, SUMILABU_TICKET_LIMITS as CAP } from "./boardExport.constants";
import {
  archiveNote,
  diffTickets,
  freshen,
  inBatches,
  keyProblem,
  planExport,
  rehearsalSuffix,
  statusOf,
  withoutKeys,
} from "./boardExport";
import { diffLines, planLines } from "./boardExportReport";
import type { StoredBacklogRow, SumilabuTicketView } from "./boardExport.types";

const at = new Date("2026-09-01T00:00:00.000Z");
const ARCHIVE = "itsutsu-backlog-2026-09-14.json";

function stored(over: Partial<StoredBacklogRow> = {}): StoredBacklogRow {
  return {
    id: "cmf00000000000000000000001",
    key: "its-xp-history",
    title: "Show a player's XP history",
    detail: "",
    kind: "feature",
    status: "open",
    priority: null,
    effort: null,
    askedBy: "John",
    addedBy: null,
    claimedBy: null,
    claimedAt: null,
    releasedIn: null,
    releasedAt: null,
    createdAt: at,
    movedAt: at,
    ...over,
  };
}

describe("Itsutsu's rows in the contract's words", () => {
  it("reads today's statuses and the three legacy words, and nothing else", () => {
    for (const status of Object.values(BACKLOG_STATUSES)) expect(statusOf(status)).toBe(status);
    expect(statusOf("proposed")).toBe(BACKLOG_STATUSES.open);
    expect(statusOf("planned")).toBe(BACKLOG_STATUSES.open);
    expect(statusOf("building")).toBe(BACKLOG_STATUSES.inProgress);
    expect(statusOf("shipped")).toBeNull();
  });

  it("carries a row that fits across as it is, with its key, and empty text as no text", () => {
    const plan = planExport([stored({ priority: "high", effort: "small", askedBy: "" })], ARCHIVE);
    expect(plan.rows).toEqual([
      {
        id: "cmf00000000000000000000001",
        key: "its-xp-history",
        title: "Show a player's XP history",
        detail: null,
        area: null,
        kind: "feature",
        status: "open",
        priority: "high",
        effort: "small",
        askedBy: null,
        claimedBy: null,
        claimedAt: null,
        releasedIn: null,
        releasedEntry: null,
        releasedAt: null,
        createdAt: "2026-09-01T00:00:00.000Z",
        movedAt: "2026-09-01T00:00:00.000Z",
      },
    ]);
    expect(plan).toMatchObject({ statuses: { open: 1 }, reshaped: [], unmappable: [], keyProblems: [], notes: [] });
  });

  it("refuses to guess: a status, kind or grade the contract has no word for keeps the row back", () => {
    const plan = planExport(
      [stored({ id: "a", status: "shipped" }), stored({ id: "b", kind: "bug" }), stored({ id: "c", priority: "urgent", effort: "huge" })],
      ARCHIVE,
    );
    expect(plan.rows).toEqual([]);
    expect(plan.unmappable.map((row) => `${row.id}: ${row.says}`)).toEqual([
      'a: status "shipped" has no word in the contract',
      'b: kind "bug" has no word in the contract',
      'c: priority "urgent" has no word in the contract',
      'c: effort "huge" has no word in the contract',
    ]);
  });
});

describe("rows past Sumilabu's caps", () => {
  it("brings an over-cap detail inside the cap, ending with a note that names the archive", () => {
    const plan = planExport([stored({ detail: "d".repeat(15111) })], ARCHIVE);
    const detail = plan.rows[0]!.detail!;
    expect(detail.length).toBeLessThanOrEqual(CAP.detail);
    expect(detail.endsWith(archiveNote(ARCHIVE))).toBe(true);
    expect(plan.reshaped).toEqual([{ id: "cmf00000000000000000000001", key: "its-xp-history", fields: [{ field: "detail", before: 15111, after: detail.length }] }]);
  });

  it("shortens a long title and asker with the note, and lengthens a short title with its own key", () => {
    const long = planExport([stored({ title: "t".repeat(CAP.title + 10), askedBy: "n".repeat(CAP.askedBy + 10), detail: "Some words." })], ARCHIVE);
    const row = long.rows[0]!;
    expect(row.title).toHaveLength(CAP.title);
    expect(row.title.endsWith("…")).toBe(true);
    expect(row.askedBy).toHaveLength(CAP.askedBy);
    expect(row.detail).toBe(`Some words.${archiveNote(ARCHIVE)}`);
    expect(long.reshaped[0]!.fields.map((field) => field.field)).toEqual(["title", "askedBy"]);

    const short = planExport([stored({ key: "its-go", title: "Go" })], ARCHIVE);
    expect(short.rows[0]!.title).toBe("Go (backlog its-go)");
    expect(short.rows[0]!.title.length).toBeGreaterThanOrEqual(CAP.titleMin);
    expect(short.rows[0]!.detail).toBeNull();
    expect(short.reshaped[0]!.fields).toEqual([{ field: "title", before: 2, after: short.rows[0]!.title.length }]);
  });

  it("reports a key Sumilabu would refuse", () => {
    expect(keyProblem("its-xp-history")).toBeNull();
    expect(keyProblem("Its_XP")).toMatch(/not a kebab slug/);
    expect(keyProblem("k".repeat(CAP.key + 1))).toMatch(/at most 80/);
    expect(planExport([stored({ key: "its--xp" })], ARCHIVE).keyProblems).toHaveLength(1);
  });

  it("sends a shape the contract would not write as it stands, and says so", () => {
    const plan = planExport(
      [
        stored({ id: "a", status: "inProgress" }),
        stored({ id: "b", status: "open", claimedBy: "its-builder", claimedAt: at }),
        stored({ id: "c", status: "building", claimedBy: "its-builder", claimedAt: at }),
        stored({ id: "d", status: "done", addedBy: "someone@example.test" }),
      ],
      ARCHIVE,
    );
    expect(plan.rows).toHaveLength(4);
    expect(plan.notes.map((row) => `${row.id}: ${row.says}`)).toEqual([
      "a: in progress with nobody holding it",
      "b: open but still claimed by its-builder",
      'c: stored as legacy "building", sent as inProgress',
    ]);
    expect(plan).toMatchObject({ doneWithoutRelease: 1, addedByNotCarried: 1, storedStatuses: { building: 1 }, statuses: { inProgress: 2 } });
  });
});

describe("a rehearsal and a diff", () => {
  it("gives every row a new id and key, keeping the key a slug inside the cap", () => {
    const suffix = rehearsalSuffix(new Date("2026-09-14T22:00:00Z"));
    const [one, two] = freshen(planExport([stored(), stored({ id: "long", key: "k".repeat(CAP.key) })], ARCHIVE).rows, suffix);
    expect(one).toMatchObject({ id: `cmf00000000000000000000001-${suffix}`, key: `its-xp-history-${suffix}` });
    expect(two!.key!.length).toBeLessThanOrEqual(CAP.key);
    expect(SUMILABU_KEY_PATTERN.test(two!.key!)).toBe(true);
    expect("key" in withoutKeys([one!])[0]!).toBe(false);
  });

  it("sorts every row into new, the same, or different, by id, and names what only the target holds", () => {
    const rows = planExport([stored({ id: "new" }), stored({ id: "same" }), stored({ id: "moved" })], ARCHIVE).rows;
    const view = (id: string, over: Partial<SumilabuTicketView> = {}): SumilabuTicketView => ({
      ...rows.find((candidate) => candidate.id === id)!,
      key: null,
      ...over,
    });
    const target = [view("same", { key: "its-xp-history" }), view("moved", { status: "dropped", key: null }), { ...view("same"), id: "theirs" }];
    expect(diffTickets(rows, target, true)).toEqual({ toAdd: ["new"], same: ["same"], changed: [{ id: "moved", fields: ["status", "key"] }], onlyOnTarget: ["theirs"] });
    expect(diffTickets(rows, target, false).changed).toEqual([{ id: "moved", fields: ["status"] }]);
    expect(diffLines(diffTickets(rows, target, false), "before")[0]).toBe("before: 1 to add, 1 the same, 1 different, 1 only on the target");
  });

  it("imports in batches of at most five hundred, and lists every reshaped row with both lengths", () => {
    expect(inBatches(Array.from({ length: 1001 }, (_, index) => index)).map((batch) => batch.length)).toEqual([500, 500, 1]);
    const lines = planLines(planExport([stored({ detail: "d".repeat(4100) })], ARCHIVE), true);
    expect(lines).toContain("reshaped to fit Sumilabu's caps: 1");
    expect(lines.some((line) => /its-xp-history \(cmf0+1\): detail 4100 -> \d{4}$/.test(line))).toBe(true);
  });
});
