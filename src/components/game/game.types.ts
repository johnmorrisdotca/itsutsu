import type {
  Assessment,
  Suggestion,
  WinChance,
} from "@/lib/gomoku/analysis.types";
import type { SeatClock } from "@/lib/clock/clock.types";
import type { TimeControlName } from "@/lib/clock/clock.constants";
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

/**
 * What clicking a move in the record does.
 *
 * `review` walks the game without being able to change it — the board is read
 * only until you return to the latest move. `branch` lets you play from an
 * earlier position, which discards everything after it, and asks first.
 */
export type HistoryMode = "review" | "branch";

/** Everything about a session that is not a rule of the game. */
export type SessionSettings = {
  awareness: AwarenessLevel;
  hintPolicy: HintPolicy;
  hintsPerSeat: number;
  timeControl: TimeControlName;
  historyMode: HistoryMode;
  /**
   * Warn each side before the other can build an open three, rather than only
   * once one exists. It applies to both players or neither — a warning given
   * to one side would simply be an advantage handed out.
   */
  earlyWarning: boolean;
  /** Show a rough chance of winning for each colour. */
  showWinChance: boolean;
};

/** What one player did over the course of a game. */
export type SeatStats = {
  moves: number;
  /** Time spent thinking, summed across their moves. */
  thinkingMs: number;
  /** The longest single think. */
  slowestMoveMs: number;
  /** Moves the analysis flagged as throwing the game away. */
  blunders: number;
  /** Moves played while a threat was on the board that they did not answer. */
  missedThreats: number;
  hintsUsed: number;
};

export type GameStats = {
  startedAt: number;
  bySeat: Record<Seat, SeatStats>;
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
  /** A board change waiting on the other player's agreement. */
  resizeProposal: ResizeProposal | null;
  canProposeGrow: boolean;
  canProposeShrink: boolean;
  clocks: Record<Seat, SeatClock>;
  /** The seat whose flag fell, when a game ended on time rather than on five. */
  lostOnTime: Seat | null;
  stats: GameStats;
  /** A rough read on who is ahead, as percentages summing to 100. */
  winChance: WinChance;
  canUndo: boolean;
  canRedo: boolean;
  canSkip: boolean;
  canSwap: boolean;
  /** Why swapping is unavailable, for the button's title. */
  swapBlockedReason: string | null;
  moveIndex: number;
  moveTotal: number;
  /** True while an earlier position is being looked at. */
  reviewing: boolean;
  /** True when the board cannot be played on at all right now. */
  boardReadOnly: boolean;
  /** The piece picked up to slide, in the games where pieces move. */
  selected: Point | null;
  /**
   * A move waiting on confirmation because playing it would discard the moves
   * after the position being reviewed.
   */
  pendingBranch: Point | null;
  /** How many moves confirming that branch would throw away. */
  branchDiscards: number;
};

/** Which way a resize would go. */
export type ResizeDirection = "grow" | "shrink";

/**
 * A resize waiting on the other player.
 *
 * Changing the board is not one player's move to make — it changes the game
 * both of them are playing — so it is proposed and then agreed to, rather
 * than done.
 */
export type ResizeProposal = {
  from: Seat;
  direction: ResizeDirection;
  /** The size it would become, for the prompt to name. */
  size: number;
};

export type GameActions = {
  play: (point: Point) => void;
  undo: () => void;
  redo: () => void;
  jumpTo: (index: number) => void;
  /** Jump back to the newest position, where play resumes. */
  returnToLatest: () => void;
  /** Play the pending move, discarding everything after it. */
  confirmBranch: () => void;
  cancelBranch: () => void;
  reset: (settings?: Partial<GameSettings>) => void;
  skip: () => void;
  swap: () => void;
  /** Settles a swap opening: the deciding seat takes this colour. */
  chooseColour: (stone: Stone) => void;
  /** Swap2 only: decline to choose and lay two more stones. */
  extendOpening: () => void;
  /** Turns a quadrant to finish the move, in the twist games. */
  twist: (quadrant: number, clockwise: boolean) => void;
  /** Offers the other player a bigger or smaller board. */
  proposeResize: (direction: ResizeDirection) => void;
  /** The other seat agrees, and the board changes. */
  acceptResize: () => void;
  declineResize: () => void;
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
