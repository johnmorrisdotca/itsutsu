import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The first visit of a day, driven through the rider `touchMember` calls.
 *
 * Over a fake that honours the unique index on `(memberId, type, subject)`,
 * because the whole of "once a day" is that index plus the day key in the
 * subject. A fake without it would make every case below pass for the wrong
 * reason.
 *
 * The reads are COUNTED here as well as the rows, because the cost is half the
 * design: the run of days is read only on a day that could be part of one, and
 * a member looking in after a week away must cost no more than a member looking
 * in twice.
 */

type Event = { memberId: string; type: string; points: number; subject: string; dayKey: string };

let events: Event[] = [];
let reads = 0;
const members = new Map<
  string,
  { id: string; botTier: string | null; timeZone: string; xp: number; xpFlash: unknown; xpLastAt: Date | null }
>();

function keyOf(row: { memberId: string; type: string; subject: string }): string {
  return `${row.memberId}\0${row.type}\0${row.subject}`;
}

const prismaFake = {
  member: {
    findUnique: async ({ where }: { where: { id: string } }) => members.get(where.id) ?? null,
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const row = members.get(where.id);
      if (row === undefined) throw new Error("no member");
      row.xp += (data.xp as { increment?: number } | undefined)?.increment ?? 0;
      if ("xpFlash" in data) row.xpFlash = data.xpFlash;
      return row;
    },
  },
  xpEvent: {
    createMany: async ({ data, skipDuplicates }: { data: Event[]; skipDuplicates?: boolean }) => {
      let count = 0;
      for (const row of data) {
        if (events.some((held) => keyOf(held) === keyOf(row))) {
          if (skipDuplicates !== true) throw new Error("unique violation");
          continue;
        }
        events.push({ ...row });
        count += 1;
      }
      return { count };
    },
    groupBy: async () => [],
    findMany: async ({ where, take }: { where: { memberId: string; type: string }; take: number }) => {
      reads += 1;
      return events
        .filter((row) => row.memberId === where.memberId && row.type === where.type)
        .map((row) => ({ subject: row.subject }))
        .sort((one, two) => two.subject.localeCompare(one.subject))
        .slice(0, take);
    },
  },
  $transaction: async (input: unknown) =>
    typeof input === "function"
      ? (input as (tx: unknown) => Promise<unknown>)(prismaFake)
      : Promise.all(input as Promise<unknown>[]),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaFake }));

const { awardDailyVisit } = await import("./dailyVisit");

/** A member row as `memberRowFor` hands it over, before "seen" is stamped. */
function visitor(lastSeenAt: string, extra: { timeZone?: string; awayUntil?: string } = {}) {
  members.set("m-one", {
    id: "m-one",
    botTier: null,
    timeZone: extra.timeZone ?? "",
    xp: 0,
    xpFlash: null,
    xpLastAt: null,
  });
  return {
    id: "m-one",
    lastSeenAt: new Date(lastSeenAt),
    timeZone: extra.timeZone ?? "",
    awayUntil: extra.awayUntil === undefined ? null : new Date(extra.awayUntil),
  };
}

function paid(type: string): number {
  return events.filter((row) => row.memberId === "m-one" && row.type === type).length;
}

function ledger(): string[] {
  return events.map((row) => `${row.type} ${row.subject}`);
}

/** Every day from `from` up to and including `to`, as visits already recorded. */
function seenOn(days: readonly string[]) {
  for (const day of days) {
    events.push({ memberId: "m-one", type: "dailyVisit", points: 5, subject: day, dayKey: day });
  }
}

beforeEach(() => {
  events = [];
  reads = 0;
  members.clear();
});

describe("the day itself", () => {
  it("pays once on the first visit of a day", async () => {
    await awardDailyVisit(visitor("2026-09-11T22:00:00Z"), new Date("2026-09-12T09:00:00Z"));
    expect(ledger()).toEqual(["dailyVisit 2026-09-12"]);
  });

  it("pays nothing on a second visit the same day", async () => {
    // `touchMember` only calls this when the stamp is a minute stale, so the
    // same day arriving twice is ordinary: the comparison refuses it before any
    // query, and the index would refuse it after.
    const row = visitor("2026-09-12T09:00:00Z");
    await awardDailyVisit(row, new Date("2026-09-12T18:00:00Z"));
    expect(ledger()).toEqual([]);
    expect(reads).toBe(0);
  });

  it("pays again the next day, because the day is the subject", async () => {
    await awardDailyVisit(visitor("2026-09-11T22:00:00Z"), new Date("2026-09-12T09:00:00Z"));
    await awardDailyVisit(visitor("2026-09-12T22:00:00Z"), new Date("2026-09-13T09:00:00Z"));
    expect(paid("dailyVisit")).toBe(2);
  });

  it("reads the day in the member's own zone", async () => {
    // 22:00 UTC on the 11th is already the 12th in Tokyo, so for a member there
    // this is the same day and not a new one.
    const tokyo = visitor("2026-09-11T22:00:00Z", { timeZone: "Asia/Tokyo" });
    await awardDailyVisit(tokyo, new Date("2026-09-11T23:00:00Z"));
    expect(ledger()).toEqual([]);
  });
});

describe("the run of days", () => {
  it("pays a week once the seventh day is in", async () => {
    seenOn([
      "2026-09-06",
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
    ]);

    await awardDailyVisit(visitor("2026-09-11T22:00:00Z"), new Date("2026-09-12T09:00:00Z"));

    expect(paid("dayStreak7")).toBe(1);
    expect(events.at(-1)?.subject).toBe("2026-09-12");
  });

  it("pays nothing on the eighth day", async () => {
    seenOn([
      "2026-09-05",
      "2026-09-06",
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
    ]);

    await awardDailyVisit(visitor("2026-09-11T22:00:00Z"), new Date("2026-09-12T09:00:00Z"));

    expect(paid("dayStreak7")).toBe(0);
    expect(paid("dailyVisit")).toBe(8);
  });

  it("starts again after a missed day", async () => {
    seenOn(["2026-09-06", "2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10"]);
    // Nothing on the 11th; back on the 12th.
    await awardDailyVisit(visitor("2026-09-10T22:00:00Z"), new Date("2026-09-12T09:00:00Z"));
    expect(paid("dayStreak7")).toBe(0);
  });

  it("reads nothing at all unless yesterday was a visit", async () => {
    // THE COST GUARD. A run can only be longer than one if the stored
    // `lastSeenAt` is yesterday, and a run of one is not a milestone — so the
    // ordinary "first visit in a while" costs one insert and no read.
    await awardDailyVisit(visitor("2026-09-03T22:00:00Z"), new Date("2026-09-12T09:00:00Z"));
    expect(reads).toBe(0);
    expect(paid("dailyVisit")).toBe(1);

    await awardDailyVisit(visitor("2026-09-12T22:00:00Z"), new Date("2026-09-13T09:00:00Z"));
    expect(reads).toBe(1);
  });
});

describe("coming back from away", () => {
  it("welcomes them on the first visit after the spell", async () => {
    const row = visitor("2026-09-01T09:00:00Z", { awayUntil: "2026-09-10T00:00:00Z" });
    await awardDailyVisit(row, new Date("2026-09-12T09:00:00Z"));

    expect(ledger()).toEqual(["dailyVisit 2026-09-12", "backFromAway 2026-09-10"]);
  });

  it("welcomes them once, and says nothing the next day", async () => {
    await awardDailyVisit(
      visitor("2026-09-01T09:00:00Z", { awayUntil: "2026-09-10T00:00:00Z" }),
      new Date("2026-09-12T09:00:00Z"),
    );
    await awardDailyVisit(
      visitor("2026-09-12T09:00:00Z", { awayUntil: "2026-09-10T00:00:00Z" }),
      new Date("2026-09-13T09:00:00Z"),
    );

    expect(paid("backFromAway")).toBe(1);
  });

  it("says nothing while the spell is still on", async () => {
    await awardDailyVisit(
      visitor("2026-09-11T22:00:00Z", { awayUntil: "2026-09-20T00:00:00Z" }),
      new Date("2026-09-12T09:00:00Z"),
    );
    expect(paid("backFromAway")).toBe(0);
  });
});

describe("what a visit cannot do", () => {
  it("pays a computer player nothing", async () => {
    const row = visitor("2026-09-11T22:00:00Z");
    members.set("m-one", { ...members.get("m-one")!, botTier: "meijin" });

    await awardDailyVisit(row, new Date("2026-09-12T09:00:00Z"));

    expect(ledger()).toEqual([]);
  });

  it("pays the day even when the run cannot be read", async () => {
    // A courtesy that failed must not take the day with it, and a run that
    // could not be read must not be guessed at: a made-up length would pay for
    // a week nobody kept.
    seenOn(["2026-09-11"]);
    const broken = prismaFake.xpEvent.findMany;
    prismaFake.xpEvent.findMany = async () => {
      throw new Error("no");
    };
    const noise = vi.spyOn(console, "error").mockImplementation(() => {});

    await awardDailyVisit(visitor("2026-09-11T22:00:00Z"), new Date("2026-09-12T09:00:00Z"));

    prismaFake.xpEvent.findMany = broken;
    noise.mockRestore();
    expect(paid("dailyVisit")).toBe(2);
    expect(paid("dayStreak7")).toBe(0);
  });
});
