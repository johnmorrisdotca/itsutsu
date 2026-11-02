"use client";

import { PartyDie } from "../PartyDie";

/**
 * A ROW OF SMALL DICE LYING STILL, for what is not being thrown: the dice set
 * aside this turn at Ten Thousand, a lifted cup at Liar's Dice. Korokoro's die
 * like every other, told its face. A die of 0 is hidden: an empty square.
 */
export function SmallDice({ dice, label, testId }: { dice: readonly number[]; label: string; testId: string }) {
  return (
    <span className="flex min-h-8 flex-wrap items-center gap-1" role="img" aria-label={`${label}: ${dice.join(", ")}`} data-testid={testId} data-dice={dice.join("")}>
      {dice.map((die, at) => (
        <span key={at} className="block w-7 shrink-0">
          {die === 0 ? <span className="block aspect-square w-full rounded-[18%] border-2 border-black/40 bg-rule/60" aria-hidden="true" /> : <PartyDie face={die} rollKey={0} tumble={false} tumbleMs={0} />}
        </span>
      ))}
    </span>
  );
}
