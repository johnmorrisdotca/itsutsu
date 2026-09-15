import "server-only";

import { pairWhere } from "@/lib/history/gameHistoryClauses";
import { NOT_A_REFUSED_OFFER } from "@/lib/history/offers";
import { prisma } from "@/lib/prisma";
import { levelShown } from "@/lib/xp/levelShown";
import { xpForBadge } from "@/lib/xp/xpScope";

import { outcomeOfGame, rivalryFrom, rivalryLine } from "./rivalry";
import type { RivalryMoment, RivalrySeat, RivalryTally, RivalryTallyShown, RivalryView } from "./rivalry.types";

/**
 * THE ONE READ BEHIND A RIVALRY SCOREBOARD.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT IT COSTS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Two queries, in parallel, once per page render, and nothing on a timer:
 *
 *  - **The pair's games**: the finished, decided games with one of these two
 *    member ids on each seat (`pairWhere`, the record's own definition of a
 *    pair), six narrow columns a row. Postgres answers the two arms of the OR
 *    from the existing single-column `Game_blackMemberId_idx` and
 *    `Game_whiteMemberId_idx` — each arm finds one member's games on one colour
 *    and filters them for the other — so no new index is needed. A composite
 *    (blackMemberId, whiteMemberId) would make each arm exact rather than
 *    filtered, and is the thing to add if a program's rivalry ever has tens of
 *    thousands of games behind a single seat.
 *
 *    Rows and not a GROUP BY, deliberately: the score could be an aggregate,
 *    but the run and the last date need the games in order, and two reads that
 *    each defined "their games" could disagree. One read, and the pure module
 *    (`rivalry.ts`) does all the counting from it, so the counts, the streak and
 *    the date are about the same set of games.
 *
 *  - **The two members**: by primary key, for the names and the level badges.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT IT WILL NOT SAY
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Null for an empty id, one member twice, or an id naming nobody. The panel
 * draws nothing for null — a seat with no account behind it has no rivalry, and
 * an empty record there would be a claim that two people had never played.
 */
export async function fetchRivalryView(input: {
  /** The member whose side is read, and who is "you" when they are the reader. */
  one: string;
  other: string;
  readerId: string | null;
  variant?: string | null;
  moment: RivalryMoment;
  /** The game just filed, for the `after` moment. */
  thisGameId?: string | null;
  now?: Date;
}): Promise<RivalryView | null> {
  const { one, other } = input;
  if (one === "" || other === "" || one === other) return null;

  const [games, members] = await Promise.all([
    prisma.game.findMany({
      where: {
        AND: [
          { status: "finished" },
          NOT_A_REFUSED_OFFER,
          { result: { not: "abandoned" } },
          pairWhere({ member: one, against: other }),
        ],
      },
      select: { id: true, playedAt: true, variant: true, status: true, result: true, blackMemberId: true, whiteMemberId: true },
    }),
    prisma.member.findMany({
      where: { id: { in: [one, other] } },
      /* Both totals, because the badge's one rule — `xpForBadge` — chooses between them. */
      select: { id: true, name: true, xp: true, xpEverywhere: true },
    }),
  ]);

  /*
   * A program stands where its total puts it, like anybody (0.182.0): the level
   * is read from the total alone, so a rivalry with Dan badges Dan too. And the
   * total is the badge's, decided in one place — `xpForBadge`, which counts a
   * kept record's credit from another site — so the badge above a pair's games
   * is the level the same player wears on every other page.
   */
  const seat = (id: string): RivalrySeat | null => {
    const row = members.find((member) => member.id === id);
    if (row === undefined) return null;
    return { memberId: row.id, name: row.name, level: levelShown({ xp: xpForBadge(row) }) };
  };
  const first = seat(one);
  const second = seat(other);
  if (first === null || second === null) return null;

  const rivalry = rivalryFrom({ one, other, variant: input.variant, games });
  if (rivalry === null) return null;

  const filed = input.thisGameId ? games.find((game) => game.id === input.thisGameId) : undefined;
  const line = rivalryLine(rivalry, {
    moment: input.moment,
    now: input.now ?? new Date(),
    thisGame: filed === undefined ? null : outcomeOfGame(filed, one, other),
  });

  return {
    one: first,
    other: second,
    readerIsOne: input.readerId === one,
    all: shown(rivalry.all),
    game: rivalry.game === null ? null : { variant: rivalry.game.variant, tally: shown(rivalry.game.tally) },
    line,
  };
}

/** A tally with its date as a string, to cross into the browser. */
function shown(tally: RivalryTally): RivalryTallyShown {
  return { ...tally, lastPlayedAt: tally.lastPlayedAt === null ? null : tally.lastPlayedAt.toISOString() };
}
