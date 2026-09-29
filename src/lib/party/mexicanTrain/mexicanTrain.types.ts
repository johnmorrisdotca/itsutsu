/**
 * Mexican Train, as its rules module (`mexicanTrain.ts`) speaks of it.
 *
 * A TILE IS A NUMBER: `low * 16 + high`, its two ends with the smaller first,
 * so the set's every tile is one small integer and a hand is a list of them.
 * Sixteen, because the largest set offered is double-fifteen (`tileOf`).
 *
 * A TILE LAID IN A TRAIN IS A NUMBER TOO: `from * 16 + to`, the end that
 * touches the train first. `to` is the end the next tile must match, so a
 * train's open end is the last laid tile's `to`, or the round's engine double
 * when nothing has been laid on it yet.
 *
 * THE TRAINS ARE NUMBERED BY SEAT: train `s` is seat `s`'s own, and train
 * `players.length` is the Mexican Train, which belongs to nobody and is open
 * to everybody.
 */

/** Who sits where: 0 is the first player, round the table in the order the set-up named them. */
export type TrainSeat = number;

/** A domino in a hand or the boneyard: `low * 16 + high`. */
export type Domino = number;

/** A domino laid in a train, turned so its `from` end touches the train: `from * 16 + to`. */
export type LaidDomino = number;

/**
 * How a double is dealt with, the table's one house rule about them.
 *
 * - `one` (the default, as most published rules play it): a double must be
 *   covered before anything else is played anywhere, and whoever laid it lays
 *   again to cover it.
 * - `chain`: after laying a double you may lay another double in the same
 *   turn, anywhere one fits, before covering; then every double left open is
 *   covered, the last laid first, before anything else is played.
 */
export type DoublesRule = "one" | "chain";

/**
 * When the Mexican Train may be started.
 *
 * - `any` (the default): on any turn, by anybody, as most published rules say.
 * - `ownFirst`: a player may lay on the Mexican Train only once their own
 *   train has been started, the common house rule that keeps a first turn
 *   about your own train.
 */
export type MexicanStart = "any" | "ownFirst";

/** How many rounds: all of them, one for every double from the set's highest down to double blank, or half as many. */
export type TrainLength = "full" | "short";

/** What the set-up chose, beyond the set and the players. */
export type TrainOptions = {
  length: TrainLength;
  doubles: DoublesRule;
  mexican: MexicanStart;
};

/** A train on the table: the tiles laid on it in order, and whether its owner's marker says anybody may play on it. */
export type Train = {
  laid: readonly LaidDomino[];
  /** Open to everybody: the Mexican Train always, a player's own once they could not play. */
  open: boolean;
};

/**
 * One move at the table.
 *
 * - `play`: lay a tile from your hand on a train.
 * - `draw`: take one tile from the boneyard, when you have nothing to play.
 * - `pass`: nothing to play and nothing to draw (or the tile drawn will not
 *   go): your train's marker goes on, and the turn passes.
 * - `next`: a round is over and everybody has seen how it went; deal the next.
 */
export type TrainMove =
  | { kind: "play"; tile: Domino; train: number }
  | { kind: "draw" }
  | { kind: "pass" }
  | { kind: "next" };

/** One link of a game's record: a move, and every move before it. */
export type TrainHistory = {
  readonly move: TrainMove;
  readonly before: TrainHistory | null;
  /** How many moves the record holds, this one included. */
  readonly count: number;
};

export type TrainPhase = "playing" | "roundOver" | "finished";

/** Why a round ended: somebody played their last tile, or nobody could play and nothing was left to draw. */
export type RoundEnding = "domino" | "blocked";

/** A round's result, kept for the table of scores. */
export type RoundResult = {
  /** The round's engine double, by its number: 12 for double-twelve. */
  engine: number;
  /** Pips left in each seat's hand when it ended: that round's score. */
  pips: readonly number[];
  ending: RoundEnding;
  /** The seat that played out, on a round that ended that way. */
  out: TrainSeat | null;
};

/**
 * A game, as its table and moves make it. Only the set, the options, the
 * seed, the seats and the moves are ever kept (`encodeTrain`); everything
 * else is read again from them (`replayTrain`), so a kept game can never hold
 * a hand or a train its moves do not make, and a reload cannot deal again.
 */
export type TrainGame = {
  /** The set, by its highest double: 9, 12 or 15. The party game's "board size". */
  set: number;
  options: TrainOptions;
  /** What every shuffle of this game is drawn from. */
  seed: number;
  /** The names given at the table, in seat order: "" for one left blank. */
  players: readonly string[];
  /** Which seats a computer plays. */
  computers: readonly boolean[];
  /**
   * Every move made, the last first, each pointing at the record before it:
   * the game's whole record (`movesOf` reads it out in order). A chain rather
   * than a list, so a move adds one link and copies nothing — a double-fifteen
   * game runs to thousands of moves, and a list copied on every one of them
   * is millions of copies a game.
   */
  history: TrainHistory | null;

  /** How many rounds this game plays, and which one is being played (0 for the first). */
  rounds: number;
  round: number;
  /** The engine double's number this round: the set's highest in the first, one fewer each round after. */
  engine: number;
  hands: readonly (readonly Domino[])[];
  /** Every seat's train, then the Mexican Train last. */
  trains: readonly Train[];
  /** The tiles still face down, in the order they will be drawn. */
  boneyard: readonly Domino[];
  toPlay: TrainSeat;
  /**
   * Trains whose last tile is a double not yet covered, the last laid last:
   * while any is open, the only play anywhere is to cover the last of them.
   */
  uncovered: readonly number[];
  /** The player to move laid a double this turn and may still lay another before covering (`chain` only). */
  chaining: boolean;
  /** The player to move has drawn this turn: the tile drawn must be played if it can, or they pass. */
  drew: boolean;
  /** Turns passed in a row with nothing played: a whole table of them with the boneyard empty ends the round. */
  passes: number;
  /** Counts every change of the player to move: a new number is a new turn, and a covered hand to pass on. */
  turn: number;
  phase: TrainPhase;
  results: readonly RoundResult[];
  /** On a finished game, every seat with the lowest total. */
  winners: readonly TrainSeat[];
  /** The last move played, for the line that says what just happened. */
  last: { seat: TrainSeat; move: TrainMove } | null;
};
