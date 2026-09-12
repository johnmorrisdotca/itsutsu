import {
  CELL,
  HEAD,
  ROW_CLASS,
  RecordCells,
  RecordHeadings,
  TABLE_CLASS,
  TABLE_HEAD_CLASS,
  type RecordOf,
  type WonLostDrawn,
} from "./PlayerRecord";
import { Paired } from "@/components/i18n/Paired";
import { RATING_POOLS, type RatingPool } from "@/lib/rating/pools";
import { TIER_DISPLAY, type RatingTier } from "@/lib/rating/elo";
import type { ReactNode } from "react";
import type { Streak } from "@/lib/rating/streak";

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
 */

/** Which of the optional columns a table shows. */
export type RecordColumns = {
  /** A place in the order, numbered from the top. Ladders only. */
  rank?: boolean;
  /** How settled the rating is. Meaningless where the rows are not ratings. */
  tier?: boolean;
  /** When a member came in. People only. */
  joined?: boolean;
  /**
   * Off where a row has no single rating to show — see above. On by default,
   * so a table without one has said so.
   */
  rating?: boolean;
  /** The heading over the actions column; absent means there are no actions. */
  actions?: string;
};

/** A rating as a row shows it: the number, and which ladder earned it. */
export type ShownRating = { rating: number; pool: RatingPool };

export type RecordTableRow = {
  /** React's key, and nothing else — never shown. */
  key: string;
  /**
   * The one thing that varies: a game, a member, a player, a site.
   *
   * A node rather than a named kind because these really are different — a
   * game name with its thumbnail, a member with their avatar, country and
   * badge — and pretending otherwise would put every one of those inside this
   * file. It is the ONLY slot, deliberately: everything after it is drawn
   * here, so a caller cannot spell a shared figure its own way.
   */
  subject: ReactNode;
  record: WonLostDrawn;
  /**
   * Exactly which games these counted, so every number leads to them.
   *
   * Required, not optional. `gameLinks.coverage.test.ts` enforces this by
   * regex on `<RecordCells … of={…}>` call sites; now that the call site is
   * inside this file, the guarantee moves to the type — which is stronger,
   * because a type cannot be satisfied by writing the right characters.
   */
  of: RecordOf;
  /** The run these same games are on, or null where there is not one. */
  streak: Streak | null;
  /**
   * Why the streak cell is blank, where the row knows a reason other than
   * "nothing finished yet" — a per-site total has no run because a run is an
   * order. Without it an em dash reads as a bug rather than as an answer.
   */
  streakBlankBecause?: string;
  /** Null prints a dash: a rating nobody has earned is not a rating of 1600. */
  rating?: ShownRating | null;
  tier?: RatingTier;
  joined?: { at: string; isNew: boolean };
  /** What the reader may do about this row — a button or two. */
  actions?: ReactNode;
  /** A mark on the played count, for a total that needs qualifying. */
  note?: ReactNode;
  /**
   * `data-*` attributes on the row, for identifying it rather than drawing it.
   *
   * The Computers tab tags each row with the grade it is — `data-tier="kyu"` —
   * so a browser test can say the grades come out in order without reading the
   * names. Typed as data attributes on purpose: it is a hook for tests and
   * nothing that can reach the styling, the headings or a cell's contents,
   * which is where the drift this component exists to stop would come back in.
   */
  attributes?: Record<`data-${string}`, string>;
};

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
  empty,
  testId,
  rowTestId,
  caption,
}: {
  /** The heading over the subject column — "Member", "Game", "Player". */
  subject: string;
  rows: readonly RecordTableRow[];
  columns?: RecordColumns;
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
              {columns.rank === true ? <th className={HEAD}>#</th> : null}
              <th className={HEAD}>{subject}</th>
              <RecordHeadings
                trailing={
                  <>
                    {showRating ? <th className={HEAD}>Rating</th> : null}
                    {columns.tier === true ? <th className={HEAD}>Tier</th> : null}
                    {columns.joined === true ? <th className={HEAD}>Joined</th> : null}
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
              <tr key={row.key} className={ROW_CLASS} data-testid={rowTestId} {...row.attributes}>
                {columns.rank === true ? (
                  <td className={`${CELL} text-muted`}>{index + 1}</td>
                ) : null}
                <td className="py-1.5 pr-3">{row.subject}</td>
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
                        <td className="py-1.5 text-right">{row.actions}</td>
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
