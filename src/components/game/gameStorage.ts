import { createGame, replayMoves } from "@/lib/gomoku/engine";
import type {
  GameSettings,
  GameState,
  Move,
  OpeningChoice,
  Seat,
  Stone,
} from "@/lib/gomoku/gomoku.types";
import type { Appearance } from "@/components/board/board.types";
import type { GameStats, SeatNames, SessionSettings } from "./game.types";

const KEY = "gomoku.session.v1";

/**
 * What a browser remembers between visits.
 *
 * The board is not stored — the moves are. A board and a move list can
 * disagree; a move list replayed through the engine cannot, so a restored game
 * is guaranteed to be a game the rules could actually have produced.
 */
export type GameSnapshot = {
  version: 1;
  settings: GameSettings;
  opener: Stone;
  moves: Move[];
  seats: Record<Stone, Seat>;
  swapsUsed: Record<Seat, number>;
  /** Decisions taken in a swap opening. Absent from snapshots that predate them. */
  openingChoices?: OpeningChoice[];
  appearance: Appearance;
  session: SessionSettings;
  names: SeatNames;
  hintsLeft: Record<Seat, number>;
  stats: GameStats;
};

export function toSnapshot(
  state: GameState,
  appearance: Appearance,
  session: SessionSettings,
  names: SeatNames,
  hintsLeft: Record<Seat, number>,
  stats: GameStats,
): GameSnapshot {
  return {
    version: 1,
    settings: state.settings,
    opener: state.opener,
    moves: state.moves,
    seats: state.seats,
    swapsUsed: state.swapsUsed,
    openingChoices: state.opening.choices,
    appearance,
    session,
    names,
    hintsLeft,
    stats,
  };
}

/**
 * Replays a snapshot into a full timeline, so undo still reaches back through
 * a game that was saved and reopened.
 *
 * Seat metadata is applied to every rebuilt state rather than replayed: a swap
 * leaves no stone behind, so undoing back past one restores the board exactly
 * but not the seating it had at the time.
 */
export function restoreTimeline(snapshot: GameSnapshot): GameState[] {
  const start = createGame({ ...snapshot.settings, firstPlayer: snapshot.opener });
  // Stops at the first move that will not replay: the snapshot no longer fits the rules.
  const timeline = replayMoves(start, snapshot.moves, snapshot.openingChoices ?? []);

  return timeline.map((state) => ({
    ...state,
    seats: snapshot.seats,
    swapsUsed: snapshot.swapsUsed,
  }));
}

export function saveSnapshot(snapshot: GameSnapshot): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    // A full or blocked store is not a reason to interrupt a game.
  }
}

export function loadSnapshot(): GameSnapshot | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null) return null;

    const parsed = JSON.parse(raw) as GameSnapshot;
    // Anything from an older or hand-edited shape is discarded, not migrated.
    if (parsed?.version !== 1 || !Array.isArray(parsed.moves)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSnapshot(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to do — the next save overwrites it anyway.
  }
}
