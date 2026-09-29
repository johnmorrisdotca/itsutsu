"use client";

import { PIECE_COLOURS, PIECE_COLOUR_LIST, pieceFace, type PieceColour } from "@/lib/pieces/pieceColours";

/**
 * THE COLOUR OF ONE PLAYER'S PIECES, CHOSEN BY LOOKING. John, 2026-09-29:
 * "just like we have the board colour selection we can have the marble
 * selection… we just do colours, nice colours, and no patterns." And, of the
 * board's picker: "Reserve the use of Circles for Marble colours."
 *
 * So this is `FeltPatches`' twin: a row of small round pieces, the chosen one
 * ringed, no words on the page, each saying its name to a screen reader and on
 * hover. The first is the seat's ordinary piece — `usual`, drawn as the stone
 * or marble it would have been — so choosing nothing is a choice on the row,
 * and the feature stays optional. A colour the table cannot take (the other
 * side has it, or it looks too like their pieces) is drawn faint and cannot be
 * pressed, and says why on hover.
 *
 * ONE COMPONENT, on every set-up and beside every board that offers a colour —
 * a stone game's seat, a party table's place, a live game's first move — so
 * none of them draws its own copy.
 */
export function PieceColourPicker({
  value,
  onChoose,
  usual,
  label,
  unavailable = () => null,
  disabled = false,
  testId = "piece-colours",
}: {
  /** The colour chosen, or null for the seat's ordinary pieces. */
  value: PieceColour | null;
  onChoose: (colour: PieceColour | null) => void;
  /** The ordinary piece: what it looks like, and its name ("Black stones", "Player 2's marble"). */
  usual: { face: string; name: string };
  /** What the row chooses, to a screen reader: "Your pieces", "Black's colour". */
  label: string;
  /** Why a colour cannot be taken here, or null where it can. */
  unavailable?: (colour: PieceColour) => string | null;
  disabled?: boolean;
  testId?: string;
}) {
  const swatch = (key: string, face: string, name: string, chosen: boolean, why: string | null, press: () => void) => (
    <button
      key={key}
      type="button"
      role="radio"
      aria-checked={chosen}
      aria-label={why === null ? name : `${name}: ${why}`}
      title={why === null ? name : `${name} — ${why}`}
      disabled={disabled || why !== null}
      onClick={press}
      data-testid="piece-colour"
      data-colour={key}
      data-chosen={chosen ? "true" : "false"}
      // A fingertip on a phone (44px, as every control there is) around a swatch drawn at its own size; the ring shows on the swatch.
      className="group flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none disabled:cursor-not-allowed sm:size-7"
    >
      <span
        aria-hidden
        className={`block size-6 rounded-full transition-shadow group-focus-visible:ring-2 group-focus-visible:ring-moss ${
          chosen ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "group-hover:ring-1 group-hover:ring-rule-strong group-hover:ring-offset-1 group-hover:ring-offset-paper"
        } ${why !== null ? "opacity-30" : ""}`}
        style={{ background: face, boxShadow: chosen ? undefined : "0 1px 2px rgba(0,0,0,0.35)" }}
      />
    </button>
  );
  return (
    <div className="flex flex-wrap items-center gap-0.5 sm:gap-1" role="radiogroup" aria-label={label} data-testid={testId}>
      {swatch("usual", usual.face, usual.name, value === null, null, () => onChoose(null))}
      {PIECE_COLOUR_LIST.map((colour) => {
        const { label: name, kanji } = PIECE_COLOURS[colour];
        return swatch(colour, pieceFace(colour), `${name} ${kanji}`, value === colour, value === colour ? null : unavailable(colour), () => onChoose(colour));
      })}
    </div>
  );
}
