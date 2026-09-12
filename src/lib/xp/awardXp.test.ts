import { beforeEach, describe, expect, it, vi } from "vitest";

import { XP_EVENTS, XP_EVENT_SPECS, xpPointsFor } from "./xp.constants";
import { XP_SKIP_REASONS, type XpEventType } from "./xp.types";
import { xpForLevel } from "./xpCurve";

/**
 * The ledger, against a fake database that enforces the one thing the real
 * schema enforces: the unique index on `(memberId, type, subject)`.
 *
 * **That index is the design**, so a fake that did not honour it would make
 * every idempotency test below pass for the wrong reason — the classic false
 * pass, green over a mechanism that is not running. So `xpEvent.createMany`
 * here refuses a duplicate key and reports `count: 0`, exactly as Postgres does
 * with `skipDuplicates`, and every "not twice" case actually exercises it.
 *
 * What the fake does NOT do is pretend to be transactional. `$transaction` runs
 * the callback; there is nothing here to roll back, and the property being
 * tested is what the rules decide rather than what the database guarantees.
 */

type Row = { memberId: string; type: string; points: number; subject: string; dayKey: string };

let events: Row[] = [];
const members = new Map<
  string,
  { id: string; botTier: string | null; timeZone: string; xp: number; xpFlash: unknown; xpLastAt: Date | null }
>();

function keyOf(row: { memberId: string; type: string; subject: string }): string {
  return `${row.memberId}\0${row.type}\0${row.subject}`;
}

vi.mock("@/lib/prisma", () => ({
  prisma: {
    member: {
      findUnique: async ({ where }: { where: { id: string } }) => members.get(where.id) ?? null,
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = members.get(where.id);
        if (row === undefined) throw new Error("no member");
        const increment = (data.xp as { increment?: number } | undefined)?.increment ?? 0;
        row.xp += increment;
        if ("xpFlash" in data) row.xpFlash = data.xpFlash;
        if ("xpLastAt" in data) row.xpLastAt = data.xpLastAt as Date | null;
        return row;
      },
    },
    xpEvent: {
      createMany: async ({ data, skipDuplicates }: { data: Row[]; skipDuplicates?: boolean }) => {
        let count = 0;
        for (const row of data) {
          const clash = events.some((held) => keyOf(held) === keyOf(row));
          if (clash) {
            // The real index refuses it; skipDuplicates turns that into a zero
            // rather than an exception, which is what the awarder relies on.
            if (skipDuplicates !== true) throw new Error("unique violation");
            continue;
          }
          events.push({ ...row });
          count += 1;
        }
        return { count };
      },
      groupBy: async ({ where }: { where: { memberId: string; dayKey: string; type: { in: string[] } } }) => {
        const counts = new Map<string, number>();
        for (const row of events) {
          if (row.memberId !== where.memberId || row.dayKey !== where.dayKey) continue;
          if (!where.type.in.includes(row.type)) continue;
          counts.set(row.type, (counts.get(row.type) ?? 0) + 1);
        }
        return [...counts.entries()].map(([type, count]) => ({ type, _count: { _all: count } }));
      },
    },
    $transaction: async <T>(run: (tx: unknown) => Promise<T>) => {
      const { prisma } = await import("@/lib/prisma");
      return run(prisma);
    },
  },
}));

const { awardXp } = await import("./awardXp");

function member(id: string, extra: { botTier?: string | null; timeZone?: string; xp?: number } = {}) {
  members.set(id, {
    id,
    botTier: extra.botTier ?? null,
    timeZone: extra.timeZone ?? "",
    xp: extra.xp ?? 0,
    xpFlash: null,
    xpLastAt: null,
  });
}

beforeEach(() => {
  events = [];
  members.clear();
});

/* A fixed instant, so a day key is a fact rather than whatever day the suite
   happens to run on — a test that asserts a day key from `new Date()` passes
   until it is run at midnight somewhere. */
const AT = new Date("2026-09-12T18:30:00.000Z");

describe("every event type in the catalogue", () => {
  const types = Object.keys(XP_EVENT_SPECS) as XpEventType[];

  it.each(types)("pays %s exactly what the catalogue says, once", async (type) => {
    member("m");
    const first = await awardXp({ memberId: "m", awards: [{ type, subject: "s" }], now: AT });
    expect(first.points).toBe(xpPointsFor(type));
    expect(first.awards).toEqual([{ type, points: xpPointsFor(type) }]);
    expect(members.get("m")?.xp).toBe(xpPointsFor(type));
  });

  it.each(types)("refuses a second %s about the same subject", async (type) => {
    member("m");
    await awardXp({ memberId: "m", awards: [{ type, subject: "s" }], now: AT });
    const again = await awardXp({ memberId: "m", awards: [{ type, subject: "s" }], now: AT });

    expect(again.points).toBe(0);
    expect(again.awards).toEqual([{ type, points: 0, skipped: XP_SKIP_REASONS.alreadyEarned }]);
    // The total moved once, and the ledger holds one row. Either alone would
    // pass over a drift between them, which is the failure the single writer
    // and the single transaction exist to prevent.
    expect(members.get("m")?.xp).toBe(xpPointsFor(type));
    expect(events.filter((row) => row.type === type)).toHaveLength(1);
  });

  it.each(types)("pays %s again for a different subject", async (type) => {
    member("m");
    await awardXp({ memberId: "m", awards: [{ type, subject: "one" }], now: AT });
    const other = await awardXp({ memberId: "m", awards: [{ type, subject: "two" }], now: AT });

    /* A capped kind legitimately stops after its allowance; an uncapped one
       must not. Both are the rule working, so the assertion is on the rule and
       not on a number. */
    const cap = XP_EVENT_SPECS[type].cap;
    if (cap === undefined || cap > 1) {
      expect(other.points).toBe(xpPointsFor(type));
    } else {
      expect(other.awards[0]?.skipped).toBe(XP_SKIP_REASONS.dailyAllowance);
    }
  });

  it.each(types)("records what %s paid at the time, not what it is worth now", async (type) => {
    member("m");
    await awardXp({ memberId: "m", awards: [{ type, subject: "s" }], now: AT });
    expect(events[0].points).toBe(xpPointsFor(type));
  });
});

describe("who may earn", () => {
  it("refuses a computer player, so Meijin never tops the leaderboard", async () => {
    // The bots are real Member rows with real ratings and real streak columns,
    // and recordPlayed carries their played run forward. This line is the only
    // thing standing between them and the top of the XP ladder.
    member("meijin", { botTier: "meijin" });
    const result = await awardXp({ memberId: "meijin", awards: [{ type: XP_EVENTS.gameWon, subject: "g1" }] });

    expect(result.points).toBe(0);
    expect(result.awards[0]?.skipped).toBe(XP_SKIP_REASONS.notAPerson);
    expect(events).toHaveLength(0);
  });

  it("reports a refused bot's real total rather than zero", async () => {
    // A refusal that said 0 for a member holding 400 would be a plausible
    // number that also means "nobody here" — the shape AGENTS.md warns about.
    member("meijin", { botTier: "meijin", xp: 400 });
    const result = await awardXp({ memberId: "meijin", awards: [{ type: XP_EVENTS.gameWon, subject: "g1" }] });
    expect(result.xp).toBe(400);
  });

  it("says nothing for a member id no row answers to", async () => {
    // The operator has no Member row, and production carries decided games
    // whose seats are bound to ids that predate the member table.
    const result = await awardXp({ memberId: "ghost", awards: [{ type: XP_EVENTS.gameFinished, subject: "g1" }] });
    expect(result.points).toBe(0);
    expect(result.awards[0]?.skipped).toBe(XP_SKIP_REASONS.noSuchMember);
    expect(events).toHaveLength(0);
  });

  it("says nothing for nobody at all, without asking the database", async () => {
    expect((await awardXp({ memberId: null, awards: [{ type: XP_EVENTS.dailyVisit }] })).points).toBe(0);
    expect((await awardXp({ memberId: undefined, awards: [{ type: XP_EVENTS.dailyVisit }] })).points).toBe(0);
    expect((await awardXp({ memberId: "m", awards: [] })).points).toBe(0);
  });
});

describe("the subject decides how often", () => {
  it("pays a daily visit once a day and again the next day", async () => {
    member("m");
    const monday = new Date("2026-09-14T10:00:00.000Z");
    const tuesday = new Date("2026-09-15T10:00:00.000Z");

    const first = await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.dailyVisit, subject: "2026-09-14" }], now: monday });
    const same = await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.dailyVisit, subject: "2026-09-14" }], now: monday });
    const next = await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.dailyVisit, subject: "2026-09-15" }], now: tuesday });

    expect([first.points, same.points, next.points]).toEqual([5, 0, 5]);
  });

  it("defaults a missing subject to the once-ever empty string", async () => {
    member("m");
    await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.joined }], now: AT });
    expect(events[0].subject).toBe("");

    const again = await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.joined }], now: AT });
    expect(again.points).toBe(0);
  });

  it("keeps one batch's two subjects apart rather than giving both the first one's", async () => {
    // A lookup by type would have keyed both rows the same, so the second would
    // have been refused as a duplicate of a game nobody played.
    member("m");
    const result = await awardXp({
      memberId: "m",
      awards: [
        { type: XP_EVENTS.firstOfVariant, subject: "renju" },
        { type: XP_EVENTS.firstOfVariant, subject: "hex" },
      ],
      now: AT,
    });

    expect(result.points).toBe(xpPointsFor(XP_EVENTS.firstOfVariant) * 2);
    expect(events.map((row) => row.subject).sort()).toEqual(["hex", "renju"]);
  });

  it("writes the day key onto the row, in the member's own zone", async () => {
    // 18:30 UTC on the 12th is already the 13th in Tokyo. A fixed Vancouver day
    // would put a member in Japan on the wrong day for most of their evening.
    member("tokyo", { timeZone: "Asia/Tokyo" });
    member("utc");
    await awardXp({ memberId: "tokyo", awards: [{ type: XP_EVENTS.joined }], now: AT });
    await awardXp({ memberId: "utc", awards: [{ type: XP_EVENTS.joined }], now: AT });

    expect(events.find((row) => row.memberId === "tokyo")?.dayKey).toBe("2026-09-13");
    expect(events.find((row) => row.memberId === "utc")?.dayKey).toBe("2026-09-12");
  });
});

describe("the day's allowance", () => {
  it("stops paying a finish after the sixth game of a day", async () => {
    member("m");
    for (let game = 1; game <= 6; game += 1) {
      const paid = await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.gameFinished, subject: `g${game}` }], now: AT });
      expect(paid.points).toBe(10);
    }
    const seventh = await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.gameFinished, subject: "g7" }], now: AT });
    expect(seventh.points).toBe(0);
    expect(seventh.awards[0]?.skipped).toBe(XP_SKIP_REASONS.dailyAllowance);
  });

  it("pays again the next day", async () => {
    member("m");
    for (let game = 1; game <= 6; game += 1) {
      await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.gameFinished, subject: `g${game}` }], now: AT });
    }
    const tomorrow = new Date("2026-09-13T18:30:00.000Z");
    const fresh = await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.gameFinished, subject: "g7" }], now: tomorrow });
    expect(fresh.points).toBe(10);
  });

  it("silences a whole game rather than paying for the win but not the finish", async () => {
    // The one rule: the awards that ride the allowance fire only if the finish
    // was paid. A game that paid 20 for being won and nothing for being
    // finished is the half-right version, and it reads as a bug.
    member("m");
    for (let game = 1; game <= 6; game += 1) {
      await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.gameFinished, subject: `g${game}` }], now: AT });
    }
    const seventh = await awardXp({
      memberId: "m",
      awards: [
        { type: XP_EVENTS.gameFinished, subject: "g7" },
        { type: XP_EVENTS.gameWon, subject: "g7" },
      ],
      now: AT,
    });

    expect(seventh.points).toBe(0);
    expect(seventh.awards.map((award) => award.skipped)).toEqual([
      XP_SKIP_REASONS.dailyAllowance,
      XP_SKIP_REASONS.dailyAllowance,
    ]);
  });

  it("never silences a milestone, however many games have been played", async () => {
    // Beating Guoshou for the first time on your seventh game of the day is not
    // the thing worth rationing, and telling somebody nothing happened is the
    // failure a cap exists to prevent rather than to cause.
    member("m");
    for (let game = 1; game <= 6; game += 1) {
      await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.gameFinished, subject: `g${game}` }], now: AT });
    }
    const seventh = await awardXp({
      memberId: "m",
      awards: [
        { type: XP_EVENTS.gameFinished, subject: "g7" },
        { type: XP_EVENTS.gradeBeaten, subject: "guoshou" },
      ],
      now: AT,
    });

    expect(seventh.points).toBe(xpPointsFor(XP_EVENTS.gradeBeaten));
    expect(seventh.awards[1]).toEqual({ type: XP_EVENTS.gradeBeaten, points: 40 });
  });

  it("does not let one batch spend a cap of one twice", async () => {
    // Asked for three of a kind capped at three, plus a fourth: the batch's own
    // awards count toward the allowance as they are decided, or a caller could
    // step round the cap by asking for everything at once.
    member("m");
    const result = await awardXp({
      memberId: "m",
      awards: [
        { type: XP_EVENTS.buddyAdded, subject: "a" },
        { type: XP_EVENTS.buddyAdded, subject: "b" },
        { type: XP_EVENTS.buddyAdded, subject: "c" },
        { type: XP_EVENTS.buddyAdded, subject: "d" },
      ],
      now: AT,
    });

    expect(result.points).toBe(xpPointsFor(XP_EVENTS.buddyAdded) * 3);
    expect(result.awards[3]?.skipped).toBe(XP_SKIP_REASONS.dailyAllowance);
  });
});

describe("what the caller is told", () => {
  it("itemises a batch rather than handing back one number", async () => {
    // A member told "+30 XP" learns less than one told what each part was for,
    // and a zero total cannot say whether the cap bit or nothing was owed.
    member("m");
    const result = await awardXp({
      memberId: "m",
      awards: [
        { type: XP_EVENTS.gameFinished, subject: "g1" },
        { type: XP_EVENTS.gameWon, subject: "g1" },
      ],
      now: AT,
    });

    expect(result.awards).toEqual([
      { type: XP_EVENTS.gameFinished, points: 10 },
      { type: XP_EVENTS.gameWon, points: 20 },
    ]);
    expect(result.points).toBe(30);
    expect(result.xp).toBe(30);
  });

  it("tells apart a zero from the cap and a zero from having had it already", async () => {
    member("m");
    await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.joined }], now: AT });
    const repeat = await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.joined }], now: AT });
    expect(repeat.awards[0]?.skipped).toBe(XP_SKIP_REASONS.alreadyEarned);
  });

  it("says when an award moved the level, and says nothing when it did not", async () => {
    member("m");
    const first = await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.joined }], now: AT });
    // 25 XP: level 2 costs 20, so joining crosses it.
    expect(first.crossed).toEqual({ from: 1, to: 2 });

    const small = await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.dailyVisit, subject: "d" }], now: AT });
    expect(small.crossed).toBeNull();
  });

  it("reports every level a single big award carried somebody through", async () => {
    member("m", { xp: xpForLevel(10) });
    const big = await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.everyVariantPlayed }], now: AT });
    expect(big.crossed?.from).toBe(10);
    expect(big.crossed?.to).toBeGreaterThan(10);
  });

  it("never reports a crossing on an award that paid nothing", async () => {
    member("m", { xp: xpForLevel(5) - 1 });
    await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.joined }], now: AT });
    const repeat = await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.joined }], now: AT });
    expect(repeat.crossed).toBeNull();
  });
});

describe("the flash the toast host reads", () => {
  it("writes what was just paid, and only what was paid", async () => {
    member("m");
    await awardXp({
      memberId: "m",
      awards: [
        { type: XP_EVENTS.gameFinished, subject: "g1" },
        { type: XP_EVENTS.gameWon, subject: "g1" },
      ],
      now: AT,
    });

    expect(members.get("m")?.xpFlash).toEqual({
      at: AT.toISOString(),
      awards: [
        { type: XP_EVENTS.gameFinished, points: 10 },
        { type: XP_EVENTS.gameWon, points: 20 },
      ],
      // 30 XP from nothing reaches level 2, which costs 20. Level 3 wants 60.
      level: { level: 2, reached: true },
    });
  });

  it("stamps when the member last earned, for the leaderboard to sort by", async () => {
    // A column and not `max(createdAt) group by memberId`: as a SORT that is a
    // full scan of the ledger on every click of the heading.
    member("m");
    expect(members.get("m")?.xpLastAt).toBeNull();

    await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.joined }], now: AT });
    expect(members.get("m")?.xpLastAt).toEqual(AT);

    const later = new Date("2026-09-20T09:00:00.000Z");
    await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.dailyVisit, subject: "d" }], now: later });
    expect(members.get("m")?.xpLastAt).toEqual(later);
  });

  it("leaves the stamp alone when nothing was paid, so it means what it says", async () => {
    // "Last earned" must be when something was last EARNED, not when something
    // was last attempted. A member whose seventh game of the day paid nothing
    // has not earned anything, and a leaderboard sorted by this would otherwise
    // float them above somebody who actually did.
    member("m");
    await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.joined }], now: AT });

    const later = new Date("2026-09-20T09:00:00.000Z");
    await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.joined }], now: later });
    expect(members.get("m")?.xpLastAt).toEqual(AT);
  });

  it("carries the level when an award crossed one", async () => {
    member("m");
    // 25 XP for joining, and level 2 costs 20.
    await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.joined }], now: AT });
    expect((members.get("m")?.xpFlash as { level?: unknown }).level).toEqual({ level: 2, reached: true });
  });

  it("carries the next level when an award left them one game short of it", async () => {
    // One finished win is 30 XP, so "one more game" is literally true. Expressed
    // in the currency of the site rather than as a percentage of the level's
    // span, which is a number nobody can act on.
    member("m", { xp: xpForLevel(20) - 25 });
    await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.dailyVisit, subject: "d" }], now: AT });
    expect((members.get("m")?.xpFlash as { level?: unknown }).level).toEqual({ level: 20, reached: false });
  });

  it("carries no level on an ordinary award in the middle of one", async () => {
    // Otherwise every daily-visit toast grows a progress line, and a courtesy
    // that goes away on its own becomes a status panel that follows a reader
    // round the site.
    member("m", { xp: xpForLevel(30) });
    await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.dailyVisit, subject: "d" }], now: AT });
    expect((members.get("m")?.xpFlash as { level?: unknown }).level).toBeUndefined();
  });

  it("carries no level at the top of the ladder, where there is no next one", async () => {
    // Not level 100 with reached: false, which would read as a level somebody is
    // approaching while already standing on it.
    member("m", { xp: xpForLevel(100) + 500 });
    await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.dailyVisit, subject: "d" }], now: AT });
    expect((members.get("m")?.xpFlash as { level?: unknown }).level).toBeUndefined();
  });

  it("is not touched when nothing was paid", async () => {
    // A toast for an award that did not happen is worse than no toast, and it
    // would also wipe one the member has not read yet.
    member("m");
    await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.joined }], now: AT });
    const flash = members.get("m")?.xpFlash;
    await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.joined }], now: AT });
    expect(members.get("m")?.xpFlash).toEqual(flash);
  });
});

describe("it never fails the thing that earned it", () => {
  it("swallows a database failure and reports nothing paid", async () => {
    // A move that ends a game is a finished game whether or not its bookkeeping
    // landed. The caller gets a zero, never an exception.
    member("m");
    const { prisma } = await import("@/lib/prisma");
    const broken = vi
      .spyOn(prisma.xpEvent, "createMany")
      .mockRejectedValueOnce(new Error("the database went away"));
    const noise = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await awardXp({ memberId: "m", awards: [{ type: XP_EVENTS.gameFinished, subject: "g1" }], now: AT });

    expect(result.points).toBe(0);
    expect(result.awards).toEqual([]);
    expect(members.get("m")?.xp).toBe(0);
    expect(noise).toHaveBeenCalled();

    broken.mockRestore();
    noise.mockRestore();
  });
});
