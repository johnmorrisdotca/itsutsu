import { PIECE_COLOURS, pieceFace } from "@/lib/pieces/pieceColours";
import type { SeatColours } from "@/lib/pieces/seatColours";

import type { StoneSetTokens } from "./board.types";

/**
 * The reader's stone set with each seat's own colour laid over its side.
 *
 * A seat that chose no colour keeps the set's stone exactly — the same object
 * when neither did — so a board nobody has dressed is drawn byte for byte as
 * before. A chosen colour replaces that side's stone and the ink written on
 * it (a move number, the last-move dot), so everything drawn from these tokens
 * — the board's stones, a Reversi disc's two faces, the stone beside a name in
 * the turn line — follows the choice at once.
 */
export function seatStones(set: StoneSetTokens, colours: SeatColours | undefined): StoneSetTokens {
  if (colours === undefined || (colours.black === undefined && colours.white === undefined)) return set;
  return {
    ...set,
    ...(colours.black === undefined ? {} : { black: pieceFace(colours.black), blackInk: PIECE_COLOURS[colours.black].ink }),
    ...(colours.white === undefined ? {} : { white: pieceFace(colours.white), whiteInk: PIECE_COLOURS[colours.white].ink }),
  };
}
