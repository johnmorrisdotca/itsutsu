import Link from "next/link";

import { CELL, HEAD } from "./PlayerRecord";
import { Paired } from "@/components/i18n/Paired";
import { RATING_POOLS } from "@/lib/rating/pools";
import { RowActions } from "@/components/ui/Controls";
import { LocalTime } from "@/components/ui/LocalTime";
import { SortableHead, type RecordSort } from "./recordSort";
import { TIER_DISPLAY } from "@/lib/rating/elo";
import { countText } from "@/lib/rating/figures";

import { XP_BLANK_BECAUSE } from "./players.constants";
import type { RecordColumns, RecordTableRow, ShownRating } from "./recordTable.types";

/**
 * THE COLUMNS A TABLE OF RECORDS MAY SWITCH ON — HEADINGS AND CELLS TOGETHER.
 *
 * Split out of `RecordTable.tsx` when the XP column arrived and the component
 * reached the 500-line gate. The split is by responsibility rather than by line
 * count, which is what the gate is asking for: `RecordTable` owns the TABLE —
 * the element, the subject cell, the row heights, the empty row, the argument
 * for the column order — and this owns the five columns a caller decides for
 * itself, each with the reason it may be absent.
 *
 * **Both halves of a column are in this file, and that is the point.** The
 * heading and the cell under it are two lists that have to agree, and
 * `PlayerRecord.tsx` already says what happens when they drift: *"A heading and
 * its column drifting apart is the quietest bug a table can have — every number
 * reads as a different quantity and nothing looks broken."* Splitting the
 * headings into the component and the cells into a module would have created
 * exactly that seam, so `trailingHeadings` and `TrailingCells` are neighbours
 * and `trailingWidth` counts the same switches both of them read.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT A CALLER MAY SWITCH OFF, AND WHAT THAT COSTS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The nine canonical columns are always drawn. Of these five, `rating` and
 * `xp` are ON unless switched off and the other three are OFF unless switched
 * on — which is not an inconsistency but the honest default in each case:
 * every table of records has a rating and an XP total to show except the ones
 * that say so, and most of them have no rank, no tier and no join date to show
 * at all.
 *
 * A column is only switched off where it would be MEANINGLESS on that table —
 * never because it is inconvenient:
 *
 * - `tier` off wherever the rows are not ratings.
 * - `joined` off anywhere the subject is not a person with a join date.
 * - `rating` off on a table whose rows have no single rating to show — a
 *   player's own by-game breakdown counts every finished game, rated or not,
 *   across both pools, and no one rating belongs to such a row. A column of
 *   dashes is not a smaller truth, it is a column that says nothing.
 * - `xp` off only where the rows are NOT PEOPLE — a game, a site — so there is
 *   nobody on the row to have earned anything. It stays on for the tables of
 *   programs, where every cell is a dash: see `XpCell` for why that dash is an
 *   answer and not a column of nothing.
 */

/**
 * A rating with the mark that says which pool earned it.
 *
 * Drawn here rather than by each caller, because the mark is the whole reason
 * the number is safe to print: an unlabelled 1639 beside a name reads as a
 * place on the ladder of people, and for somebody who has only played the
 * programs it is not one. Two pages drew this mark for themselves and a third
 * did not draw it at all.
 */
function RatingCell({ rating }: { rating: ShownRating | null }) {
  if (rating === null) return <td className={CELL} data-testid="record-rating">–</td>;
  return (
    <td className={CELL} data-testid="record-rating">
      {rating.rating}
      {rating.pool === RATING_POOLS.computer ? (
        <span
          className="ml-1 font-mincho text-[0.68rem] font-normal opacity-70"
          title="Earned against the computer players, which are rated in a pool of their own."
          data-testid="rating-pool-computer"
        >
          機械
        </span>
      ) : null}
    </td>
  );
}

/**
 * WHAT THIS MEMBER HAS EARNED, LEADING TO THE BOARD THAT RANKS IT.
 *
 * John asked for this by name: *"I love our leaderboard that have your win loss
 * tie record should also show your experience points and site level."* The LEVEL
 * was already here — a compact badge in the subject cell, beside the name, since
 * 0.166.0 — and the TOTAL is this column. Two halves of one standing, and they
 * are drawn in two places for a reason `RecordTable`'s head sets out: a level is
 * part of how the site refers to a person, and a total is a figure compared down
 * a column, added up and sorted by.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHERE THE NUMBER LEADS, AND WHY IT IS THE SAME PLACE EVERYWHERE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `/xp`, the leaderboard: every member ordered by exactly this figure, with the
 * reader's own row marked. One destination on every table and for every row,
 * rather than one per table or one per kind of reader.
 *
 * The alternatives were real and each fails the promise a link makes:
 *
 * - **`/me?view=xp`**, the reader's own ledger, is the set this number is MADE
 *   OF — every point, what earned it, when. It is the right answer for exactly
 *   one row on the page and there is no public version of it for anybody else,
 *   so as a rule it would be a link that keeps its promise for the reader and
 *   breaks it for the other forty-nine names.
 * - **`/xp/levels/<level>`** is where the LEVEL leads, and it is already reached
 *   from the badge four columns to the left. Sending the total there too would
 *   give one row two links to one page and leave the board unreachable.
 * - **A person's own page** shows this same total and one rung. It is a smaller
 *   answer than the board and the name beside it already goes there.
 *
 * So: the badge leads to the rung, the number leads to the board. Two figures,
 * two destinations, each the page that is actually about that figure.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NOUGHT IS A NUMBER; A DASH MEANS THERE IS NO TOTAL TO BE HAD
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A person who has earned nothing prints `0`, and it links like any other total:
 * John settled that nought is level 1, and a `0` in a column of tabular figures
 * is a fact about them where an em dash would read as "not known" — which is
 * what a dash means in the rating and streak cells of the very same row.
 *
 * `null` is the other thing entirely, and on this column it has two causes. The
 * usual one is a PROGRAM, which `awardXp` refuses by name and which therefore
 * sits at nought for ever without being on the ladder at all; `xpShown` decides
 * that, not this cell. The other is a rating row keyed by a name that no member
 * has ever claimed, which the ladder can hold and the members list cannot — and
 * the row says so through `xpBlankBecause`, since the program's reason would
 * be wrong about it. Either way the dash explains itself on hover, because an
 * unexplained blank beside Meijin's two hundred games reads as a bug, and this
 * one is an answer.
 *
 * THE TABLES OF PROGRAMS KEEP THE COLUMN, DASHES AND ALL. They switched it off
 * for a while on the argument that a column of dashes says nothing — and John
 * answered that argument when he asked for XP on every stats table and said
 * what a program's cell should read: "–", never 0 and never "Lv 1". A dash says
 * nothing is there, where a 0 would claim a fact; and a table of programs that
 * carries the same columns as the table of people beside it is one table, which
 * is the whole reason `RecordTable` exists.
 */
export function XpCell({ xp, blankBecause }: { xp: number | null; blankBecause?: string }) {
  if (xp === null) {
    return (
      <td className={CELL} title={blankBecause ?? XP_BLANK_BECAUSE.program} data-testid="record-xp">
        –
      </td>
    );
  }
  return (
    <td className={CELL} data-testid="record-xp">
      <Link
        href="/xp"
        className="underline-offset-2 hover:underline"
        title="Experience earned on Itsutsu. Opens the board that ranks everybody by it."
        data-testid="record-xp-link"
      >
        {countText(xp)}
      </Link>
    </td>
  );
}

/**
 * How many columns these switches come to, for the span of the empty row.
 *
 * Counted from the same object the cells read rather than written down, so a
 * column added above cannot leave the empty row spanning the wrong width —
 * which is the sort of thing that looks fine until the one day there are no rows.
 */
export function trailingWidth(columns: RecordColumns): number {
  return (
    (columns.rating !== false ? 1 : 0) +
    (columns.xp !== false ? 1 : 0) +
    (columns.tier === true ? 1 : 0) +
    (columns.joined === true ? 1 : 0) +
    (columns.actions === undefined ? 0 : 1)
  );
}

/**
 * The headings for the columns a caller switched on, in the canonical order.
 *
 * A function returning a fragment rather than a component, because it is handed
 * to `RecordHeadings`'s `trailing` slot and has to be a node in a `<tr>` that
 * another module opened.
 */
export function trailingHeadings({
  columns,
  sort,
}: {
  columns: RecordColumns;
  sort: RecordSort | undefined;
}) {
  return (
    <>
      {columns.rating !== false ? (
        <SortableHead sort={sort} slot="rating">
          Rating
        </SortableHead>
      ) : null}
      {columns.xp !== false ? (
        /*
         * DIRECTLY AFTER RATING, which is where John put it: "display directly
         * after the Played column... never mind after the Rating column for
         * now." It sat after Tier for two releases; the head of `RecordTable.tsx`
         * has the order and the argument.
         *
         * "XP" and not "XP 経験", which every other heading on this table would
         * also have to grow for the pairing to read as the site's rather than as
         * one column's. `LevelName` settled the same question the same way for
         * the badge in the cell beside it: the kanji is a hover here and read
         * properly where there is room for it — the lead paragraph over this
         * table pairs it, as does the XP tab it belongs to.
         */
        <SortableHead
          sort={sort}
          slot="xp"
          title="Experience 経験 — what this member has earned on Itsutsu"
        >
          XP
        </SortableHead>
      ) : null}
      {columns.tier === true ? (
        <SortableHead sort={sort} slot="tier">
          Tier
        </SortableHead>
      ) : null}
      {columns.joined === true ? (
        <SortableHead sort={sort} slot="joined">
          Joined
        </SortableHead>
      ) : null}
      {columns.actions === undefined ? null : <th className={HEAD}>{columns.actions}</th>}
    </>
  );
}

/** The cells for those same columns, in that same order, for one row. */
export function TrailingCells({
  row,
  columns,
}: {
  row: RecordTableRow;
  columns: RecordColumns;
}) {
  return (
    <>
      {columns.rating !== false ? <RatingCell rating={row.rating ?? null} /> : null}
      {columns.xp !== false ? <XpCell xp={row.xp ?? null} blankBecause={row.xpBlankBecause} /> : null}
      {columns.tier === true ? (
        <td className="py-1.5 pr-3" data-testid="record-tier">
          {row.tier === undefined ? (
            "–"
          ) : (
            <Paired
              en={TIER_DISPLAY[row.tier].label}
              kanji={TIER_DISPLAY[row.tier].kanji}
              kanjiClassName="text-muted"
            />
          )}
        </td>
      ) : null}
      {columns.joined === true ? (
        <td className="py-1.5 pr-3 text-xs text-muted">
          {row.joined === undefined ? (
            "–"
          ) : (
            <>
              {/*
                Through `LocalTime`, never `toLocaleDateString()` in render: the
                server drew this in its own language and zone and the browser in
                the reader's, so the members list disagreed with itself on every
                load. The first drawing is the UTC date, the same on both sides.
              */}
              <LocalTime at={row.joined.at} style="date" />
              {/*
                A COLOURED MARK AND NOT A PILL, AND THE XP COLUMN IS WHY. The
                pill was 8 pixels of padding each side and an 8-pixel gap, which
                is most of why this column wanted 142 pixels for a nine-character
                date. Measured when XP arrived: the members list's min-content went
                from 1,061 to 1,123 in a box of 1,118, so "Challenge" sat 5 pixels
                past the edge on every row. Dropping the chrome gives back 18
                pixels whatever the rows hold — the word, the kanji, the colour and
                the weight all stay, so a new member is marked exactly as clearly.

                The alternatives were weighed on the same measurement. Moving the
                mark beside the name saves nothing on a page whose widest names are
                themselves new members. Shaving the XP figure would mean writing it
                without the thousands separator every other count here uses.
              */}
              {row.joined.isNew ? (
                <span className="ml-1.5 text-[0.65rem] font-semibold text-moss" data-testid="record-new">
                  New 新人
                </span>
              ) : null}
            </>
          )}
        </td>
      ) : null}
      {columns.actions === undefined ? null : (
        <td className="py-1.5 text-right">
          {/*
            An empty `RowActions` where a row offers nothing, so the space a
            control would have taken is held rather than the absence patched —
            see the head of `RecordTable.tsx`, which measures what that costs.
          */}
          {row.actions ?? <RowActions />}
        </td>
      )}
    </>
  );
}
