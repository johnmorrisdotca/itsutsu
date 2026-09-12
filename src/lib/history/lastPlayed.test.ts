import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * When each of a batch of members last finished a game.
 *
 * Two things are worth pinning and both are about what the answer MEANS. A
 * member holds either seat, so the date is the later of two maxima and not
 * whichever seat the database answered about first — get that wrong and a bot
 * that has played white all week reads as idle. And a member with no finished
 * game is null, never a date: a plausible stamp for "never" is the exact shape
 * AGENTS.md names, because it would be in range, it would sort, and it would be
 * read as a game that was played.
 *
 * The filtering is the database's, and the test says so by reading back what
 * was asked for: doing it here would mean fetching every finished game a
 * bot-against-bot batch left behind in order to find one date.
 */

type Grouped = { _max: { playedAt: Date | null } };
type BlackRow = Grouped & { blackMemberId: string | null };
type WhiteRow = Grouped & { whiteMemberId: string | null };

let asBlack: BlackRow[] = [];
let asWhite: WhiteRow[] = [];
let asked: Record<string, unknown>[] = [];

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: {
      groupBy: async (args: { by: string[]; where: Record<string, unknown> }) => {
        asked.push(args);
        return args.by[0] === "blackMemberId" ? asBlack : asWhite;
      },
    },
  },
}));

const { lastPlayedByMember } = await import("./lastPlayed");

const EARLY = new Date("2026-03-01T09:00:00.000Z");
const LATE = new Date("2026-09-11T21:30:00.000Z");

beforeEach(() => {
  asBlack = [];
  asWhite = [];
  asked = [];
});

describe("lastPlayedByMember", () => {
  it("asks nothing at all for an empty list", async () => {
    expect(await lastPlayedByMember([])).toEqual(new Map());
    expect(asked).toEqual([]);
  });

  it("is null for a member with no finished game, rather than a date that reads as one", async () => {
    expect(await lastPlayedByMember(["kyu"])).toEqual(new Map([["kyu", null]]));
  });

  it("takes the later of the two seats", async () => {
    asBlack = [{ blackMemberId: "kyu", _max: { playedAt: EARLY } }];
    asWhite = [{ whiteMemberId: "kyu", _max: { playedAt: LATE } }];
    expect((await lastPlayedByMember(["kyu"])).get("kyu")).toEqual(LATE);
  });

  it("takes it the other way round too, so neither seat wins by arriving first", async () => {
    asBlack = [{ blackMemberId: "kyu", _max: { playedAt: LATE } }];
    asWhite = [{ whiteMemberId: "kyu", _max: { playedAt: EARLY } }];
    expect((await lastPlayedByMember(["kyu"])).get("kyu")).toEqual(LATE);
  });

  it("answers about each member separately", async () => {
    asBlack = [
      { blackMemberId: "kyu", _max: { playedAt: EARLY } },
      { blackMemberId: "dan", _max: { playedAt: LATE } },
    ];
    const latest = await lastPlayedByMember(["kyu", "dan", "meijin"]);
    expect(latest.get("kyu")).toEqual(EARLY);
    expect(latest.get("dan")).toEqual(LATE);
    expect(latest.get("meijin"), "a member with no games got somebody else's date").toBeNull();
  });

  it("ignores a row for somebody who was not asked about", async () => {
    asBlack = [{ blackMemberId: "somebody-else", _max: { playedAt: LATE } }];
    expect(await lastPlayedByMember(["kyu"])).toEqual(new Map([["kyu", null]]));
  });

  it("asks the database for finished games that were not called off, on both seats", async () => {
    await lastPlayedByMember(["kyu", "kyu", ""]);
    expect(asked).toHaveLength(2);
    for (const args of asked) {
      const where = args.where as Record<string, unknown>;
      expect(where.status).toBe("finished");
      expect(where.result).toEqual({ not: "abandoned" });
    }
    // Deduplicated, and the blank id left out: an anonymous seat is nobody.
    expect((asked[0].where as { blackMemberId: { in: string[] } }).blackMemberId.in).toEqual(["kyu"]);
    expect((asked[1].where as { whiteMemberId: { in: string[] } }).whiteMemberId.in).toEqual(["kyu"]);
  });

  it("asks for a maximum rather than for the games themselves", async () => {
    await lastPlayedByMember(["kyu"]);
    for (const args of asked) expect(args._max).toEqual({ playedAt: true });
  });
});
