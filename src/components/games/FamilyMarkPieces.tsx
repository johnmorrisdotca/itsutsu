import type { MarkDomino } from "./games.types";

/*
 * THE PIECES A FAMILY'S MARK LAYS ON ITS LITTLE BOARD that are neither stones
 * nor cards: the Tiles family's dominoes, drawn in the mark's own cell
 * coordinates. Their own file since 2026-09-30, when `FamilyMark.tsx` reached
 * its 500-line limit.
 */

/** Where a domino end's or a die's pips sit in its square, for nought to six, in that square's 0..1. */
const MARK_PIPS: Record<number, [number, number][]> = {
  0: [],
  1: [[0.5, 0.5]],
  2: [[0.28, 0.28], [0.72, 0.72]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
  5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
  6: [[0.28, 0.22], [0.72, 0.22], [0.28, 0.5], [0.72, 0.5], [0.28, 0.78], [0.72, 0.78]],
};

export function MarkDominoes({ dominoes }: { dominoes: readonly MarkDomino[] }) {
  return (
    <>
      {dominoes.map((domino) => (
        <g key={`${domino.x}-${domino.y}`}>
          <rect x={domino.x} y={domino.y} width={2.3} height={1.15} rx={0.14} fill="#fffdf6" stroke="var(--ink)" strokeWidth={0.06} />
          <line x1={domino.x + 1.15} x2={domino.x + 1.15} y1={domino.y + 0.12} y2={domino.y + 1.03} stroke="var(--ink)" strokeWidth={0.05} />
          {domino.ends.flatMap((end, half) =>
            (MARK_PIPS[end] ?? []).map(([px, py], at) => (
              <circle key={`${half}-${at}`} cx={domino.x + half * 1.15 + 0.1 + px * 0.95} cy={domino.y + 0.1 + py * 0.95} r={0.09} fill="#22231f" />
            )),
          )}
        </g>
      ))}
    </>
  );
}
