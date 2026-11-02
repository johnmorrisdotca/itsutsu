"use client";

import { useSpeaker } from "@/components/i18n/LocaleProvider";

import { MarbleChip } from "../MarbleChip";

/**
 * WHO IS AT THE TABLE AND HOW EACH STANDS, one row a seat in seat order, the
 * player to move marked in words as well as by the row's colour, and one row for
 * whatever else the table holds (Sayu's pot). Every row is always drawn, so
 * nothing below moves as a game goes on.
 */
export function DiceScores({ names, figures, toPlay, heading, foot, marked }: { names: readonly string[]; figures: readonly string[]; toPlay: number | null; heading: string; foot?: { label: string; figure: string }; marked?: readonly number[] }) {
  const say = useSpeaker();
  return (
    <section className="flex flex-col gap-1" data-testid="dicetable-scores" aria-label={heading}>
      <h3 className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">{heading}</h3>
      <ol className="flex flex-col gap-1">
        {names.map((name, seat) => (
          <li key={seat} className={`flex min-h-9 items-center gap-2 rounded-md px-2 text-sm ${seat === toPlay ? "bg-rule/60 font-semibold" : ""}`} data-testid="dicetable-score" data-seat={seat} data-to-play={seat === toPlay ? "true" : undefined} data-won={marked?.includes(seat) ? "true" : undefined}>
            <MarbleChip player={seat} />
            <span className="min-w-0 flex-1 truncate">{name}</span>
            {marked?.includes(seat) ? <span className="shrink-0 text-xs font-semibold tracking-[0.12em] text-shu uppercase">{say.say("party.dice.won")}</span> : null}
            <span className="shrink-0 tabular-nums" data-testid="dicetable-figure">
              {figures[seat]}
            </span>
          </li>
        ))}
        {foot === undefined ? null : (
          <li className="flex min-h-9 items-center gap-2 border-t border-rule px-2 text-sm" data-testid="dicetable-foot">
            <span className="min-w-0 flex-1 truncate">{foot.label}</span>
            <span className="shrink-0 tabular-nums">{foot.figure}</span>
          </li>
        )}
      </ol>
    </section>
  );
}
