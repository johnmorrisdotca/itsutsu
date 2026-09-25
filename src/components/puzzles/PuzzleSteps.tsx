"use client";

import { ReplayScrubber } from "@/components/history/ReplayScrubber";

/** The one cell a step changed, and what it became; null where the step changed none or several. */
function changeOf<V>(before: readonly V[], after: readonly V[]): { index: number; value: V } | null {
  let found: { index: number; value: V } | null = null;
  for (let index = 0; index < after.length; index += 1) {
    if (before[index] === after[index]) continue;
    if (found !== null) return null;
    found = { index, value: after[index] as V };
  }
  return found;
}

/**
 * THE SCRUBBER UNDER A PUZZLE'S BOARD, AND ITS STEPS FOLDED BELOW IT.
 *
 * Full width of the board, the controls under it (`ReplayScrubber`, the one
 * every replay on the site uses), and the list of entries shut until opened —
 * John, 2026-09-25: "full board width. controls below it. Hidden move list that
 * can reveal when opened. keep the page simple and as minimal as possible."
 * Drawn from the start, the same height throughout, so nothing moves when the
 * first entry is made.
 */
export function PuzzleSteps<V>({
  steps,
  viewing,
  go,
  size,
  say,
}: {
  steps: readonly (readonly V[])[];
  viewing: number;
  go: (index: number) => void;
  size: number;
  /** What a cell's new value reads as: "7", "black", "a cross", "cleared". */
  say: (value: V) => string;
}) {
  // Drawn from the start, at zero steps, so it never arrives and pushes the page down at the first entry.
  const last = steps.length - 1;
  return (
    <div className="flex flex-col gap-2" data-testid="puzzle-steps" data-viewing={viewing} data-last={last}>
      <ReplayScrubber index={viewing} last={last} onGo={go} testId="puzzle-steps" />
      <details className="text-sm" data-testid="puzzle-steps-list">
        <summary className="cursor-pointer text-xs text-muted">
          {last} {last === 1 ? "step" : "steps"}
        </summary>
        <ol className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-rule">
          {steps.slice(1).map((step, at) => {
            const number = at + 1;
            const change = changeOf(steps[at] as readonly V[], step);
            return (
              <li key={number}>
                <button
                  type="button"
                  onClick={() => go(number)}
                  className={`flex w-full gap-2 px-2.5 py-1 text-left hover:bg-shade ${number === viewing ? "bg-shade font-semibold" : ""}`}
                >
                  <span className="w-7 shrink-0 text-right font-mono text-xs text-muted tabular-nums">{number}</span>
                  <span>
                    {change === null
                      ? "several cells"
                      : `row ${Math.floor(change.index / size) + 1}, column ${(change.index % size) + 1}: ${say(change.value)}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </details>
    </div>
  );
}
