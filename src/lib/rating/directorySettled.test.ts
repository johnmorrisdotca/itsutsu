import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * WHO COUNTS AS HAVING A SETTLED RATING, when the question has to be answered
 * BEFORE a page of members is chosen.
 *
 * The directory's other two narrowings are columns on `Member` and go straight
 * into the read. This one asks about a TIER — twenty rated games or more —
 * which is derived from `Player.ratedGames`: another table, no relation, and
 * reached by the member's id where a rating is bound to one and by their FOLDED
 * NAME where it is not. So it arrives as an id list, and the list has to pick
 * exactly the members `filterDirectory` would have picked out of an array.
 *
 * THE PRECEDENCE IS THE WHOLE DIFFICULTY, and it is easy to get wrong in the
 * flattering direction. A directory row's profile is
 * `byMember.get(id) ?? byKey.get(playerKey(name))` — the member's own rating row
 * WINS, and the name answers only where there is none. So a member whose bound
 * row is unrated, but whose name happens to key an established row somebody
 * else earned, must NOT be listed as settled: the page would show them a dash
 * for a rating under a filter that says settled, which reads as a broken filter
 * rather than as an answer.
 *
 * Mocked rather than run against a database, because what is being checked is
 * which rows the three reads are asked for and how their answers combine —
 * which is a property of this function and not of any particular database's
 * contents. `pnpm test:unit` runs it on every commit as a result.
 */

type PlayerRow = { key: string; name: string; memberId: string | null };
type MemberRow = { id: string; name: string };

let players: PlayerRow[] = [];
let members: MemberRow[] = [];
const asked: { players: unknown[]; members: unknown[] } = { players: [], members: [] };

vi.mock("@/lib/prisma", () => ({
  prisma: {
    player: {
      findMany: async ({ where }: { where: Record<string, unknown> }) => {
        asked.players.push(where);
        if ("ratedGames" in where) {
          const floor = (where.ratedGames as { gte: number }).gte;
          return players.filter((row) => (RATED[row.key] ?? 0) >= floor);
        }
        const ids = (where.memberId as { in: string[] }).in;
        return players.filter((row) => row.memberId !== null && ids.includes(row.memberId));
      },
    },
    member: {
      /*
       * Two columns, no `where` — the shape `memberIdForName` has always used,
       * because `playerKey` collapses whitespace as well as case and no SQL
       * comparison the database offers reproduces it. The mock takes no `where`
       * for that reason: a version of this function that tried to narrow in SQL
       * would not type-check against it.
       */
      findMany: async (query: { select: Record<string, boolean> }) => {
        asked.members.push(query);
        return members;
      },
    },
  },
}));

/** How many rated games each fixture rating row has. */
const RATED: Record<string, number> = {};

const { membersWithSettledRatings } = await import("./directorySettled");

afterEach(() => {
  players = [];
  members = [];
  asked.players = [];
  asked.members = [];
  for (const key of Object.keys(RATED)) delete RATED[key];
});

/** A rating row: its folded key, the name it was earned under, and its owner. */
function rating(key: string, name: string, memberId: string | null, ratedGames: number) {
  players.push({ key, name, memberId });
  RATED[key] = ratedGames;
}

describe("the members with a settled rating", () => {
  it("is nobody at all when no rating has settled, and asks no more questions", async () => {
    rating("newcomer", "Newcomer", "m-new", 3);
    expect(await membersWithSettledRatings()).toEqual([]);
    // One read and no more: there is nothing for the name lookups to resolve.
    expect(asked.players).toHaveLength(1);
    expect(asked.members).toHaveLength(0);
  });

  it("lists a member whose own rating row has settled", async () => {
    rating("aki", "Aki", "m-aki", 40);
    rating("newcomer", "Newcomer", "m-new", 3);
    expect(await membersWithSettledRatings()).toEqual(["m-aki"]);
    // Nothing to look up by name, so the second and third reads are not made.
    expect(asked.members).toHaveLength(0);
  });

  it("finds a member through the FOLDED name of a rating nobody is bound to", async () => {
    /*
     * The case that must keep working: `Player.key` is the name a record was
     * earned under, it does not move when somebody renames, and most of the
     * rows in that table have no member bound to them at all.
     *
     * AND THE FOLDING IS WHY IT IS DONE IN MEMORY. This row was earned as
     * "Hanako   Morris" and is keyed `hanako morris`, because `playerKey`
     * collapses runs of whitespace as well as case. The first version of this
     * function narrowed with `name IN (…) mode: insensitive` and MISSED her —
     * silently, dropping a member out of a filter that should list her. This
     * case is written with the awkward spacing on purpose.
     */
    rating("hanako morris", "Hanako   Morris", null, 60);
    members.push({ id: "m-hana", name: "Hanako Morris" });
    expect(await membersWithSettledRatings()).toEqual(["m-hana"]);
  });

  it("does NOT list a member whose own row is unrated, whatever their name keys", async () => {
    /*
     * The precedence, and the one way this could be wrong while looking right.
     * "Sumi" is an established rating earned by a bot series under that name;
     * the member called Sumi has a bound row of her own with four games on it.
     * The page would show HER row — a dash — so the filter must not list her.
     */
    rating("sumi", "Sumi", null, 396);
    rating("sumi-2026", "Sumi", "m-sumi", 4);
    members.push({ id: "m-sumi", name: "Sumi" });
    expect(await membersWithSettledRatings()).toEqual([]);
    // And it took a third read to know that — the one that asks whether the
    // member reached by name has a rating row of their own.
    expect(asked.players).toHaveLength(2);
  });

  it("lists nobody for an established name no member answers to", async () => {
    // Most of the development database: three thousand rating rows keyed by
    // names typed into a game at one screen, and no account behind them.
    rating("mio", "Mio", null, 447);
    expect(await membersWithSettledRatings()).toEqual([]);
  });

  it("counts each member once, however many settled rows point at them", async () => {
    rating("aki", "Aki", "m-aki", 40);
    rating("aki tanaka", "Aki Tanaka", "m-aki", 30);
    expect(await membersWithSettledRatings()).toEqual(["m-aki"]);
  });

  it("asks about twenty games, which is what established means", async () => {
    // The threshold is `PROVISIONAL_BELOW` rather than a number written here,
    // so retuning the curve cannot leave this filter behind. Nineteen is out,
    // twenty is in — asserted at the boundary, where an off-by-one lives.
    rating("nineteen", "Nineteen", "m-19", 19);
    rating("twenty", "Twenty", "m-20", 20);
    expect(await membersWithSettledRatings()).toEqual(["m-20"]);
  });
});
