import "server-only";

import type { Prisma } from "@prisma/client";

import { SETTLED_SELECT, settledPosition } from "@/lib/history/settledTurn";
import { prisma } from "@/lib/prisma";

/**
 * HOW MANY GAMES THE READER HAS GOING WITH EACH BUDDY, and how many of those
 * are waiting on the reader.
 *
 * ONE QUERY FOR THE WHOLE LIST, never one per row — the shape AGENTS.md names
 * outright. It reads the reader's own active games, which the twenty-game cap
 * bounds at twenty whatever else is on the site, and tallies them in memory by
 * who is in the other seat. A buddy list of forty people therefore costs the
 * same single read as a list of two.
 *
 * WHOSE MOVE IS READ, NEVER REPLAYED. `settledPosition` answers from the two
 * columns the writer of the last move left behind; a row that has none says
 * nothing rather than guessing, and is counted as a game going and not as a
 * game waiting. Replaying every game of every buddy to fill in a number beside
 * a name is exactly the per-request work this site does not do — and the list
 * of your turns is `/play`, which is one press away from every row here.
 */
export type GamesWith = {
  /** Games still running between the two of you. */
  going: number;
  /** Of those, the ones the record says are waiting on the reader. */
  yours: number;
};

/**
 * THE GAMES RUNNING BETWEEN TWO PEOPLE, as a `where` — the one definition of
 * the set a buddy row's "2 going" counts, and the set `/play?with=<them>`
 * lists. Both read this, so the number and the list cannot disagree: that is
 * the rule in AGENTS.md that a count must link to exactly what it counted,
 * kept by construction rather than by care.
 *
 * Running: the row is active. Between the two: one holds black and the
 * other white, either way round. An offer is not a game running, and a seat
 * nobody has taken is not a game with anybody.
 */
export function gamesBetween(memberId: string, other: string): Prisma.GameWhereInput {
  return {
    status: "active",
    OR: [
      { blackMemberId: memberId, whiteMemberId: other },
      { blackMemberId: other, whiteMemberId: memberId },
    ],
  };
}

export async function gamesWithEach(memberId: string): Promise<Map<string, GamesWith>> {
  const games = await prisma.game.findMany({
    where: { status: "active", OR: [{ blackMemberId: memberId }, { whiteMemberId: memberId }] },
    select: { blackMemberId: true, whiteMemberId: true, ...SETTLED_SELECT },
  });

  const by = new Map<string, GamesWith>();
  for (const game of games) {
    const mine = game.blackMemberId === memberId ? "black" : "white";
    const theirs = mine === "black" ? game.whiteMemberId : game.blackMemberId;
    // A seat nobody holds yet, or the reader on both — neither is a game with a buddy.
    if (theirs === null || theirs === memberId) continue;
    const position = settledPosition(game);
    const waiting = position !== null && position.running && position.toPlay === mine;
    const had = by.get(theirs) ?? { going: 0, yours: 0 };
    by.set(theirs, { going: had.going + 1, yours: had.yours + (waiting ? 1 : 0) });
  }
  return by;
}
