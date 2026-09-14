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
import { SortableHead, type RecordSort } from "./recordSort";
import { TrailingCells, trailingHeadings, trailingWidth } from "./recordTrailing";
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
 *   [#] · SUBJECT · PLAYED · W · L · D · WIN RATE · STREAK · RATING · XP ·
 *   TIER · JOINED · (actions)
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
 * - **XP DIRECTLY AFTER RATING**, because John put it there — "display
 *   directly after the Played column... never mind after the Rating column for
 *   now" — and because it is the site's other conclusion. Everything to the
 *   left of the rating is what happened at the board and the rating is what the
 *   site concluded from it; experience is what the site has recorded of the
 *   whole membership — games, yes, but also turning up, filling in a profile,
 *   making a buddy. It cannot sit among the game figures without reading as one
 *   of them, and it cannot come before the rating without putting the site's
 *   smaller conclusion in front of its main one. It sat after Tier for two
 *   releases, on the argument that Tier belongs against the rating it
 *   qualifies; the owner's placement wins, and the two conclusions now stand
 *   together with the rating's caveat one column further on.
 * - **TIER after them**, because it says how much that rating can be trusted.
 *   One column away from the rating is still beside it: on most tables of
 *   people the two are read together, and on the tables that carry no tier the
 *   rating and XP are simply the last two figures.
 * - **JOINED last of the facts**, because it is not about playing at all.
 * - **Actions last**, because they are not facts.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE LEVEL IS A MARK IN THE SUBJECT CELL; THE XP TOTAL IS A COLUMN
 * ─────────────────────────────────────────────────────────────────────────
 *
 * John asked for both by name — *"I love our leaderboard that have your win loss
 * tie record should also show your experience points and site level"* — and they
 * are drawn in two different places, which is the decision this section is here
 * to argue rather than an inconsistency.
 *
 * A member's LEVEL goes beside their NAME, in the cell the name is already in, as
 * `LevelName`'s compact badge. A level is not a figure compared DOWN a column the
 * way Played and Rating are — nothing adds levels up, and ordering by one is
 * ordering by the total behind it, which `xpBoard.sort.ts` says in so many words
 * — it is part of how this site refers to a person, like the flag and the ROBOT
 * badge already in that cell. `LevelName`'s compact form is what makes it fit,
 * and its own comment argues why the NUMBER survives and the name drops to the
 * `title`: this is the call site it was written for.
 *
 * The XP TOTAL is a column, because it is the opposite kind of thing: a figure
 * read down the page, ordered by, and indexed for it (`Member_xp_idx`, pressed
 * through `SortableHead` like every other sortable heading here). A total hidden
 * inside the subject cell could not be sorted by at all, which is the half of
 * John's sentence that a badge alone does not answer — he called this a
 * leaderboard, and a leaderboard is a thing you order.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT THE COLUMN COST, MEASURED, BECAUSE THERE WAS NO SLACK TO SPEND
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The members list fits `/players` EXACTLY — 1,118 pixels of table in 1,118 of
 * box at both 1280 and 1216 — and an over-subscribed table cuts "Challenge" off
 * the right-hand end, which is the fault 0.164.2 fixed and the one John had
 * already complained about. So the column was measured before it was added,
 * rather than after.
 *
 * The figure that decides it is the table's MIN-CONTENT width, read at 390
 * pixels where every column sits at its narrowest: 1,061 before, in a box of
 * 1,118 — so there were 57 pixels of real slack, and the table was being
 * stretched to fill its box rather than squeezed to fit it. (At 1280 each column
 * was exactly 1.054 times its narrow self, which is the stretch.)
 *
 * THE COLUMN DID NOT FIT, and it was predicted to. An XP cell at min-content is
 * at most six characters — the top of the curve is 69,995 — and was estimated at
 * 51 pixels; measured with a member seeded AT the top, it was 62. Min-content went
 * to 1,123 and "Challenge" sat 5 pixels past the right-hand edge on every row, at
 * both 1280 and 1216: the exact fault, from a column added under a comment saying
 * it fitted. That is why this section now carries measurements rather than
 * estimates, and why the seed was the widest total the column can print rather
 * than a typical one.
 *
 * THE ROOM CAME FROM JOINED, and from the part of it that was chrome. Per column,
 * what drives each width was measured rather than guessed: JOINED was 142 pixels
 * for a nine-character date, because the "New 新人" pill beside it carried 8
 * pixels of padding each side and an 8-pixel gap. It is a coloured mark now — the
 * same words, kanji, colour and weight — and gives back 18 pixels whatever rows a
 * page holds. `recordTrailing.tsx` says so beside it.
 *
 * What was weighed and not done, each on the same measurement:
 *
 * - DROPPING JOINED would have paid twice over, and taken the "New 新人" mark the
 *   paragraph over this table promises — a welcome to every new member, spent to
 *   buy 18 pixels.
 * - WIN RATE and STREAK are as wide as their HEADINGS, not their figures, and
 *   both are drawn by `RecordCells` for every table here; narrowing them on this
 *   table alone would make it a different table, the drift this file exists for.
 * - MOVING THE NEW MARK beside the name saves nothing: the widest names on a page
 *   are as likely as any to be new members.
 * - WRITING XP WITHOUT A THOUSANDS SEPARATOR would have saved one character by
 *   spelling one count differently from every count beside it.
 * - FOLDING XP INTO THE SUBJECT CELL costs no width, and cannot be sorted by.
 *
 * RE-MEASURED AFTER BOTH CHANGES, with a member seeded at 69,995: min-content
 * 1,105, so 13 pixels of slack — enough for a seven-character total. At 1280 and
 * at 1216 the box is 1,118, the table is 1,118, the overflow is NOUGHT and every
 * row is 45 pixels, with and without `sort=xp` in force; the page never scrolls
 * sideways, and at 390 the table scrolls inside its own box. Read these before
 * adding anything to this table. Thirteen pixels is not a column.
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
 * - `xp` off only on a table whose rows are not people — the same by-game
 *   breakdown, and a per-site total — since nobody is on the row to have
 *   earned anything. On by default everywhere else, and
 *   `xpColumn.coverage.test.ts` holds every `xp: false` to a written reason:
 *   this column was added to one table and not the rest, and John asked why.
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
  /*
   * Counted rather than written down, so a column added above cannot leave the
   * empty row spanning the wrong width — which is the sort of thing that looks
   * fine until the one day there are no rows. The optional columns count
   * themselves, in the same module that draws them: two places counting one set
   * of switches is how they come to disagree.
   */
  const width =
    (columns.rank === true ? 1 : 0) +
    1 + // the subject
    6 + // played, W, L, D, win rate, streak
    trailingWidth(columns);

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
                trailing={trailingHeadings({ columns, sort })}
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
                  trailing={<TrailingCells row={row} columns={columns} />}
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
