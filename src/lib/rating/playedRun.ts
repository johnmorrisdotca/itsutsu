import "server-only";

import { prisma } from "@/lib/prisma";
import { awardFinishedGameXp } from "@/lib/xp/xpGameServer";
import { MEMBER_STREAK_SCOPES, streakWrite, type StreakOutcome } from "./streak";
import { outcomeFor } from "./pools";

/**
 * The run over every finished game a member has played here.
 *
 * `recordResult` keeps the three RATED runs on `Player`, and is called only
 * when the row says rated. This keeps the fourth — the one the PLAYED column
 * beside it is counting — and is called wherever a game is DECIDED, whether or
 * not anything rated it. An all-games run maintained only on rated games would
 * be a rated run wearing a different name, which is the one way this can be
 * wrong while looking right.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE DEFINITION IS `fetchPlayedTallies`, AND NOT A SECOND VERSION OF IT
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `history/playerRecord.ts` has the number this run will be printed next to.
 * If the two are about sets of games that differ by even one game, the row
 * contradicts itself in a way a reader can see — which is worse than the dash
 * this replaces. So the three rules that decide the set are stated once, here,
 * and `playedRun.test.ts` pins them against the same games that function
 * counts:
 *
 * - **A game counts when it is finished and its result is not `abandoned`.**
 *   Called off before the first stone is not a result; nothing is recorded.
 * - **BY MEMBER ID ONLY, never by name.** Production carries a decided game
 *   between "Meijin" and "Hidemasa Tamenoki" with both seats' ids null,
 *   recorded before those member rows existed. A name fallback pulls it into a
 *   total it was never bound to — 60 where the count says 59.
 * - **A game against yourself is one game, counted from the black seat.** Both
 *   seats carry the one id, and a naive pass over the seats counts it twice.
 *   John has played himself; that game is why his record reads 14 played.
 *
 * Nothing here tests `rated`, `isHotSeat` or `isRateable`. None of those is
 * part of what PLAYED counts, and adding one would narrow this set away from
 * the count it has to match. A hot-seat game whose creator was signed in is a
 * game that member played, and the column says so.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT IT COSTS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * One read of at most two rows by primary key, and one transaction of at most
 * two small updates — per finished GAME, never per move, and nothing at all
 * for a game neither seat was bound to. No page reads a game to show this: the
 * members list already fetches every `Member` row it lists, so the run comes
 * back on rows that were being read anyway, which is the whole reason it is a
 * column. See `Player.peopleStreakKind`, which says it at length.
 *
 * The read is there because the run is extended by `streakWrite` — the one
 * implementation of "one more result" on the site — rather than by a second
 * copy of that rule written in SQL. It inherits `recordResult`'s race with it:
 * two games for one member finishing in the same instant can both read the
 * same run and one increment is lost. That is a property of every stored run
 * here, not a new one, and it is the honest trade for having the rule in one
 * place. The backfill puts such a row right.
 */

/**
 * One decided game, as much of it as this needs — and `winner` as loosely as
 * the column really is.
 *
 * `Game.winner` is a plain string, so a caller reading a stored row cannot hand
 * over anything narrower without asserting something about it. Taking it wide
 * and refusing what cannot be read is the honest shape; narrowing it here would
 * only move the guess to whoever calls.
 */
export type DecidedSeats = {
  blackMemberId: string | null;
  whiteMemberId: string | null;
  winner: string | null;
};

/**
 * Everything recording one takes — the seats, and the facts the ledger keys its
 * awards on.
 *
 * TWO TYPES RATHER THAN ONE, because two questions are being asked. `playedSides`
 * answers "whose run does this move, and which way", which needs the seats and
 * the result and nothing else — it is asked of rows read for other reasons, and
 * of a backfill's rows, and widening it would make every one of those callers
 * carry fields its answer does not depend on. `recordPlayed` answers "what does
 * this finished game do", which includes paying for it.
 */
export type DecidedGame = DecidedSeats & {
  /**
   * The game's own id.
   *
   * REQUIRED, though the streak columns do not need it, because the XP ledger
   * does: `gameFinished` and `gameWon` are keyed on it, which is what makes one
   * game pay once however many times an ending fires. Optional would mean a
   * caller that forgot it awarded with an empty subject — once ever, for the
   * first game a member ever finished, and never again. That is a silent wrong
   * answer rather than a missing one, so the compiler asks for it instead.
   */
  id: string;
  /**
   * What was played, for the tour's awards — a first game of a variant, and of
   * its family.
   *
   * A plain string because `Game.variant` is one, and checked in `xpGame.ts`
   * rather than asserted here. REQUIRED, like `id`, so the four endings each
   * hand it over: a default of freestyle would pay every member a first game of
   * gomoku for a game of Hex, which is a wrong answer rather than a missing one.
   */
  variant: string;
  /**
   * How many moves the finished game holds. See `longGame`.
   *
   * REQUIRED for the same reason, and it is the one field the callers cannot
   * spread off the row they read: `GAME_ROW` selects the move LIST and the
   * count is what the ending has just worked out. Asking for it explicitly is
   * what stops a caller passing the count from before its own last move.
   */
  moveCount: number;
};

/**
 * The winner, or a refusal.
 *
 * Null is a DRAW and means something; anything that is not a colour means the
 * row cannot be read, and that is not the same thing. `outcomeFor` would call
 * an unreadable value a loss for BOTH seats — a perfectly plausible pair of
 * results out of a row nothing understands — so it is never reached with one.
 * Undefined rather than a default, for the reason AGENTS.md gives: a rule that
 * cannot measure must not fire.
 *
 * Both databases hold only `black`, `white` and null today, checked on
 * 2026-09-11. This is what keeps that a fact rather than an assumption.
 */
function winnerOf(winner: string | null): "black" | "white" | null | undefined {
  if (winner === null) return null;
  if (winner === "black" || winner === "white") return winner;
  return undefined;
}

/** One member's half of one decided game. */
export type PlayedSide = { memberId: string; outcome: StreakOutcome };

/**
 * Whose run this game moves, and which way — the whole definition, as a pure
 * function so it can be checked against `fetchPlayedTallies` without a
 * database.
 *
 * An unbound seat contributes nothing: there is no row for a run to live on,
 * and the count beside it does not include the game either. A seat whose id
 * matches the other seat's is the same person twice, and is answered once from
 * black.
 */
export function playedSides(game: DecidedSeats): PlayedSide[] {
  const winner = winnerOf(game.winner);
  // A row whose result cannot be read moves nobody's run. See `winnerOf`.
  if (winner === undefined) return [];
  const sides: PlayedSide[] = [];
  if (game.blackMemberId !== null) {
    sides.push({ memberId: game.blackMemberId, outcome: outcomeFor(winner, "black") });
  }
  if (game.whiteMemberId !== null && game.whiteMemberId !== game.blackMemberId) {
    sides.push({ memberId: game.whiteMemberId, outcome: outcomeFor(winner, "white") });
  }
  return sides;
}

/**
 * Carries each bound seat's run forward by one result.
 *
 * Call it once, where a game has just been decided, having established that it
 * IS decided: this takes the seats and the winner and asks no question about
 * the status, because the four places a game ends have each already answered
 * it. A game filed as `abandoned` must not reach here.
 */
export async function recordPlayed(game: DecidedGame): Promise<void> {
  const sides = playedSides(game);
  if (sides.length === 0) return;

  const rows = await prisma.member.findMany({
    where: { id: { in: sides.map((side) => side.memberId) } },
    select: { id: true, playedStreakKind: true, playedStreakCount: true },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));

  const writes = sides.flatMap((side) => {
    const row = byId.get(side.memberId);
    // A seat bound to an id no member row answers to: there is nothing to
    // carry forward and nothing that would show it. Silence rather than an
    // upsert inventing a member.
    if (row === undefined) return [];
    return [
      prisma.member.update({
        where: { id: side.memberId },
        data: streakWrite(
          row as unknown as Record<string, unknown>,
          side.outcome,
          MEMBER_STREAK_SCOPES,
        ) as never,
      }),
    ];
  });
  if (writes.length === 0) return;
  await prisma.$transaction(writes);

  await awardGameXp(game, sides);
}

/**
 * What the finished game paid each bound seat.
 *
 * Here rather than in the four endings because this is already the one place a
 * decided game is seen exactly once per bound member id — which is precisely
 * what an XP award needs, and is the reason XP rides this rather than
 * `recordResult`. `recordResult` takes NAMES, bails on `!isRateable`, and is
 * called only `if (row.rated)`; XP is about playing, not about rating, so an
 * unrated hot-seat game pays it and a rating-ineligible name does not stop it.
 *
 * AFTER the streak transaction and outside it, on purpose. The run is the thing
 * this function exists to keep and the ledger is bookkeeping on top of it, so a
 * ledger failure must not roll the run back — and `awardXp` swallows its own
 * failures, so nothing here can throw at the ending that called it either.
 *
 * A loss pays too, for finishing: seeing a game through is the courtesy
 * correspondence play depends on, and a ladder that only pays winners is a
 * second rating. `XP_EVENT_SPECS.gameFinished.cap` is what stops somebody
 * hot-seating tic-tac-toe against themselves for an afternoon, and `gameWon`
 * rides that allowance so a game outside it is silent as a whole rather than
 * paying for being won but not for being finished.
 *
 * WHAT a game pays is `xpGame.ts`, pure and handed the facts; this passes the
 * row on and nothing more. The one thing it decides is which facts to pass: the
 * variant and the move count come off the row, and every other award the site
 * has for a finished game is derived from those and from the run this write is
 * already carrying forward.
 */
async function awardGameXp(game: DecidedGame, sides: readonly PlayedSide[]): Promise<void> {
  await awardFinishedGameXp(
    { id: game.id, variant: game.variant, moveCount: game.moveCount },
    sides.map((side) => ({ memberId: side.memberId, facts: { outcome: side.outcome } })),
  );
}
