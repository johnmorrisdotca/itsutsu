import { STONES } from "@/lib/gomoku/gomoku.constants";
import { streakFrom, type StreakOutcome } from "@/lib/rating/streak";

import {
  RIVALRY_DAYS_IN_MONTH,
  RIVALRY_DAYS_IN_YEAR,
  RIVALRY_LONG_GAP_DAYS,
  RIVALRY_MOMENTS,
  RIVALRY_MS_IN_DAY,
  RIVALRY_STREAK_WORTH_NAMING,
} from "./rivalry.constants";
import type {
  Rivalry,
  RivalryGame,
  RivalryLine,
  RivalryLineContext,
  RivalryTally,
} from "./rivalry.types";

/**
 * TWO PEOPLE'S RECORD AGAINST EACH OTHER, AND THE ONE THING WORTH SAYING ABOUT IT.
 *
 * John, looking at two games of Ninuki-renju between himself and Dan: "It would
 * be good to see Rivalry stats... before and after a game... like 'You and Dan
 * have never played this before' or 'haven't played in 2 years...' or 'You've
 * lost to Dan 3 times in a row...' or 'You guys are tied 4-4'."
 *
 * Pure, the way the engine is: hand it the games and it answers, and nothing
 * here reads a request or a database. `rivalryRead.ts` is the one read that
 * feeds it, and the record's pair filter (`pairWhere` in `gameHistoryQuery.ts`)
 * is the same definition of "their games" — so a count on the scoreboard and the
 * list it links to are one set.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHOSE GAMES
 * ─────────────────────────────────────────────────────────────────────────
 *
 * BY MEMBER ID ON BOTH SEATS, and nothing else. A seat that is only a typed name
 * — two people at one screen, a seat taken from a scanned link with no account —
 * has no rivalry, because a name is not a person here: "Dan" typed into a game
 * at somebody's kitchen table is not the Dan on the ladder. So a missing id
 * answers NULL, which the panel draws as nothing at all, rather than an empty
 * record that would claim two people had never met.
 *
 * FINISHED AND DECIDED GAMES ONLY. An abandoned game is not a result (the
 * record's own "Won, lost or drawn" filter and every player tally leave it out),
 * and an unfinished one has no result yet. Counted here, either would make the
 * score disagree with the games behind it.
 */

/** How one game went for `one`, or null when it is not a result between the two. */
function outcomeFor(game: RivalryGame, one: string, other: string): StreakOutcome | null {
  if (game.status !== "finished" || game.result === "abandoned") return null;
  const oneSeat =
    game.blackMemberId === one && game.whiteMemberId === other
      ? STONES.black
      : game.whiteMemberId === one && game.blackMemberId === other
        ? STONES.white
        : null;
  if (oneSeat === null) return null;
  if (game.result === "draw") return "draw";
  if (game.result === STONES.black || game.result === STONES.white) {
    return game.result === oneSeat ? "win" : "loss";
  }
  // A result this module has no word for is not guessed at.
  return null;
}

/** A tally of results already read from `one`'s side, newest first. */
function tallyOf(results: readonly { outcome: StreakOutcome; playedAt: Date }[]): RivalryTally {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  for (const { outcome } of results) {
    if (outcome === "win") wins += 1;
    else if (outcome === "loss") losses += 1;
    else draws += 1;
  }
  return {
    wins,
    losses,
    draws,
    total: results.length,
    lastPlayedAt: results[0]?.playedAt ?? null,
    // The site's one rule for a run — a draw is a streak of its own — not a second.
    streak: streakFrom(results.map((result) => result.outcome)),
  };
}

/**
 * The record between two members, from `one`'s side, or null where there is no
 * rivalry to read: a missing id, or one member asked about against themselves.
 *
 * The games may come in any order and may include games that are not theirs or
 * not results; both are dealt with here rather than trusted to the caller.
 */
export function rivalryFrom(input: {
  one: string | null | undefined;
  other: string | null | undefined;
  variant?: string | null;
  games: readonly RivalryGame[];
}): Rivalry | null {
  const one = input.one?.trim() ?? "";
  const other = input.other?.trim() ?? "";
  if (one === "" || other === "" || one === other) return null;

  const results = input.games
    .map((game) => ({ game, outcome: outcomeFor(game, one, other) }))
    .filter((row): row is { game: RivalryGame; outcome: StreakOutcome } => row.outcome !== null)
    .sort((a, b) => b.game.playedAt.getTime() - a.game.playedAt.getTime())
    .map(({ game, outcome }) => ({ outcome, playedAt: game.playedAt, variant: game.variant }));

  const variant = input.variant?.trim() ?? "";
  return {
    one,
    other,
    all: tallyOf(results),
    game: variant === "" ? null : { variant, tally: tallyOf(results.filter((row) => row.variant === variant)) },
  };
}

/** Whole days from one moment to a later one; nought for a moment in the future. */
function daysBetween(earlier: Date, later: Date): number {
  return Math.max(0, Math.floor((later.getTime() - earlier.getTime()) / RIVALRY_MS_IN_DAY));
}

/**
 * THE ONE LINE, chosen by rules in this order — the first that holds is said:
 *
 *  1. **Never played at all** → `never`. The strongest fact there is, so it
 *     beats "never played this game", which would also be true.
 *  2. **Played, but never this game** → `neverGame`. John's "never played this
 *     before". Only when a game was asked about.
 *  3. **A long gap** — at least `RIVALRY_LONG_GAP_DAYS` (180) since their last
 *     game of ANY kind → `gap`, in whole years once it is 365 days, otherwise
 *     whole months. Not after a game: the game just filed is the last one, so
 *     the gap is nought by definition.
 *  4. **A first win, just now** → `firstWin`. After a game only: the game just
 *     filed was a win and it is the winner's first in the scope. "Your first win
 *     against Dan" after four losses is the line a person wants to read.
 *  5. **A run of three or more** (`RIVALRY_STREAK_WORTH_NAMING`) of wins, losses
 *     or draws, newest first → `streak`.
 *  6. **Nothing but draws** → `allDrawn`. "Tied 0–0" is true and says nothing.
 *  7. **Level** → `tied`.
 *  8. **Otherwise somebody is ahead** → `lead`.
 *
 * THE SCOPE is the game asked about when there is one and it has been played;
 * otherwise every game between them. The gap is always every game, because
 * "you haven't played Dan in two years" is a sentence about Dan, not about Go.
 */
export function rivalryLine(rivalry: Rivalry, context: RivalryLineContext): RivalryLine {
  const { all } = rivalry;
  if (all.total === 0) return { kind: "never" };
  if (rivalry.game !== null && rivalry.game.tally.total === 0) {
    return { kind: "neverGame", variant: rivalry.game.variant };
  }
  const scope = rivalry.game?.tally ?? all;

  if (context.moment !== RIVALRY_MOMENTS.after && all.lastPlayedAt !== null) {
    const days = daysBetween(all.lastPlayedAt, context.now);
    if (days >= RIVALRY_LONG_GAP_DAYS) {
      return days >= RIVALRY_DAYS_IN_YEAR
        ? { kind: "gap", unit: "years", count: Math.floor(days / RIVALRY_DAYS_IN_YEAR) }
        : { kind: "gap", unit: "months", count: Math.floor(days / RIVALRY_DAYS_IN_MONTH) };
    }
  }

  if (context.moment === RIVALRY_MOMENTS.after) {
    if (context.thisGame === "win" && scope.wins === 1) return { kind: "firstWin", winner: "one" };
    if (context.thisGame === "loss" && scope.losses === 1) return { kind: "firstWin", winner: "other" };
  }

  const run = scope.streak;
  if (run !== null && run.count >= RIVALRY_STREAK_WORTH_NAMING) {
    return { kind: "streak", outcome: run.kind, count: run.count };
  }

  if (scope.wins === 0 && scope.losses === 0) return { kind: "allDrawn" };
  if (scope.wins === scope.losses) return { kind: "tied", score: scope.wins };
  return scope.wins > scope.losses
    ? { kind: "lead", leader: "one", ahead: scope.wins, behind: scope.losses }
    : { kind: "lead", leader: "other", ahead: scope.losses, behind: scope.wins };
}

/**
 * How the game just filed went for `one`, for the `after` moment's `thisGame`.
 * Null for a game that is not a result between the two of them.
 */
export function outcomeOfGame(game: RivalryGame, one: string, other: string): StreakOutcome | null {
  return outcomeFor(game, one, other);
}

/**
 * WHICH TWO PEOPLE A RECORD PAGE IS ABOUT, or null when it is not about two.
 *
 * - A record narrowed to a pair (`between`) is about that pair.
 * - A record narrowed to one member is about the READER against them — when
 *   the reader is signed in as a member and is not that member. Your own games
 *   are nobody's rivalry with you.
 * - Anything else — the whole record, a name with no member behind it — is not
 *   about two people, and says nothing.
 *
 * The reader goes first whenever they are one of the two, which is what lets
 * the board say "you" to them and only to them.
 */
export function recordRivals(input: {
  between: { member: string; against: string } | null;
  member: string | null;
  readerId: string | null;
}): { one: string; other: string } | null {
  const { between, member, readerId } = input;
  if (between !== null) {
    return readerId === between.against
      ? { one: between.against, other: between.member }
      : { one: between.member, other: between.against };
  }
  if (member !== null && readerId !== null && member !== readerId) return { one: readerId, other: member };
  return null;
}

/** The two seats of a match in reading order: the reader first when they hold one. */
export function seatedRivals(input: {
  black: string | null;
  white: string | null;
  readerId: string | null;
}): { one: string; other: string } | null {
  const { black, white, readerId } = input;
  if (black === null || white === null || black === white) return null;
  return readerId === white ? { one: white, other: black } : { one: black, other: white };
}
