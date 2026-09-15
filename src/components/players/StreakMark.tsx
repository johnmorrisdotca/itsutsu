import { streakLabel, streakText, type Streak } from "@/lib/rating/streak";

import { blankOf, streakCounts } from "./recordScopeWords";
import type { RecordOf } from "./recordTable.types";

/*
 * Split out of `PlayerRecord.tsx` when it reached the file-size gate. A streak is
 * still one of the shared figures — that file re-exports this, so every import
 * keeps its path — and the sentences it says on hover are worded in
 * `recordScopeWords.ts`.
 */

/**
 * A streak, drawn the one way it is drawn.
 *
 * It sits with the other record cells rather than being a column a table adds
 * for itself, because it is one of the shared figures: a page may choose
 * whether to show a tier, and may not choose whether a run reads "W3" here
 * and "3 wins" there.
 *
 * NULL PRINTS AN EM DASH AND NOTHING ELSE. Somebody with no finished games has
 * no streak, and "W0" or "0" would be a claim about a run that never happened
 * — see the head of `rating/streak.ts`.
 */
export function StreakMark({
  streak,
  of = {},
  played,
  blankBecause,
}: {
  streak: Streak | null;
  of?: RecordOf;
  /** How many games the row counted, which tells "none yet" from "not known". */
  played?: number;
  /**
   * Why this cell is blank, where a row has games and still has no run to
   * show for a reason the row itself knows.
   *
   * The per-site table is the case: its rows are totals for a whole site, and
   * a run is an ORDER — two sites' games interleave in time, so no site's row
   * is a run of anything. Saying that is the difference between a blank a
   * reader can understand and one that looks like a bug.
   */
  blankBecause?: string;
}) {
  /*
   * A row that knows WHY it has no run says only that. The scope sentence
   * exists to tell a reader which games a run covers, and appending it to "this
   * kind of row has no run" promises a scope for a cell that has none —
   * "...no site's row is a run of anything. Over the games finished here by
   * Razryad" read as two answers disagreeing.
   */
  const reason = streakLabel(streak);
  const title =
    reason === "" && blankBecause !== undefined
      ? blankBecause
      : `${reason || blankOf(played)} ${streakCounts(of)}`.trim();
  return (
    <span
      title={title}
      data-testid="record-streak"
      data-streak={streak === null ? "" : streak.kind}
    >
      {streakText(streak)}
    </span>
  );
}
