import {
  CELL,
  HEAD,
  ROW_CLASS,
  RecordCells,
  RecordHeadings,
  TABLE_CLASS,
  TABLE_HEAD_CLASS,
  playedScopeNote,
  type RecordOf,
} from "./PlayerRecord";
import { LevelName } from "@/components/xp/LevelName";
import { Paired } from "@/components/i18n/Paired";
import { RowActions } from "@/components/ui/Controls";
import { SortableHead, type RecordSort } from "./recordSort";
import { RATING_POOLS } from "@/lib/rating/pools";
import { TIER_DISPLAY } from "@/lib/rating/elo";
/*
 * The row's shape is `recordTable.types.ts` and re-exported here, because four
 * files import `RecordTableRow` from this module and a type with two doors is a
 * type that drifts. One door, one place to read the contract, and the component
 * that draws it is the one that hands it out.
 */
export type {
  RecordColumns,
  RecordTableRow,
  ShownRating,
} from "./recordTable.types";
import type { ReactNode } from "react";
import type { RecordColumns, RecordTableRow, ShownRating } from "./recordTable.types";

/**
 * ONE TABLE OF RECORDS, USED EVERYWHERE ONE IS SHOWN.
 *
 * `PlayerRecord.tsx` already held the four counts. What every page invented
 * for itself was everything AROUND them: five pages put the same five facts in
 * four column orders, spelled the counts two ways — `W L D` on three of them
 * and `Won · Lost · Drawn` on a fourth — and one of them was not a table at
 * all but a list of cards. John, who owns the site:
 *
 *   "Stats tables have to look the same… the Players page has another table…
 *    they have to render stats the same. needs to be consistent. Make sure we
 *    show the same columns in all places. Computer Players is where it's
 *    really messed up… so the task for this is CONSISTENCY and CODE REUSE and
 *    UX reuse."
 *
 * So this owns the whole table: the element, the headings, the order, the
 * alignment, the empty state and every cell after the subject. A caller hands
 * it rows and says WHICH optional columns it wants — never how to draw one.
 * That distinction is the point. A component taking a heading, a class name or
 * a cell renderer from its caller is a component that will be five different
 * tables again inside a fortnight, and nothing will fail while it happens.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE COLUMN ORDER, AND WHY IT IS THIS ONE
 * ─────────────────────────────────────────────────────────────────────────
 *
 *   [#] · SUBJECT · PLAYED · W · L · D · WIN RATE · STREAK · RATING · TIER ·
 *   JOINED · (actions)
 *
 * It is written down here because the next person will want to reorder it, and
 * a column order with no argument behind it gets reordered by whoever cares
 * most that day — which is how there came to be four of them.
 *
 * - **# and SUBJECT name the row.** A rank is part of the row's identity on a
 *   ladder, so it goes before the name rather than being a figure among the
 *   figures.
 * - **PLAYED first**, because it is the size of the claim. Everything to its
 *   right is a statement about those games, and a reader who does not know
 *   whether the sample is six or six hundred cannot read any of them.
 * - **W · L · D next**, because they are that number taken apart. They belong
 *   against it, in that order, spelled that way, on every page.
 * - **WIN RATE next**, because it is arithmetic on the three cells to its
 *   left and belongs beside its working.
 * - **STREAK next.** It is also read off the results, but it is about the
 *   RECENT ones — so it qualifies the win rate rather than restating it.
 *   "58%, and lost the last four" is the pair of facts a reader wants
 *   adjacent.
 * - **RATING after all of them**, because it is a different KIND of number.
 *   Everything to its left is what happened; the rating is what the site
 *   concluded from it. Putting the conclusion after the evidence is the only
 *   ordering that is the same sentence on every page — and it is what settles
 *   the disagreement, since the ladder had rating second and the members list
 *   had it seventh.
 * - **TIER immediately after RATING**, because it says how much that rating
 *   can be trusted and means nothing away from it.
 * - **JOINED last of the facts**, because it is not about playing at all.
 * - **Actions last**, because they are not facts.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE LEVEL IS A MARK IN THE SUBJECT CELL AND NOT AN ELEVENTH COLUMN
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A member's XP level goes beside their NAME, in the cell the name is already
 * in, as `LevelName`'s compact badge. The reason it is not a column is measured
 * rather than aesthetic: the members list fits `/players` EXACTLY — 1,118 pixels
 * of table in 1,118 of box at both 1280 and 1216 — so there is no slack for an
 * eleventh column to come out of, and taking it would cut "Challenge" off the
 * end again, the fault 0.164.2 had just finished fixing. The badge instead rides
 * the room the subject column already has: that cell is 274 pixels wide and the
 * compact badge is about thirty of them, so the table's width does not move at
 * all. Both figures are in the section below, re-measured for this change.
 *
 * It belongs there on the merits too. A level is not a figure compared DOWN a
 * column the way Played and Rating are — nothing sorts by it and nothing adds it
 * up — it is part of how this site refers to a person, like the flag and the
 * ROBOT badge already in that cell. `LevelName`'s compact form is what makes it
 * fit, and its own comment argues why the NUMBER survives and the name drops to
 * the `title`: this is the call site it was written for.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT A CALLER MAY SWITCH OFF, AND WHAT THAT COSTS
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Every column above `columns` names is ON unless switched off, so leaving one
 * out is a decision somebody made rather than a column somebody forgot. A
 * column is only switched off where it would be MEANINGLESS on that table —
 * never because it is inconvenient:
 *
 * - `tier` off wherever the rows are not ratings.
 * - `joined` off anywhere the subject is not a person with a join date.
 * - `rating` off on a table whose rows have no single rating to show — a
 *   player's own by-game breakdown counts every finished game, rated or not,
 *   across both pools, and no one rating belongs to such a row. A column of
 *   dashes is not a smaller truth, it is a column that says nothing.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * EVERY ROW IS THE SAME HEIGHT, AND IT TAKES BOTH OF THESE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * A row's height belongs to the table, not to what that particular row
 * happens to hold. On the members list it belonged to neither: the rows were
 * 59 pixels, the reader's own 45, the seven programs 53 and the two kept
 * records 45. Three heights in one table, which reads as three kinds of thing.
 *
 * Neither cause was a missing element as such. Both were WRAPPING, and each
 * wrapped in a different cell:
 *
 * - The ordinary rows were tallest because the "☆ Buddy" button broke over
 *   two lines — 46 pixels of controls where the other two buttons beside it
 *   were 30.
 * - A program's row was tallest because its NAME broke over two lines: a long
 *   one, a flag and a ROBOT badge in a column squeezed to 223 pixels.
 * - A row with no controls at all had nothing holding the controls' height,
 *   so it fell to whatever the rest of the line came to.
 *
 * So the fix is two rules, and the missing one is the reason this was only
 * ever half fixed before:
 *
 * 1. **Nothing in a record row wraps.** These cells are short facts — a
 *    count, a rate, a run, a rating, two or three small controls — and a cell
 *    that takes a second line makes ONE row taller than its neighbours. Wide
 *    is the right answer instead of tall: the table already scrolls inside its
 *    own `overflow-x-auto`, which is what AGENTS.md asks of wide content. The
 *    headings have said this for releases — see `HEAD` in `PlayerRecord.tsx`,
 *    where a wrapped "WIN RATE" threw one table half a line out against the
 *    one beside it — and the body was left to wrap where it liked.
 *
 *    WHAT THAT COSTS, MEASURED, because somebody will want to weigh it. When
 *    this was written the members list wanted 1,051 pixels in a box of 990, so
 *    the right-hand end of the actions column sat 61 past the edge and had to
 *    be scrolled to. The table was ALWAYS over-subscribed by that much and
 *    wrapping is how the browser hid it, at the price of the ragged rows this
 *    is about. 0.164.2 answered it the way the sentence said to — a decision
 *    about the PAGE rather than a licence to let one row be taller than the row
 *    above it: `/players` is `width="wide"` (`max-w-6xl`) now, not `standard`.
 *
 *    RE-MEASURED AFTER THAT MOVE, at 1280 and at 1216: the box is 1,118 at
 *    both, the table is 1,118, and the overflow is NOUGHT. It fits, and it fits
 *    with no slack whatever — which is a better place to be and a more
 *    dangerous one, because the next column has nowhere to come from and the
 *    failure it causes is silent. Read these numbers before adding one.
 *
 *    RE-MEASURED AGAIN when the members directory learned to sort, because six
 *    of its headings became LINKS with a direction arrow after them. Box 1,118,
 *    table 1,118, overflow nought, every row 45 pixels — at 1280 and at 1216,
 *    with and without a sort in force. It costs nothing because an arrow is a
 *    character inside a heading whose column is already wider than its label,
 *    which is the same room the level badge rides in the subject cell. A
 *    seventh heading is not a column and neither is a sort.
 * 3. **A badge added to the subject cell needs a flex row, or it is a second
 *    LINE.** The XP level went in as a plain sibling of `row.subject` and made
 *    36 of the 209 rows on /players 53 pixels against the other 45 — this
 *    fault, reintroduced by the commit after the one that fixed it. Nothing
 *    wrapped and nothing was too long: every caller's subject is a
 *    `display: flex` span, which is a BLOCK-level box, so an inline badge after
 *    one starts a new line inside the cell. Eight pixels, on the rows that had
 *    a level and on no others, which reads as "some members are different"
 *    rather than as a layout fault. The remedy is to make the two flex items of
 *    one row; the general rule is that anything added beside a subject joins its
 *    line rather than following it.
 * 2. **The controls' height is held whether a row has controls or not.** Your
 *    own row has nobody to befriend, a kept record has nobody to challenge,
 *    and a program has no account to act on — so all three are handed an empty
 *    `RowActions`, which is that component's whole purpose. Held by the TABLE
 *    rather than by each caller: `RowActions` says "there is nothing to
 *    remember per table", and that is only true if the table does it. Every
 *    caller returning `null` for a row with nothing to offer was doing the
 *    right thing; the cell was dropping the space on the floor.
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

export function RecordTable({
  subject,
  rows,
  columns = {},
  playedScope,
  empty,
  testId,
  rowTestId,
  caption,
  sort,
}: {
  /** The heading over the subject column — "Member", "Game", "Player". */
  subject: string;
  rows: readonly RecordTableRow[];
  columns?: RecordColumns;
  /**
   * What this table's Played column counts, when a reader could not tell from
   * the number alone — the ladder's is rated games in one pool, and looks
   * identical to a member's own page's, which is every finished game in
   * either. Left unset everywhere Played needs no footnote: that is most
   * tables, and a heading explaining itself on all of them would be a
   * footnote nobody asked for. Worded the same way the streak cell already
   * words its own scope, from the same shape of `of`.
   */
  playedScope?: RecordOf;
  /**
   * What no rows MEANS here, under the headings.
   *
   * AN EMPTY TABLE IS DATA, and this is the half that gets got wrong. John:
   * "empty tables are fine! show the table. Show nothing has been played
   * yet… and that's a change to have a link saying - be the first to play!"
   * So the headings are always drawn and this fills one row beneath them —
   * a reader learns the shape of what the site keeps before there is anything
   * in it, and an untouched list becomes an invitation rather than an
   * apology. Required, so no table can quietly answer an empty list with
   * nothing at all.
   */
  empty: ReactNode;
  testId: string;
  rowTestId?: string;
  /** A line under the table — what a mark in it means, usually. */
  caption?: ReactNode;
  /**
   * How this table sorts, when it does — see `RecordSort`.
   *
   * Optional, and every table that leaves it out keeps the headings it has
   * always had. That is deliberate rather than transitional: a table whose rows
   * are assembled in memory from several reads cannot be ordered by the
   * database, and a heading that sorted the loaded page in the browser would lie
   * the moment there were two pages. The members directory is exactly that, and
   * says so where its rows are built.
   */
  sort?: RecordSort;
}) {
  const showRating = columns.rating !== false;
  /*
   * Counted rather than written down, so a column added above cannot leave the
   * empty row spanning the wrong width — which is the sort of thing that looks
   * fine until the one day there are no rows.
   */
  const width =
    (columns.rank === true ? 1 : 0) +
    1 + // the subject
    6 + // played, W, L, D, win rate, streak
    (showRating ? 1 : 0) +
    (columns.tier === true ? 1 : 0) +
    (columns.joined === true ? 1 : 0) +
    (columns.actions === undefined ? 0 : 1);

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <table className={TABLE_CLASS} data-testid={testId}>
          <thead className={TABLE_HEAD_CLASS}>
            <tr>
              {/*
                THE RANK IS NOT A SORT, and the difference matters once a
                heading can be pressed. It is the row's place in the order
                currently in force — numbered from the top of the page — so
                "sort by #" would mean "sort by the order you are already in".
                A plain heading is the honest answer.
              */}
              {columns.rank === true ? <th className={HEAD}>#</th> : null}
              {/*
                The subject heading sorts on exactly one table — the members
                directory, by name — and is plain text everywhere else, which is
                what `SortableHead` does for a slot no spec names. It is drawn
                through the same component as every other heading so that the
                arrow, the `aria-sort` and the "press to reverse" label are the
                one implementation rather than a second one for this column.
              */}
              <SortableHead sort={sort} slot="subject">
                {subject}
              </SortableHead>
              <RecordHeadings
                playedTitle={playedScope === undefined ? undefined : playedScopeNote(playedScope)}
                sort={sort}
                trailing={
                  <>
                    {showRating ? (
                      <SortableHead sort={sort} slot="rating">
                        Rating
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
                    {columns.actions === undefined ? null : (
                      <th className={HEAD}>{columns.actions}</th>
                    )}
                  </>
                }
              />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className={ROW_CLASS}>
                <td colSpan={width} className="py-3 text-sm text-muted" data-testid={`${testId}-empty`}>
                  {empty}
                </td>
              </tr>
            ) : null}
            {rows.map((row, index) => (
              // `whitespace-nowrap` on the row, so no cell can wrap — see above.
              <tr
                key={row.key}
                className={`${ROW_CLASS} whitespace-nowrap`}
                data-testid={rowTestId}
                {...row.attributes}
              >
                {columns.rank === true ? (
                  <td className={`${CELL} text-muted`}>{index + 1}</td>
                ) : null}
                <td className="py-1.5 pr-3">
                  {/*
                    ONE FLEX ROW, AND THE THIRD RULE ABOVE IS WHY. Measured: as
                    a plain sibling of `row.subject` the badge made 36 of 209
                    rows on /players 53 pixels against the other 45. Only where
                    there IS a level, so a table with none keeps the markup
                    0.164.2 measured. `items-baseline`, so the badge sits on the
                    name's baseline even where a subject is two lines tall — the
                    Bots tab puts a grade under the name. And AFTER the subject,
                    never inside it: an anchor within an anchor is invalid HTML
                    and a browser drops one of them silently.
                  */}
                  {typeof row.level === "number" ? (
                    <span className="flex min-w-0 items-baseline gap-2">
                      {row.subject}
                      <LevelName level={row.level} compact className="text-muted" testId="record-level" />
                    </span>
                  ) : (
                    row.subject
                  )}
                </td>
                <RecordCells
                  record={row.record}
                  of={row.of}
                  streak={row.streak}
                  streakBlankBecause={row.streakBlankBecause}
                  note={row.note}
                  trailing={
                    <>
                      {showRating ? <RatingCell rating={row.rating ?? null} /> : null}
                      {columns.tier === true ? (
                        <td className="py-1.5 pr-3">
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
                              {new Date(row.joined.at).toLocaleDateString()}
                              {row.joined.isNew ? (
                                <span className="ml-2 rounded-full bg-moss-soft px-2 py-0.5 text-[0.65rem] font-semibold text-moss">
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
                            An empty `RowActions` where a row offers nothing, so
                            the space a control would have taken is held rather
                            than the absence patched — see the head of this file.
                          */}
                          {row.actions ?? <RowActions />}
                        </td>
                      )}
                    </>
                  }
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption}
    </div>
  );
}
