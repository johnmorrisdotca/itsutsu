import Link from "@/components/ui/Link";
import type { ReactNode } from "react";

import { BUTTON_BASE, BUTTON_QUIET, PANEL_CLASS, SECTION_TITLE, TABLE_SCROLL } from "@/components/ui/ui.constants";
import { clockText } from "@/lib/puzzles/clockText";
import { dailyWordsPath } from "@/lib/puzzles/dailyWords/dailyAddress";
import type { DailyStatus } from "@/lib/puzzles/dailyWords/dailyWords.types";
import { guessesText } from "@/lib/puzzles/gomoji/guessesTaken";
import { FUTAGO_DISPLAY } from "@/lib/puzzles/gomoji/futago";

import type { DailyWordButtonsProps } from "./dailyWords.types";
import { SolveTime } from "./SolveTime";
import type { PuzzleKind } from "@/lib/puzzles/puzzles.types";

/**
 * TODAY'S WORDS, ONE BUTTON A LENGTH: "Today's 4", "Today's 5" — in kana
 * "Today's 3" as well. John, 2026-09-26: "I want a TODAYS 5, TODAYS 4, Todays
 * 3 sort of thing... so users can play N different times daily against their
 * friends. The text should be a button too, and perhaps we need a table to
 * nicely show the 3 buttons."
 *
 * A row a length, from the kind's own sizes (`dailyLengths`), so a new size
 * gets its button the day it ships. Each button is a link to that length's
 * word today, and beside it where the reader stands: found (the time and the
 * guesses), missed, half done, or not yet. The side is left off for a reader
 * nobody is signed in as, who has nothing to stand on, and for the prerendered
 * shell the live one replaces.
 *
 * Drawn on a puzzle's front door under the Play button, and on its set-up in
 * a panel of its own. Two narrow columns, so it fits a 390-pixel phone.
 */
export function DailyWordButtons({ kind, rows, todayHref, framed }: DailyWordButtonsProps) {
  /*
   * A Futago's day beside the word's, a table of its own under the first: two
   * words at every length (`futago.ts`), "Futago 5" beside where the reader
   * stands with it, as each word's row has.
   */
  const table = (
    <div className="flex flex-col gap-2">
      <ButtonTable kind={kind} rows={rows} testId="daily-words-table" label={(size) => <>Today&apos;s {size} <span className="font-mincho opacity-70">今日の{size}</span></>} prefix="daily" />
      <ButtonTable kind={kind}
        rows={rows.map((row) => ({ size: row.size, ...row.futago }))}
        testId="futago-daily-table"
        label={(size) => (
          <>
            {FUTAGO_DISPLAY.label} {size} <span className="font-mincho opacity-70">{FUTAGO_DISPLAY.kanji}の{size}</span>
          </>
        )}
        prefix="futago-daily"
      />
    </div>
  );
  const links = (
    <p className="flex flex-wrap justify-center gap-x-3 text-xs">
      {todayHref === null ? null : (
        <Link href={todayHref} className="text-muted underline-offset-2 hover:underline" data-testid="daily-today-fastest">
          Today&apos;s fastest <span className="font-mincho">最速</span>
        </Link>
      )}
      <Link href={dailyWordsPath(kind)} className="text-muted underline-offset-2 hover:underline" data-testid="daily-archive-link">
        Past words <span className="font-mincho">過去</span> →
      </Link>
    </p>
  );
  if (framed) {
    return (
      <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="daily-words">
        <h2 className={SECTION_TITLE}>
          Today&apos;s words <span className="font-mincho normal-case tracking-normal">今日の言葉</span>
        </h2>
        <p className="text-xs text-muted">The same word for everybody today at each length, and the same two for a {FUTAGO_DISPLAY.label}, new at midnight UTC.</p>
        {table}
        {links}
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-1.5" data-testid="daily-words">
      <p className="text-center text-xs font-semibold text-muted">
        Today&apos;s words <span className="font-mincho">今日の言葉</span>
      </p>
      {table}
      {links}
    </section>
  );
}

function StatusText({ kind, status }: { kind: PuzzleKind; status: DailyStatus }) {
  if (status.state === "found") {
    return (
      <span className="text-moss">
        ✓ <SolveTime kind={kind} solveId={status.solveId} elapsedMs={status.elapsedMs} mine />
        {status.guesses === null ? null : <span className="text-muted"> · {guessesText(status.guesses)}</span>}
      </span>
    );
  }
  if (status.state === "missed") return <span className="text-muted">✗ not found{status.guesses === null ? "" : ` · ${guessesText(status.guesses)}`}</span>;
  if (status.state === "going") return <span>Half done</span>;
  return <span className="text-muted">Not yet</span>;
}

/** One table of today's buttons, a row a length: the button, and where the reader stands with it where anybody is signed in to say. */
function ButtonTable({
  kind,
  rows,
  testId,
  label,
  prefix,
}: {
  kind: PuzzleKind;
  rows: readonly { size: number; href: string; status: DailyStatus | null }[];
  testId: string;
  label: (size: number) => ReactNode;
  /** The test ids' start: "daily" for the words, "futago-daily" for the Futagos. */
  prefix: string;
}) {
  const showStatus = rows.some((row) => row.status !== null);
  return (
    <div className={TABLE_SCROLL}>
      <table className="w-full text-sm" data-testid={testId}>
        <tbody>
          {rows.map((row) => (
            <tr key={row.size} data-testid={`${prefix}-row`} data-size={row.size}>
              <td className="py-0.5 pr-2">
                <Link href={row.href} className={`${BUTTON_BASE} ${BUTTON_QUIET} w-full whitespace-nowrap`} data-testid={`${prefix}-play`} data-size={row.size}>
                  {label(row.size)}
                </Link>
              </td>
              {showStatus ? (
                <td className="py-0.5 text-xs whitespace-nowrap tabular-nums" data-testid={`${prefix}-status`} data-state={row.status?.state ?? "unknown"}>
                  {row.status === null ? null : <StatusText kind={kind} status={row.status} />}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
