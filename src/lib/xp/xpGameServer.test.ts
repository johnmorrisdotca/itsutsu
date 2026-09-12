import { beforeEach, describe, expect, it, vi } from "vitest";

import { BOT_MEMBERS } from "@/lib/bots/bots.constants";
import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { RULE_VARIANTS, RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";
import { BOT_SPECIALIST_LIST, BOT_TIER_LIST } from "@/lib/gomoku/opponent.constants";

import { XP_EVENT_SPECS } from "./xp.constants";

/**
 * The awards a finished game actually writes, driven through the writer.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE REAL `awardXp`, OVER A FAKE THAT KEEPS THE ONE PROMISE THE SCHEMA MAKES
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `playedRun.test.ts` mocks the awarder and asserts what was ASKED for, which is
 * the right question there. This file asks the other one: what a game PAYS, once,
 * when the same ending fires twice. So it fakes only the database, and honours
 * the unique index on `(memberId, type, subject)` exactly as Postgres does with
 * `skipDuplicates` — because that index is the whole design, and a fake without
 * it would make every "not twice" case below pass for the wrong reason.
 *
 * It drives `recordPlayed`, not `awardFinishedGameXp`, on purpose. The writer is
 * where the seat, the outcome and the self-game rule are resolved, and a test
 * that called the award path directly would prove nothing about the path a real
 * finished game takes.
 */

type Event = { memberId: string; type: string; points: number; subject: string; dayKey: string };
/** One finished game the fake database holds, for the rivalry read. */
type Past = { id: string; variant: string; blackMemberId: string; whiteMemberId: string; winner: string };

let events: Event[] = [];
let past: Past[] = [];
/** `owner\0buddy`, both addresses, as the Buddy table's unique key really is. */
let buddies: Set<string> = new Set();
const members = new Map<
  string,
  {
    id: string;
    email: string | null;
    botTier: string | null;
    timeZone: string;
    xp: number;
    xpFlash: unknown;
    xpLastAt: Date | null;
    playedStreakKind: string | null;
    playedStreakCount: number;
  }
>();

function keyOf(row: { memberId: string; type: string; subject: string }): string {
  return `${row.memberId}\0${row.type}\0${row.subject}`;
}

const prismaFake = {
  buddy: {
    findUnique: async ({ where }: { where: { owner_buddy: { owner: string; buddy: string } } }) =>
      buddies.has(`${where.owner_buddy.owner}\0${where.owner_buddy.buddy}`)
        ? { owner: where.owner_buddy.owner }
        : null,
  },
  game: {
    /*
     * The rivalry read behind `revengeWin`, restated here as the OR the live
     * query uses: a finished game of this variant that this member lost to that
     * member, and never this game.
     */
    findFirst: async ({ where }: { where: Record<string, unknown> }) => {
      const clauses = (where.OR ?? []) as { blackMemberId: string; whiteMemberId: string; winner: string }[];
      const not = (where.id as { not?: string } | undefined)?.not;
      return (
        past.find(
          (row) =>
            row.id !== not &&
            row.variant === where.variant &&
            clauses.some(
              (clause) =>
                clause.blackMemberId === row.blackMemberId &&
                clause.whiteMemberId === row.whiteMemberId &&
                clause.winner === row.winner,
            ),
        ) ?? null
      );
    },
  },
  member: {
    findUnique: async ({ where }: { where: { id: string } }) => members.get(where.id) ?? null,
    findMany: async ({ where }: { where: { id: { in: string[] } } }) =>
      where.id.in.flatMap((id) => {
        const row = members.get(id);
        return row === undefined ? [] : [row];
      }),
    update: ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const row = members.get(where.id);
      if (row === undefined) throw new Error("no member");
      const increment = (data.xp as { increment?: number } | undefined)?.increment ?? 0;
      row.xp += increment;
      if ("xpFlash" in data) row.xpFlash = data.xpFlash;
      if ("xpLastAt" in data) row.xpLastAt = data.xpLastAt as Date | null;
      if (typeof data.playedStreakKind === "string") row.playedStreakKind = data.playedStreakKind;
      if (typeof data.playedStreakCount === "number") row.playedStreakCount = data.playedStreakCount;
      // The real client hands the transaction a promise; applying eagerly and
      // returning a thenable is all either caller here does with it.
      return { then: (resolve: (value: unknown) => unknown) => resolve(row) };
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
    groupBy: async ({ where }: { where: { memberId: string; dayKey: string; type: { in: string[] } } }) => {
      const counts = new Map<string, number>();
      for (const row of events) {
        if (row.memberId !== where.memberId || row.dayKey !== where.dayKey) continue;
        if (!where.type.in.includes(row.type)) continue;
        counts.set(row.type, (counts.get(row.type) ?? 0) + 1);
      }
      return [...counts.entries()].map(([type, count]) => ({ type, _count: { _all: count } }));
    },
    count: async ({ where }: { where: { memberId: string; type: string } }) =>
      events.filter((row) => row.memberId === where.memberId && row.type === where.type).length,
  },
  $transaction: async (input: unknown) =>
    typeof input === "function"
      ? (input as (tx: unknown) => Promise<unknown>)(prismaFake)
      : Promise.all(input as Promise<unknown>[]),
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaFake }));

const { recordPlayed } = await import("@/lib/rating/playedRun");

function member(
  id: string,
  extra: { botTier?: string | null; email?: string; run?: { kind: string; count: number } } = {},
) {
  members.set(id, {
    id,
    email: extra.email ?? null,
    botTier: extra.botTier ?? null,
    timeZone: "",
    xp: 0,
    xpFlash: null,
    xpLastAt: null,
    playedStreakKind: extra.run?.kind ?? null,
    playedStreakCount: extra.run?.count ?? 0,
  });
}

let nextId = 0;
function finished(input: {
  black: string | null;
  white: string | null;
  winner: "black" | "white" | null;
  variant?: string;
  moveCount?: number;
  id?: string;
}) {
  nextId += 1;
  return {
    id: input.id ?? `g${nextId}`,
    blackMemberId: input.black,
    whiteMemberId: input.white,
    winner: input.winner,
    variant: input.variant ?? RULE_VARIANTS.reversi,
    moveCount: input.moveCount ?? 10,
  };
}

/** What one member holds in the ledger, as `type subject` pairs. */
function ledger(memberId: string): string[] {
  return events.filter((row) => row.memberId === memberId).map((row) => `${row.type} ${row.subject}`);
}

function paid(memberId: string, type: string): number {
  return events.filter((row) => row.memberId === memberId && row.type === type).length;
}

beforeEach(() => {
  events = [];
  past = [];
  buddies = new Set();
  members.clear();
  nextId = 0;
});

describe("a finished game, paid once", () => {
  it("writes the finish, the first game, the tour and the win", async () => {
    member("winner");
    member("loser");

    await recordPlayed(finished({ black: "winner", white: "loser", winner: "black", id: "one" }));

    expect(ledger("winner")).toEqual([
      "gameFinished one",
      "firstGameEver ",
      "firstOfVariant reversi",
      "firstOfFamily flips",
      "gameWon one",
      "wonVsPerson one",
      "firstWinAtVariant reversi",
    ]);
    expect(ledger("loser")).toEqual([
      "gameFinished one",
      "firstGameEver ",
      "firstOfVariant reversi",
      "firstOfFamily flips",
    ]);
  });

  it("writes nothing a second time when the same ending fires again", async () => {
    // Three of the four endings can fire for one game — a move that wins, then a
    // timeout claimed on the already-finished row — and bots replay endings. The
    // subject is what makes the second one cost nothing.
    member("a");
    member("b");
    const one = finished({ black: "a", white: "b", winner: "white", id: "twice" });

    await recordPlayed(one);
    const after = [...ledger("a")];
    await recordPlayed(one);
    await recordPlayed(one);

    expect(ledger("a")).toEqual(after);
    expect(paid("a", "gameFinished")).toBe(1);
    expect(paid("b", "gameWon")).toBe(1);
  });

  it("pays the total once, so the column agrees with the ledger", async () => {
    member("a");
    member("b");
    const one = finished({ black: "a", white: "b", winner: "black", id: "sum" });

    await recordPlayed(one);
    await recordPlayed(one);

    const owed = events
      .filter((row) => row.memberId === "a")
      .reduce((total, row) => total + row.points, 0);
    expect(members.get("a")?.xp).toBe(owed);
  });

  it("asks nothing for a computer player, however many games it finishes", async () => {
    // The bots are real member rows with real streak columns, and they play
    // constantly. `awardXp` refuses them at the top; this is the same refusal
    // seen from the writer, which is where it would otherwise be invisible.
    member("person");
    member("meijin", { botTier: "meijin" });

    await recordPlayed(finished({ black: "meijin", white: "person", winner: "black" }));

    expect(ledger("meijin")).toEqual([]);
    expect(ledger("person").length).toBeGreaterThan(0);
  });
});

describe("a different subject is a different award", () => {
  it("pays a first game of each variant, and one first game ever", async () => {
    member("tourist");

    await recordPlayed(finished({ black: "tourist", white: null, winner: "black", variant: RULE_VARIANTS.hex }));
    await recordPlayed(finished({ black: "tourist", white: null, winner: "black", variant: RULE_VARIANTS.halma }));
    await recordPlayed(finished({ black: "tourist", white: null, winner: "black", variant: RULE_VARIANTS.hex }));

    expect(paid("tourist", "firstOfVariant")).toBe(2);
    expect(paid("tourist", "firstGameEver")).toBe(1);
    // Hex is a family of one and Halma is in Races, so two families were met.
    expect(paid("tourist", "firstOfFamily")).toBe(2);
  });

  it("pays a family once however many of its games are played", async () => {
    member("reader");
    const flips = GAME_FAMILIES.find((family) => family.key === "flips");

    for (const variant of flips?.games ?? []) {
      await recordPlayed(finished({ black: "reader", white: null, winner: null, variant }));
    }

    expect(paid("reader", "firstOfFamily")).toBe(1);
    expect(paid("reader", "firstOfVariant")).toBe(flips?.games.length);
  });
});

describe("winning, through the writer", () => {
  it("pays the person, the buddy, and the first win at that game", async () => {
    member("me", { email: "me@example.test" });
    member("pal", { email: "PAL@example.test" });
    // The buddy list is keyed by folded addresses, so the row is written folded
    // and the read has to fold too — a member who signed in as PAL@ is the same
    // person as pal@.
    buddies.add("me@example.test\0pal@example.test");

    await recordPlayed(finished({ black: "me", white: "pal", winner: "black", id: "beat-pal" }));

    expect(ledger("me")).toEqual([
      "gameFinished beat-pal",
      "firstGameEver ",
      "firstOfVariant reversi",
      "firstOfFamily flips",
      "gameWon beat-pal",
      "wonVsPerson beat-pal",
      "wonVsBuddy beat-pal",
      "firstWinAtVariant reversi",
    ]);
  });

  it("says nothing about a buddy who is not on the list", async () => {
    member("me", { email: "me@example.test" });
    member("stranger", { email: "them@example.test" });

    await recordPlayed(finished({ black: "me", white: "stranger", winner: "black" }));

    expect(ledger("me")).toContain("wonVsPerson " + events[0].subject);
    expect(paid("me", "wonVsBuddy")).toBe(0);
  });

  it("pays the turn-around once, keyed on the rivalry and the game", async () => {
    member("me", { email: "me@example.test" });
    member("rival", { email: "rival@example.test" });
    // They beat me at Reversi last week: I held white, they held black and won.
    past = [{ id: "old", variant: "reversi", blackMemberId: "rival", whiteMemberId: "me", winner: "black" }];

    await recordPlayed(finished({ black: "me", white: "rival", winner: "black", id: "turned" }));
    await recordPlayed(finished({ black: "rival", white: "me", winner: "white", id: "again" }));

    expect(paid("me", "revengeWin")).toBe(1);
    expect(ledger("me")).toContain("revengeWin rival:reversi");
    // And the loser of those two got nothing for a turn-around they did not make.
    expect(paid("rival", "revengeWin")).toBe(0);
  });

  it("pays a turn-around at each game separately", async () => {
    member("me", { email: "me@example.test" });
    member("rival", { email: "rival@example.test" });
    past = [
      { id: "o1", variant: "reversi", blackMemberId: "rival", whiteMemberId: "me", winner: "black" },
      { id: "o2", variant: "hex", blackMemberId: "rival", whiteMemberId: "me", winner: "black" },
    ];

    await recordPlayed(finished({ black: "me", white: "rival", winner: "black", variant: RULE_VARIANTS.reversi }));
    await recordPlayed(finished({ black: "me", white: "rival", winner: "black", variant: RULE_VARIANTS.hex }));

    expect(paid("me", "revengeWin")).toBe(2);
  });

  it("reads two things, and only for a win over a person", async () => {
    /*
     * WHAT A FINISHED GAME COSTS BEYOND THE WRITES IT ALREADY MADE, counted
     * rather than claimed. The buddy list and the rivalry are the two facts a
     * finished game does not already know, and they are the price of exactly two
     * awards — so a draw pays nothing for them, and neither does a win over a
     * program, whose grade is answered by a pure function.
     */
    member("me", { email: "me@example.test" });
    member("them", { email: "them@example.test" });
    member(BOT_MEMBERS.kyu.id, { botTier: "kyu" });
    let reads = 0;
    const buddyRead = prismaFake.buddy.findUnique;
    const rivalryRead = prismaFake.game.findFirst;
    prismaFake.buddy.findUnique = async (args) => {
      reads += 1;
      return buddyRead(args);
    };
    prismaFake.game.findFirst = async (args) => {
      reads += 1;
      return rivalryRead(args);
    };

    await recordPlayed(finished({ black: "me", white: "them", winner: null, id: "drawn" }));
    const afterDraw = reads;
    await recordPlayed(finished({ black: "me", white: BOT_MEMBERS.kyu.id, winner: "black", id: "bot" }));
    const afterBot = reads;
    await recordPlayed(finished({ black: "me", white: "them", winner: "black", id: "won" }));

    prismaFake.buddy.findUnique = buddyRead;
    prismaFake.game.findFirst = rivalryRead;
    // Two seats, neither of which won: nothing to ask about the other one.
    expect(afterDraw).toBe(0);
    expect(afterBot).toBe(0);
    // One buddy read and one rivalry read, for the one side that beat a person.
    expect(reads).toBe(2);
  });
});

describe("a run of wins, through the writer", () => {
  it("pays the milestone off the run the writer is already keeping", async () => {
    // The run comes out of the very columns `recordPlayed` writes, so the
    // milestone and the column cannot disagree. Two wins in hand, and this one
    // is the third.
    member("hot", { run: { kind: "win", count: 2 } });

    await recordPlayed(finished({ black: "hot", white: null, winner: "black", id: "third" }));

    expect(ledger("hot")).toContain("winStreak3 third");
    expect(members.get("hot")?.playedStreakCount).toBe(3);
  });

  it("pays a later run again, because it is keyed on the game", async () => {
    member("hot", { run: { kind: "win", count: 2 } });

    await recordPlayed(finished({ black: "hot", white: null, winner: "black", id: "one" }));
    // A loss ends it, then three more wins.
    await recordPlayed(finished({ black: "hot", white: null, winner: "white", id: "two" }));
    for (const id of ["three", "four", "five"]) {
      await recordPlayed(finished({ black: "hot", white: null, winner: "black", id }));
    }

    expect(paid("hot", "winStreak3")).toBe(2);
  });

  it("pays nothing at four", async () => {
    member("warm", { run: { kind: "win", count: 3 } });

    await recordPlayed(finished({ black: "warm", white: null, winner: "black" }));

    expect(paid("warm", "winStreak3")).toBe(0);
    expect(paid("warm", "winStreak5")).toBe(0);
  });
});

describe("the computer ladder, through the writer", () => {
  it("pays each grade once and the lot when the fifth falls", async () => {
    member("climber");
    for (const tier of BOT_TIER_LIST) {
      member(BOT_MEMBERS[tier].id, { botTier: tier });
      // Twice each: the second win over a grade already beaten pays nothing.
      for (const round of [1, 2]) {
        await recordPlayed(
          finished({
            black: "climber",
            white: BOT_MEMBERS[tier].id,
            winner: "black",
            id: `${tier}-${round}`,
          }),
        );
      }
    }

    expect(paid("climber", "gradeBeaten")).toBe(BOT_TIER_LIST.length);
    expect(paid("climber", "everyGradeBeaten")).toBe(1);
    // A grade is not a person, however many games it plays.
    expect(paid("climber", "wonVsPerson")).toBe(0);
  });

  it("does not count the specialists towards the five", async () => {
    member("hunter");
    for (const tier of BOT_SPECIALIST_LIST) {
      member(BOT_MEMBERS[tier].id, { botTier: tier });
      await recordPlayed(
        finished({ black: "hunter", white: BOT_MEMBERS[tier].id, winner: "black", id: `${tier}-1` }),
      );
    }

    expect(paid("hunter", "specialistBeaten")).toBe(BOT_SPECIALIST_LIST.length);
    expect(paid("hunter", "gradeBeaten")).toBe(0);
    expect(paid("hunter", "everyGradeBeaten")).toBe(0);
  });
});

describe("the tour's two bonuses", () => {
  it("pays every-family and every-game once the last one is in", async () => {
    member("completer");

    for (const variant of RULE_VARIANT_LIST) {
      await recordPlayed(finished({ black: "completer", white: null, winner: "black", variant }));
    }

    expect(paid("completer", "everyVariantPlayed")).toBe(1);
    expect(paid("completer", "everyFamilyPlayed")).toBe(1);
    expect(paid("completer", "firstOfVariant")).toBe(RULE_VARIANT_LIST.length);
  });

  it("pays them even though the day's allowance stopped the finishes", async () => {
    // The allowance gates the RESULT awards and never a milestone: finishing
    // your seventh game of the day is worth nothing, and playing your
    // thirty-ninth game of something new on the same day is worth 500. Telling
    // somebody nothing happened is the failure a cap exists to prevent.
    member("busy");

    for (const variant of RULE_VARIANT_LIST) {
      await recordPlayed(finished({ black: "busy", white: null, winner: "black", variant }));
    }

    expect(paid("busy", "gameFinished")).toBe(XP_EVENT_SPECS.gameFinished.cap);
    expect(paid("busy", "everyVariantPlayed")).toBe(1);
  });

  it("says nothing until the set is complete", async () => {
    member("nearly");

    for (const variant of RULE_VARIANT_LIST.slice(0, RULE_VARIANT_LIST.length - 1)) {
      await recordPlayed(finished({ black: "nearly", white: null, winner: "black", variant }));
    }

    expect(paid("nearly", "everyVariantPlayed")).toBe(0);
  });

  it("counts nothing on a game that met nothing new", async () => {
    // The count runs only when a first-of was just paid, which is at most
    // thirty-nine times in a member's life. Every other finished game asks
    // nothing at all.
    member("regular");
    const before = prismaFake.xpEvent.count;
    let counts = 0;
    prismaFake.xpEvent.count = async (args: { where: { memberId: string; type: string } }) => {
      counts += 1;
      return before(args);
    };

    await recordPlayed(finished({ black: "regular", white: null, winner: "black" }));
    const afterFirst = counts;
    await recordPlayed(finished({ black: "regular", white: null, winner: "black" }));

    prismaFake.xpEvent.count = before;
    expect(afterFirst).toBe(2);
    expect(counts).toBe(afterFirst);
  });
});
