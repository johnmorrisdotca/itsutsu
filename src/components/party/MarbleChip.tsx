"use client";

import { usePartyMarbles } from "./partyMarbles";
import { marbleFace } from "./party.constants";
import type { MarbleChipProps } from "./party.types";

/**
 * One player's marble: their colour, and their letter on it, so the pieces
 * can be told apart by anybody who cannot tell the colours apart. The same
 * marble stands in the holes and beside each name, so the turn line and the
 * board say whose turn it is in one picture.
 */
export function MarbleChip({ player, size = "line" }: MarbleChipProps) {
  // Every place's marble as this table shows it, with any colour a player chose (`usePartyMarbles`).
  const marbles = usePartyMarbles();
  const marble = marbles[player];
  return (
    <span
      className={[
        "relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none",
        size === "hole" ? "h-[86%] w-[86%] shadow-[1px_2px_3px_rgba(0,0,0,0.45)]" : "h-6 w-6 text-xs shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
      ].join(" ")}
      style={{
        background: marbleFace(marble),
        color: marble.ink,
        // In a hole the letter scales with the hole (the hole is a size container), as a move number does on a stone.
        ...(size === "hole" ? { fontSize: "46cqmin" } : {}),
        // White on the wood needs an edge to stand on.
        boxShadow:
          marble.letter === "W"
            ? `inset 0 0 0 0.06em rgba(0,0,0,0.35), ${size === "hole" ? "1px 2px 3px rgba(0,0,0,0.45)" : "0 1px 2px rgba(0,0,0,0.35)"}`
            : undefined,
      }}
      aria-hidden="true"
      data-marble={marble.label.toLowerCase()}
    >
      {marble.letter}
    </span>
  );
}
