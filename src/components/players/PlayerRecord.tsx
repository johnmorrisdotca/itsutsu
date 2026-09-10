import { countText, figuresOf, winRateText } from "@/lib/rating/figures";
import type { ReactNode } from "react";

/**
 * How a record is shown, everywhere a record is shown.
 *
 * The same four things — how many played, won, lost and drawn, and how often
 * that is a win — were drawn in a different shape on every page that showed
 * them. The members directory used table columns; the Computers tab, on the
 * same page, used a line of text; a player's own record used tiles and then a
 * different table again. Nine components, nine layouts, one set of numbers.
 *
 * The numbers were never the problem: `rating/figures.ts` has worded them in
 * one place all along, and every page already used it. What each page invented
 * for itself was the SHAPE. So this is presentation and nothing else, and it
 * holds the three shapes the site actually needs rather than one that would
 * have to be bent into six places:
 *
 *   a ROW      — for a table of many players (the directory, the ladder, the
 *                per-variant standings)
 *   a LINE     — for one player read inline (the Computers tab, a source)
 *   a SUMMARY  — for one player's headline figures, which is `ui/Figures`
 *                and already shared; nothing here replaces it
 *
 * The column order is one decision made once. Played first because it is the
 * question people ask first, then the three counts, then the rate they imply.
 * A page may add a column of its own on either side; what it may not do is
 * spell these ones differently.
 */

export type WonLostDrawn = { wins: number; losses: number; draws: number };

/** The cell classes, here rather than in each table, so columns line up between pages. */
const CELL = "py-1.5 pr-3 font-mono tabular-nums";
const HEAD = "py-1 pr-3";

/**
 * The headings for `RecordCells`, in the same order and from the same module.
 *
 * Kept beside the cells deliberately. A heading and its column drifting apart
 * is the quietest bug a table can have — every number reads as a different
 * quantity and nothing looks broken.
 */
export function RecordHeadings({ trailing }: { trailing?: ReactNode }) {
  return (
    <>
      <th className={HEAD}>Played</th>
      <th className={HEAD}>W</th>
      <th className={HEAD}>L</th>
      <th className={HEAD}>D</th>
      <th className={HEAD}>Win rate</th>
      {trailing}
    </>
  );
}

/**
 * One player's record as table cells.
 *
 * `trailing` is for a column this table has and the others do not — the
 * directory's rating, a ladder's place. It goes after the shared ones so the
 * shared ones stay in the same position on every page.
 */
export function RecordCells({
  record,
  trailing,
  note,
}: {
  record: WonLostDrawn;
  trailing?: ReactNode;
  /**
   * A mark on the count itself, for a total that needs qualifying.
   *
   * On the count rather than the row, because what wants qualifying is the
   * NUMBER — a figure that includes games copied from another site once and
   * never updated since. A table row has no space for the paragraph a profile
   * page can afford, and leaving the qualification out because it does not fit
   * would be misleading by omission, which is the fault the paragraph exists
   * to avoid.
   */
  note?: ReactNode;
}) {
  const figures = figuresOf({ won: record.wins, lost: record.losses, drawn: record.draws });
  return (
    <>
      <td className={CELL} data-testid="record-played">
        {countText(figures.played)}
        {note}
      </td>
      <td className={CELL}>{record.wins}</td>
      <td className={CELL}>{record.losses}</td>
      <td className={CELL}>{record.draws}</td>
      <td className={CELL} data-testid="record-win-rate">
        {winRateText(figures.winRate)}
      </td>
      {trailing}
    </>
  );
}

/**
 * The same record on one line, for a list that is not a table.
 *
 * Reads "12 played · 7W 4L 1D · 58%". The separator is a middle dot rather
 * than a slash because a slash between W and L reads as "wins per loss",
 * which is a different figure.
 */
export function RecordLine({
  record,
  trailing,
  testId,
}: {
  record: WonLostDrawn;
  /** Anything this page shows after the shared figures — a rating, usually. */
  trailing?: ReactNode;
  testId?: string;
}) {
  const figures = figuresOf({ won: record.wins, lost: record.losses, drawn: record.draws });
  if (figures.played === 0) {
    return (
      <span className="font-mono text-xs tabular-nums text-muted" data-testid={testId}>
        No games yet
      </span>
    );
  }
  return (
    <span className="font-mono text-xs tabular-nums text-muted" data-testid={testId}>
      {countText(figures.played)} played · {record.wins}W {record.losses}L {record.draws}D ·{" "}
      {winRateText(figures.winRate)}
      {trailing === undefined ? null : <> · {trailing}</>}
    </span>
  );
}
