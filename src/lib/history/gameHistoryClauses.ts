import type { Prisma } from "@prisma/client";

import { GAME_VERDICT_ANY } from "./gameHistory.constants";
import type { GameOutcome, GamePair } from "./gameHistory.types";

/**
 * The clauses that ask WHOSE a game was: a player by name and id, a pair of
 * members, an outcome from one side, a pool, a verdict.
 *
 * `buildGameWhere` in `gameHistoryQuery.ts` puts them together; each is here
 * rather than inline there because each is a definition another page leans on
 * — the rivalry count reads `pairWhere`, a filter chip reads
 * `outcomeNeedsPlayer` — and a definition is easier to keep single when it has
 * a module of its own. Pure, like the query: the member ids a clause needs are
 * handed in, never looked up.
 */
/**
 * "This seat is that player" — asked of the NAME and of the member IDS the name
 * belongs to.
 *
 * WHY BOTH, and why the ids are the half that was missing. A game stores the
 * names as they were played, so a filter matching only the name loses every game
 * somebody played before renaming. `fetchPlayerRecord` learned that already and
 * counts a person's games by member id OR folded name; this filter did not, so
 * the two had different ideas of whose games those were. On production today her
 * record counts five games and `/history?player=Hanachan` answers with none of
 * them — the number right, the link it promised empty, which is the fault a count
 * that cannot be opened always is.
 *
 * It is the same disjunction the record uses, so a count and the page it links to
 * are narrowed by one definition of a person rather than two.
 *
 * THE NAME STAYS IN THE OR rather than being replaced by the ids. Most seats here
 * have no account behind them — a name typed in at one screen, a record kept from
 * another site — and those games are found by the only name they have.
 *
 * An empty `named` is a real answer and not "not looked up yet": a name nobody
 * holds an account under resolves to no ids, and the filter is then the name
 * alone, exactly as it has always been.
 */
export function seatIs(
  seat: "black" | "white",
  player: string,
  named: readonly string[],
): Prisma.GameWhereInput {
  const byName: Prisma.GameWhereInput =
    seat === "black"
      ? { blackName: { equals: player, mode: "insensitive" } }
      : { whiteName: { equals: player, mode: "insensitive" } };
  if (named.length === 0) return byName;
  const byId: Prisma.GameWhereInput =
    seat === "black"
      ? { blackMemberId: { in: [...named] } }
      : { whiteMemberId: { in: [...named] } };
  return { OR: [byName, byId] };
}

/**
 * THE GAMES BETWEEN TWO MEMBERS, by id on both seats, either way round.
 *
 * The one definition of a pair on this site. The record's `?member=A&against=B`
 * narrows by it, and the rivalry scoreboard (`rivalryRead.ts`) counts by it, so
 * "4 – 4" and the list that number links to are the same games and cannot come
 * apart. By id and never by name: a seat that is only a typed name is nobody's
 * rivalry, and matching it by name would count a stranger at a kitchen table
 * who happened to type "Dan".
 */
export function pairWhere(pair: GamePair): Prisma.GameWhereInput {
  return {
    OR: [
      { blackMemberId: pair.member, whiteMemberId: pair.against },
      { blackMemberId: pair.against, whiteMemberId: pair.member },
    ],
  };
}

/**
 * An outcome from `member`'s side of a pair, by id — the pair's own version of
 * `outcomeWhere`, so "the games A won against B" asks the seats rather than a
 * name. `decided` and `drawn` are the same question with or without a pair.
 */
export function pairOutcomeWhere(outcome: GameOutcome, pair: GamePair): Prisma.GameWhereInput {
  if (outcome === "decided") return { result: { not: "abandoned" } };
  if (outcome === "drawn") return { result: "draw" };
  const won = outcome === "won";
  return {
    OR: [
      { blackMemberId: pair.member, whiteMemberId: pair.against, result: won ? "black" : "white" },
      { blackMemberId: pair.against, whiteMemberId: pair.member, result: won ? "white" : "black" },
    ],
  };
}

/**
 * Whether `outcome` can be judged without a name to read it against.
 *
 * `decided` and `drawn` are questions about the RESULT alone — did it reach
 * one, was it a draw — and answer themselves with no player in sight. `won`
 * and `lost` are the other two: a colour won, but whether that was a win
 * depends on which colour somebody was, so they are unanswerable without a
 * name. `outcomeWhere` below is the query's own use of this; a filter chip
 * reads it too (`narrowings.ts`), so the two cannot drift into disagreeing
 * about which chip is honest to show.
 *
 * Takes a plain string rather than `GameOutcome` so a chip can ask it about
 * whatever an address happens to hold, valid or not — an outcome this module
 * does not recognise needs a player exactly as much as one that does: there
 * is no reading of it that is answerable without one.
 */
export function outcomeNeedsPlayer(outcome: string): boolean {
  return outcome !== "decided" && outcome !== "drawn";
}

/**
 * An outcome from one player's side of the board.
 *
 * The stored result names a colour, so "their losses" is two questions at
 * once: which colour won, and which colour they were. Both are asked here, in
 * one place, because a page that worked it out for itself would be a second
 * definition of somebody's record — and the two would disagree the first time
 * one of them forgot that an abandoned game is not a loss.
 *
 * Without a name to read it against, `won` and `lost` are unanswerable rather
 * than empty, so they are dropped: a filter nobody can honour should leave the
 * record as it was, not quietly return nothing.
 */
export function outcomeWhere(
  outcome: GameOutcome,
  player: string | null,
  named: readonly string[],
): Prisma.GameWhereInput | null {
  if (outcome === "decided") return { result: { not: "abandoned" } };
  if (outcome === "drawn") return { result: "draw" };
  // outcomeNeedsPlayer(outcome) is always true from here on — decided and
  // drawn, the only outcomes it says otherwise about, have already returned.
  if (player === null) return null;

  const asBlack = seatIs("black", player, named);
  const asWhite = seatIs("white", player, named);
  const theirs = outcome === "won" ? "black" : "white";
  const others = outcome === "won" ? "white" : "black";
  return {
    OR: [
      { AND: [asBlack, { result: theirs }] },
      { AND: [asWhite, { result: others }] },
    ],
  };
}

/**
 * Which games one of the two ladders was counting.
 *
 * A game is in the computer pool when either seat was a program, so the
 * question is about who sat down rather than about the game. The ids are
 * handed in because they come from the members table and this module is pure;
 * without them the filter is dropped rather than guessed at, which leaves the
 * record as it was instead of quietly answering a different question.
 *
 * The nulls are written out on purpose: a seat nobody holds an account for has
 * no id, and `NOT (id IN (…))` is not true of NULL in SQL — leaving it implied
 * would drop every game played under a typed-in name from the people pool,
 * which is most of the record.
 */
export function poolWhere(pool: string, computerSeats: readonly string[]): Prisma.GameWhereInput | null {
  const ids = [...computerSeats];
  if (pool === "computer") {
    if (ids.length === 0) return { id: { in: [] } };
    return { OR: [{ blackMemberId: { in: ids } }, { whiteMemberId: { in: ids } }] };
  }
  if (ids.length === 0) return null;
  return {
    AND: [
      { OR: [{ blackMemberId: null }, { blackMemberId: { notIn: ids } }] },
      { OR: [{ whiteMemberId: null }, { whiteMemberId: { notIn: ids } }] },
    ],
  };
}

/**
 * What one player thought of their own play.
 *
 * Kept per seat, so it is the same two questions at once an outcome is: which
 * seat they were, and what that seat said. Unanswerable without a name, and
 * dropped rather than answered emptily for the same reason.
 *
 * `fetchVerdictTally` counts by member id, and this read by NAME — the seam that
 * comment used to describe, and it has been closed rather than described: `seatIs`
 * asks the ids as well, so a game somebody played under an older name is on both
 * sides of the comparison instead of only the tally's.
 */
export function verdictWhere(
  verdict: string,
  player: string | null,
  named: readonly string[],
): Prisma.GameWhereInput | null {
  if (player === null) return null;
  const said = verdict === GAME_VERDICT_ANY ? { not: null } : verdict;
  return {
    OR: [
      { AND: [seatIs("black", player, named), { blackVerdict: said }] },
      { AND: [seatIs("white", player, named), { whiteVerdict: said }] },
    ],
  };
}
