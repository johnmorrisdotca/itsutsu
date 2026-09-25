import { Paired } from "@/components/i18n/Paired";

import { MY_GAMES_COPY } from "./mine.constants";

/**
 * A MY GAMES PANEL'S HEADING: its name, and its count large beside it —
 * moss when the panel is waiting on the reader, ink when it has rows, grey
 * when it has none — with "· showing 5" after it when the panel shows fewer
 * rows than it counts. One heading for every panel on /play, the games' and
 * the puzzles' alike, so a count reads the same wherever it is.
 */
export function GroupHeading({
  label,
  kanji,
  total,
  showing = null,
  waiting = false,
  testId,
}: {
  label: string;
  kanji: string;
  total: number;
  /** How many rows the panel shows, when that is fewer than it counts. */
  showing?: number | null;
  /** A panel waiting on the reader (your move, an offer to you): its count is lit. */
  waiting?: boolean;
  /** The panel's own id; the count is `${testId}-count`. */
  testId: string;
}) {
  return (
    <h3 className="flex items-center gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
      <Paired en={label} kanji={kanji} kanjiClassName="text-[0.8rem] font-normal tracking-normal" />
      {/* The number first and large; "· showing 5" after it in the same run of text, which is what a spec reads. */}
      <span className="text-sm font-normal tracking-normal normal-case" data-testid={`${testId}-count`}>
        <span
          className={`inline-flex min-w-8 items-center justify-center rounded-full px-2.5 py-0.5 text-lg font-semibold tabular-nums ${
            total > 0 && waiting ? "bg-moss text-paper" : total > 0 ? "bg-ink text-paper" : "bg-rule/70 text-muted"
          }`}
        >
          {total}
        </span>
        {showing !== null ? <> {MY_GAMES_COPY.showing(showing)}</> : null}
      </span>
    </h3>
  );
}
