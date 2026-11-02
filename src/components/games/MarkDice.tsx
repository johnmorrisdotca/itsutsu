import type { MarkDie } from "./familyMark.types";

/** Where a die's pips sit in its square, for one to six, in that square's 0..1. */
const MARK_PIPS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.28, 0.28], [0.72, 0.72]],
  3: [[0.28, 0.28], [0.5, 0.5], [0.72, 0.72]],
  4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
  5: [[0.28, 0.28], [0.72, 0.28], [0.5, 0.5], [0.28, 0.72], [0.72, 0.72]],
  6: [[0.28, 0.22], [0.72, 0.22], [0.28, 0.5], [0.72, 0.5], [0.28, 0.78], [0.72, 0.78]],
};

/** A die's side in a mark, in cells. */
const DIE_SIDE = 1.5;

/** Dice lying on a family mark's board, a held one ringed in vermilion as the table rings it: the Dice family's. */
export function MarkDice({ dice }: { dice: readonly MarkDie[] }) {
  return (
    <>
      {dice.map((die) => (
        <g key={`${die.x}-${die.y}`}>
          <rect x={die.x} y={die.y} width={DIE_SIDE} height={DIE_SIDE} rx={0.28} fill="#fffdf6" stroke={die.held === true ? "var(--shu)" : "var(--ink)"} strokeWidth={die.held === true ? 0.14 : 0.06} />
          {(MARK_PIPS[die.face] ?? []).map(([px, py], at) => (
            <circle key={at} cx={die.x + 0.15 + px * (DIE_SIDE - 0.3)} cy={die.y + 0.15 + py * (DIE_SIDE - 0.3)} r={0.13} fill="#22231f" />
          ))}
        </g>
      ))}
    </>
  );
}
