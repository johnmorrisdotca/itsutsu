import { GameCount } from "@/components/games/GameCount";
import { countText, figuresOf, winRateText } from "@/lib/rating/figures";
import { streakLabel, streakText, type Streak } from "@/lib/rating/streak";
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

/**
 * The cell classes, here rather than in each table, so columns line up between
 * pages.
 *
 * Exported so that `RecordTable` — which draws the columns AROUND these: the
 * rating, the tier, whatever a table switches on — uses the same two strings
 * rather than a copy. A copied class string is how a table drifts half a line
 * out of true and nobody can say why.
 */
export const CELL = "py-1.5 pr-3 font-mono tabular-nums";
/*
 * `whitespace-nowrap` because these headings are two words at most and a
 * wrapped one throws the whole row's baseline out. On the members list, which
 * carries two action columns, "WIN RATE" broke over two lines while the same
 * heading on the ladder beside it did not — two tables meant to read as one,
 * differing by a line height for no reason a reader could see.
 */
export const HEAD = "py-1 pr-3 whitespace-nowrap";

/**
 * The heading typography every record table shares.
 *
 * It was this string written out in five files and a near-miss of it in two
 * more — `0.68rem`/`0.1em` against `0.7rem`/`0.14em`, on two tables a reader
 * sees one after the other. One string, one look.
 */
export const TABLE_HEAD_CLASS =
  "text-left text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase";

/** The table element itself, so no page invents its own width or size. */
export const TABLE_CLASS = "w-full text-sm";

/** The line between rows. */
export const ROW_CLASS = "border-t border-rule";

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

/**
 * What an em dash MEANS here, which is three different things.
 *
 * It said "No finished games to make a streak of yet" for all of them, and on
 * a row showing 511 games that is simply untrue. A cell that cannot answer has
 * to say so honestly — never claim a reason it does not know, and never claim
 * the reason that happens to read best.
 */
function blankOf(played: number | undefined): string {
  if (played === 0) return "No finished games yet, so there is no run to show.";
  return "No run recorded for this row.";
}

/**
 * The three answers a record's own hover sentences are built from — which
 * games, against whom, rated or not — read once from `of` so `streakCounts`
 * and `playedScopeNote` cannot describe the same row two different ways.
 */
function scopeWords(of: RecordOf): { games: string; pool: string; rated: string } {
  return {
    games: of.variant === undefined ? "games" : "games of this one game",
    pool:
      of.pool === "computer"
        ? " against the computer players"
        : of.pool === "people"
          ? " against other people"
          : "",
    rated: of.rated === "yes" ? "rated " : of.rated === "no" ? "friendly " : "",
  };
}

/**
 * WHICH GAMES THIS RUN IS OVER, said out loud on every streak on the site.
 *
 * A streak is the one figure in the row that cannot be checked by looking. The
 * counts beside it link to the games they counted, so a reader can open them
 * and see; a run is a single number with no way to inspect it. So it has to
 * SAY what it is about, and it says it from the same `of` the counts are
 * filtered by — which means the sentence and the links cannot drift apart.
 *
 * It earned this the day the PLAYED column changed meaning. That column was
 * counting rated games under a heading that says played, and when it was fixed
 * to count every finished game a streak over rated games alone became a second
 * number on the same row that nobody could reconcile with the first. Whichever
 * way that goes, a run that names its own set is a run a reader can still trust.
 */
function streakCounts(of: RecordOf): string {
  /*
   * `here: false` says the COUNTS beside this reach beyond Itsutsu — a kept
   * record copied down from another site. It does not say that about the run,
   * and cannot: a run is an order, and another site's figures are four totals
   * with no order in them. So the sentence says what the run is over rather
   * than repeating what the counts are over, which is the distinction the
   * rating column already makes on the same rows.
   */
  if (of.here === false) return "A run is only ever counted from games played here.";
  const { games, pool, rated } = scopeWords(of);
  const whose = of.player === undefined || of.player === "" ? "" : ` by ${of.player}`;
  return `Over the ${rated}${games}${pool} finished here${whose}, most recent first.`;
}

/**
 * WHAT "PLAYED" COUNTS HERE, said on hover from the same `of` the numbers
 * under it are filtered by — the same idea `streakCounts` already keeps,
 * for the same reason: a table's heading and its cells must not be able to
 * drift into describing two different sets of games.
 *
 * `RecordHeadings` draws one "Played" heading for every table on the site,
 * and it does not always mean the same thing under it: the site ladder counts
 * rated games in one pool, a member's own page counts every finished game in
 * either. For the same person that was 5 against 14, one click apart, with
 * nothing on either page saying so. `RecordTable`'s `playedScope` is optional
 * and most callers leave it unset — "every finished game" needs no footnote —
 * so this only has something to say where a table's Played is narrower than
 * that.
 */
export function playedScopeNote(of: RecordOf): string {
  if (of.here === false) return "Counted on another site — no games here to open.";
  const { games, pool, rated } = scopeWords(of);
  return `Counts the ${rated}${games}${pool}, finished here.`;
}

/**
 * The headings for `RecordCells`, in the same order and from the same module.
 *
 * Kept beside the cells deliberately. A heading and its column drifting apart
 * is the quietest bug a table can have — every number reads as a different
 * quantity and nothing looks broken.
 */
export function RecordHeadings({
  trailing,
  playedTitle,
}: {
  trailing?: ReactNode;
  /** What this table's Played column counts, when it is not every finished game. See `playedScopeNote`. */
  playedTitle?: string;
}) {
  return (
    <>
      <th className={HEAD} title={playedTitle}>
        Played
      </th>
      <th className={HEAD}>W</th>
      <th className={HEAD}>L</th>
      <th className={HEAD}>D</th>
      <th className={HEAD}>Win rate</th>
      <th className={HEAD}>Streak</th>
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
  streak,
  streakBlankBecause,
  trailing,
  note,
}: {
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
      <td className={CELL}>
        <StreakMark
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
  record,
  of = {},
  streak,
  trailing,
  testId,
}: {
  record: WonLostDrawn;
  /** Whose games, so the counts lead to them. */
  of?: RecordOf;
  /** The run these games are on. Required, for the reason `RecordCells` gives. */
  streak: Streak | null;
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
      {cells.played} played · {cells.won}W {cells.lost}L {cells.drawn}D · {winRateText(figures.winRate)} ·{" "}
      <StreakMark streak={streak} of={of} played={figures.played} />
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
