import type { Assessment, Suggestion } from "@/lib/gomoku/analysis.types";
import type {
  GameSettings,
  GameState,
  Point,
  Seat,
  Stone,
} from "@/lib/gomoku/gomoku.types";
import type { Appearance, BoardMark } from "@/components/board/board.types";

/**
 * How much the board tells a player about the position.
 *
 * `off` says nothing. `outlook` shows how the game stands without saying
 * where. `full` also marks the intersections a threat has to be answered on.
 * None of them change what is legal — awareness is a lens, not a rule.
 */
export type AwarenessLevel = "off" | "outlook" | "full";

/**
 * How often the engine will name a best move.
 *
 * `off` never. `limited` spends from an allowance that a player can also gift
 * to their opponent. `unlimited` answers every time it is asked.
 */
export type HintPolicy = "off" | "limited" | "unlimited";

/** Everything about a session that is not a rule of the game. */
export type SessionSettings = {
  awareness: AwarenessLevel;
  hintPolicy: HintPolicy;
  hintsPerSeat: number;
};

export type SeatNames = Record<Seat, string>;

/** A move the analysis flagged as the one that lost the game (敗着). */
export type FatalMove = {
  moveNumber: number;
  stone: Stone;
};

export type GameSession = {
  state: GameState;
  appearance: Appearance;
  settings: SessionSettings;
  names: SeatNames;
  assessment: Assessment;
  /** Marks the board should draw: forced points, hints, help, blunders. */
  marks: BoardMark[];
  /** The hint currently on show, if one has been spent this move. */
  hint: Suggestion | null;
  hintsLeft: Record<Seat, number>;
  fatalMoves: FatalMove[];
  /** The seat that asked for advice and is waiting for it. */
  helpRequest: Seat | null;
  canUndo: boolean;
  canRedo: boolean;
  canSkip: boolean;
  canSwap: boolean;
  /** Why swapping is unavailable, for the button's title. */
  swapBlockedReason: string | null;
  moveIndex: number;
  moveTotal: number;
};

export type GameActions = {
  play: (point: Point) => void;
  undo: () => void;
  redo: () => void;
  jumpTo: (index: number) => void;
  reset: (settings?: Partial<GameSettings>) => void;
  skip: () => void;
  swap: () => void;
  askHint: () => void;
  grantHint: () => void;
  requestHelp: () => void;
  cancelHelp: () => void;
  setAppearance: (next: Partial<Appearance>) => void;
  setSessionSettings: (next: Partial<SessionSettings>) => void;
  setName: (seat: Seat, name: string) => void;
};

export type GamePanelProps = {
  session: GameSession;
  actions: GameActions;
};
