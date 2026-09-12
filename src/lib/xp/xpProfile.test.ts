import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The awards for being somebody: a country, a line about yourself, a name, and
 * the four words.
 *
 * The case worth the most here is the one that is easy to get backwards: a save
 * that CLEARS a field must not pay for setting it. The decision is made from the
 * values as they now stand rather than from the patch, and the two differ exactly
 * when somebody empties something.
 */

type Event = { memberId: string; type: string; points: number; subject: string; dayKey: string };

let events: Event[] = [];
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
  },
  $transaction: async (input: unknown) =>
    typeof input === "function"
      ? (input as (tx: unknown) => Promise<unknown>)(prismaFake)
      : Promise.all(input as Promise<unknown>[]),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaFake }));

const { awardNameSet, awardProfileXp, awardWordsSet, profileAwards } = await import("./xpProfile");

function paid(type: string): number {
  return events.filter((row) => row.memberId === "m-one" && row.type === type).length;
}

beforeEach(() => {
  events = [];
  members.clear();
  members.set("m-one", { id: "m-one", botTier: null, timeZone: "", xp: 0, xpFlash: null, xpLastAt: null });
});

describe("what a saved profile is worth", () => {
  it("pays for each field that says something", () => {
    expect(profileAwards({ country: "Japan", bio: "I play Reversi." }).map((one) => one.type)).toEqual([
      "countrySet",
      "bioSet",
    ]);
    expect(profileAwards({ country: "Japan" }).map((one) => one.type)).toEqual(["countrySet"]);
  });

  it("pays nothing for a field cleared, blank, or never filled in", () => {
    // The patch asked about the country; the value it wrote is nothing. Paying on
    // "the patch mentioned it" would pay a member for emptying their page.
    expect(profileAwards({ country: "", bio: "" })).toEqual([]);
    expect(profileAwards({ country: "   " })).toEqual([]);
    expect(profileAwards({ country: null, bio: null })).toEqual([]);
    expect(profileAwards({})).toEqual([]);
  });
});

describe("paying for it", () => {
  it("pays once, however many times the page is saved", async () => {
    await awardProfileXp({ memberId: "m-one", row: { country: "Japan" }, touched: true });
    await awardProfileXp({ memberId: "m-one", row: { country: "Japan" }, touched: true });
    await awardProfileXp({ memberId: "m-one", row: { country: "Estonia" }, touched: true });

    expect(paid("countrySet")).toBe(1);
  });

  it("asks nothing at all when the save was not about either field", async () => {
    // A member changing the wood their board is drawn on saves their profile too —
    // same row, same route — and that must cost nothing, not even a refused
    // insert.
    await awardProfileXp({ memberId: "m-one", row: { country: "Japan" }, touched: false });
    expect(events).toEqual([]);
  });

  it("pays a name and the four words once each", async () => {
    await awardNameSet("m-one");
    await awardNameSet("m-one");
    await awardWordsSet("m-one");
    await awardWordsSet("m-one");

    expect(paid("nameSet")).toBe(1);
    expect(paid("wordsSet")).toBe(1);
    // Both are about the member and nobody else, so both are keyed on nothing.
    expect(events.map((row) => row.subject)).toEqual(["", ""]);
  });

  it("pays nobody for a member id that answers to no row", async () => {
    await awardNameSet(null);
    await awardWordsSet("ghost");
    expect(events).toEqual([]);
  });
});
