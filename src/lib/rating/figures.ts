import type { GameScore } from "./elo";

/**
 * What can be worked out from a won-lost-drawn record.
 *
 * Three numbers is the least that could be said about somebody's play, and
 * everything more is arithmetic on those three. None of it is stored, so a
 * figure can never disagree with the record it came from.
 */
export type RecordFigures = {
  played: number;
  won: number;
  lost: number;
  drawn: number;
  /**
   * Wins plus half the draws, over every game played. Null when nothing was.
   *
   * There are two honest ways to put a win rate on a record with draws in it
   * — wins over the games that had a winner, or wins with a draw counted as
   * half — and they give different numbers. A draw is worth half a point to
   * the ratings on this site (`GameScore` is 1, 0.5 or 0), so a win rate that
   * counted draws any other way would disagree with the rating printed beside
   * it. Wherever this is shown, the page says which one it means rather than
   * printing a percentage that could be read either way.
   */
  winRate: number | null;
};

/** What one result is worth, and the reason a draw is a half everywhere else here. */
export function scoreOf(result: "won" | "lost" | "drawn"): GameScore {
  if (result === "won") return 1;
  return result === "drawn" ? 0.5 : 0;
}

export function figuresOf(record: { won: number; lost: number; drawn: number }): RecordFigures {
  const played = record.won + record.lost + record.drawn;
  return {
    played,
    won: record.won,
    lost: record.lost,
    drawn: record.drawn,
    winRate: played === 0 ? null : (record.won + record.drawn * 0.5) / played,
  };
}

/** Several records added together, so a total is the sum of its parts rather than a number kept in step with them. */
export function addUp(
  records: readonly { won: number; lost: number; drawn: number }[],
): { won: number; lost: number; drawn: number } {
  return records.reduce(
    (total, one) => ({ won: total.won + one.won, lost: total.lost + one.lost, drawn: total.drawn + one.drawn }),
    { won: 0, lost: 0, drawn: 0 },
  );
}

/** A win rate as it is printed: one decimal, or an em dash when there is nothing to divide. */
export function winRateText(rate: number | null): string {
  return rate === null ? "—" : `${(rate * 100).toFixed(1)}%`;
}

/** A count with its thousands separated — these records run to thousands of games. */
export function countText(value: number): string {
  return value.toLocaleString("en-GB");
}

/** Won, lost and drawn as one string, in the order every table here writes them. */
export function recordText(record: { won: number; lost: number; drawn: number }): string {
  return `${countText(record.won)}W · ${countText(record.lost)}L · ${countText(record.drawn)}D`;
}
