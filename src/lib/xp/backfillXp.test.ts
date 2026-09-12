import { describe, expect, it } from "vitest";

import { GAME_FAMILIES } from "@/lib/gomoku/families";
import { RULE_VARIANT_LIST } from "@/lib/gomoku/gomoku.constants";

import { ledgerDisagreements } from "./backfillPay";
import { XP_BACKFILL_COVERAGE } from "./backfillXp.constants";
import { planBackfill } from "./backfillXp";
import type { BackfillGame, BackfillMember, BackfillPlan, HeldEvent } from "./backfillXp.types";
import { XP_EVENTS, XP_EVENT_SPECS } from "./xp.constants";
import type { XpEventType } from "./xp.types";

/**
 * The replay, checked where ORDER is the whole of the answer.
 *
 * `XP_DESIGN.md` deferred the backfill on one argument: `firstOfVariant`,
 * `firstOfFamily`, `revengeWin` and the win streaks depend on what had already
 * happened when each game ended, so paying them out of order produces a
 * different number from the one the rules would have produced. **Every case
 * below that matters is therefore a pair**: the same games in two orders, or
 * with one extra game in the middle, asserting that the answer moves. A test
 * that only checked "a first game of Reversi pays 25" would pass just as
 * happily over a backfill that summed the games and ignored the order — which
 * is the exact fault this whole module exists to avoid.
 *
 * The allowance and the index are checked here too, because `backfillPay.ts`
 * restates them: a dry run prints a total out of that restatement, and a
 * restatement nobody checks is a second authority.
 */

const AT = (iso: string): Date => new Date(iso);
/* A Wednesday and the Saturday after it, for the weekend award. */
const WED = "2026-02-04T12:00:00Z";
const SAT = "2026-02-07T12:00:00Z";
const SUN = "2026-02-08T12:00:00Z";

function member(id: string, over: Partial<BackfillMember> = {}): BackfillMember {
  return {
    id,
    name: id,
    email: `${id}@example.test`,
    botTier: null,
    timeZone: "UTC",
    createdAt: AT("2026-01-01T00:00:00Z"),
    ...over,
  };
}

let made = 0;
function game(over: Partial<BackfillGame> & { playedAt: Date }): BackfillGame {
  made += 1;
  return {
    id: `g${made}`,
    variant: "freestyle",
    moveCount: 10,
    blackMemberId: null,
    whiteMemberId: null,
    /* Null is a DRAW, so every case that wants a result says so. */
    winner: null,
    ...over,
  };
}

/** A game A won against B, at whatever variant. */
const beat = (winner: string, loser: string, playedAt: string, over: Partial<BackfillGame> = {}) =>
  game({ blackMemberId: winner, whiteMemberId: loser, winner: "black", playedAt: AT(playedAt), ...over });

function plan(input: {
  members: BackfillMember[];
  games?: BackfillGame[];
  buddies?: { owner: string; buddy: string; since: Date }[];
  held?: HeldEvent[];
}): BackfillPlan {
  return planBackfill({
    members: input.members,
    games: input.games ?? [],
    buddies: input.buddies ?? [],
    held: input.held ?? [],
  });
}

const awardsFor = (made: BackfillPlan, memberId: string) =>
  made.batches.filter((batch) => batch.memberId === memberId).flatMap((batch) => batch.paying);

const typesFor = (made: BackfillPlan, memberId: string) =>
  awardsFor(made, memberId).map((award) => award.type);

const countOf = (made: BackfillPlan, memberId: string, type: XpEventType) =>
  typesFor(made, memberId).filter((one) => one === type).length;

/** Which game a type was paid on, so an ORDERED fact can be pinned to a game. */
function paidOn(made: BackfillPlan, memberId: string, type: XpEventType): string[] {
  return made.batches
    .filter((batch) => batch.memberId === memberId && batch.paying.some((award) => award.type === type))
    .map((batch) => (batch.reason.kind === "joined" ? "joined" : batch.reason.gameId));
}

/** Every award a plan would pay, as ledger rows — for a second run over the first. */
function asHeld(made: BackfillPlan): HeldEvent[] {
  return made.batches.flatMap((batch) =>
    batch.paying.map((award) => ({
      memberId: batch.memberId,
      type: award.type,
      subject: award.subject,
      dayKey: batch.dayKey,
    })),
  );
}

describe("the replay pays the first of a variant to the EARLIER game", () => {
  it("pays it once, on the first of two games of the same variant", () => {
    const games = [
      game({ blackMemberId: "a", playedAt: AT("2026-02-01T00:00:00Z") }),
      game({ blackMemberId: "a", playedAt: AT("2026-02-02T00:00:00Z") }),
    ];
    const made = plan({ members: [member("a")], games });
    expect(countOf(made, "a", XP_EVENTS.firstOfVariant)).toBe(1);
    expect(paidOn(made, "a", XP_EVENTS.firstOfVariant)).toEqual([games[0].id]);
    expect(countOf(made, "a", XP_EVENTS.firstGameEver)).toBe(1);
  });

  it("moves to the other game when the games arrive in the other order", () => {
    /* THE PAIR. Same two games, swapped, and the award follows the order — a
       backfill that summed instead of replaying would pass the case above and
       fail this one. */
    const first = game({ blackMemberId: "a", variant: "renju", playedAt: AT("2026-02-01T00:00:00Z") });
    const second = game({ blackMemberId: "a", variant: "renju", playedAt: AT("2026-02-02T00:00:00Z") });
    const forwards = plan({ members: [member("a")], games: [first, second] });
    const backwards = plan({ members: [member("a")], games: [second, first] });
    expect(paidOn(forwards, "a", XP_EVENTS.firstOfVariant)).toEqual([first.id]);
    expect(paidOn(backwards, "a", XP_EVENTS.firstOfVariant)).toEqual([second.id]);
  });

  it("pays a family once across two games in it, and the earlier one gets it", () => {
    const [family] = GAME_FAMILIES;
    const [one, two] = family.games;
    const games = [
      game({ blackMemberId: "a", variant: one, playedAt: AT("2026-02-01T00:00:00Z") }),
      game({ blackMemberId: "a", variant: two, playedAt: AT("2026-02-02T00:00:00Z") }),
    ];
    const made = plan({ members: [member("a")], games });
    expect(countOf(made, "a", XP_EVENTS.firstOfVariant)).toBe(2);
    expect(countOf(made, "a", XP_EVENTS.firstOfFamily)).toBe(1);
    expect(paidOn(made, "a", XP_EVENTS.firstOfFamily)).toEqual([games[0].id]);
  });

  it("pays nothing for a variant this deploy cannot name, and does not crash", () => {
    const made = plan({
      members: [member("a")],
      games: [game({ blackMemberId: "a", variant: "a-game-we-retired", playedAt: AT(WED) })],
    });
    expect(typesFor(made, "a")).not.toContain(XP_EVENTS.firstOfVariant);
    expect(typesFor(made, "a")).not.toContain(XP_EVENTS.firstOfFamily);
    /* The finish still pays: the game happened whatever it was called. */
    expect(typesFor(made, "a")).toContain(XP_EVENTS.gameFinished);
  });
});

describe("the replay reaches a win streak on the game that completes it", () => {
  it("pays winStreak3 on the third win and not before", () => {
    const games = [
      beat("a", "b", "2026-02-01T00:00:00Z"),
      beat("a", "b", "2026-02-02T00:00:00Z"),
      beat("a", "b", "2026-02-03T00:00:00Z"),
    ];
    const made = plan({ members: [member("a"), member("b")], games });
    expect(countOf(made, "a", XP_EVENTS.winStreak3)).toBe(1);
    expect(paidOn(made, "a", XP_EVENTS.winStreak3)).toEqual([games[2].id]);
    expect(countOf(made, "a", XP_EVENTS.winStreak5)).toBe(0);
  });

  it("does not pay it when a loss sits in the middle of three wins", () => {
    /* THE PAIR again: the same three wins, one extra game between them, and the
       run never reaches three. `extendStreak` is what decides that, imported. */
    const made = plan({
      members: [member("a"), member("b")],
      games: [
        beat("a", "b", "2026-02-01T00:00:00Z"),
        beat("a", "b", "2026-02-02T00:00:00Z"),
        beat("b", "a", "2026-02-03T00:00:00Z"),
        beat("a", "b", "2026-02-04T00:00:00Z"),
      ],
    });
    expect(countOf(made, "a", XP_EVENTS.winStreak3)).toBe(0);
  });

  it("pays three and then five, each on its own game, and nothing at four", () => {
    const games = [1, 2, 3, 4, 5].map((day) => beat("a", "b", `2026-02-0${day}T00:00:00Z`));
    const made = plan({ members: [member("a"), member("b")], games });
    expect(paidOn(made, "a", XP_EVENTS.winStreak3)).toEqual([games[2].id]);
    expect(paidOn(made, "a", XP_EVENTS.winStreak5)).toEqual([games[4].id]);
    expect(countOf(made, "a", XP_EVENTS.winStreak10)).toBe(0);
  });

  it("pays a second run of three, because the subject is the game", () => {
    const wins = [1, 2, 3].map((day) => beat("a", "b", `2026-02-0${day}T00:00:00Z`));
    const broken = beat("b", "a", "2026-02-04T00:00:00Z");
    const again = [5, 6, 7].map((day) => beat("a", "b", `2026-02-0${day}T00:00:00Z`));
    const made = plan({ members: [member("a"), member("b")], games: [...wins, broken, ...again] });
    expect(countOf(made, "a", XP_EVENTS.winStreak3)).toBe(2);
  });
});

describe("the replay pays a turn-around only after the loss that made it one", () => {
  it("pays revengeWin on a win that follows a loss to the same person at the same game", () => {
    const games = [beat("b", "a", "2026-02-01T00:00:00Z"), beat("a", "b", "2026-02-02T00:00:00Z")];
    const made = plan({ members: [member("a"), member("b")], games });
    expect(paidOn(made, "a", XP_EVENTS.revengeWin)).toEqual([games[1].id]);
    expect(awardsFor(made, "a").find((one) => one.type === XP_EVENTS.revengeWin)?.subject).toBe(
      "b:freestyle",
    );
    /* And B, who lost the second one, is not owed a turn-around for the first. */
    expect(countOf(made, "b", XP_EVENTS.revengeWin)).toBe(0);
  });

  it("gives it to the OTHER player when the same two games arrive the other way round", () => {
    /* THE PAIR, and the sharpest of them: the same two results, swapped, and the
       turn-around changes hands. Whoever lost first is the one who turned it
       around — which is exactly the fact a backfill that summed the games could
       not have known, and it is why this is a replay. */
    const games = [beat("a", "b", "2026-02-01T00:00:00Z"), beat("b", "a", "2026-02-02T00:00:00Z")];
    const made = plan({ members: [member("a"), member("b")], games });
    expect(countOf(made, "a", XP_EVENTS.revengeWin)).toBe(0);
    expect(paidOn(made, "b", XP_EVENTS.revengeWin)).toEqual([games[1].id]);
  });

  it("does not carry a rivalry across games — a loss at one is not avenged at another", () => {
    const made = plan({
      members: [member("a"), member("b")],
      games: [
        beat("b", "a", "2026-02-01T00:00:00Z", { variant: "freestyle" }),
        beat("a", "b", "2026-02-02T00:00:00Z", { variant: "renju" }),
      ],
    });
    expect(countOf(made, "a", XP_EVENTS.revengeWin)).toBe(0);
  });

  it("does not carry it across people either", () => {
    const made = plan({
      members: [member("a"), member("b"), member("c")],
      games: [
        beat("c", "a", "2026-02-01T00:00:00Z"),
        beat("a", "b", "2026-02-02T00:00:00Z"),
      ],
    });
    expect(countOf(made, "a", XP_EVENTS.revengeWin)).toBe(0);
  });

  it("pays it once per rivalry however many later wins there are", () => {
    const made = plan({
      members: [member("a"), member("b")],
      games: [
        beat("b", "a", "2026-02-01T00:00:00Z"),
        beat("a", "b", "2026-02-02T00:00:00Z"),
        beat("a", "b", "2026-02-03T00:00:00Z"),
      ],
    });
    expect(countOf(made, "a", XP_EVENTS.revengeWin)).toBe(1);
  });

  it("never pays a turn-around over a computer — that is what gradeBeaten is for", () => {
    const made = plan({
      members: [member("a")],
      games: [
        game({ blackMemberId: "kyu", whiteMemberId: "a", winner: "black", playedAt: AT("2026-02-01T00:00:00Z") }),
        game({ blackMemberId: "a", whiteMemberId: "kyu", winner: "black", playedAt: AT("2026-02-02T00:00:00Z") }),
      ],
    });
    expect(countOf(made, "a", XP_EVENTS.revengeWin)).toBe(0);
    expect(countOf(made, "a", XP_EVENTS.wonVsPerson)).toBe(0);
    expect(countOf(made, "a", XP_EVENTS.gradeBeaten)).toBe(1);
  });
});

describe("the replay reads the buddy list as it stood at each game", () => {
  const games = [beat("a", "b", "2026-02-05T00:00:00Z")];

  it("pays wonVsBuddy where the link was made before the game", () => {
    const made = plan({
      members: [member("a"), member("b")],
      games,
      buddies: [{ owner: "a", buddy: "b", since: AT("2026-02-01T00:00:00Z") }],
    });
    expect(countOf(made, "a", XP_EVENTS.wonVsBuddy)).toBe(1);
  });

  it("does not pay it where the link was made afterwards", () => {
    const made = plan({
      members: [member("a"), member("b")],
      games,
      buddies: [{ owner: "a", buddy: "b", since: AT("2026-03-01T00:00:00Z") }],
    });
    expect(countOf(made, "a", XP_EVENTS.wonVsBuddy)).toBe(0);
    /* Still a win over a person, which is the award that does not depend on it. */
    expect(countOf(made, "a", XP_EVENTS.wonVsPerson)).toBe(1);
  });

  it("pays nothing on a member with no address, because the question cannot be asked", () => {
    const made = plan({
      members: [member("a", { email: null }), member("b")],
      games,
      buddies: [{ owner: "a", buddy: "b", since: AT("2026-02-01T00:00:00Z") }],
    });
    expect(countOf(made, "a", XP_EVENTS.wonVsBuddy)).toBe(0);
  });

  it("reads the link in the right direction", () => {
    const made = plan({
      members: [member("a"), member("b")],
      games,
      buddies: [{ owner: "b", buddy: "a", since: AT("2026-02-01T00:00:00Z") }],
    });
    expect(countOf(made, "a", XP_EVENTS.wonVsBuddy)).toBe(0);
  });
});

describe("the replay completes a set on the game that completed it", () => {
  it("pays everyVariantPlayed once, on the last new game of the tour", () => {
    const games = RULE_VARIANT_LIST.map((variant, index) =>
      game({
        blackMemberId: "a",
        variant,
        /* One a day, so the day's allowance cannot silence a finish and confuse
           the thing being measured. */
        playedAt: new Date(Date.UTC(2026, 2, 1 + index)),
      }),
    );
    const made = plan({ members: [member("a")], games });
    expect(countOf(made, "a", XP_EVENTS.firstOfVariant)).toBe(RULE_VARIANT_LIST.length);
    expect(countOf(made, "a", XP_EVENTS.everyVariantPlayed)).toBe(1);
    expect(paidOn(made, "a", XP_EVENTS.everyVariantPlayed)).toEqual([games[games.length - 1].id]);
    expect(countOf(made, "a", XP_EVENTS.everyFamilyPlayed)).toBe(1);
  });

  it("counts the rows already in the ledger towards the set", () => {
    /* A member who met most of the games since 0.162.0 and meets the last one in
       the replay must still be paid the bonus. A replay counting only its own
       writes would never complete a set. */
    const last = RULE_VARIANT_LIST[RULE_VARIANT_LIST.length - 1];
    const held: HeldEvent[] = RULE_VARIANT_LIST.slice(0, -1).map((variant) => ({
      memberId: "a",
      type: XP_EVENTS.firstOfVariant,
      subject: variant,
      dayKey: "2026-01-01",
    }));
    const made = plan({
      members: [member("a")],
      games: [game({ blackMemberId: "a", variant: last, playedAt: AT(WED) })],
      held,
    });
    expect(countOf(made, "a", XP_EVENTS.everyVariantPlayed)).toBe(1);
  });

  it("pays everyGradeBeaten on the fifth grade and nothing for a specialist", () => {
    const grades = ["razryad", "kyu", "dan", "meijin", "guoshou"];
    const games = grades.map((tier, index) =>
      game({
        blackMemberId: "a",
        whiteMemberId: tier,
        winner: "black",
        playedAt: new Date(Date.UTC(2026, 2, 1 + index)),
      }),
    );
    const made = plan({ members: [member("a")], games });
    expect(countOf(made, "a", XP_EVENTS.gradeBeaten)).toBe(5);
    expect(countOf(made, "a", XP_EVENTS.everyGradeBeaten)).toBe(1);
    expect(paidOn(made, "a", XP_EVENTS.everyGradeBeaten)).toEqual([games[4].id]);

    const specialist = plan({
      members: [member("a")],
      games: [game({ blackMemberId: "a", whiteMemberId: "tamenoki", winner: "black", playedAt: AT(WED) })],
    });
    expect(countOf(specialist, "a", XP_EVENTS.specialistBeaten)).toBe(1);
    expect(countOf(specialist, "a", XP_EVENTS.gradeBeaten)).toBe(0);
    expect(countOf(specialist, "a", XP_EVENTS.everyGradeBeaten)).toBe(0);
  });
});

describe("the replay honours the day's allowance", () => {
  it("pays six finishes a day and silences the seventh whole", () => {
    const games = [1, 2, 3, 4, 5, 6, 7, 8].map((n) =>
      game({
        blackMemberId: "a",
        whiteMemberId: "b",
        winner: "black",
        /* Eight wins, one day, one variant. */
        playedAt: new Date(Date.UTC(2026, 1, 4, n)),
      }),
    );
    const made = plan({ members: [member("a"), member("b")], games });
    expect(countOf(made, "a", XP_EVENTS.gameFinished)).toBe(XP_EVENT_SPECS.gameFinished.cap);
    /* The riders go with the finish rather than paying on their own, which is
       what `ridesAllowance` means. */
    expect(countOf(made, "a", XP_EVENTS.gameWon)).toBe(6);
    expect(countOf(made, "a", XP_EVENTS.wonVsPerson)).toBe(6);
    /* And what cannot be farmed is not rationed: the once-ever awards still pay
       on the games the allowance silenced. */
    expect(countOf(made, "a", XP_EVENTS.firstGameEver)).toBe(1);
    expect(countOf(made, "a", XP_EVENTS.winStreak3)).toBe(1);
    expect(countOf(made, "a", XP_EVENTS.winStreak5)).toBe(1);
  });

  it("starts a new allowance on the next day, in the member's own zone", () => {
    /* Two games either side of midnight in Tokyo, which is the middle of the
       afternoon in UTC. The member in Tokyo has two days; the one in UTC has
       one — and neither is capped here, so what is measured is the KEY. */
    const games = [
      game({ blackMemberId: "tokyo", whiteMemberId: "utc", winner: "black", playedAt: AT("2026-02-04T14:00:00Z") }),
      game({ blackMemberId: "tokyo", whiteMemberId: "utc", winner: "black", playedAt: AT("2026-02-04T16:00:00Z") }),
    ];
    const made = plan({
      members: [member("tokyo", { timeZone: "Asia/Tokyo" }), member("utc")],
      games,
    });
    /* The GAME batches only: `joined` files under the day the member's row was
       made, which is a different date and not what is being measured here. */
    const days = (id: string) =>
      new Set(
        made.batches
          .filter((batch) => batch.memberId === id && batch.reason.kind === "game")
          .map((batch) => batch.dayKey),
      );
    expect(days("tokyo")).toEqual(new Set(["2026-02-04", "2026-02-05"]));
    expect(days("utc")).toEqual(new Set(["2026-02-04"]));
  });
});

describe("the replay pays the weekend once a weekend", () => {
  it("pays nothing on a Wednesday and something on a Saturday", () => {
    const weekday = plan({
      members: [member("a")],
      games: [game({ blackMemberId: "a", playedAt: AT(WED) })],
    });
    expect(countOf(weekday, "a", XP_EVENTS.weekendGame)).toBe(0);

    const weekend = plan({
      members: [member("a")],
      games: [game({ blackMemberId: "a", playedAt: AT(SAT) })],
    });
    expect(countOf(weekend, "a", XP_EVENTS.weekendGame)).toBe(1);
  });

  it("pays once for a Saturday and the Sunday after it, because the subject is the week", () => {
    const made = plan({
      members: [member("a")],
      games: [
        game({ blackMemberId: "a", playedAt: AT(SAT) }),
        game({ blackMemberId: "a", playedAt: AT(SUN) }),
      ],
    });
    expect(countOf(made, "a", XP_EVENTS.weekendGame)).toBe(1);
  });
});

describe("the replay pays nobody it should not", () => {
  it("pays a computer player nothing at all, joined included", () => {
    const made = plan({
      members: [member("a"), member("kyu", { botTier: "kyu" })],
      games: [beat("kyu", "a", "2026-02-01T00:00:00Z")],
    });
    expect(made.batches.filter((batch) => batch.memberId === "kyu")).toEqual([]);
    expect(made.perMember.has("kyu")).toBe(false);
  });

  it("pays nothing for a seat bound to an id no member row answers to", () => {
    const made = plan({
      members: [member("a")],
      games: [beat("ghost", "a", "2026-02-01T00:00:00Z")],
    });
    expect(made.batches.every((batch) => batch.memberId === "a")).toBe(true);
  });

  it("pays a self-game once, and not for beating a person", () => {
    const made = plan({
      members: [member("a")],
      games: [
        game({ blackMemberId: "a", whiteMemberId: "a", winner: "black", playedAt: AT(WED) }),
      ],
    });
    expect(countOf(made, "a", XP_EVENTS.gameFinished)).toBe(1);
    expect(countOf(made, "a", XP_EVENTS.gameWon)).toBe(1);
    expect(countOf(made, "a", XP_EVENTS.wonVsPerson)).toBe(0);
  });

  it("pays nothing at all for a game whose result cannot be read", () => {
    const made = plan({
      members: [member("a")],
      games: [game({ blackMemberId: "a", winner: "purple", playedAt: AT(WED) })],
    });
    expect(made.batches.filter((batch) => batch.reason.kind === "game")).toEqual([]);
  });

  it("pays joined once per person, at the moment their row was made", () => {
    const made = plan({ members: [member("a", { createdAt: AT(WED) })] });
    expect(made.batches).toHaveLength(1);
    expect(made.batches[0].reason).toEqual({ kind: "joined" });
    expect(made.batches[0].at).toEqual(AT(WED));
    expect(made.points).toBe(XP_EVENT_SPECS.joined.points);
  });

  it("puts joined before a member's games when their row is the older thing", () => {
    const made = plan({
      members: [member("a", { createdAt: AT("2026-01-01T00:00:00Z") })],
      games: [game({ blackMemberId: "a", playedAt: AT(WED) })],
    });
    expect(made.batches[0].reason.kind).toBe("joined");
  });
});

describe("the replay is idempotent, and the plan says so before a write does", () => {
  const world = {
    members: [member("a"), member("b")],
    games: [
      beat("a", "b", "2026-02-01T00:00:00Z"),
      beat("b", "a", "2026-02-02T00:00:00Z"),
      beat("a", "b", "2026-02-03T00:00:00Z", { variant: "renju", moveCount: 80 }),
      game({ blackMemberId: "a", whiteMemberId: "kyu", winner: "black", playedAt: AT(SAT) }),
    ],
  };

  it("plans nothing the second time over its own writes", () => {
    const first = plan(world);
    expect(first.batches.length).toBeGreaterThan(0);
    expect(first.points).toBeGreaterThan(0);

    const second = plan({ ...world, held: asHeld(first) });
    expect(second.batches).toEqual([]);
    expect(second.points).toBe(0);
    expect(second.events).toBe(0);
  });

  it("plans only the difference when part of the ledger is already there", () => {
    const first = plan(world);
    const held = asHeld(first).filter((row) => row.type !== XP_EVENTS.gameFinished);
    const again = plan({ ...world, held });
    expect(new Set(typesFor(again, "a"))).toEqual(new Set([XP_EVENTS.gameFinished]));
  });

  it("prices every award at the catalogue's price, and the whole is the sum of its parts", () => {
    const made = plan(world);
    for (const batch of made.batches) {
      expect(batch.points).toBe(batch.paying.reduce((sum, award) => sum + award.points, 0));
      for (const award of batch.paying) expect(award.points).toBe(XP_EVENT_SPECS[award.type].points);
    }
    expect([...made.perMember.values()].reduce((sum, one) => sum + one.points, 0)).toBe(made.points);
    expect([...made.byType.values()].reduce((sum, one) => sum + one.points, 0)).toBe(made.points);
  });

  it("never plans an award it has said it does not replay", () => {
    const made = plan(world);
    for (const type of made.byType.keys()) {
      expect(XP_BACKFILL_COVERAGE[type].replayed, `${type} was paid but is listed as skipped`).toBe(true);
    }
  });
});

describe("the one check the design named", () => {
  it("says nothing where every total equals its own ledger", () => {
    const disagreements = ledgerDisagreements(
      [
        { id: "a", name: "A", xp: 60 },
        { id: "b", name: "B", xp: 0 },
      ],
      new Map([["a", 60]]),
    );
    expect(disagreements).toEqual([]);
  });

  it("names a member holding XP their ledger cannot account for", () => {
    /* The shape this refuses to write over: a total with nothing behind it, and
       nought is the right reading of an empty ledger rather than "unknown". */
    expect(ledgerDisagreements([{ id: "a", name: "A", xp: 40 }], new Map())).toEqual([
      { memberId: "a", name: "A", xp: 40, ledger: 0 },
    ]);
  });

  it("names a member whose ledger holds more than their total", () => {
    expect(
      ledgerDisagreements([{ id: "a", name: "A", xp: 10 }], new Map([["a", 85]])),
    ).toEqual([{ memberId: "a", name: "A", xp: 10, ledger: 85 }]);
  });

  it("names every one of them rather than the first", () => {
    const disagreements = ledgerDisagreements(
      [
        { id: "a", name: "A", xp: 1 },
        { id: "b", name: "B", xp: 2 },
        { id: "c", name: "C", xp: 3 },
      ],
      new Map([["c", 3]]),
    );
    expect(disagreements.map((one) => one.memberId)).toEqual(["a", "b"]);
  });
});

describe("the coverage table", () => {
  it("names every award in the catalogue, and says why for each refusal", () => {
    for (const type of Object.keys(XP_EVENT_SPECS) as XpEventType[]) {
      const row = XP_BACKFILL_COVERAGE[type];
      expect(row, `${type} is not in the coverage table`).toBeDefined();
      if (row.replayed) expect(row.from.length).toBeGreaterThan(10);
      else expect(row.why.length).toBeGreaterThan(30);
    }
  });

  it("refuses to claim it replays what nothing pays live", () => {
    /* `comeback` is priced and deliberately unwired. A backfill paying it would
       put points in the ledger the running site does not award. */
    expect(XP_BACKFILL_COVERAGE.comeback.replayed).toBe(false);
  });
});
