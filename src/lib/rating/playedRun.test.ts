import { beforeEach, describe, expect, it, vi } from "vitest";

import { extendStreak, streakFrom, type Streak, type StreakOutcome } from "./streak";

/**
 * The fourth run, and the one test that matters: THAT IT COUNTS THE SAME GAMES
 * AS THE NUMBER IT IS PRINTED BESIDE.
 *
 * A streak is the one figure in a record table that cannot be checked by
 * looking — the counts link to their games, a run is a single number. So a run
 * that is about a slightly different set from the count beside it is wrong in a
 * way nobody can see, which is why 0.150.0 left this cell blank rather than
 * fill it with the rated run. The set is `fetchPlayedTallies`, and the
 * equivalence below is asserted against that function itself rather than
 * against a restatement of it.
 *
 * Two of its rules are the ones a fresh implementation gets wrong, and both are
 * real rows on production:
 *
 *   - MEMBER ID ONLY. A decided game between "Meijin" and "Hidemasa Tamenoki"
 *     carries both seats' ids null, played before those member rows existed. A
 *     name fallback reads 60 games where the count says 59.
 *   - A GAME AGAINST YOURSELF IS ONE GAME, from the black seat. John has
 *     played himself; a naive pass over the seats gives him a win and a loss
 *     out of one game.
 */

/**
 * One stored game, as narrow as the domain really is. `Game.winner` is a plain
 * string column, but only three values ever reach it, and typing the fixtures
 * loosely would mean the two functions under test could not be handed the same
 * row — which is the whole point of the equivalence below.
 */
type Row = {
  blackMemberId: string | null;
  whiteMemberId: string | null;
  winner: "black" | "white" | null;
};

/** Every finished, non-abandoned game the fake database holds, oldest first. */
let stored: Row[] = [];
const memberRows = new Map<string, { id: string; playedStreakKind: string | null; playedStreakCount: number }>();
const updates: { id: string; data: Record<string, unknown> }[] = [];
let reads = 0;
let transactions = 0;

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: {
      findMany: async () => stored,
    },
    member: {
      findMany: async ({ where }: { where: { id: { in: string[] } } }) => {
        reads += 1;
        return where.id.in.flatMap((id) => {
          const row = memberRows.get(id);
          return row === undefined ? [] : [row];
        });
      },
      // The real client returns a promise the transaction awaits; the shape of
      // the call is what is being asserted, so recording it is enough.
      update: ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        updates.push({ id: where.id, data });
        return { then: (resolve: (value: unknown) => unknown) => resolve(null) };
      },
    },
    $transaction: async (writes: unknown[]) => {
      transactions += 1;
      return writes;
    },
  },
}));

const { playedSides, recordPlayed } = await import("./playedRun");
const { fetchPlayedTallies } = await import("@/lib/history/playerRecord");

function game(black: string | null, white: string | null, winner: "black" | "white" | null): Row {
  return { blackMemberId: black, whiteMemberId: white, winner };
}

function member(id: string, streak: Streak | null = null) {
  memberRows.set(id, {
    id,
    playedStreakKind: streak?.kind ?? null,
    playedStreakCount: streak?.count ?? 0,
  });
}

beforeEach(() => {
  stored = [];
  memberRows.clear();
  updates.length = 0;
  reads = 0;
  transactions = 0;
});

describe("whose run a decided game moves", () => {
  it("moves both seats, each by their own result", () => {
    expect(playedSides(game("a", "b", "black"))).toEqual([
      { memberId: "a", outcome: "win" },
      { memberId: "b", outcome: "loss" },
    ]);
  });

  it("moves both seats by a draw when nobody won", () => {
    expect(playedSides(game("a", "b", null))).toEqual([
      { memberId: "a", outcome: "draw" },
      { memberId: "b", outcome: "draw" },
    ]);
  });

  it("moves nobody when neither seat is bound to a member", () => {
    // The Meijin / Hidemasa Tamenoki row. It is a real finished game and it is
    // in nobody's total, because nothing on it says whose it was.
    expect(playedSides(game(null, null, "white"))).toEqual([]);
  });

  it("moves only the bound seat when one is loose", () => {
    expect(playedSides(game(null, "b", "black"))).toEqual([{ memberId: "b", outcome: "loss" }]);
    expect(playedSides(game("a", null, "black"))).toEqual([{ memberId: "a", outcome: "win" }]);
  });

  it("moves a game against yourself once, from the black seat", () => {
    // Not a win and a loss out of one game, which is what two entries would
    // mean — and what would make a 14-game record read as 15.
    expect(playedSides(game("solo", "solo", "white"))).toEqual([
      { memberId: "solo", outcome: "loss" },
    ]);
  });
});

/**
 * Replays a whole database of games the way `recordPlayed` does, one at a time
 * in the order they were decided, and reports each member's run and record.
 *
 * This is the writer's side of the equivalence: `playedSides` decides who and
 * `extendStreak` decides how, exactly as the live path does.
 */
function replayed(games: readonly Row[]) {
  const runs = new Map<string, { streak: Streak | null; wins: number; losses: number; draws: number }>();
  for (const one of games) {
    for (const side of playedSides(one)) {
      const run = runs.get(side.memberId) ?? { streak: null, wins: 0, losses: 0, draws: 0 };
      run.streak = extendStreak(run.streak, side.outcome);
      if (side.outcome === "win") run.wins += 1;
      else if (side.outcome === "loss") run.losses += 1;
      else run.draws += 1;
      runs.set(side.memberId, run);
    }
  }
  return runs;
}

/** The same games read backwards, which is what a leading run is. */
function leadingRun(games: readonly Row[], id: string): Streak | null {
  const outcomes: StreakOutcome[] = [];
  for (const one of [...games].reverse()) {
    for (const side of playedSides(one)) {
      if (side.memberId === id) outcomes.push(side.outcome);
    }
  }
  return streakFrom(outcomes);
}

describe("the run counts the same games the PLAYED column counts", () => {
  /*
   * A set of games with every awkward case in it at once: a loose seat, a game
   * belonging to nobody, a game against yourself, a draw, and a run that is
   * broken and started again. If the two definitions differ anywhere, they
   * differ on one of these.
   */
  const world: Row[] = [
    game("a", "b", "black"),
    game(null, null, "white"),
    game("b", "a", "black"),
    game("a", "solo", null),
    game("solo", "solo", "black"),
    game("a", null, "black"),
    game(null, "b", "black"),
    game("a", "b", "white"),
    game("b", "a", "white"),
  ];

  it("agrees with fetchPlayedTallies on every member's record", async () => {
    stored = world;
    const ids = ["a", "b", "solo"];

    const tallies = await fetchPlayedTallies(ids);
    const runs = replayed(world);

    for (const id of ids) {
      const tally = tallies.get(id);
      const run = runs.get(id);
      expect(run, `${id} has games in one definition and not the other`).toBeDefined();
      expect({ wins: run?.wins, losses: run?.losses, draws: run?.draws }).toEqual(tally);
    }
  });

  it("counts, for each member, exactly as many games as the PLAYED column shows", async () => {
    stored = world;
    const ids = ["a", "b", "solo"];

    const tallies = await fetchPlayedTallies(ids);
    const runs = replayed(world);

    // Spelled out as a total as well as three counts, because PLAYED is the
    // number a reader compares the run against, and the ticket this comes from
    // says a disagreement of one game is worse than the dash it replaced.
    for (const id of ids) {
      const tally = tallies.get(id);
      const played = (tally?.wins ?? 0) + (tally?.losses ?? 0) + (tally?.draws ?? 0);
      const run = runs.get(id);
      expect((run?.wins ?? 0) + (run?.losses ?? 0) + (run?.draws ?? 0)).toBe(played);
    }
    // And the set really is the awkward one: "a" has a loose-seated game, a
    // game against solo, and a game nobody is in — 6, not 7 and not 5.
    const forA = tallies.get("a");
    expect((forA?.wins ?? 0) + (forA?.losses ?? 0) + (forA?.draws ?? 0)).toBe(6);
  });

  it("carried forward one game at a time is the same run as read backwards", () => {
    // The writer goes forwards and a reader goes backwards; if those disagree,
    // a backfill and the live path would quietly rewrite each other.
    for (const id of ["a", "b", "solo"]) {
      expect(replayed(world).get(id)?.streak ?? null).toEqual(leadingRun(world, id));
    }
  });
});

describe("what recording one costs", () => {
  it("reads the two rows once and writes them in one transaction", async () => {
    member("a", { kind: "win", count: 2 });
    member("b");

    await recordPlayed(game("a", "b", "black"));

    expect(reads).toBe(1);
    expect(transactions).toBe(1);
    expect(updates).toEqual([
      { id: "a", data: { playedStreakKind: "win", playedStreakCount: 3 } },
      { id: "b", data: { playedStreakKind: "loss", playedStreakCount: 1 } },
    ]);
  });

  it("starts a run again when the result changes kind", async () => {
    member("a", { kind: "win", count: 9 });

    await recordPlayed(game("a", null, "white"));

    expect(updates).toEqual([{ id: "a", data: { playedStreakKind: "loss", playedStreakCount: 1 } }]);
  });

  it("writes one row for a game against yourself", async () => {
    member("solo", { kind: "loss", count: 1 });

    await recordPlayed(game("solo", "solo", "black"));

    expect(updates).toEqual([{ id: "solo", data: { playedStreakKind: "win", playedStreakCount: 1 } }]);
  });

  it("costs nothing at all for a game neither seat was bound to", async () => {
    await recordPlayed(game(null, null, "black"));

    expect(reads).toBe(0);
    expect(transactions).toBe(0);
    expect(updates).toEqual([]);
  });

  it("writes nothing for a seat no member row answers to", async () => {
    // A seat bound to an id that has since gone. Silence rather than an upsert
    // inventing a member, and no empty transaction either.
    await recordPlayed(game("ghost", null, "black"));

    expect(reads).toBe(1);
    expect(transactions).toBe(0);
    expect(updates).toEqual([]);
  });
});
