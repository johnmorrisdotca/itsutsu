/** Where each pip of a face sits on a three-by-three grid, 0 to 8 from the top left. */
const PIPS: Record<number, readonly number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/**
 * THE LAST THROW'S TWO DICE, beside the board: ivory faces with their pips,
 * a die whose value has been used this throw shown faint. Blank before the
 * first throw, and turned a little where they landed: the same turn for the
 * same throw, so a reload lays them as they lay.
 */
export function PachisiDice({ dice, used, thrown }: { dice: readonly [number, number]; used: readonly boolean[]; thrown: number }) {
  return (
    <div className="flex items-center gap-2" data-testid="pachisi-dice" data-thrown={thrown}>
      {dice.map((value, at) => (
        <svg
          key={`${thrown}-${at}`}
          viewBox="0 0 3 3"
          className={`h-11 w-11 shrink-0 rounded-lg shadow-sm transition-opacity ${used[at] ? "opacity-35" : ""}`}
          data-testid="pachisi-die"
          data-value={value}
          data-used={used[at] ? "true" : undefined}
          role="img"
          aria-label={value === 0 ? "Not thrown yet" : `A ${value}${used[at] ? ", used" : ""}`}
          style={{ transform: `rotate(${value === 0 ? 0 : ((value * 37 + at * 53 + thrown * 11) % 13) - 6}deg)` }}
        >
          <rect x={0.04} y={0.04} width={2.92} height={2.92} rx={0.5} fill="#fbf6ea" stroke="rgba(0,0,0,0.45)" strokeWidth={0.06} />
          {(PIPS[value] ?? []).map((pip) => (
            <circle key={pip} cx={0.6 + (pip % 3) * 0.9} cy={0.6 + Math.floor(pip / 3) * 0.9} r={0.28} fill={value === 1 ? "var(--shu)" : "#2b2622"} />
          ))}
        </svg>
      ))}
    </div>
  );
}
