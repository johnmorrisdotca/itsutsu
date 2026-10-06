import type { createMatch } from "./gunjinEngine";

/** The engine's own full state, both sides' ranks included: the package exports the function that makes it, and this is its type. */
export type GunjinMatch = ReturnType<typeof createMatch>;

/** One piece of a side's arrangement: what it is and where it stands. */
export type GunjinPlacement = { kind: string; x: number; y: number };

/** A square, counted from the top left. */
export type GunjinSquare = { x: number; y: number };

/**
 * One move at the table.
 *
 * - `setup`: one side's secret arrangement, every piece of its roster placed.
 * - `hand`: the device has been handed to the player named, who has said so.
 * - `move`: one piece to one square, which may hold an enemy piece.
 * - `resign`, `offer-draw`, `accept-draw`, `decline-draw`: the side to move
 *   ends the game by giving it up, offers the other a draw, or answers an offer
 *   the other made (the package's `resignMatch`, `offerDraw`, `acceptDraw` and
 *   `declineDraw`). Only while the game is being played, never while arranging.
 *
 * A game is its board, its two names and these, in order.
 */
export type GunjinMove =
  | { kind: "setup"; placements: readonly GunjinPlacement[] }
  | { kind: "hand" }
  | { kind: "move"; from: GunjinSquare; to: GunjinSquare }
  | { kind: "resign" }
  | { kind: "offer-draw" }
  | { kind: "accept-draw" }
  | { kind: "decline-draw" };

/** The moves that end a game or answer one's end, which a table offers as presses of their own. */
export type GunjinEndingMove = Extract<GunjinMove, { kind: "resign" | "offer-draw" | "accept-draw" | "decline-draw" }>;

/**
 * A game of Gunjin, as its rules module (`gunjin.ts`) speaks of it.
 *
 * The match is read again from the moves (`replayGunjin`), never kept: what a
 * browser stores is the board, the names and the moves (`gunjinCodec.ts`).
 * It holds both sides' ranks, which is the engine's own authoritative state
 * ("keep it on a trusted host"): a table round one device draws a player only
 * what `viewForPlayer` gives them (`gunjinView.ts`), and a table on two
 * devices keeps it on the server and sends each reader their own view alone.
 */
export type GunjinGame = {
  /** The board's squares: which of the four games (`GUNJIN_BOARDS`). */
  size: number;
  players: readonly string[];
  moves: readonly GunjinMove[];
  match: GunjinMatch;
  /** Set on a game one side resigned (`lib/party/resign.ts`). */
  resignedBy?: number;
};
