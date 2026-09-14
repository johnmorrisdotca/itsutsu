import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * What being let in pays — over the same fake `dailyVisit.test.ts` uses, so the
 * unique index on `(memberId, type, subject)` is real and "once a day" is not
 * being asserted against a mock that would agree with anything.
 *
 * THESE ARE THE CASES THAT WERE FAILING IN PRODUCTION. Every one of them is
 * green only because `admitMember` now hands over the row as it was; before the
 * fix the first two paid nothing at all and the third paid joining alone.
 */

type Event = { memberId: string; type: string; points: number; subject: string; dayKey: string };

let events: Event[] = [];
const members = new Map<string, { id: string; botTier: string | null; timeZone: string; xp: number; xpFlash: unknown }>();

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
    findMany: async ({ where, take }: { where: { memberId: string; type: string }; take: number }) =>
      events
        .filter((row) => row.memberId === where.memberId && row.type === where.type)
        .map((row) => ({ subject: row.subject }))
        .sort((one, two) => two.subject.localeCompare(one.subject))
        .slice(0, take),
  },
  $transaction: async (input: unknown) =>
    typeof input === "function"
      ? (input as (tx: unknown) => Promise<unknown>)(prismaFake)
      : Promise.all(input as Promise<unknown>[]),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaFake }));

const { awardAdmission } = await import("./admission");

function member(timeZone = ""): void {
  members.set("m-one", { id: "m-one", botTier: null, timeZone, xp: 0, xpFlash: null });
}

function ledger(): string[] {
  return events.filter((row) => row.memberId === "m-one").map((row) => row.type);
}

beforeEach(() => {
  events = [];
  members.clear();
});

describe("a member signing in again", () => {
  it("earns the day when their last visit was yesterday", async () => {
    /*
     * THE BUG. The sign-in writes `lastSeenAt = now` and the page load that
     * follows then reads today from it, so before the fix nobody who signed in
     * on a given day could earn that day — and the operator's session lasts one
     * day, so he signs in daily and could never earn one at all.
     */
    member();
    await awardAdmission(
      { id: "m-one", lastSeenAt: new Date("2026-09-11T22:00:00Z"), timeZone: "", awayUntil: null, createdAt: null, played: null },
      new Date("2026-09-12T09:00:00Z"),
    );
    expect(ledger()).toEqual(["dailyVisit"]);
    expect(members.get("m-one")?.xp).toBeGreaterThan(0);
  });

  it("earns nothing on a second sign-in the same day", async () => {
    member();
    const now = new Date("2026-09-12T09:00:00Z");
    await awardAdmission({ id: "m-one", lastSeenAt: new Date("2026-09-11T22:00:00Z"), timeZone: "", awayUntil: null, createdAt: null, played: null }, now);
    /* The second sign-in hands over the stamp the first one wrote, which is what
       a real `admitMember` does once it has updated the row. */
    await awardAdmission({ id: "m-one", lastSeenAt: now, timeZone: "", awayUntil: null, createdAt: null, played: null }, new Date("2026-09-12T18:00:00Z"));
    expect(ledger()).toEqual(["dailyVisit"]);
  });

  it("never pays joining to somebody who was already a member", async () => {
    member();
    await awardAdmission(
      { id: "m-one", lastSeenAt: new Date("2026-09-11T22:00:00Z"), timeZone: "", awayUntil: null, createdAt: null, played: null },
      new Date("2026-09-12T09:00:00Z"),
    );
    expect(ledger()).not.toContain("joined");
  });

  it("reckons the day in their own zone, so a Vancouver evening is not tomorrow", async () => {
    /*
     * Both instants are the 12th in UTC; only the second is the 12th in
     * Vancouver. A member whose zone is known must not be paid twice for one of
     * their own days, which is the other half of the zone fix.
     */
    member("America/Vancouver");
    await awardAdmission(
      { id: "m-one", lastSeenAt: new Date("2026-09-12T05:00:00Z"), timeZone: "America/Vancouver", awayUntil: null, createdAt: null, played: null },
      new Date("2026-09-12T08:00:00Z"),
    );
    expect(ledger()).toEqual(["dailyVisit"]);
    expect(events[0]?.subject).toBe("2026-09-12");

    await awardAdmission(
      { id: "m-one", lastSeenAt: new Date("2026-09-12T08:00:00Z"), timeZone: "America/Vancouver", awayUntil: null, createdAt: null, played: null },
      new Date("2026-09-12T20:00:00Z"),
    );
    expect(ledger()).toEqual(["dailyVisit"]);
  });
});

describe("a member joining", () => {
  it("is paid for joining AND for the day, in one batch", async () => {
    /*
     * `lastSeenAt: null` is the create path's way of saying there is no previous
     * visit. The column itself is `@default(now())`, so passing what it holds
     * would read as "already seen today" and refuse the first visit there is.
     *
     * One batch rather than two calls, because `xpFlash` REPLACES: a second
     * `awardXp` would overwrite the first one's toast, and a new member would be
     * shown "+5 a new day" having never been told they were paid for joining.
     */
    member();
    await awardAdmission({ id: "m-one", lastSeenAt: null, timeZone: null, awayUntil: null, createdAt: null, played: null }, new Date("2026-09-12T09:00:00Z"));
    expect(ledger()).toEqual(["joined", "dailyVisit"]);
    const flash = members.get("m-one")?.xpFlash as { awards: { type: string }[] };
    expect(flash.awards.map((one) => one.type)).toEqual(["joined", "dailyVisit"]);
  });

  it("puts their first day in the calendar the streak is counted from", async () => {
    /*
     * THE LEDGER IS THE CALENDAR — `dayRunMilestone` counts `dailyVisit` rows.
     * A member whose joining day was missing from it would reach a seven-day run
     * on their eighth day, for ever, and nothing would have said why.
     */
    member();
    await awardAdmission({ id: "m-one", lastSeenAt: null, timeZone: null, awayUntil: null, createdAt: null, played: null }, new Date("2026-09-12T09:00:00Z"));
    expect(events.filter((row) => row.type === "dailyVisit").map((row) => row.subject)).toEqual(["2026-09-12"]);
  });

  it("asks for no run of days on a first visit, because a run of one is not a milestone", async () => {
    /* There is nothing to read: no previous visit means the run starts today. */
    member();
    const reads: string[] = [];
    const real = prismaFake.xpEvent.findMany;
    prismaFake.xpEvent.findMany = async () => {
      reads.push("read");
      return [];
    };
    try {
      await awardAdmission({ id: "m-one", lastSeenAt: null, timeZone: null, awayUntil: null, createdAt: null, played: null }, new Date("2026-09-12T09:00:00Z"));
    } finally {
      // Put the fake back, or every case added after this one reads nothing.
      prismaFake.xpEvent.findMany = real;
    }
    expect(reads).toEqual([]);
  });
});
