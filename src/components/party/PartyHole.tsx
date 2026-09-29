import { HEX_LATTICE } from "@/components/board/Board.constants";

import { MarbleChip } from "./MarbleChip";
import type { PartyHoleProps } from "./party.types";

/**
 * ONE PLACE A PIECE CAN STAND on a table's board — a hole of the star, a
 * square of Halma's board — as a button, with the marble standing in it, if
 * any. The picked-up piece is ringed, where it may go is dotted, and the last
 * move is marked, the same on every board a table plays on. A piece held over
 * the board before it is laid (Block Five for four) shows faded in its
 * player's colour, and ringed in red where the rules refuse it.
 */
export function PartyHole({ point, owner, label, target, picked, last, enabled, unslant, onHole, ghost = null, onAim }: PartyHoleProps) {
  return (
    <button
      type="button"
      onClick={() => onHole(point)}
      onPointerEnter={onAim === undefined ? undefined : (event) => event.pointerType === "mouse" && onAim(point)}
      disabled={!enabled}
      aria-label={label}
      aria-pressed={picked}
      data-testid="party-hole"
      data-row={point.row}
      data-col={point.col}
      data-owner={owner ?? ""}
      data-target={target ? "true" : undefined}
      data-picked={picked ? "true" : undefined}
      data-ghost={ghost === null ? undefined : ghost.allowed ? "allowed" : "refused"}
      className="relative flex aspect-square items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-moss disabled:cursor-default"
    >
      {/* On the lattice the cell is sheared; the marble inside leans back so it is round again, as `Intersection` does. */}
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{ ...(unslant ? { transform: HEX_LATTICE.unslant } : {}), containerType: "size" }}
      >
        {owner === null ? null : <MarbleChip player={owner} size="hole" />}
        {ghost !== null && owner === null ? (
          <span className={`absolute inset-0 flex items-center justify-center ${ghost.allowed ? "opacity-70" : "opacity-35"}`}>
            <MarbleChip player={ghost.player} size="hole" />
          </span>
        ) : null}
        {ghost !== null && !ghost.allowed ? <span className="absolute inset-[4%] rounded-full border-[0.14em] border-shu" data-mark="refused" /> : null}
        {picked ? <span className="absolute inset-[2%] rounded-full border-[0.16em] border-ink" /> : null}
        {last && !picked ? <span className="absolute inset-[4%] rounded-full border-[0.1em] border-dashed border-shu" /> : null}
        {target ? <span className="absolute inset-[32%] rounded-full bg-moss opacity-85" data-mark="target" /> : null}
      </span>
    </button>
  );
}
