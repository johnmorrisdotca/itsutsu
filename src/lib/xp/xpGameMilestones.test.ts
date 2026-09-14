import { describe, expect, it, vi } from "vitest";

import { playedSides } from "@/lib/rating/playedRun";
import { STREAK_KINDS, type StreakOutcome } from "@/lib/rating/streak";

/*
 * The count a milestone at one game is read against, checked against the one
 * definition of whose game a game is: `playedSides`.
 *
 * `sameResultsWhere` restates that definition as a where clause, because a count
 * cannot call a function — and a restatement nobody checks is a second
 * authority. So the where is evaluated here over rows by the same rules Postgres
 * applies (a null seat equals nothing, and `not` never matches a null), and the
 * answer is compared with what `playedSides` says about the same rows.
 */

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
const { sameResultsWhere } = await import("./xpGameServer");

type Row = { status: string; result: string; variant: string; blackMemberId: string | null; whiteMemberId: string | null; winner: string | null };

/** A where clause of the shape `sameResultsWhere` builds, evaluated as SQL would. */
function matches(where: Record<string, unknown>, row: Row): boolean {
  return Object.entries(where).every(([key, want]) => {
    if (key === "OR") return (want as Record<string, unknown>[]).some((one) => matches(one, row));
    const have = row[key as keyof Row];
    if (want !== null && typeof want === "object") {
      const not = (want as { not: unknown }).not;
      return have !== null && have !== not;
    }
    return want === null ? have === null : have === want;
  });
}

const ME = "m-me";
const games: Row[] = [
  { status: "finished", result: "black", variant: "reversi", blackMemberId: ME, whiteMemberId: "m-you", winner: "black" },
  { status: "finished", result: "white", variant: "reversi", blackMemberId: "m-you", whiteMemberId: ME, winner: "white" },
  // White seat mine, black seat unbound: mine, and the null must not hide it.
  { status: "finished", result: "white", variant: "reversi", blackMemberId: null, whiteMemberId: ME, winner: "white" },
  // A game against myself, won by white: answered once, from black, as a loss.
  { status: "finished", result: "white", variant: "reversi", blackMemberId: ME, whiteMemberId: ME, winner: "white" },
  { status: "finished", result: "draw", variant: "reversi", blackMemberId: ME, whiteMemberId: "m-you", winner: null },
  { status: "finished", result: "draw", variant: "reversi", blackMemberId: ME, whiteMemberId: ME, winner: null },
  // Not counted: another game, an abandoned row, a game still being played.
  { status: "finished", result: "black", variant: "renju", blackMemberId: ME, whiteMemberId: "m-you", winner: "black" },
  { status: "finished", result: "abandoned", variant: "reversi", blackMemberId: ME, whiteMemberId: "m-you", winner: null },
  { status: "active", result: "abandoned", variant: "reversi", blackMemberId: ME, whiteMemberId: "m-you", winner: null },
];

/** What `playedSides` says: the count of games at reversi, decided and not abandoned, where I had this outcome. */
function byPlayedSides(outcome: StreakOutcome): number {
  return games
    .filter((row) => row.status === "finished" && row.result !== "abandoned" && row.variant === "reversi")
    .filter((row) => playedSides(row).some((side) => side.memberId === ME && side.outcome === outcome)).length;
}

describe("the count behind a milestone at one game", () => {
  it.each([STREAK_KINDS.win, STREAK_KINDS.loss, STREAK_KINDS.draw])("counts %s exactly as playedSides decides it", (outcome) => {
    const where = sameResultsWhere(ME, "reversi", outcome) as unknown as Record<string, unknown>;
    const counted = games.filter((row) => {
      const { result, ...rest } = where as { result: { not: string } } & Record<string, unknown>;
      return row.result !== result.not && matches(rest, row);
    }).length;
    expect(counted).toBe(byPlayedSides(outcome));
  });

  it("finds the counts the fixture was built to have", () => {
    expect([byPlayedSides(STREAK_KINDS.win), byPlayedSides(STREAK_KINDS.loss), byPlayedSides(STREAK_KINDS.draw)]).toEqual([3, 1, 2]);
  });
});
