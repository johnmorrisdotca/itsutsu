import { DEFAULT_APPEARANCE } from "@/components/board/Board.constants";
import { otherStone } from "@/lib/gomoku/engine";
import { DEFAULT_SETTINGS, SEATS } from "@/lib/gomoku/gomoku.constants";
import type {
  GameSettings,
  Move,
  MoveKind,
  Seat,
  Stone,
} from "@/lib/gomoku/gomoku.types";
import type { GameDetail } from "@/lib/history/gameHistory.types";
import { DEFAULT_SEAT_NAMES, DEFAULT_SESSION_SETTINGS } from "./game.constants";
import type { GameSnapshot } from "./gameStorage";
import { emptyStats } from "./stats";

/**
 * A match as the server holds it, in the shape the board restores from. The
 * moves replay through the engine on the way in, so the position is rebuilt
 * by the rules and never trusted from a stored board.
 */
export function snapshotFromMatch(game: GameDetail): GameSnapshot {
  const opener = game.opener as Stone;
  const settings: GameSettings = {
    ...DEFAULT_SETTINGS,
    size: game.size,
    winLength: game.winLength,
    variant: game.variant as GameSettings["variant"],
    obstacles: game.obstacles as GameSettings["obstacles"],
    opening: game.opening as GameSettings["opening"],
    handicap: game.handicap,
    seed: game.seed,
    firstPlayer: opener as GameSettings["firstPlayer"],
  };
  const seats = {
    [opener]: SEATS.one,
    [otherStone(opener)]: SEATS.two,
  } as Record<Stone, Seat>;
  const nameOf = (stone: Stone) => (stone === "black" ? game.blackName : game.whiteName);

  return {
    version: 1,
    settings,
    opener,
    moves: game.moves.map(
      (move): Move => ({
        row: move.row,
        col: move.col,
        stone: move.stone as Stone,
        kind: move.kind as MoveKind,
        from: move.from,
        twist: move.twist,
        cells: move.cells,
      }),
    ),
    seats,
    swapsUsed: { one: 0, two: 0 },
    appearance: DEFAULT_APPEARANCE,
    session: DEFAULT_SESSION_SETTINGS,
    names: { ...DEFAULT_SEAT_NAMES, one: nameOf(opener), two: nameOf(otherStone(opener)) },
    hintsLeft: { one: DEFAULT_SESSION_SETTINGS.hintsPerSeat, two: DEFAULT_SESSION_SETTINGS.hintsPerSeat },
    stats: emptyStats(),
  };
}
