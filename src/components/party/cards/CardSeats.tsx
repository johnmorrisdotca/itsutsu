"use client";

import { PlayingCard } from "@/components/cards/PlayingCard";

import { MarbleChip } from "../MarbleChip";
import { CARD_TABLE_COPY } from "./cardTable.constants";

/**
 * EVERYBODY ELSE AT THE TABLE, in a row over it: their marble and name, a
 * computer marked as one, how many cards they hold (a back, never a face),
 * and their standing; the player to move ringed. In Go Fish a seat is also
 * who to ask: pressed to choose them, and a card may be dropped on them
 * (`data-card-drop`).
 */
export function CardSeats({
  seats,
  names,
  computers,
  counts,
  standing,
  toPlay,
  targets,
  target,
  onTarget,
}: {
  seats: readonly number[];
  names: readonly string[];
  computers: readonly boolean[];
  counts: readonly number[];
  standing: (seat: number) => { score: string; note?: string };
  toPlay: number | null;
  targets: readonly number[];
  target: number | null;
  onTarget: (seat: number | null) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" data-testid="cards-seats">
      {seats.map((seat) => {
        const aimable = targets.includes(seat);
        const { score, note } = standing(seat);
        const body = (
          <>
            <span className="relative w-7 shrink-0">
              <PlayingCard faceUp={false} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
              <span className="flex items-center gap-1.5 truncate text-sm font-semibold">
                <MarbleChip player={seat} />
                <span className="truncate">{names[seat]}</span>
              </span>
              <span className="text-xs text-muted">
                {CARD_TABLE_COPY.cards(counts[seat])} · {score}
                {computers[seat] ? ` · ${CARD_TABLE_COPY.computerTag}` : ""}
                {note === undefined ? "" : ` · ${note}`}
              </span>
            </span>
          </>
        );
        const ring = seat === toPlay ? "ring-2 ring-moss" : "";
        return (
          <li key={seat} data-testid="cards-seat" data-seat={seat} data-to-play={seat === toPlay ? "true" : undefined}>
            {aimable ? (
              <button
                type="button"
                className={`flex min-h-12 w-full items-center gap-2 rounded-lg border px-2 py-1 ${target === seat ? "border-ink bg-rule/70" : "border-rule-strong bg-ivory"} ${ring}`}
                aria-pressed={target === seat}
                onClick={() => onTarget(target === seat ? null : seat)}
                data-card-pile={`seat-${seat}`}
                data-card-drop=""
                data-testid="cards-seat-target"
              >
                {body}
              </button>
            ) : (
              <div className={`flex min-h-12 w-full items-center gap-2 rounded-lg border border-rule bg-paper px-2 py-1 ${ring}`}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
