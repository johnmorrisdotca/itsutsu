import type { Stone, WinReason } from "@/lib/gomoku/gomoku.types";
import type { RivalryView } from "@/lib/record/rivalry.types";

/**
 * How a finished game came out, from where the reader sits.
 *
 * `won` and `lost` are said to one of the two players. `decided` is a game with
 * a winner said by colour rather than to a person — two people at one screen,
 * where "you" would be both of them. `draw` is a game neither side won.
 */
export type ResultOutcome = "won" | "lost" | "draw" | "decided";

/**
 * Why a game neither side won ended, in the engine's own terms and the order the
 * board asks them in (`GameStatus`): nobody could finish it, neither side had a
 * move, a position came round too often, an ending ran out of moves, the game ran
 * to its agreed length, both made a line at once, or the board filled. `draw` is
 * a draw the replay does not read as one — said plainly, never given a reason.
 */
export type DrawReason =
  | "unfinishable"
  | "noMoves"
  | "repetition"
  | "endgameCount"
  | "length"
  | "bothLines"
  /* Not `full`: that is already a way to WIN (`WinReason`), when a filled board is decided on it. */
  | "boardFull"
  | "draw";

/**
 * Why it came out that way: the engine's own reasons for a win, or for a draw. A
 * resignation and a loss on time are among the engine's reasons, and are read off
 * the record where no move closed the game.
 */
export type ResultReason = WinReason | DrawReason;

/** A game's score where its rules keep one: pairs captured, discs showing, or area held. */
export type ResultScore = { kind: "captures" | "discs" | "area"; black: number; white: number };

export type GameResultFacts = {
  outcome: ResultOutcome;
  /** The colour that won, or null for a draw. */
  winner: Stone | null;
  reason: ResultReason;
  score: ResultScore | null;
};

/** Everything the result card over a finished board says and offers, read on the server. */
export type ResultCardData = {
  gameId: string;
  facts: GameResultFacts;
  /** The two names as the page shows them. */
  names: { black: string; white: string };
  /** The head start the game was played with, in words — `describeHeadStart` — or null for an even game. */
  headStart: string | null;
  /**
   * XP this reader was paid for this game, or null where there is none to say.
   *
   * Where the game-end batch has not been shown yet, this IS that batch — the same
   * total and level note its toasts would have announced — and `heldFlashAt` names
   * it, so the masthead holds those toasts while the card says them. Otherwise it
   * is the ledger rows keyed to this game, and `heldFlashAt` is null.
   */
  xp: { points: number; level: { name: string; reached: boolean } | null; heldFlashAt: string | null } | null;
  /** Where these two stand now, this game included; null where there is no pair to read. */
  rivalry: RivalryView | null;
  /**
   * The way to play again, always through the set-up page pre-filled. `again` is
   * a game at one screen, which has nobody opposite to rematch and is offered the
   * same game set up afresh instead.
   */
  rematch: { href: string; again: boolean } | null;
  newGame: string;
  /** The longest-waiting game on this reader's move, and how many there are; null when none. */
  waiting: { count: number; href: string } | null;
};
