import { beforeEach, describe, expect, it, vi } from "vitest";

import { LEASE_MS } from "./backlog";
import { BACKLOG_STATUSES, DETAIL_MAX } from "./backlog.constants";

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
 *
 * Board convergence ITS-01 adds a second thing every move now asks: whether
 * somebody else's live claim is in the way. `updateMany` is mocked to
 * evaluate the same `where` a real database would — the id, the status the
 * move was planned from, and the three-way claim OR — so these tests pin the
 * store's own logic (what it asks the database, and how it reads a `count`
 * of zero) without a live Postgres. The database enforcing that write
 * atomically is Postgres's own property, not something a mock re-proves.
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
  claimedBy: string | null;
  claimedAt: Date | null;
  createdAt: Date;
  movedAt: Date;
  releasedIn: string | null;
  releasedAt: Date | null;
};

let rows: Row[] = [];

const update = vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<Row> }) => {
  const row = rows.find((one) => one.id === where.id);
  if (row === undefined) throw new Error("no row");
  Object.assign(row, data);
  return { ...row };
});

type ClaimOr = { claimedBy: string | null } | { claimedAt: { lt: Date } };

/**
 * Evaluates the same `where` `moveWhere` builds: the row still has to stand
 * at the status the move was planned from, and either nobody holds it, this
 * actor does, or the hold is old enough to be stale. A count of zero is the
 * store's signal to re-read and say why, exactly as an `UPDATE … WHERE`
 * that matched no row would tell a real caller.
 */
const updateMany = vi.fn(
  async ({ where, data }: { where: { id: string; status: string; OR: ClaimOr[] }; data: Partial<Row> }) => {
    const row = rows.find((one) => one.id === where.id && one.status === where.status);
    const matches =
      row !== undefined &&
      where.OR.some((clause) =>
        "claimedBy" in clause
          ? row.claimedBy === clause.claimedBy
          : row.claimedAt !== null && row.claimedAt.getTime() < clause.claimedAt.lt.getTime(),
      );
    if (!matches) return { count: 0 };
    Object.assign(row, data);
    return { count: 1 };
  },
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    backlogItem: {
      findUnique: async ({ where }: { where: { id?: string; key?: string } }) => {
        const found = rows.find((one) => (where.id !== undefined ? one.id === where.id : one.key === where.key));
        return found === undefined ? null : { ...found };
      },
      findUniqueOrThrow: async ({ where }: { where: { id: string } }) => {
        const found = rows.find((one) => one.id === where.id);
        if (found === undefined) throw new Error("no row");
        return { ...found };
      },
      update,
      updateMany,
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
          claimedBy: null,
          claimedAt: null,
          createdAt: new Date("2026-09-01T00:00:00.000Z"),
          movedAt: new Date("2026-09-01T00:00:00.000Z"),
          releasedIn: null,
          releasedAt: null,
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
    claimedBy: null,
    claimedAt: null,
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    movedAt: new Date("2026-09-01T00:00:00.000Z"),
    releasedIn: null,
    releasedAt: null,
    ...over,
  };
}

beforeEach(() => {
  rows = [row()];
  update.mockClear();
  updateMany.mockClear();
});

describe("a move the table forbids", () => {
  it("is refused and writes nothing", async () => {
    const outcome = await moveItem("a", BACKLOG_STATUSES.done, "John");
    expect(outcome).toEqual({ ok: false, reason: "illegal", problems: [expect.stringContaining("cannot go straight")] });
    expect(update).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
    expect(rows[0].status).toBe("open");
  });

  it("takes a legal grade down with it rather than writing half a request", async () => {
    const outcome = await changeItem("a", { status: BACKLOG_STATUSES.done, priority: "high" }, "John");
    expect(outcome.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
    expect(rows[0].priority).toBeNull();
  });
});

describe("text past the caps", () => {
  it("cannot be written onto a row any more than it could be added", async () => {
    const outcome = await changeItem("a", { detail: "x".repeat(DETAIL_MAX + 1) }, "John");
    expect(outcome).toMatchObject({ ok: false, reason: "illegal" });
    expect(update).not.toHaveBeenCalled();
  });

  it("is judged over the row as it would stand, so a good title cannot carry a bad detail", async () => {
    const outcome = await changeItem("a", { title: "A better title for it", detail: "x".repeat(DETAIL_MAX + 1) }, "John");
    expect(outcome.ok).toBe(false);
    expect(rows[0].title).toBe("A request that says something");
  });

  it("refuses a title too short to mean anything", async () => {
    expect((await changeItem("a", { title: "todo" }, "John")).ok).toBe(false);
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
    const outcome = await changeItem("a", { title: "  A request   revised  ", detail: "  more  " }, "John");
    expect(outcome.ok).toBe(true);
    expect(rows[0].title).toBe("A request revised");
    expect(rows[0].detail).toBe("more");
    expect(rows[0].key).toBe("a-request");
    expect(rows[0].movedAt.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    // No status and no claim in the request, so the plain door, not the
    // conditional one a move uses.
    expect(update).toHaveBeenCalledTimes(1);
    expect(updateMany).not.toHaveBeenCalled();
  });
});

describe("a grade", () => {
  it("is refused when the grade is not one the board has", async () => {
    const outcome = await editItem("a", { priority: "urgent" as never }, "John");
    expect(outcome).toMatchObject({ ok: false, reason: "illegal" });
    expect(update).not.toHaveBeenCalled();
  });

  it("is written in one conditional write together with a legal move, and done carries the release", async () => {
    rows = [row({ status: "inProgress" })];
    const outcome = await changeItem("a", { status: BACKLOG_STATUSES.done, effort: "small" }, "John");
    expect(outcome.ok).toBe(true);
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
    expect(rows[0].status).toBe("done");
    expect(rows[0].effort).toBe("small");
    // Done is nobody's to hold.
    expect(rows[0].claimedBy).toBeNull();
    expect(rows[0].releasedIn).not.toBeNull();
  });

  it("clears the release stamp on the way back out of done, and writes the mover's claim", async () => {
    rows = [row({ status: "done", releasedIn: "0.1.0" })];
    const outcome = await moveItem("a", BACKLOG_STATUSES.inProgress, "John");
    expect(outcome.ok).toBe(true);
    expect(rows[0].releasedIn).toBeNull();
    expect(rows[0].claimedBy).toBe("John");
    expect(rows[0].claimedAt).not.toBeNull();
  });
});

describe("a row that is not there", () => {
  it("is missing, not illegal", async () => {
    expect(await changeItem("nope", { status: BACKLOG_STATUSES.dropped }, "John")).toEqual({ ok: false, reason: "missing" });
  });

  it("is missing rather than held when a move's conditional write matches nothing because the row is gone", async () => {
    expect(await moveItem("nope", BACKLOG_STATUSES.inProgress, "John")).toEqual({ ok: false, reason: "missing" });
  });
});

/**
 * BOARD_RULES.md invariant 4: every moving write is conditional, so the
 * database — here, the mock standing in for it — decides who wins, never
 * whoever's `findUnique` landed first.
 */
describe("a live claim", () => {
  it("refuses a different actor's move while the hold is inside the lease, and writes nothing", async () => {
    rows = [row({ status: "inProgress", claimedBy: "A", claimedAt: new Date() })];
    const outcome = await changeItem("a", { status: BACKLOG_STATUSES.done }, "B");
    expect(outcome).toEqual({ ok: false, reason: "held", heldBy: "A" });
    expect(rows[0].status).toBe("inProgress");
    expect(rows[0].claimedBy).toBe("A");
  });

  it("lets the holder itself move the row it holds", async () => {
    rows = [row({ status: "inProgress", claimedBy: "A", claimedAt: new Date() })];
    const outcome = await changeItem("a", { status: BACKLOG_STATUSES.done }, "A");
    expect(outcome.ok).toBe(true);
    expect(rows[0].status).toBe("done");
  });

  it("lets anybody move a row nobody holds", async () => {
    rows = [row({ status: "inProgress", claimedBy: null, claimedAt: null })];
    const outcome = await moveItem("a", BACKLOG_STATUSES.open, "B");
    expect(outcome.ok).toBe(true);
    expect(rows[0].status).toBe("open");
  });

  it("lets a different actor take a hold once its lease has lapsed", async () => {
    const longAgo = new Date(Date.now() - LEASE_MS - 1000);
    rows = [row({ status: "inProgress", claimedBy: "A", claimedAt: longAgo })];
    const outcome = await moveItem("a", BACKLOG_STATUSES.done, "B");
    expect(outcome.ok).toBe(true);
    expect(rows[0].status).toBe("done");
  });

  it("still refuses a stale hold's actor one millisecond before the lease is up", async () => {
    const justInsideLease = new Date(Date.now() - LEASE_MS + 1000);
    rows = [row({ status: "inProgress", claimedBy: "A", claimedAt: justInsideLease })];
    const outcome = await moveItem("a", BACKLOG_STATUSES.done, "B");
    expect(outcome).toEqual({ ok: false, reason: "held", heldBy: "A" });
  });

  it("writes the actor's own name into the claim on a move to in progress", async () => {
    rows = [row({ status: "open" })];
    const outcome = await moveItem("a", BACKLOG_STATUSES.inProgress, "A");
    expect(outcome.ok).toBe(true);
    expect(rows[0].claimedBy).toBe("A");
    expect(rows[0].claimedAt).not.toBeNull();
  });
});
