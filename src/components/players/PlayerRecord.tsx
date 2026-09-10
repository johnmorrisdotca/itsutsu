import { GameCount } from "@/components/games/GameCount";
import { countText, figuresOf, winRateText } from "@/lib/rating/figures";
import type { GameOutcome, GamePoolFilter, GameRatedFilter } from "@/lib/history/gameHistory.types";
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
 *
 * Every one of these numbers is a way into the games it counted — John's rule,
 * stated twice: "if you see a W/L/T record, each number you see should be
 * clickable". Doing it here rather than in each table is the whole reason this
 * module was worth writing: one change, and the directory, the ladder, the
 * standings and a player's own page all obey it at once.
 */

export type WonLostDrawn = { wins: number; losses: number; draws: number };

/**
 * Whose games these are, so each count can lead to them.
 *
 * Optional because a record is sometimes nobody's in particular — a totals
 * row, a figure added up across several people — and a link then has no set of
 * games to promise. `here` is false for a record kept from another site: those
 * numbers are true and there is nothing behind them to open.
 */
export type RecordOf = {
  player?: string;
  /** One game's record, when the table is per game. Left out for every game. */
  variant?: string;
  /**
   * Which ladder counted these, when a ladder did.
   *
   * A rating's record is rated games in one pool, and nothing else. A table
   * showing one has to hand both down or its numbers link to a longer list
   * than they came from — which is the same fault as a number that leads
   * nowhere, only harder to notice.
   */
  pool?: GamePoolFilter;
  rated?: GameRatedFilter;
  here?: boolean;
};

/** The four counts as links, in one place, so no table invents its own. */
function counts(record: WonLostDrawn, of: RecordOf) {
  const figures = figuresOf({ won: record.wins, lost: record.losses, drawn: record.draws });
  const linked = (count: ReactNode, outcome: GameOutcome, what: string) => (
    <GameCount
      count={count}
      player={of.player}
      variant={of.variant}
      outcome={outcome}
      pool={of.pool}
      rated={of.rated}
      here={of.here !== false && of.player !== undefined && of.player !== ""}
      title={what}
    />
  );
  /*
   * All four separated, not just the total. A row that read "4,118 played ·
   * 2414W" disagreed with itself about how a number is written, and these
   * records run to thousands — `countText` exists for exactly that. The cells
   * used to print the three counts raw while the total beside them was
   * separated, which is the sort of difference nobody chooses and everybody
   * notices.
   */
  return {
    figures,
    played: linked(countText(figures.played), "decided", "Every game counted here"),
    won: linked(countText(record.wins), "won", "The games won"),
    lost: linked(countText(record.losses), "lost", "The games lost"),
    drawn: linked(countText(record.draws), "drawn", "The games drawn"),
  };
}

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
  of = {},
  trailing,
  note,
}: {
  record: WonLostDrawn;
  /** Whose games, so the counts lead to them. */
  of?: RecordOf;
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
  const cells = counts(record, of);
  return (
    <>
      <td className={CELL} data-testid="record-played">
        {cells.played}
        {note}
      </td>
      <td className={CELL}>{cells.won}</td>
      <td className={CELL}>{cells.lost}</td>
      <td className={CELL}>{cells.drawn}</td>
      <td className={CELL} data-testid="record-win-rate">
        {winRateText(cells.figures.winRate)}
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
  of = {},
  trailing,
  testId,
}: {
  record: WonLostDrawn;
  /** Whose games, so the counts lead to them. */
  of?: RecordOf;
  /** Anything this page shows after the shared figures — a rating, usually. */
  trailing?: ReactNode;
  testId?: string;
}) {
  const cells = counts(record, of);
  const { figures } = cells;
  if (figures.played === 0) {
    return (
      <span className="font-mono text-xs tabular-nums text-muted" data-testid={testId}>
        No games yet
      </span>
    );
  }
  return (
    <span className="font-mono text-xs tabular-nums text-muted" data-testid={testId}>
      {cells.played} played · {cells.won}W {cells.lost}L {cells.drawn}D · {winRateText(figures.winRate)}
      {trailing === undefined ? null : <> · {trailing}</>}
    </span>
  );
}

/**
 * Won, lost and drawn as one figure, each number a way into those games.
 *
 * The linked twin of `recordText`, which returns a string and therefore
 * cannot be clicked — that string under "Won · Lost · Drawn" at the top of
 * every player's page is exactly what John was pointing at. The words stay
 * identical, so nothing about the page reads differently; the numbers in them
 * now go somewhere.
 */
export function RecordFigure({ record, of = {} }: { record: WonLostDrawn; of?: RecordOf }) {
  const cells = counts(record, of);
  return (
    <span data-testid="record-figure">
      {cells.won}W · {cells.lost}L · {cells.drawn}D
    </span>
  );
}

/** The same for a count of games played, where a page shows that on its own. */
export function PlayedFigure({ record, of = {} }: { record: WonLostDrawn; of?: RecordOf }) {
  return counts(record, of).played;
}
