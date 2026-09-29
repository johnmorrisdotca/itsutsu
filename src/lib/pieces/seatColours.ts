import type { Stone } from "@/lib/gomoku/gomoku.types";

import { PIECE_COLOURS, isPieceColour, nextFreeColour, tooAlike, type PieceColour } from "./pieceColours";

/**
 * WHICH COLOUR EACH SEAT OF A TWO-SIDED GAME HAS CHOSEN FOR ITS PIECES.
 *
 * Keyed by the side — the engine's black and white, which every rule, opening
 * and record is written in — and absent for a seat that has not chosen, which
 * is drawn in the reader's own stone set exactly as before. The side keeps its
 * name everywhere a rule or a record needs one ("Black to move", "B 7"); only
 * its pieces change colour.
 */
export type SeatColours = Partial<Record<Stone, PieceColour>>;

/** What an unchosen seat's pieces look like, near enough to judge a clash: the ordinary black and white stones. */
export const SIDE_FLAT: Record<Stone, string> = { black: "#1a1a1a", white: "#ececec" };

const OTHER: Record<Stone, Stone> = { black: "white", white: "black" };

/** The colour a side's pieces are seen in: its chosen colour, or its ordinary stone. */
export function sideFlat(side: Stone, colours: SeatColours): string {
  const chosen = colours[side];
  return chosen === undefined ? SIDE_FLAT[side] : PIECE_COLOURS[chosen].flat;
}

/** The seats' colours out of whatever a row or a store held: only colours the palette offers survive. */
export function seatColoursFrom(black: unknown, white: unknown): SeatColours {
  return { ...(isPieceColour(black) ? { black } : {}), ...(isPieceColour(white) ? { white } : {}) };
}

export type SeatColourRefusal = {
  /** `same`: the other seat has this colour; `alike`: the other seat's pieces look like it. */
  reason: "same" | "alike";
  /** The next colour round the palette that the seat could have instead. */
  offer: PieceColour | null;
};

/**
 * Whether `side` may take `wanted` beside what the other seat shows, and if not
 * why, with the colour it could have instead. Null for "yes". Taking no colour
 * back (`null`) is always allowed: the two ordinary stones never clash.
 */
export function seatColourRefusal(side: Stone, wanted: PieceColour | null, colours: SeatColours): SeatColourRefusal | null {
  if (wanted === null) return null;
  const other = OTHER[side];
  const theirs = sideFlat(other, colours);
  if (!tooAlike(PIECE_COLOURS[wanted].flat, theirs)) return null;
  return { reason: colours[other] === wanted ? "same" : "alike", offer: nextFreeColour(wanted, [theirs]) };
}

/** What a refusal says, for a notice beside the chooser or an API's answer. */
export function refusalWords(refusal: SeatColourRefusal): string {
  const offer = refusal.offer === null ? "" : ` ${PIECE_COLOURS[refusal.offer].label} is free.`;
  return refusal.reason === "same"
    ? `The other side already plays in that colour.${offer}`
    : `That colour is too like the other side's pieces to tell apart.${offer}`;
}
