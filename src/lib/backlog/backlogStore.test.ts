import { beforeEach, describe, expect, it, vi } from "vitest";

import { ASSIGNED_TO_MAX, BACKLOG_STATUSES, DETAIL_MAX } from "./backlog.constants";

/**
 * The store asks the rules before it writes.
 *
 * Every rule here already existed in backlog.ts and was already asked by the
 * route; what was missing was the store asking them itself. Two sessions wrote
 * to the table from inside the process, and between them put thirteen rows
 * straight from open to done and eleven past the detail cap — moves and
 * lengths the form and the route would both have refused. See AGENTS.md,
 * Board Gate. These pin that the store now refuses the same things, and that a
 * refusal writes nothing at all.
 */

type Row = {
  id: string;
  key: string;
  title: string;
  detail: string;
  kind: string;
  status: string;
  priority: string | null;
  effort: string | null;
  askedBy: string;
  assignedTo: string;
  createdAt: Date;
  movedAt: Date;
  releasedIn: string | null;
};

let rows: Row[] = [];
const update = vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<Row> }) => {
  const row = rows.find((one) => one.id === where.id);
  if (row === undefined) throw new Error("no row");
  Object.assign(row, data);
  return { ...row };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    backlogItem: {
      findUnique: async ({ where }: { where: { id?: string; key?: string } }) => {
        const found = rows.find((one) => (where.id !== undefined ? one.id === where.id : one.key === where.key));
        return found === undefined ? null : { ...found };
      },
      update,
      count: async () => rows.length,
      findMany: async () => rows.map((one) => ({ ...one })),
      create: async ({ data }: { data: Partial<Row> }) => {
        const row: Row = {
          id: `id-${rows.length + 1}`,
          key: data.key ?? "",
          title: data.title ?? "",
          detail: data.detail ?? "",
          kind: data.kind ?? "feature",
          status: "open",
          priority: null,
          effort: null,
          askedBy: data.askedBy ?? "",
          assignedTo: "",
          createdAt: new Date("2026-09-01T00:00:00.000Z"),
          movedAt: new Date("2026-09-01T00:00:00.000Z"),
          releasedIn: null,
        };
        rows.push(row);
        return { ...row };
      },
    },
  },
}));

const { addItem, changeItem, editItem, moveItem } = await import("./backlogStore");

function row(over: Partial<Row> = {}): Row {
  return {
    id: "a",
    key: "a-request",
    title: "A request that says something",
    detail: "Why it is wanted.",
    kind: "feature",
    status: "open",
    priority: null,
    effort: null,
    askedBy: "John",
    assignedTo: "",
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    movedAt: new Date("2026-09-01T00:00:00.000Z"),
    releasedIn: null,
    ...over,
  };
}

beforeEach(() => {
  rows = [row()];
  update.mockClear();
});

describe("a move the table forbids", () => {
  it("is refused and writes nothing", async () => {
    const outcome = await moveItem("a", BACKLOG_STATUSES.done);
    expect(outcome).toEqual({ ok: false, reason: "illegal", problems: [expect.stringContaining("cannot go straight")] });
    expect(update).not.toHaveBeenCalled();
    expect(rows[0].status).toBe("open");
  });

  it("takes a legal grade down with it rather than writing half a request", async () => {
    const outcome = await changeItem("a", { status: BACKLOG_STATUSES.done, priority: "high" });
    expect(outcome.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
    expect(rows[0].priority).toBeNull();
  });
});

describe("text past the caps", () => {
  it("cannot be written onto a row any more than it could be added", async () => {
    const outcome = await changeItem("a", { detail: "x".repeat(DETAIL_MAX + 1) });
    expect(outcome).toMatchObject({ ok: false, reason: "illegal" });
    expect(update).not.toHaveBeenCalled();
  });

  it("is judged over the row as it would stand, so a good title cannot carry a bad detail", async () => {
    const outcome = await changeItem("a", { title: "A better title for it", detail: "x".repeat(DETAIL_MAX + 1) });
    expect(outcome.ok).toBe(false);
    expect(rows[0].title).toBe("A request that says something");
  });

  it("refuses a title too short to mean anything", async () => {
    expect((await changeItem("a", { title: "todo" })).ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("cannot be added past the cap either", async () => {
    const outcome = await addItem(
      { title: "A request that says something else", detail: "x".repeat(DETAIL_MAX + 1), kind: "fix", askedBy: "John" },
      null,
    );
    expect(outcome.ok).toBe(false);
    expect(rows).toHaveLength(1);
  });
});

describe("a revision that the rules allow", () => {
  it("is written trimmed, keeps the key, and does not count as movement", async () => {
    const outcome = await changeItem("a", { title: "  A request   revised  ", detail: "  more  " });
    expect(outcome.ok).toBe(true);
    expect(rows[0].title).toBe("A request revised");
    expect(rows[0].detail).toBe("more");
    expect(rows[0].key).toBe("a-request");
    expect(rows[0].movedAt.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });
});

describe("a grade or a name", () => {
  it("is refused when the name is longer than a name", async () => {
    const outcome = await editItem("a", { assignedTo: "x".repeat(ASSIGNED_TO_MAX + 1) });
    expect(outcome).toMatchObject({ ok: false, reason: "illegal" });
    expect(update).not.toHaveBeenCalled();
  });

  it("is refused when the grade is not one the board has", async () => {
    const outcome = await editItem("a", { priority: "urgent" as never });
    expect(outcome.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("is written in one write with a legal move, and done carries the release", async () => {
    rows = [row({ status: "inProgress" })];
    const outcome = await changeItem("a", { status: BACKLOG_STATUSES.done, effort: "small", assignedTo: " Sora " });
    expect(outcome.ok).toBe(true);
    expect(update).toHaveBeenCalledTimes(1);
    expect(rows[0].status).toBe("done");
    expect(rows[0].effort).toBe("small");
    expect(rows[0].assignedTo).toBe("Sora");
    expect(rows[0].releasedIn).not.toBeNull();
  });

  it("clears the release stamp on the way back out of done", async () => {
    rows = [row({ status: "done", releasedIn: "0.1.0" })];
    const outcome = await moveItem("a", BACKLOG_STATUSES.inProgress);
    expect(outcome.ok).toBe(true);
    expect(rows[0].releasedIn).toBeNull();
  });
});

describe("a row that is not there", () => {
  it("is missing, not illegal", async () => {
    expect(await changeItem("nope", { status: BACKLOG_STATUSES.dropped })).toEqual({ ok: false, reason: "missing" });
  });
});
