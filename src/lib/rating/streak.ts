import type { GamePoolFilter } from "@/lib/history/gameHistory.types";

/**
 * A streak: consecutive results of the same kind, most recent first.
 *
 * There is no universal convention for this, so the site has to choose one and
 * write it down. These are the choices, and the reasoning is the useful part
 * because the next person will want to change them.
 *
 * **A DRAW IS ITS OWN STREAK.** It ends a run of wins and starts a run of
 * draws; it is neither skipped nor counted as a loss. The two alternatives
 * were considered and both are worse:
 *
 *   - *Skipping draws* would make "W5" mean five wins with anything at all
 *     between them. A reader takes "won five in a row" literally, and a
 *     number that quietly allows a draw in the middle is a claim the games do
 *     not support.
 *   - *Counting a draw as a loss* is asymmetric — it would end a win streak
 *     and extend a losing one, so the same game would mean two different
 *     things depending on which way the player was going.
 *
 * Every finished game is a result, and a run of the same result is a streak.
 * That is the whole rule, and it is the only one of the three that can be
 * stated without an exception.
 *
 * **NOUGHT IS NOT A STREAK.** Somebody who has finished no games has no
 * streak, and the answer is `null` — never `0`, never `"W0"`. A count of zero
 * would mean both "no games" and "a run that just ended", which is the
 * failure AGENTS.md calls Nothing Answers What It Cannot Answer: a value that
 * can mean two things will eventually be read as the wrong one. The tables
 * print an em dash for null, which says nothing and cannot be misread.
 */

export const STREAK_KINDS = {
  win: "win",
  loss: "loss",
  draw: "draw",
} as const;

export type StreakKind = (typeof STREAK_KINDS)[keyof typeof STREAK_KINDS];

export const STREAK_KIND_LIST: readonly StreakKind[] = [
  STREAK_KINDS.win,
  STREAK_KINDS.loss,
  STREAK_KINDS.draw,
];

/**
 * How one finished game went for one player.
 *
 * The same three words `pools.ts` already uses for a result, so a streak is
 * extended by exactly what `outcomeFor` returns and nothing has to be
 * translated on the way in.
 */
export type StreakOutcome = "win" | "loss" | "draw";

/** A run: what kind, and how long. Never length nought — see above. */
export type Streak = { kind: StreakKind; count: number };

export const STREAK_DISPLAY: Record<StreakKind, { letter: string; label: string; kanji: string }> = {
  win: { letter: "W", label: "won in a row", kanji: "連勝" },
  loss: { letter: "L", label: "lost in a row", kanji: "連敗" },
  draw: { letter: "D", label: "drawn in a row", kanji: "連分" },
};

/** What nothing looks like, everywhere a streak is printed. */
export const NO_STREAK_TEXT = "—";

/**
 * A streak as it is written: "W3", "L2", "D1" — and an em dash for nothing.
 *
 * One function rather than a format per table, for the same reason
 * `winRateText` is one function: two spellings of the same figure on two
 * pages is exactly the drift this whole change exists to undo.
 */
export function streakText(streak: Streak | null): string {
  if (streak === null || streak.count <= 0) return NO_STREAK_TEXT;
  return `${STREAK_DISPLAY[streak.kind].letter}${streak.count}`;
}

/**
 * The same in words, for a hover note: "3 won in a row".
 *
 * Null returns the empty string rather than a sentence, because there is no
 * single true sentence for it. A blank streak means one of three different
 * things — nobody has finished a game, this row's run is not known, or rows of
 * this kind have no run — and only the caller knows which. It said "No
 * finished games to make a streak of yet" for all three, which was a false
 * statement on a row showing 511 games. See `StreakMark`, which decides.
 */
export function streakLabel(streak: Streak | null): string {
  if (streak === null || streak.count <= 0) return "";
  return `${streak.count} ${STREAK_DISPLAY[streak.kind].label}.`;
}

/** What a result counts as. A draw is its own kind, which is the whole decision. */
export function streakKindOf(outcome: StreakOutcome): StreakKind {
  return outcome === "win" ? STREAK_KINDS.win : outcome === "loss" ? STREAK_KINDS.loss : STREAK_KINDS.draw;
}

/**
 * The streak after one more result — the only way a stored streak ever moves.
 *
 * THE WRITER ALREADY KNOWS, which is the whole reason a streak can be a
 * column rather than a query. Whatever records a result has just read the row
 * it is about to write, so the run so far is in its hands: a streak is the
 * previous one carried forward, and nothing has to read a game back.
 *
 * The alternative was measured on the landing page and removed in 0.139.0 —
 * it read 2,508 move rows to draw eight games. A streak computed per row on a
 * list of eleven members is the same fault with a different name.
 */
export function extendStreak(current: Streak | null, outcome: StreakOutcome): Streak {
  const kind = streakKindOf(outcome);
  if (current === null || current.count <= 0 || current.kind !== kind) return { kind, count: 1 };
  return { kind, count: current.count + 1 };
}

/**
 * The streak a run of results makes, newest first.
 *
 * For the places that are holding the games anyway — a backfill, and a page
 * that has already read somebody's finished games to count them. It is NOT
 * for a table to call per row: that is the cost this design exists to avoid.
 */
export function streakFrom(results: readonly StreakOutcome[]): Streak | null {
  const first = results[0];
  if (first === undefined) return null;
  let streak: Streak = { kind: streakKindOf(first), count: 1 };
  for (const result of results.slice(1)) {
    if (streakKindOf(result) !== streak.kind) break;
    streak = { kind: streak.kind, count: streak.count + 1 };
  }
  return streak;
}

/**
 * Which set of games a streak counts — and it must always be said.
 *
 * A ladder's streak is that ladder's pool, rated; the members list counts
 * every rated game here whichever pool scored it. They are different numbers
 * about the same person, and a count that links to a set it did not count is
 * the fault AGENTS.md spends a page on.
 *
 * Deliberately the same three words as `GamePoolFilter`, so the value naming
 * the streak's scope is the very value that goes into the link beside it —
 * `of={{ pool }}`. A column and the address under it cannot disagree if they
 * are handed the same thing.
 */
export type StreakScope = GamePoolFilter;

/**
 * Where each scope's streak is kept.
 *
 * SPELLED OUT RATHER THAN FOLLOWING THE POOL CONVENTION, on purpose. The
 * rating columns use a bare name for the people pool (`rating`,
 * `computerRating`), so a bare `streakKind` would read as the people pool to
 * anybody who knows this schema — and it is not: `ratedStreak` counts both
 * pools together, which is what the members list and a member's own headline
 * are counting. A name that would be misread by the people who know the
 * codebase best is worth three extra characters.
 *
 * `PlayerVariantRating` keeps only the two pool scopes. Every table of
 * per-game standings is already one row per game per pool, so a both-pools
 * figure there would be a number nothing on the site shows.
 */
export const STREAK_COLUMNS = {
  people: { kind: "peopleStreakKind", count: "peopleStreakCount" },
  computer: { kind: "computerStreakKind", count: "computerStreakCount" },
  all: { kind: "ratedStreakKind", count: "ratedStreakCount" },
} as const satisfies Record<StreakScope, { kind: string; count: string }>;

/** The scopes each table keeps, so a writer cannot name one the row has no column for. */
export const PLAYER_STREAK_SCOPES: readonly StreakScope[] = ["people", "computer", "all"];
export const VARIANT_STREAK_SCOPES: readonly StreakScope[] = ["people", "computer"];

/**
 * One row's streak in one scope, or null where there is not one.
 *
 * The two columns are read together and are only ever believed together: a
 * kind with no count, or a count of nought, is nothing said. That is the guard
 * that makes a nullable pair safe — the settled-position pair on `Game` is the
 * same shape for the same reason, and `history/settledTurn.ts` owns it.
 */
export function streakIn(row: Record<string, unknown>, scope: StreakScope): Streak | null {
  const columns = STREAK_COLUMNS[scope];
  const kind = row[columns.kind];
  const count = row[columns.count];
  if (typeof kind !== "string" || typeof count !== "number" || count <= 0) return null;
  if (!(STREAK_KIND_LIST as readonly string[]).includes(kind)) return null;
  return { kind: kind as StreakKind, count };
}

/**
 * The columns to write for one player's half of a finished game.
 *
 * Computed from the row the writer has already read, so it costs no query of
 * its own. `scopes` says which streaks this table keeps — the global ladder
 * moves a pool's run and the both-pools run at once, a per-game standing only
 * the pool's.
 */
export function streakWrite(
  row: Record<string, unknown>,
  outcome: StreakOutcome,
  scopes: readonly StreakScope[],
): Record<string, string | number> {
  const write: Record<string, string | number> = {};
  for (const scope of scopes) {
    const columns = STREAK_COLUMNS[scope];
    const next = extendStreak(streakIn(row, scope), outcome);
    write[columns.kind] = next.kind;
    write[columns.count] = next.count;
  }
  return write;
}
