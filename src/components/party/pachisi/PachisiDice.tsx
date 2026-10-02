import { PartyDie } from "../PartyDie";
import { PACHISI_TUMBLE_MS } from "./pachisi.constants";

/**
 * THE LAST THROW'S TWO DICE, beside the board: Korokoro's die (`PartyDie`),
 * which tumbles after a throw made while the table is open and lands on the
 * face the game threw, a die whose value has been used this throw shown
 * faint. Blank before the first throw. A table opened on a throw already made
 * shows it at rest, so a reload lays the dice as they lay.
 */
export function PachisiDice({ dice, used, thrown }: { dice: readonly [number, number]; used: readonly boolean[]; thrown: number }) {
  return (
    <div className="flex items-center gap-2" data-testid="pachisi-dice" data-thrown={thrown}>
      {dice.map((value, at) => (
        <span
          key={at}
          className={`relative block size-11 shrink-0 transition-opacity ${used[at] ? "opacity-35" : ""}`}
          data-testid="pachisi-die"
          data-value={value}
          data-used={used[at] ? "true" : undefined}
          role="img"
          aria-label={value === 0 ? "Not thrown yet" : `A ${value}${used[at] ? ", used" : ""}`}
        >
          {/* Mounted before the first throw too, so the first throw tumbles; hidden under the empty square until then. */}
          <span className={`block ${value === 0 ? "invisible" : ""}`}>
            <PartyDie face={value} rollKey={thrown} tumble={value > 0} tumbleMs={PACHISI_TUMBLE_MS} />
          </span>
          {value === 0 ? <span className="absolute inset-[4%] rounded-lg border border-black/45 bg-[rgba(251,246,234,0.55)]" aria-hidden="true" /> : null}
        </span>
      ))}
    </div>
  );
}
