import { GameCount } from "@/components/games/GameCount";
import { figuresOf, winRateText } from "@/lib/rating/figures";
import type { Streak } from "@/lib/rating/streak";
import type { GameOutcome } from "@/lib/history/gameHistory.types";
import { CELL } from "./players.constants";
import type { Speaker } from "@/lib/i18n/i18n";
import { weave } from "@/lib/i18n/weave";
import { SortableHead, type RecordSort } from "./recordSort";
import type { RecordOf, WonLostDrawn } from "./recordTable.types";
import { StreakMark } from "./StreakMark";
import type { ReactNode } from "react";

/*
 * Split at the file-size gate, and every name still imported from here: the
 * cell and table classes are in `players.constants.ts`, `WonLostDrawn` and
 * `RecordOf` in `recordTable.types.ts`, the streak cell in `StreakMark.tsx`, and
 * the sentences a record says on hover in `recordScopeWords.ts`. This file keeps
 * the figures themselves — the counts as links, the headings, the cells, the
 * line and the figure — which is the job its header describes.
 */
export { CELL, HEAD, ROW_CLASS, TABLE_CLASS, TABLE_HEAD_CLASS } from "./players.constants";
export type { RecordOf, WonLostDrawn } from "./recordTable.types";
export { StreakMark } from "./StreakMark";
export { playedScopeNote } from "./recordScopeWords";

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

/** The four counts as links, in one place, so no table invents its own. */
function counts(record: WonLostDrawn, of: RecordOf, say: Speaker) {
  const figures = figuresOf({ won: record.wins, lost: record.losses, drawn: record.draws });
  const linked = (count: ReactNode, outcome: GameOutcome, what: string) => (
    <GameCount
      count={count}
      player={of.player}
      memberId={of.memberId}
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
    played: linked(say.number(figures.played), "decided", say.say("players.titlePlayed")),
    won: linked(say.number(record.wins), "won", say.say("players.titleWon")),
    lost: linked(say.number(record.losses), "lost", say.say("players.titleLost")),
    drawn: linked(say.number(record.draws), "drawn", say.say("players.titleDrawn")),
  };
}

/**
 * The headings for `RecordCells`, in the same order and from the same module.
 *
 * Kept beside the cells deliberately. A heading and its column drifting apart
 * is the quietest bug a table can have — every number reads as a different
 * quantity and nothing looks broken.
 */
export function RecordHeadings({
  say,
  trailing,
  playedTitle,
  sort,
}: {
  say: Speaker;
  trailing?: ReactNode;
  /** What this table's Played column counts, when it is not every finished game. See `playedScopeNote`. */
  playedTitle?: string;
  /**
   * How this table sorts, when it does. Absent means every heading is text,
   * which is what every table here was until the ladder learned to sort — so
   * adding it to one page changes nothing on the others.
   *
   * `SortableHead` draws a plain `<th>` for a slot with no sort word in it, so
   * the four shared counts and the four figures beside them stay one component
   * whether or not a given table can order by them. Two sets of headings, one
   * sortable and one not, is how a table becomes two tables again.
   */
  sort?: RecordSort;
}) {
  return (
    <>
      <SortableHead say={say} sort={sort} slot="played" title={playedTitle}>
        {say.say("players.colPlayed")}
      </SortableHead>
      <SortableHead say={say} sort={sort} slot="won">
        {say.say("chrome.strip.won")}
      </SortableHead>
      <SortableHead say={say} sort={sort} slot="lost">
        {say.say("chrome.strip.lost")}
      </SortableHead>
      <SortableHead say={say} sort={sort} slot="drawn">
        {say.say("chrome.strip.drawn")}
      </SortableHead>
      <SortableHead say={say} sort={sort} slot="winRate">
        {say.say("players.colWinRate")}
      </SortableHead>
      <SortableHead say={say} sort={sort} slot="streak">
        {say.say("players.colStreak")}
      </SortableHead>
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
  say,
  record,
  of = {},
  streak,
  streakBlankBecause,
  trailing,
  note,
}: {
  say: Speaker;
  record: WonLostDrawn;
  /** Whose games, so the counts lead to them. */
  of?: RecordOf;
  /**
   * The run these games are on, or null where there is not one.
   *
   * REQUIRED, AND DELIBERATELY NOT DEFAULTED. An optional streak would print
   * an em dash for a caller that simply forgot to work one out, and an em dash
   * reads as "this player has no streak" — a statement, and a false one.
   * Required means every table has had to decide WHICH set of games its
   * streak is about, which is the whole difficulty here: a ladder's run is one
   * pool's rated games, a member's own page counts every finished game, and
   * those are different numbers about the same person.
   */
  streak: Streak | null;
  /** Why the streak cell is blank, when the row knows a reason. See `StreakMark`. */
  streakBlankBecause?: string;
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
  const cells = counts(record, of, say);
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
      <td className={CELL}>
        <StreakMark
          say={say}
          streak={streak}
          of={of}
          played={cells.figures.played}
          blankBecause={streakBlankBecause}
        />
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
  say,
  record,
  of = {},
  streak,
  trailing,
  testId,
}: {
  say: Speaker;
  record: WonLostDrawn;
  /** Whose games, so the counts lead to them. */
  of?: RecordOf;
  /** The run these games are on. Required, for the reason `RecordCells` gives. */
  streak: Streak | null;
  /** Anything this page shows after the shared figures — a rating, usually. */
  trailing?: ReactNode;
  testId?: string;
}) {
  const cells = counts(record, of, say);
  const { figures } = cells;
  if (figures.played === 0) {
    return (
      <span className="font-mono text-xs tabular-nums text-muted" data-testid={testId}>
        {say.say("players.noGamesYet")}
      </span>
    );
  }
  return (
    <span className="font-mono text-xs tabular-nums text-muted" data-testid={testId}>
      {weave(say.say("players.recordLine", { rate: winRateText(figures.winRate) }), {
        played: cells.played,
        won: cells.won,
        lost: cells.lost,
        drawn: cells.drawn,
        streak: <StreakMark say={say} streak={streak} of={of} played={figures.played} />,
      })}
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
export function RecordFigure({ say, record, of = {} }: { say: Speaker; record: WonLostDrawn; of?: RecordOf }) {
  const cells = counts(record, of, say);
  return (
    <span data-testid="record-figure">
      {weave(say.say("players.figure"), { won: cells.won, lost: cells.lost, drawn: cells.drawn })}
    </span>
  );
}

/** The same for a count of games played, where a page shows that on its own. */
export function PlayedFigure({ say, record, of = {} }: { say: Speaker; record: WonLostDrawn; of?: RecordOf }) {
  return counts(record, of, say).played;
}
