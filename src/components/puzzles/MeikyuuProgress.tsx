import type { SizeProgress } from "@/lib/puzzles/meikyuu/completion";
import { meikyuuTallShape } from "@/lib/puzzles/meikyuu/sizes";

import { PROGRESS_COPY } from "./meikyuu.constants";

/** What a size is called in a row of progress: "Small", and "6×9" for a tall size (the section says it is tall). */
export function progressName(size: number, label: (size: number) => string): string {
  const tall = meikyuuTallShape(size);
  return tall === null ? label(size) : `${tall.width}×${tall.height}`;
}

/**
 * HOW MANY LEVELS OF EACH SIZE ARE SOLVED, one row a size: its name, a bar, "12 of 256", and a mark when it is whole
 * (`completion.ts`, John, 2026-10-02: "encouraging people to finish them all"). Nothing is locked; this is what there is to
 * finish. The rows keep their places whatever is solved, so choosing a size or solving a level moves nothing, and the bar is
 * drawn at the share done with the figures beside it for anybody who cannot see the bar.
 */
export function MeikyuuProgress({ rows, label, className = "" }: { rows: readonly SizeProgress[]; label: (size: number) => string; className?: string }) {
  return (
    <ul className={`flex w-full flex-col gap-1.5 ${className}`} aria-label={PROGRESS_COPY.legend} data-testid="meikyuu-progress">
      {rows.map((row) => (
        <li key={row.size} className="grid grid-cols-[3.75rem_minmax(0,1fr)_auto] items-center gap-2 text-xs tabular-nums" data-testid="meikyuu-progress-row" data-size={row.size} data-solved={row.solved} data-complete={row.complete ? "true" : "false"}>
          <span className="truncate text-ink-soft">{progressName(row.size, label)}</span>
          <span className="h-1.5 overflow-hidden rounded-full bg-rule/70" aria-hidden="true">
            <span className={`block h-full rounded-full ${row.complete ? "bg-moss" : "bg-ink/45"}`} style={{ width: `${row.count === 0 ? 0 : Math.round((100 * row.solved) / row.count)}%` }} />
          </span>
          <span className="min-w-[5.75rem] text-right text-muted" data-testid="meikyuu-progress-figure">
            {PROGRESS_COPY.of(row.solved, row.count)}
            {row.complete ? (
              <span className="ml-1 font-semibold text-moss" title={PROGRESS_COPY.whole} data-testid="meikyuu-progress-whole">
                ✓
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
