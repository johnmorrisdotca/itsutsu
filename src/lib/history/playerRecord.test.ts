import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A record follows the person, not the spelling.
 *
 * John, looking at the Players page on 0.129.1: "Why does Hanachan has 0 games
 * played???" She had seven. Nothing was lost and no migration was needed — the
 * question was wrong.
 *
 * A game stores the names as they were PLAYED, so every one of hers says
 * "Hanako Morris". She renamed to "Hanachan", the page asked for a record
 * under the new name, and found none. It was a half-finished migration: the
 * `memberId` column landed in 0.73.0 and 0.75.0 and is populated, and the
 * lookups never followed it.
 *
 * SHE RENAMED BECAUSE THIS SITE TOLD HER TO. "She can change her display name"
 * is recorded as the remedy for her full name being public. It fixed the
 * surname and erased her record, so the privacy answer and the record were in
 * direct conflict until this. Any member who renamed lost their history the
 * same way.
 */

type Row = {
  id: string;
  variant: string;
  blackName: string;
  whiteName: string;
  blackMemberId: string | null;
  whiteMemberId: string | null;
  winner: string | null;
  hiddenByBlack: boolean;
  hiddenByWhite: boolean;
};

let stored: Row[] = [];

type NameMatch = { blackName?: { equals: string }; whiteName?: { equals: string } };
type IdMatch = { blackMemberId?: string; whiteMemberId?: string };
type Clause = NameMatch & IdMatch;

/** Enough of Prisma to answer the one query this module makes. */
const findMany = vi.fn(async ({ where }: { where: { OR: Clause[] } }) =>
  stored.filter((row) =>
    where.OR.some((clause) => {
      if (clause.blackName !== undefined) return row.blackName.toLowerCase() === clause.blackName.equals;
      if (clause.whiteName !== undefined) return row.whiteName.toLowerCase() === clause.whiteName.equals;
      if (clause.blackMemberId !== undefined) return row.blackMemberId === clause.blackMemberId;
      if (clause.whiteMemberId !== undefined) return row.whiteMemberId === clause.whiteMemberId;
      return false;
    }),
  ),
);

vi.mock("@/lib/prisma", () => ({ prisma: { game: { findMany: (args: never) => findMany(args) } } }));

const { fetchPlayerRecord } = await import("./playerRecord");

const HER = "964k9atpbhzja6d9";

/** A game she played as black, under the name she had at the time. */
function asBlack(id: string, won: boolean, memberId: string | null = HER): Row {
  return {
    id,
    variant: "freestyle",
    blackName: "Hanako Morris",
    whiteName: "John Morris",
    blackMemberId: memberId,
    whiteMemberId: "john",
    winner: won ? "black" : "white",
    hiddenByBlack: false,
    hiddenByWhite: false,
  };
}

beforeEach(() => {
  stored = [];
  findMany.mockClear();
});

describe("a member who has renamed", () => {
  it("had no record at all when asked for by their new name — the bug", async () => {
    stored = [asBlack("a", true), asBlack("b", false)];

    // No member id: exactly what the page used to ask, and the answer John saw.
    const record = await fetchPlayerRecord("Hanachan");

    expect(record.games, "this is the reported bug, kept as the thing being fixed").toBe(0);
  });

  it("keeps every game once the question is asked about the person", async () => {
    stored = [asBlack("a", true), asBlack("b", false), asBlack("c", false)];

    const record = await fetchPlayerRecord("Hanachan", HER);

    expect(record.games).toBe(3);
  });

  it("reads which seat they were in from the id, so a win is not filed as a loss", async () => {
    /*
     * The half that matters more than the count. `isBlack` was decided by
     * comparing NAMES — so under a new name every game would fail that test,
     * be read as white, and every win she earned would be counted as a loss.
     * A wrong record is worse than an empty one, because it looks like data.
     */
    stored = [asBlack("a", true), asBlack("b", true), asBlack("c", false)];

    const record = await fetchPlayerRecord("Hanachan", HER);

    expect(record.wins).toBe(2);
    expect(record.losses).toBe(1);
    expect(record.byVariant[0]).toMatchObject({ variant: "freestyle", wins: 2, losses: 1 });
  });

  it("counts a game once even though its id and its name both match", async () => {
    // Asking for either finds both; a game must not be counted twice for
    // answering on two columns.
    stored = [{ ...asBlack("a", true), blackName: "Hanachan" }];

    const record = await fetchPlayerRecord("Hanachan", HER);

    expect(record.games).toBe(1);
  });

  it("still finds games they played before a seat was bound to them", async () => {
    /*
     * The id is the reliable half and not the whole. A member who played here
     * before accounts existed has games with no member on the seat at all,
     * and those are still theirs.
     */
    stored = [asBlack("old", true, null), asBlack("new", true)];

    const record = await fetchPlayerRecord("Hanako Morris", HER);

    expect(record.games).toBe(2);
  });
});

describe("a record with nobody behind it", () => {
  it("is still found by name, because that is all it has", async () => {
    /*
     * Most of this table is names: a player typed into a game at one screen,
     * or a record kept from another site. They have no account and must go on
     * working exactly as before — this is the fallback, not a leftover.
     */
    stored = [
      { ...asBlack("a", true, null), blackName: "Someone At A Screen" },
      { ...asBlack("b", false, null), blackName: "Someone At A Screen" },
    ];

    const record = await fetchPlayerRecord("Someone At A Screen");

    expect(record.games).toBe(2);
    expect(record.wins).toBe(1);
    expect(record.losses).toBe(1);
  });
});
