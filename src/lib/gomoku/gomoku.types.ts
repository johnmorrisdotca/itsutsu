/**
 * Domain types for the gomoku engine. The engine is pure: every function in
 * `engine.ts` takes a `GameState` and returns a new one, so the UI can hold a
 * single state value and the rules can be tested without a browser.
 */

export type Stone = "black" | "white";

/** An intersection the rules have taken out of play. See `obstacles.ts`. */
export type Blocked = "blocked";

/** A hotspot: an intersection that counts as either colour's stone in a line. */
export type Hot = "hot";

/** A wormhole: a line entering it comes out of its partner and carries on. */
export type Worm = "worm";

/** One intersection of the board: a stone, an obstacle, a hotspot, a wormhole, or nothing. */
export type Cell = Stone | Blocked | Hot | Worm | null;

/** Zero-based board coordinates. Row 0 is the top, column 0 is the left. */
export type Point = {
  row: number;
  col: number;
};

/**
 * `place`: an ordinary stone.
 * `skip`: a deliberately wasted move, dropped on the emptiest corner.
 * `move`: a piece stepping from `from` to the move's point, in the games
 * where a fixed handful of pieces move once they are all down.
 * `piece`: a multi-cell piece from the queue, laid as `cells`.
 * `pass`: a turn taken without a stone — nothing fit, or a deadline went by.
 * A pass has no point; its row and column are -1.
 */
export type MoveKind = "place" | "skip" | "move" | "piece" | "pass";

/** One cell of a multi-cell piece, with the colour it carries. */
export type PieceCell = Point & { stone: Stone };

/** A piece from the queue: its cells relative to the top-left of its bounding box. */
export type Piece = {
  cells: readonly PieceCell[];
};

/** Which queue of pieces a game draws from. */
export type PieceQueue = "domino" | "tetro";

/** A quarter turn of one quadrant, which ends a move in the twist games. */
export type Twist = {
  quadrant: number;
  clockwise: boolean;
};

export type Move = Point & {
  /** The colour of the stone placed. */
  stone: Stone;
  /** The colour that moved, when the game lets a mover place the other colour. */
  by?: Stone;
  kind: MoveKind;
  /** Opponent stones this move took off the board, in the capture variants. */
  captured?: Point[];
  /** Where a moving piece came from. Only on `move` kinds. */
  from?: Point;
  /** The twist that finished this move, once it has been made. */
  twist?: Twist;
  /** The bottom row this move cleared, so it can be put back by an undo. */
  cleared?: Cell[];
  /** The cells a piece covered, with their colours, on `piece` kinds. */
  cells?: PieceCell[];
  /** Whether the piece making this move was already a king. Checkers only, for undo. */
  wasKing?: boolean;
  /** Whether the piece this move captured was itself a king. Checkers only, for undo. */
  capturedWasKing?: boolean;
  /** Whether this move continued a capture chain already under way. Checkers only, for undo. */
  continuedChain?: boolean;
  /** The ko point in force just before this move, so undo can put it back. Go only. */
  koPointBefore?: Point | null;
};

/** The shape of a move as a record or a request carries it, without the colour. */
export type MoveInput = Point & {
  /** As a record stores it: a string, checked against MOVE_KINDS where it matters. */
  kind?: string;
  /** The colour placed, where the mover chose it. */
  stone?: string;
  from?: Point;
  twist?: Twist;
  cells?: PieceCell[];
};

/**
 * The named rule sets. Each is described as data in `VARIANT_SPECS`, so the
 * engine reads a spec rather than switching on the name.
 *
 * `freestyle`: five or more in a row wins.
 * `standard`: exactly five wins; an overline (six or more) does not.
 * `renju`: black is forbidden the double three, double four and overline.
 * `omok`: the double three is forbidden for both sides; overlines win.
 * `caro`: exactly five wins, and not when blocked at both ends.
 * `ninuki`: five in a row wins, and so does capturing five pairs.
 * `connect6`: two stones a turn, six in a row wins.
 */
export type RuleVariant =
  | "freestyle"
  | "standard"
  | "renju"
  | "omok"
  | "caro"
  | "ninuki"
  | "connect6"
  | "tictactoe"
  | "trapThree"
  | "dropFour"
  | "twistFive"
  | "twistFour"
  | "squareFour"
  | "ringDrop"
  | "holeDrop"
  | "hotDrop"
  | "clearDrop"
  | "giveawayDrop"
  | "edgeDrop"
  | "dominoFive"
  | "blockFive"
  | "sannuki"
  | "wormDrop"
  | "misereFive"
  | "makerBreaker"
  | "wildTicTacToe"
  | "notakto"
  | "toroidalFive"
  | "reversi"
  | "classicReversi"
  | "antiReversi"
  | "miniReversi"
  | "grandReversi"
  | "halma"
  | "hex"
  | "obstacleFive"
  | "checkers"
  | "chineseCheckers"
  | "go";

/**
 * Where a stone goes when played. `free`: where it was put. `drop`: it slides
 * to the lowest empty cell of its column, as if the board were upright and
 * the stones were magnetic.
 */
export type Placement = "free" | "drop" | "edge";

/**
 * How the first stones go down. Everything after the opening is the variant's
 * business; these only shape the start, to blunt black's first-move advantage.
 *
 * `free`: anywhere, any order.
 * `pro` / `longPro`: black opens at tengen and black's second stone must leave
 * the central 5×5 (7×7 for long pro).
 * `swap`: seat one places three stones, seat two picks a colour.
 * `swap2`: as swap, but seat two may instead add two stones and hand the choice
 * back.
 * `rif`: the classic renju opening — centre, then inside the 3×3, then inside
 * the 5×5, after which white may swap colours.
 * `sakata`: the RIF start and swap, and then the fifth stone must land inside
 * the central 7×7.
 * `tarannikov`: the first five stones must land inside the central 1×1, 3×3,
 * 5×5, 7×7 and 9×9 in turn, and after each of them the other seat may swap.
 */
export type OpeningRule =
  | "free"
  | "pro"
  | "longPro"
  | "swap"
  | "swap2"
  | "rif"
  | "sakata"
  | "tarannikov";

/**
 * What a completed line has to look like to win.
 *
 * `atLeast`: `winLength` or longer.
 * `exact`: precisely `winLength`; an overline is not a win.
 * `exactOpen`: precisely `winLength`, and not shut in at both ends.
 */
export type LineRule = "atLeast" | "exact" | "exactOpen";

/** Shapes a colour may be forbidden from making. See `rules/forbidden.ts`. */
export type ForbiddenPattern = "doubleThree" | "doubleFour" | "overline";

/**
 * How a won game was won. Null while nobody has. `trap` is the loser's doing:
 * they made the line the rules forbid. `square` is four in a 2×2. `blocked`
 * is the checkers family: the colour to move has no legal move left, whether
 * because it has no pieces or because every one of them is shut in.
 */
export type WinReason = "line" | "captures" | "time" | "resign" | "trap" | "square" | "full" | "count" | "camp" | "connection" | "blocked" | "territory";

/**
 * Where a swap-style opening stands. `placing` and `extending` are stretches
 * where one seat lays every stone regardless of colour; `choosing` is a pause
 * where no stone is legal until the deciding seat has picked a colour.
 */
export type OpeningStage = "placing" | "choosing" | "extending" | "done";

/** A decision taken during the opening: a colour, or two more stones. */
export type OpeningChoice = Stone | "extend";

export type OpeningState = {
  stage: OpeningStage;
  /** The seat acting outside the normal turn order, if any. */
  actor: Seat | null;
  /** Every decision so far, so a stored game can be replayed through them. */
  choices: OpeningChoice[];
};

/**
 * One rule set, as data. The engine consults this and never the variant's
 * name, so adding a variant is a matter of adding a row.
 */
/** Which edges of the board join up: a plane, a cylinder, or a torus. */
export type WrapMode = "none" | "columns" | "both";

export type VariantSpec = {
  /** Per colour, because renju lets white win with an overline and not black. */
  lineRule: Record<Stone, LineRule>;
  forbidden: Record<Stone, readonly ForbiddenPattern[]>;
  /** Flanking a pair of enemy stones removes them. */
  captures: boolean;
  stonesPerTurn: number;
  /** Connect6 opens with a single stone before the two-a-turn rhythm starts. */
  firstTurnStones: number;
  /** A pinned line length, or null when the players may choose. */
  winLength: number | null;
  /** Whether the players may hand the first stone to white or draw lots. */
  allowFirstPlayerChoice: boolean;
  openings: readonly OpeningRule[];
  placement: Placement;
  /** Making exactly this many in a row loses, as in the trap game; null when nothing does. */
  loseLength: number | null;
  /** Side of the quadrants a move ends by rotating; null when moves do not twist. */
  quadrantSize: number | null;
  /** Pieces per player; once all are down, a turn moves one. Null for unlimited stones. */
  pieces: number | null;
  /** A 2×2 square of one colour also wins. */
  squareWins: boolean;
  /** Board sizes this game is played on, or null for the standard list. */
  boardSizes: readonly number[] | null;
  /** Whether the threat reading means anything; off where stones move after placing. */
  analysis: boolean;
  /**
   * Which edges join. `columns` is a cylinder — left meets right; `both` is a
   * torus, where top meets bottom as well. A mode rather than two booleans
   * because "rows wrap but columns do not" is the same cylinder turned on its
   * side, and there is no reason for the type to allow two ways to say it.
   */
  wrap: WrapMode;
  /** Squares taken out of play at random when the game starts. */
  deadSquares: number;
  /** Squares that count as either colour's stone, placed at random when the game starts. */
  hotSquares: number;
  /** A full bottom row disappears and everything above it drops, as in the falling-block game. */
  lineClear: boolean;
  /** Making the winning line loses, and a full board goes to the player who opened. */
  misere: boolean;
  /** Pieces come from a shared seeded queue rather than being single stones. */
  queue: PieceQueue | null;
  /** Single stones of your own colour each player may lay instead of a piece. */
  singles: number;
  /** How many enemy stones a flank may take at once: pairs, or pairs and triples. */
  captureSizes: readonly number[];
  /** Enemy stones to capture for a win, in stones, in the capture variants. */
  capturesToWin: number | null;
  /** Two random squares joined by a wormhole: a line entering one leaves the other. */
  wormholes: number;
  /** The mover chooses the colour of every stone. */
  anyColour: boolean;
  /** Every stone is black, whoever placed it. */
  singleColour: boolean;
  /** Maker wants a line of either colour; breaker wants a full board without one. */
  makerBreaker: boolean;
  /**
   * The flipping games. A stone may only be placed where it flanks a line of
   * the other colour, which then turns; a colour with no such place passes;
   * when neither can move the discs are counted. Lines and captures mean
   * nothing here — the whole of the game is in the flip.
   */
  flips: boolean;
  /** How the centre is set before the first move: fixed, laid by the players, or empty. */
  startingDiscs: StartingDiscs;
  /**
   * The race games. Every piece starts in a corner camp; a move is a step or
   * a chain of jumps over any piece; filling the far camp wins. Lines,
   * captures and placing mean nothing here.
   */
  camps: boolean;
  /**
   * The connection game. A colour wins by joining its own two sides of the
   * board with a chain of touching stones, on a lattice where a cell touches
   * six others rather than four or eight. No lines, no captures, no draws.
   */
  connects: boolean;
  /**
   * The checkers family. Pieces stand on the board from the start and move
   * one diagonal step forward, or capture by jumping an adjacent enemy piece
   * into the empty square beyond. Capturing is forced whenever any of a
   * colour's pieces can, and a piece that jumps again from where it lands
   * keeps jumping in the same move for as long as it has another to take. A
   * man reaching the far row is crowned a king, which may move and capture
   * backward as well as forward; a colour with no legal move loses.
   */
  checkers: boolean;
  /**
   * Chinese Checkers: a hexagram board, embedded in a square Point grid the
   * way Hex's rhombus is, with the cells outside it sealed off as `BLOCKED`.
   * Otherwise the same race as Halma's `camps` — step or jump-chain to fill
   * the point opposite, nothing captured — just six hex directions in place
   * of eight square ones, and a star's points in place of a corner's square.
   */
  chineseCheckers: boolean;
  /**
   * Go: stones never move once placed. A group of one colour with no
   * liberties left is captured whole; a move that would leave the mover's
   * own group with none, after any capture it makes, is suicide and illegal;
   * a move that would exactly retake the single stone a capture just lifted
   * is forbidden for one turn — the simple ko rule. Either side may pass at
   * any point; two passes in a row end the game, scored by area — every
   * stone on the board plus the empty points only that colour surrounds —
   * with a fixed komi added for white.
   */
  go: boolean;
};

/** How a flipping game begins: nothing, the fixed four, or four the players lay themselves. */
export type StartingDiscs = "none" | "fixed" | "laid";

/**
 * Extra restrictions one colour plays under, so a stronger player can give a
 * weaker one a fair game. Every item is a rule some variant already imposes on
 * a colour, applied here on top of whatever the variant says. A handicap
 * belongs to a colour, not a seat, so seat swaps are off while one is set.
 *
 * `doubleThree` / `doubleFour` / `overline`: shapes this colour may not make.
 * `exactLine`: this colour's overline is not a win.
 * `openLine`: this colour's winning line must not be shut in at both ends.
 * `longerLine`: this colour needs one more stone in a row.
 * `singleStone`: one stone a turn where the variant gives two.
 * `noCaptures`: this colour does not capture, in the capture variants.
 * `secondStoneExclusion`: this colour's second stone must land outside the
 * central square of this half-width (2 for 5×5, 3 for 7×7); 0 for none.
 */
export type Handicap = {
  stone: Stone | null;
  doubleThree: boolean;
  doubleFour: boolean;
  overline: boolean;
  exactLine: boolean;
  openLine: boolean;
  longerLine: boolean;
  singleStone: boolean;
  noCaptures: boolean;
  secondStoneExclusion: number;
};

/** The toggles of a handicap, without the colour that carries them. */
export type HandicapRule = Exclude<keyof Handicap, "stone" | "secondStoneExclusion">;

/**
 * The rules one colour actually plays under: the variant's spec for that
 * colour with the handicap laid over it. Everything in the engine that asks
 * "may this colour…" reads one of these, never the spec directly.
 */
export type ColourRules = {
  lineRule: LineRule;
  forbidden: readonly ForbiddenPattern[];
  captures: boolean;
  stonesPerTurn: number;
  winLength: number;
  secondStoneExclusion: number;
};

export type GameStatus = "playing" | "won" | "draw";

/**
 * Who opens. `random` is resolved once when the game is created — the engine
 * stays pure by taking the roll as an argument, see `resolveOpener`.
 */
export type FirstPlayer = Stone | "random";

/**
 * `none`: every intersection is playable.
 * `hoshi`: the star points are blocked, except tengen at the centre.
 */
export type ObstacleLayout = "none" | "hoshi";

/**
 * The two people at the board. Seats are distinct from stone colours because
 * `swapSeats` exchanges them mid-game — see `GameState.seats`.
 */
export type Seat = "one" | "two";

/**
 * When a game nobody has won is called a draw.
 *
 * Some of these games can run for ever between two careful players, and a
 * board that never fills is a game neither side can leave. The limit is a
 * share of the board's points rather than a number of moves, so it needs no
 * arithmetic per size: the same setting means something sensible on 9x9 and
 * on 19x19.
 */
export type DrawLimit = "none" | "half" | "threeQuarters";

export type GameSettings = {
  /** Board is `size` × `size` intersections. */
  size: number;
  /** Stones in a line needed to win. */
  winLength: number;
  variant: RuleVariant;
  opening: OpeningRule;
  handicap: Handicap;
  /**
   * The random seed the game was created with: it places dead and hot
   * squares and draws the piece queues, so a stored game reproduces them.
   */
  seed: number;
  /** Pairs a colour must capture to win, in the variants that capture. */
  capturesToWin: number;
  firstPlayer: FirstPlayer;
  obstacles: ObstacleLayout;
  /**
   * In the flipping games, whether the centre four discs start placed or are
   * laid by the players. Absent, the game's own rule applies.
   */
  openingDiscs?: StartingDiscs;
  /** Taking a move back. Off by default in the stricter variants. */
  allowUndo: boolean;
  /** Burning a turn on a corner stone rather than playing where it matters. */
  allowSkip: boolean;
  /** Trading seats with the opponent. `swapsPerSeat` caps how often. */
  allowSwap: boolean;
  swapsPerSeat: number;
  /**
   * Letting the board change size mid-game, re-centring the stones: up when a
   * game has run out of room, down when it is dragging and the outer ring is
   * unused. Both directions need the other player to agree.
   */
  allowResize: boolean;
  /**
   * Calling a long game a draw. `none` plays it out, which is how every game
   * here behaved before this existed and is still the default.
   */
  drawLimit: DrawLimit;
};

export type GameState = {
  settings: GameSettings;
  /** Row-major, `size * size` entries. See `indexOf` / `pointOf`. */
  board: Cell[];
  /** Every move played so far, in order. */
  moves: Move[];
  /** The colour that opened, kept so the game can be replayed from move zero. */
  opener: Stone;
  /** Which seat currently holds each colour. Exchanged by `swapSeats`. */
  seats: Record<Stone, Seat>;
  /** Swaps each seat has spent, counted against `settings.swapsPerSeat`. */
  swapsUsed: Record<Seat, number>;
  /** Pairs each colour has captured. Always zero outside the capture variants. */
  captures: Record<Stone, number>;
  opening: OpeningState;
  toPlay: Stone;
  /** True between placing a stone and turning a quadrant, in the twist games. */
  pendingTwist: boolean;
  /** Board squares holding a crowned piece, in the checkers family. Empty everywhere else. */
  kings: readonly Point[];
  /** The square of a piece mid-capture-chain that must keep jumping, in the checkers family. Null otherwise. */
  chainAt: Point | null;
  /** The point the simple ko rule forbids retaking this move, in Go. Null otherwise. */
  koPoint: Point | null;
  status: GameStatus;
  winner: Stone | null;
  winBy: WinReason | null;
  /** The stones that completed the winning line, empty until someone wins. */
  winningLine: Point[];
};
