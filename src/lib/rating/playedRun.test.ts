import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  /** Required since 0.159.0: the XP ledger keys a game's awards on it. */
  id: string;
  blackMemberId: string | null;
  whiteMemberId: string | null;
  winner: "black" | "white" | null;
  /** Required too, and for the same reason: the tour's awards are keyed on it. */
  variant: string;
  /** What `longGame` is measured against. */
  moveCount: number;
};

/** Every finished, non-abandoned game the fake database holds, oldest first. */
let stored: Row[] = [];
const memberRows = new Map<
  string,
  { id: string; email: string | null; playedStreakKind: string | null; playedStreakCount: number }
>();
const updates: { id: string; data: Record<string, unknown> }[] = [];
let reads = 0;
let transactions = 0;

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: {
      findMany: async () => stored,
      /* The rivalry read behind `revengeWin`: nobody here has beaten anybody
         before. It is answered rather than left missing so this file exercises
         the same path the live one does instead of the read's failure path. */
      findFirst: async () => null,
    },
    buddy: {
      findUnique: async () => null,
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

/**
 * The XP awards a finished game asked for, recorded rather than paid.
 *
 * Mocked because this file is about the RUN — that it counts the same games as
 * the number printed beside it — and a real `awardXp` would want a member row,
 * an XpEvent table and a day key that none of the fixtures here have. What is
 * worth asserting at this seam is that each bound side was asked for the right
 * awards keyed on the right game, and that is what `asked` holds. What those
 * awards then come to is `awardXp.test.ts`.
 */
const asked: { memberId: string | null | undefined; types: string[]; subjects: string[] }[] = [];
vi.mock("@/lib/xp/awardXp", () => ({
  awardXp: async ({
    memberId,
    awards,
  }: {
    memberId: string | null | undefined;
    awards: { type: string; subject?: string }[];
  }) => {
    asked.push({
      memberId,
      types: awards.map((award) => award.type),
      subjects: awards.map((award) => award.subject ?? ""),
    });
    return { awards: [], points: 0, xp: 0, crossed: null };
  },
}));

const { playedSides, recordPlayed } = await import("./playedRun");
const { fetchPlayedTallies } = await import("@/lib/history/playerRecord");

let nextGameId = 0;
function game(
  black: string | null,
  white: string | null,
  winner: "black" | "white" | null,
  id?: string,
): Row {
  nextGameId += 1;
  return {
    id: id ?? `g${nextGameId}`,
    blackMemberId: black,
    whiteMemberId: white,
    winner,
    /* A real variant, because the tour's awards are keyed on it and a fixture
       naming nothing would quietly assert the case where they do not fire. */
    variant: "reversi",
    moveCount: 10,
  };
}

function member(id: string, streak: Streak | null = null) {
  memberRows.set(id, {
    id,
    /* Read for the XP ledger, which needs an address to ask the buddy list
       about. Null here, so nothing in this file pays `wonVsBuddy` — what that
       award comes to is asserted in `src/lib/xp/xpGameServer.test.ts`. */
    email: null,
    playedStreakKind: streak?.kind ?? null,
    playedStreakCount: streak?.count ?? 0,
  });
}

/**
 * A Wednesday, so that what a game asks for does not depend on the day the suite
 * runs. `weekendGame` fires on a game finished at the weekend; without this, every
 * case below asserting an exact list of awards would pass on five days and fail
 * on two. Only `Date` is faked — the timers are real, because everything awaits.
 */
const MIDWEEK = new Date("2026-09-09T12:00:00Z");

beforeEach(() => {
  vi.useFakeTimers({ now: MIDWEEK, toFake: ["Date"] });
  stored = [];
  memberRows.clear();
  updates.length = 0;
  asked.length = 0;
  reads = 0;
  transactions = 0;
});

afterEach(() => {
  vi.useRealTimers();
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

  it("moves nobody on a row whose result it cannot read", () => {
    /*
     * `winner` is a plain string column. Neither database holds anything but
     * `black`, `white` and null today, and if one ever did, `outcomeFor` would
     * call it a LOSS for both seats — two plausible results out of a row
     * nothing understands. A rule that cannot measure must not fire.
     */
    expect(playedSides({ blackMemberId: "a", whiteMemberId: "b", winner: "abandoned" })).toEqual([]);
    expect(playedSides({ blackMemberId: "a", whiteMemberId: "b", winner: "" })).toEqual([]);
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
    /*
     * THE RUN AND THE TALLY, IN THE ONE UPDATE. They are two facts about the
     * same finished game — the count and the run over the games it belongs to —
     * and the directory prints them in adjacent cells, so a write that could
     * land one without the other is a row contradicting itself where a reader
     * can see it. The tally is spelled as an INCREMENT rather than a value, so
     * two games finishing in the same instant both add one; the run cannot say
     * that, and `playedRun.ts` says why.
     */
    expect(updates).toEqual([
      {
        id: "a",
        data: {
          playedStreakKind: "win",
          playedStreakCount: 3,
          played: { increment: 1 },
          won: { increment: 1 },
        },
      },
      {
        id: "b",
        data: {
          playedStreakKind: "loss",
          playedStreakCount: 1,
          played: { increment: 1 },
          lost: { increment: 1 },
        },
      },
    ]);
  });

  it("starts a run again when the result changes kind", async () => {
    member("a", { kind: "win", count: 9 });

    await recordPlayed(game("a", null, "white"));

    expect(updates).toEqual([
      {
        id: "a",
        data: {
          playedStreakKind: "loss",
          playedStreakCount: 1,
          played: { increment: 1 },
          lost: { increment: 1 },
        },
      },
    ]);
  });

  it("writes one row for a game against yourself", async () => {
    member("solo", { kind: "loss", count: 1 });

    await recordPlayed(game("solo", "solo", "black"));

    // ONE row and ONE game: the tally adds one, not two, for the same reason
    // the run does — both seats carry the one id and it is counted from black.
    expect(updates).toEqual([
      {
        id: "solo",
        data: {
          playedStreakKind: "win",
          playedStreakCount: 1,
          played: { increment: 1 },
          won: { increment: 1 },
        },
      },
    ]);
  });

  it("costs nothing at all for a game neither seat was bound to", async () => {
    await recordPlayed(game(null, null, "black"));

    expect(reads).toBe(0);
    expect(transactions).toBe(0);
    expect(updates).toEqual([]);
    expect(asked).toEqual([]);
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

/**
 * The XP the same decided game asks for.
 *
 * XP rides THIS function rather than `recordResult`, which is the decision worth
 * pinning: `recordResult` takes names, bails on `!isRateable`, and is only
 * called `if (row.rated)`. XP is about playing rather than about rating, so an
 * unrated game and a hot-seat game both pay it — which is exactly the set of
 * games this function already sees, once per bound member id.
 *
 * What the awards then come to — the day's allowance, the unique index, whether
 * a bot may earn at all — is `src/lib/xp/awardXp.test.ts`. Here the question is
 * only whether the right member was asked for the right awards about the right
 * game.
 */
describe("the XP a decided game asks for", () => {
  it("pays the winner for finishing and for winning, and the loser for finishing", async () => {
    // A lost game still pays. Seeing a game through is the courtesy
    // correspondence play depends on, and a ladder that only paid winners would
    // be a second rating.
    member("a");
    member("b");

    await recordPlayed(game("a", "b", "black", "k3m9-p2qx"));

    expect(asked).toEqual([
      {
        memberId: "a",
        types: [
          "gameFinished",
          "firstGameEver",
          "firstOfVariant",
          "firstOfFamily",
          "gameWon",
          "wonVsPerson",
          "firstWinAtVariant",
        ],
        subjects: ["k3m9-p2qx", "", "reversi", "flips", "k3m9-p2qx", "k3m9-p2qx", "reversi"],
      },
      {
        memberId: "b",
        types: ["gameFinished", "firstGameEver", "firstOfVariant", "firstOfFamily"],
        subjects: ["k3m9-p2qx", "", "reversi", "flips"],
      },
    ]);
  });

  it("pays both seats for finishing a draw and neither for winning it", async () => {
    member("a");
    member("b");

    await recordPlayed(game("a", "b", null, "d1"));

    for (const call of asked) expect(call.types).not.toContain("gameWon");
    expect(asked.map((one) => one.types[0])).toEqual(["gameFinished", "gameFinished"]);
  });

  it("keys every award on the game, so one game pays once however often an ending fires", async () => {
    // Three of the four endings can fire for one game — a move that wins, then a
    // timeout claimed on the already-finished row — and bots replay endings.
    // Without the game id on the subject, the second firing would pay again.
    member("a");
    member("b");
    const one = game("a", "b", "white", "same");

    await recordPlayed(one);
    await recordPlayed(one);

    expect(asked).toHaveLength(4);
    // Every award about the GAME carries the game's id. The tour's awards are
    // about the variant and the family, which is the whole point of them, so
    // they are the ones deliberately not keyed here.
    const perGame = new Set(["gameFinished", "gameWon", "longGame"]);
    for (const call of asked) {
      const subjects = call.types.flatMap((type, at) => (perGame.has(type) ? [call.subjects[at]] : []));
      expect(new Set(subjects)).toEqual(new Set(["same"]));
    }
  });

  it("asks nothing for a seat no member row answers to", async () => {
    // The streak write already skips it; the award must too, or the operator —
    // who has no Member row at all — becomes a member the first time they finish
    // a game in the browser suite.
    await recordPlayed(game("ghost", null, "black"));
    expect(asked).toEqual([]);
  });

  it("asks once for a game against yourself, from the black seat", async () => {
    // John has played himself. Two calls would pay him for a win and for a loss
    // out of one game, and move his total twice for one row.
    member("solo");

    await recordPlayed(game("solo", "solo", "black", "self"));

    expect(asked).toHaveLength(1);
    expect(asked[0].memberId).toBe("solo");
    expect(asked[0].types).toEqual([
      "gameFinished",
      "firstGameEver",
      "firstOfVariant",
      "firstOfFamily",
      "gameWon",
      "firstWinAtVariant",
    ]);
    // And nothing about the other seat, because the other seat is him. A win
    // over yourself is a win over nobody.
    expect(asked[0].types).not.toContain("wonVsPerson");
  });

  it("asks nothing about a row whose result it cannot read", async () => {
    // `winner` is a plain string column. A value nothing understands must move
    // nobody's run and pay nobody — a rule that cannot measure must not fire.
    member("a");
    member("b");

    await recordPlayed({
      id: "bad",
      blackMemberId: "a",
      whiteMemberId: "b",
      winner: "abandoned",
      variant: "reversi",
      moveCount: 10,
    });

    expect(asked).toEqual([]);
    expect(updates).toEqual([]);
  });
});
