import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { playedSides, playedTallyWrite, type DecidedSeats } from "./playedRun";

/**
 * THE FOUR STORED COUNTS AND `fetchPlayedTallies` HAVE TO BE ONE SET OF GAMES.
 *
 * `Member.played`, `.won`, `.lost` and `.drawn` are what the members directory
 * SORTS and PAGES by since the directory learned to do either. That raises the
 * cost of a drift: before, a wrong tally was a wrong number in a cell, which a
 * reader can see and report. Now it is also a member in the wrong place in an
 * order, with the right number printed beside them — which nobody can see, and
 * which no amount of looking at the row would find.
 *
 * So the equivalence is asserted three ways, and the three are deliberately at
 * different levels rather than the same claim written out repeatedly:
 *
 *   - HERE, purely: replaying the write over a set of games gives exactly what
 *     `fetchPlayedTallies` counts out of the same games. No database, so it runs
 *     in `pnpm test:unit` on every commit, and it can be handed the awkward rows
 *     production actually holds.
 *   - `playedRun.play.test.ts`, against a real database: two real games through
 *     the real endings, and the stored columns compared with the real function
 *     on the real rows. That is what proves the increments are REACHED rather
 *     than merely written down — AGENTS.md spends a section on the difference.
 *   - AND THE MIGRATION, which filled the columns for every game already
 *     recorded. Its arithmetic is a fourth implementation of the same rule, in
 *     SQL, and the only one nothing can run twice; the source check at the
 *     bottom of this file is what keeps its filter from being edited into
 *     something else.
 */

/** One decided game, as narrow as the fixtures need it. */
type Row = DecidedSeats & { winner: "black" | "white" | null };

/** What one member's four counts come to, from replaying the write. */
type Counts = { wins: number; losses: number; draws: number; played: number };

const NOTHING: Counts = { wins: 0, losses: 0, draws: 0, played: 0 };

/**
 * The tally as the DATABASE would hold it: every decided game put through
 * `playedSides` and `playedTallyWrite`, and the increments applied.
 *
 * Deliberately built out of the two functions the live write uses rather than
 * out of a restatement of them — a test that counted the games itself would be
 * a fifth implementation, and it would agree with `fetchPlayedTallies` while
 * saying nothing at all about the code that runs.
 */
function replayColumns(games: readonly Row[]): Map<string, Counts> {
  const byMember = new Map<string, Counts>();
  const column: Record<string, keyof Counts> = {
    played: "played",
    won: "wins",
    lost: "losses",
    drawn: "draws",
  };
  for (const game of games) {
    for (const side of playedSides(game)) {
      const so_far = byMember.get(side.memberId) ?? { ...NOTHING };
      for (const [name, step] of Object.entries(playedTallyWrite(side.outcome))) {
        const field = column[name];
        expect(field, `the write touched a column nothing here knows: ${name}`).toBeDefined();
        so_far[field] += step.increment;
      }
      byMember.set(side.memberId, so_far);
    }
  }
  return byMember;
}

/**
 * `fetchPlayedTallies`' arithmetic over the same games.
 *
 * Transcribed rather than imported, and this is the ONE place in this file
 * where that is right: importing it would drag `server-only` and a
 * `PrismaClient` in for a function whose whole body is a loop over rows. The
 * transcription is checked against the real function on a real database by
 * `playedRun.play.test.ts`, which is what stops it drifting into a copy of the
 * thing it is supposed to be checking.
 */
function asFetchPlayedTalliesWould(games: readonly Row[], ids: readonly string[]): Map<string, Counts> {
  const tallies = new Map<string, Counts>(ids.map((id) => [id, { ...NOTHING }]));
  const bump = (id: string, field: "wins" | "losses" | "draws") => {
    const tally = tallies.get(id);
    if (tally === undefined) return;
    tally[field] += 1;
    tally.played += 1;
  };
  for (const { blackMemberId, whiteMemberId, winner } of games) {
    if (blackMemberId !== null && tallies.has(blackMemberId)) {
      bump(blackMemberId, winner === null ? "draws" : winner === "black" ? "wins" : "losses");
    }
    if (whiteMemberId !== null && whiteMemberId !== blackMemberId && tallies.has(whiteMemberId)) {
      bump(whiteMemberId, winner === null ? "draws" : winner === "white" ? "wins" : "losses");
    }
  }
  return tallies;
}

/**
 * The games that have caught a fresh implementation of this before, all of them
 * real rows on one of the two databases:
 *
 *   - a game with BOTH SEATS UNBOUND — "Meijin" against "Hidemasa Tamenoki",
 *     played before those member rows existed. A name fallback pulls it into a
 *     total it was never bound to;
 *   - a game AGAINST YOURSELF, which John has played. Both seats carry the one
 *     id, and a naive pass over the seats gives him a win and a loss out of one
 *     game;
 *   - a game with ONE seat bound and the other loose, which is most of the
 *     development database;
 *   - and a DRAW, which is its own result rather than a loss for both.
 */
const WORLD: Row[] = [
  { blackMemberId: "a", whiteMemberId: "b", winner: "black" },
  { blackMemberId: "b", whiteMemberId: "a", winner: "black" },
  { blackMemberId: "a", whiteMemberId: "b", winner: null },
  { blackMemberId: "a", whiteMemberId: null, winner: "white" },
  { blackMemberId: null, whiteMemberId: "b", winner: "white" },
  { blackMemberId: "solo", whiteMemberId: "solo", winner: "black" },
  { blackMemberId: null, whiteMemberId: null, winner: "black" },
];

const EVERYBODY = ["a", "b", "solo"];

describe("the stored tally and the counted one", () => {
  it("agree on every member, over the games that have caught this before", () => {
    const stored = replayColumns(WORLD);
    const counted = asFetchPlayedTalliesWould(WORLD, EVERYBODY);
    for (const id of EVERYBODY) {
      expect(stored.get(id) ?? NOTHING, `${id}'s stored tally`).toEqual(counted.get(id));
    }
  });

  it("is really the awkward world, so a passing run means something", () => {
    /*
     * The other half of the check above. Two implementations that both counted
     * nothing would agree perfectly, and this file would be green for ever
     * having compared two zeros — the shape AGENTS.md calls a green test that
     * is not a statement about the code. So the figures are written out.
     */
    const stored = replayColumns(WORLD);
    // Four games for "a": a win, a loss, a draw, and a loss in the game whose
    // other seat nobody holds — which counts, because SHE was in it.
    expect(stored.get("a")).toEqual({ wins: 1, losses: 2, draws: 1, played: 4 });
    expect(stored.get("b")).toEqual({ wins: 2, losses: 1, draws: 1, played: 4 });
    // ONE game, not two, and a win rather than a win and a loss.
    expect(stored.get("solo")).toEqual({ wins: 1, losses: 0, draws: 0, played: 1 });
    // The game with neither seat bound reached nobody at all.
    expect([...stored.keys()].sort()).toEqual(EVERYBODY);
  });

  it("keeps played as the sum of the other three, which is what an index sorts", () => {
    /*
     * `played` is a column rather than `won + lost + drawn` so that "who has
     * played most" is an indexed ORDER BY. That makes it the one figure here
     * that CAN be wrong on its own — and a directory ordered by a played count
     * that does not match its own row's W/L/D would put people in an order
     * nothing on the page explains.
     */
    for (const counts of replayColumns(WORLD).values()) {
      expect(counts.played).toBe(counts.wins + counts.losses + counts.draws);
    }
  });

  it("moves nobody's tally for a result it cannot read", () => {
    /*
     * A rule that cannot measure must not fire. `winner` is a plain TEXT column,
     * so a fourth value is possible, and the arithmetic would otherwise call it
     * a LOSS for black — a perfectly plausible result out of a row nothing
     * understands. `playedSides` refuses it and the tally rides that refusal.
     */
    const unreadable = [
      { blackMemberId: "a", whiteMemberId: "b", winner: "sideways" },
    ] as unknown as Row[];
    expect(replayColumns(unreadable).size).toBe(0);
  });
});

describe("where the tally is written", () => {
  /**
   * The four endings, found by SEARCHING `lib/history` rather than by naming
   * the two files that hold them today.
   *
   * `recordPlayed` is the one function all four reach, which is what makes the
   * tally a single write rather than four remembered ones — so the claim is
   * about the COUNT of call sites, not about which files they sit in. Named
   * paths would have made this a test that breaks on a refactor and says
   * nothing about the behaviour; `liveGameEndings.ts` is being moved on another
   * branch as this is written, which is exactly the case that settles it.
   *
   * It still fails loudly if an ending stops recording a decided game, which is
   * the fault worth catching: the run and the tally would both stop moving for
   * that one ending, and nothing else on the site would report it.
   */
  const HISTORY = join(process.cwd(), "src/lib/history");
  const endings = readdirSync(HISTORY)
    .filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"))
    .map((name) => ({ path: `src/lib/history/${name}`, source: readFileSync(join(HISTORY, name), "utf8") }))
    .filter(({ source }) => source.includes("recordPlayed"));

  it("has the files that end a game to read", () => {
    // At least two of them, or the search found nothing and every assertion
    // below would loop over an empty list and pass having checked nothing.
    expect(endings.length, "nothing under lib/history records a decided game").toBeGreaterThan(1);
  });

  it("is reached from all four endings, through one function and not four writes", () => {
    const calls = endings.flatMap(({ source }) => [...source.matchAll(/await recordPlayed\(/g)]);
    expect(calls, "an ending has stopped recording a decided game").toHaveLength(4);

    // And no ending writes the tally for itself. Four call sites incrementing
    // four columns is four places to forget one, which is the whole reason
    // `recordPlayed` carries it — and the reason this change touched neither of
    // those files.
    for (const { path, source } of endings) {
      expect(source, `${path} writes the tally itself`).not.toContain("playedTallyWrite");
    }
  });
});

describe("the migration that filled the columns", () => {
  const SQL = readFileSync(
    join(
      process.cwd(),
      "prisma/migrations/20260912170000_the_directory_sorts_by_what_it_shows/migration.sql",
    ),
    "utf8",
  );

  it("counts the same set of games the live write counts", () => {
    // The filter, which is the definition: a finished game whose result is not
    // `abandoned`. A migration that dropped either half would have filled every
    // row with a number nothing since then can reproduce.
    expect(SQL).toContain(`"status" = 'finished'`);
    expect(SQL).toContain(`"result" <> 'abandoned'`);
    // Only the winners the arithmetic can read — the same refusal `playedSides`
    // makes, asserted above.
    expect(SQL).toContain(`"winner" IN ('black', 'white')`);
    // A game against yourself once, from the black seat.
    expect(SQL).toContain(`"whiteMemberId" <> "blackMemberId"`);
    // And `played` as the sum, so the column an index orders by cannot start
    // life disagreeing with the three beside it.
    expect(SQL).toContain(`"played" = t."won" + t."lost" + t."drawn"`);
  });

  it("adds and never rewrites, so a database that has it keeps everything else", () => {
    expect(SQL).toContain(`ADD COLUMN "played"`);
    expect(SQL).not.toMatch(/\bDROP\s+(COLUMN|TABLE|INDEX)\b/i);
    expect(SQL).not.toMatch(/\bDELETE\s+FROM\b/i);
  });
});
