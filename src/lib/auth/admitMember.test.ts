import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE ORDER OF THE TWO WRITES A SIGN-IN MAKES.
 *
 * `admitMember` stamps `lastSeenAt = now` on every Google sign-in. The day's XP
 * is decided by comparing the STORED `lastSeenAt` with now — so if the award is
 * handed the row after that stamp, it reads the value the same request has just
 * written, answers "already seen today", and the day is gone. Nothing logs it,
 * because no award is ever attempted for `awardXp` to swallow: a site that looks
 * perfectly healthy with an empty ledger.
 *
 * Every case here is about WHICH ROW reaches the award, which is the one thing a
 * test of the award itself cannot see.
 */

type Row = {
  id: string;
  email: string | null;
  name: string;
  picture: string;
  lastSeenAt: Date;
  timeZone: string;
  country: string;
  awayUntil: Date | null;
  preferences: unknown;
};

const YESTERDAY = new Date("2026-09-11T22:00:00.000Z");

let rows: Row[] = [];
let updates: { email: string; lastSeenAt: Date | undefined; timeZone: string | undefined; preferences: unknown }[] = [];

const prismaFake = {
  member: {
    /*
     * A COPY, because that is what a query returns. The first version of this
     * fake handed back the stored object itself, so the update below mutated the
     * row the caller was still holding and this file failed on correct code —
     * a fake disagreeing for a reason the database does not have. Prisma
     * deserialises a fresh object per query; anything else makes "the row as it
     * was" untestable.
     */
    findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
      const row = rows.find((one) => (where.email !== undefined ? one.email === where.email : one.id === where.id));
      return row === undefined ? null : { ...row };
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const made: Row = {
        id: data.id as string,
        email: data.email as string,
        name: data.name as string,
        picture: data.picture as string,
        /* Exactly what the column does: `lastSeenAt DateTime @default(now())`.
           A created row already says "seen today" before anybody has looked at
           anything, which is why the create path must pass null. */
        lastSeenAt: new Date(),
        timeZone: "",
        country: "",
        awayUntil: null,
        preferences: null,
      };
      rows.push(made);
      return made;
    },
    update: async ({ where, data }: { where: { email: string }; data: Record<string, unknown> }) => {
      const row = rows.find((one) => one.email === where.email);
      if (row === undefined) throw new Error("no such member");
      updates.push({
        email: where.email,
        lastSeenAt: data.lastSeenAt as Date | undefined,
        timeZone: data.timeZone as string | undefined,
        preferences: data.preferences,
      });
      if (data.timeZone !== undefined) row.timeZone = data.timeZone as string;
      if (data.lastSeenAt !== undefined) row.lastSeenAt = data.lastSeenAt as Date;
      if (data.picture !== undefined) row.picture = data.picture as string;
      return row;
    },
  },
};

const awardAdmission = vi.fn(async () => undefined);

vi.mock("@/lib/prisma", () => ({ prisma: prismaFake }));
vi.mock("@/lib/xp/admission", () => ({ awardAdmission }));
vi.mock("@/lib/xp/dailyVisit", () => ({ awardDailyVisit: vi.fn(async () => undefined) }));

const { admitMember } = await import("./members");

beforeEach(() => {
  rows = [];
  updates = [];
  awardAdmission.mockClear();
});

function known(lastSeenAt: Date, extra: Partial<Row> = {}): void {
  rows.push({
    id: "m-one",
    email: "aki@example.com",
    name: "Aki",
    picture: "",
    lastSeenAt,
    timeZone: "",
    country: "",
    awayUntil: null,
    preferences: null,
    ...extra,
  });
}

describe("a member who signs in again", () => {
  it("hands the award the row AS IT WAS, not the stamp it has just written", async () => {
    known(YESTERDAY);
    await admitMember({ email: "aki@example.com", name: "Aki", picture: "p" });

    expect(awardAdmission).toHaveBeenCalledTimes(1);
    const [row] = awardAdmission.mock.calls[0] as unknown as [Row];
    // Yesterday's. If this is today's, the day can never be earned by anybody
    // who signed in on it — which is what production was doing.
    expect(row.lastSeenAt).toEqual(YESTERDAY);
    // And the stamp still happened: presence is not what this gave up.
    expect(updates.at(0)?.lastSeenAt).toBeInstanceOf(Date);
  });

  it("carries the zone and the away spell the award needs, off the same lookup", async () => {
    /* Both are read on a `findUnique` that was happening anyway, so the day's
       XP costs no query. A row that arrived without them would silently reckon
       every member in UTC again. */
    known(YESTERDAY, { timeZone: "America/Vancouver", awayUntil: new Date("2026-09-10T00:00:00.000Z") });
    await admitMember({ email: "aki@example.com", name: "Aki", picture: "p" });

    const [row] = awardAdmission.mock.calls[0] as unknown as [Row];
    expect(row.timeZone).toBe("America/Vancouver");
    expect(row.awayUntil).toEqual(new Date("2026-09-10T00:00:00.000Z"));
    expect(row.id).toBe("m-one");
  });

  it("decides the day against the same instant it stamps", async () => {
    /* One `now` for both, so the comparison and the write cannot disagree by
       the milliseconds between two `new Date()` calls — which at midnight is a
       day. */
    known(YESTERDAY);
    await admitMember({ email: "aki@example.com", name: "Aki", picture: "p" });
    const [, now] = awardAdmission.mock.calls[0] as unknown as [Row, Date];
    expect(now).toEqual(updates.at(0)?.lastSeenAt);
  });
});

describe("the zone a sign-in assigns", () => {
  it("fills an empty column from the country, on the write it was already making", async () => {
    /* John's own case: country Canada, zone "", so every day was reckoned in UTC
       and rolled over at five in the afternoon where he lives. */
    known(YESTERDAY, { timeZone: "", country: "Canada" });
    await admitMember({ email: "aki@example.com", name: "Aki", picture: "p" });
    expect(updates.at(0)?.timeZone).toBe("America/Toronto");
  });

  it("reckons that very first day in the zone it has just assigned", async () => {
    /* Otherwise the sign-in that fixes the zone still pays its own day in UTC —
       one last wrong day, on the one request that knew better. */
    known(YESTERDAY, { timeZone: "", country: "Japan" });
    await admitMember({ email: "aki@example.com", name: "Aki", picture: "p" });
    const [row] = awardAdmission.mock.calls[0] as unknown as [{ timeZone: string }];
    expect(row.timeZone).toBe("Asia/Tokyo");
  });

  it("never writes over a zone the member chose", async () => {
    known(YESTERDAY, { timeZone: "America/Vancouver", country: "Canada" });
    await admitMember({ email: "aki@example.com", name: "Aki", picture: "p" });
    expect(updates.at(0)?.timeZone).toBeUndefined();
  });

  it("records that the zone it assigned is a guess, beside what the row already kept", async () => {
    /* Written with the guess, on the same update, so a guess can never be on a
       row without saying it is one — the ambiguity this source exists to end. */
    known(YESTERDAY, { timeZone: "", country: "Canada", preferences: { language: "ja" } });
    await admitMember({ email: "aki@example.com", name: "Aki", picture: "p" });
    expect(updates.at(0)?.preferences).toEqual({ language: "ja", timeZoneFrom: "country" });
  });

  it("writes no source at all when it assigns no zone — not onto an old row, not in bulk", async () => {
    known(YESTERDAY, { timeZone: "America/Toronto", country: "Canada" });
    await admitMember({ email: "aki@example.com", name: "Aki", picture: "p" });
    expect(updates.at(0)?.preferences).toBeUndefined();
    expect(updates.at(0)?.timeZone).toBeUndefined();
  });

  it("writes nothing when there is nothing to guess from", async () => {
    known(YESTERDAY, { timeZone: "", country: "" });
    await admitMember({ email: "aki@example.com", name: "Aki", picture: "p" });
    expect(updates.at(0)?.timeZone).toBeUndefined();
  });
});

describe("a member who joins", () => {
  it("says there is no previous visit rather than passing the default the column holds", async () => {
    await admitMember({ email: "new@example.com", name: "New", picture: "" });

    expect(awardAdmission).toHaveBeenCalledTimes(1);
    const [row] = awardAdmission.mock.calls[0] as unknown as [{ lastSeenAt: Date | null; id: string }];
    /*
     * Null, not the `@default(now())` the created row carries. Passing that
     * value would read as "already seen today" and refuse the first visit there
     * has ever been — so a new member got `joined` and never a `dailyVisit`, and
     * their joining day was missing from the calendar their streak is counted
     * from for ever.
     */
    expect(row.lastSeenAt).toBeNull();
    expect(row.id).toBe(rows.at(0)?.id);
  });

  it("does not stamp the row it has just created", async () => {
    await admitMember({ email: "new@example.com", name: "New", picture: "" });
    expect(updates).toEqual([]);
  });
});
