import Link from "next/link";

import { Paired } from "@/components/i18n/Paired";
import { CELL, HEAD, ROW_CLASS, TABLE_CLASS, TABLE_HEAD_CLASS } from "@/components/players/PlayerRecord";
import { countText } from "@/lib/rating/figures";
import type { LadderRung } from "@/lib/xp/levelLadder";
import { levelPath } from "@/lib/xp/levelNames";

/**
 * THE WHOLE LADDER, A HUNDRED RUNGS, SCROLLED RATHER THAN PAGED.
 *
 * A hundred rows is not a table that wants a pager, a sort or a cursor. It is a
 * reference — the same thing a rules page is — and a reader goes down it looking
 * for the rung above theirs, or for the name they were just called. Paging it
 * would put level 21 on a second page for no reason but that lists on this site
 * usually have one, and sorting it would destroy the only order it has: a ladder
 * is its sequence.
 *
 * So it consumes none of the paging convention, and that is a decision rather
 * than an omission. `paging.ts` exists for lists whose length the site does not
 * control — every finished game, every member. This list is exactly a hundred
 * rows for ever, decided in a constants file, and the cost of drawing all of it
 * is one pass over an array already in memory.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHAT MAKES IT READABLE, SINCE A HUNDRED ROWS OF ANYTHING IS A WALL
 * ─────────────────────────────────────────────────────────────────────────
 *
 * - **The milestones are marked.** 10, 25, 50, 75 and 100 carry an accent and
 *   the level number is set in the moss. They are the rungs somebody would
 *   screenshot, and they give the eye somewhere to land.
 * - **Every tenth rung starts a band**, with a stronger rule above it, so the
 *   sequence can be counted down rather than read.
 * - **The reader's own rung is marked where they stand**, which is the one row
 *   they came for. It carries `aria-current` as well as a colour, because "you
 *   are here" said only in a background is not said to everybody.
 * - **The note is prose and is not set in the mono face.** Every other cell here
 *   is a number or a name and lines up; a sentence about Pac-Man in tabular
 *   figures reads as data, which it is not.
 */

/** The ladder's own headings. Plain words: this table sorts by nothing. */
function Headings() {
  return (
    <thead className={TABLE_HEAD_CLASS}>
      <tr>
        <th className={HEAD} scope="col">
          Level
        </th>
        <th className={HEAD} scope="col">
          Name
        </th>
        <th className={HEAD} scope="col" title="Total XP a member must hold to stand on this rung">
          To reach
        </th>
        <th className={HEAD} scope="col" title="XP climbed from the rung below">
          Climb
        </th>
        <th className={HEAD} scope="col">
          Why this one
        </th>
      </tr>
    </thead>
  );
}

/**
 * One rung.
 *
 * The kanji goes through `Paired` only where the level HAS one, which is a
 * minority of the hundred. `Paired` is a client component, so one per row would
 * be a hundred islands in a server-rendered table — and with an empty kanji it
 * renders the English and nothing else, so the two branches put the same markup
 * on the page. Where there is kanji it is `Paired` and not a hand-rolled
 * `font-mincho` span, because the rule for how the two scripts sit together
 * belongs in that component and nowhere else.
 */
function Rung({ rung, here }: { rung: LadderRung; here: boolean }) {
  const band = rung.level % 10 === 1 && rung.level !== 1;
  const accent = rung.milestone ? "font-semibold text-moss" : "";

  return (
    <tr
      className={`${ROW_CLASS} ${band ? "border-t-rule-strong" : ""} ${
        here ? "bg-moss-soft" : rung.milestone ? "bg-shade" : ""
      }`.trim()}
      aria-current={here ? "true" : undefined}
      data-testid={here ? "your-rung" : "ladder-rung"}
      data-level={rung.level}
      data-milestone={rung.milestone ? "" : undefined}
    >
      <td className={`${CELL} ${accent}`}>
        {rung.level}
        {here ? (
          <span className="ml-2 font-sans text-[0.65rem] tracking-wide text-moss uppercase">
            You
          </span>
        ) : null}
      </td>
      <td className="py-1.5 pr-3">
        <Link
          href={levelPath(rung.level)}
          className={`underline-offset-4 hover:underline ${accent}`.trim()}
          data-testid="ladder-level-link"
        >
          {rung.kanji === "" ? (
            rung.name
          ) : (
            <Paired en={rung.name} kanji={rung.kanji} kanjiClassName="text-xs font-normal opacity-70" />
          )}
        </Link>
      </td>
      <td className={CELL}>{countText(rung.toReach)}</td>
      <td className={`${CELL} text-muted`}>
        {/* Nobody climbed to level 1, so there is no figure for it. An em dash
            rather than a nought, which would read as a rung that was free. */}
        {rung.step === 0 ? "—" : countText(rung.step)}
      </td>
      <td className="py-1.5 pr-3 text-sm text-ink-soft">{rung.note}</td>
    </tr>
  );
}

export function LevelLadder({
  rungs,
  /** The rung the reader stands on, or null when there is nobody to mark. */
  standing,
}: {
  rungs: readonly LadderRung[];
  standing: number | null;
}) {
  return (
    /* Five columns with a sentence in the last one, so the table scrolls inside
       its own box rather than making the page scroll sideways on a phone. */
    <div className="overflow-x-auto" data-testid="level-ladder">
      <table className={TABLE_CLASS}>
        <caption className="sr-only">
          Every level of the experience ladder, with what it is called, what it costs to reach,
          and why the name was chosen.
        </caption>
        <Headings />
        <tbody>
          {rungs.map((rung) => (
            <Rung key={rung.level} rung={rung} here={rung.level === standing} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
