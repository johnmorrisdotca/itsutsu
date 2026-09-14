import { beforeEach, describe, expect, it, vi } from "vitest";

import { UNCLAIMABLE_REASONS } from "@/lib/auth/memberId";

/**
 * Reconcile before paying, over a fake database that keeps the two promises the
 * schema makes: the unique index on `(memberId, type, subject)`, and a repair
 * statement that sets `xpEverywhere` from each row's own current `xp` and
 * `xpImported`, touching only the rows that disagree.
 *
 * The case this exists for is the deploy window: the migration fills
 * `xpEverywhere`, and the old code still serving moves `xp` alone for a few
 * minutes. A member who earned in those minutes must be listed, must stop the
 * payer from paying, and must be repaired by the run — in that order.
 */

type Row = {
  id: string;
  name: string;
  botTier: string | null;
  unclaimableBecause: string | null;
  timeZone: string;
  xp: number;
  xpImported: number;
  xpEverywhere: number;
};
type Event = { memberId: string; type: string; points: number; subject: string; dayKey: string };

let members: Row[] = [];
let events: Event[] = [];
let repairs = 0;

const prismaFake = {
  member: {
    findMany: async ({ where }: { where?: { botTier?: null } } = {}) =>
      members.filter((row) => where?.botTier !== null || row.botTier === null).map((row) => ({ ...row })),
    findUnique: async ({ where }: { where: { id: string } }) => members.find((row) => row.id === where.id) ?? null,
    update: async ({ where, data }: { where: { id: string }; data: Record<string, { increment: number }> }) => {
      const row = members.find((one) => one.id === where.id);
      if (row === undefined) throw new Error("no member");
      row.xpImported += data.xpImported?.increment ?? 0;
      row.xpEverywhere += data.xpEverywhere?.increment ?? 0;
      return row;
    },
  },
  xpEvent: {
    findMany: async ({ where }: { where: { memberId: string; type: { in: string[] } } }) =>
      events.filter((row) => row.memberId === where.memberId && where.type.in.includes(row.type)),
    createMany: async ({ data }: { data: Event[] }) => {
      let count = 0;
      for (const row of data) {
        if (events.some((held) => held.memberId === row.memberId && held.type === row.type && held.subject === row.subject)) continue;
        events.push({ ...row });
        count += 1;
      }
      return { count };
    },
  },
  /* The one repair statement: every row whose Everywhere total is not its two totals, set from its own values. */
  $executeRaw: async () => {
    let count = 0;
    for (const row of members) {
      if (row.xpEverywhere === row.xp + row.xpImported) continue;
      row.xpEverywhere = row.xp + row.xpImported;
      count += 1;
    }
    repairs += 1;
    return count;
  },
  $transaction: async (run: (tx: unknown) => Promise<unknown>) => run(prismaFake),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaFake }));

const { payImportedXpForEveryone, readEverywhereDrift, reconcileEverywhere } = await import("./importedXpPay");

const chibi = (over: Partial<Row> = {}): Row => ({
  id: "chjb-jjac-k794-q84",
  name: "Chibi",
  botTier: null,
  unclaimableBecause: UNCLAIMABLE_REASONS.keptRecord,
  timeZone: "",
  xp: 25,
  xpImported: 0,
  xpEverywhere: 25,
  ...over,
});

beforeEach(() => {
  events = [];
  repairs = 0;
  /* Chibi earned 15 in the deploy window: the old code moved xp and not xpEverywhere. */
  members = [
    chibi({ xp: 40, xpEverywhere: 25 }),
    { id: "m-fine", name: "Fine", botTier: null, unclaimableBecause: null, timeZone: "", xp: 100, xpImported: 0, xpEverywhere: 100 },
  ];
});

describe("reconciling a drifted Everywhere total before paying", () => {
  it("lists the drifted member with both figures, and writes nothing to report it", async () => {
    expect(await readEverywhereDrift()).toEqual([{ id: "chjb-jjac-k794-q84", name: "Chibi", xpEverywhere: 25, should: 40 }]);
    expect(members[0].xpEverywhere).toBe(25);
    expect(repairs).toBe(0);
  });

  it("refuses to pay anything while a total has drifted, and pays once it is repaired", async () => {
    const refused = await payImportedXpForEveryone({ write: true });
    expect(refused.refusedForDrift).toBe(true);
    expect(refused.drift).toHaveLength(1);
    expect(refused.payments.every((payment) => payment.paid === 0)).toBe(true);
    expect(events).toEqual([]);
    // The plan is still worked out, so the report can say what repairing would unlock.
    expect(refused.payments[0].plan.points).toBeGreaterThan(0);

    const { repaired, remaining } = await reconcileEverywhere();
    expect(repaired).toBe(1);
    expect(remaining).toEqual([]);
    // Only the drifted row was touched.
    expect(members.map((row) => row.xpEverywhere)).toEqual([40, 100]);

    const paid = await payImportedXpForEveryone({ write: true });
    expect(paid.refusedForDrift).toBe(false);
    expect(paid.payments[0].paid).toBe(paid.payments[0].plan.points);
    const row = members[0];
    expect(row.xpEverywhere).toBe(row.xp + row.xpImported);
    expect(row.xpImported).toBe(paid.payments[0].paid);
  });

  it("never refuses a report: a dry run with drift plans and writes nothing", async () => {
    const dry = await payImportedXpForEveryone({ write: false });
    expect(dry.refusedForDrift).toBe(false);
    expect(dry.drift).toHaveLength(1);
    expect(events).toEqual([]);
  });
});
