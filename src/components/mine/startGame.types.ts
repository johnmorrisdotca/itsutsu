import type { Handicap } from "@/lib/gomoku/gomoku.types";

/** One seat already on the board, as the composer needs to read it. */
export type SeatOnBoard = {
  id: string;
  variant: string;
  /** The board it is posted on, so the sentence only offers a seat it describes. */
  size: number;
  moveTimeMs: number | null;
  /*
   * The rest of what its game IS, so a seat is only offered to somebody who
   * chose that game — see `seatIsThisGame`. Without these a Pro chooser was
   * sat down at a Free seat on the same board and pace.
   */
  opening: string;
  obstacles: string;
  rated: boolean;
  handicap: Handicap;
  clockMode: string;
  timeoutPenalty: string;
  /** The member sitting in it, as they are named. */
  who: string;
};

/** Somebody the sentence can name as an opponent. */
export type Opponent = {
  /** Their member id: how the sentence names them on the way to the setup screen. */
  id: string;
  email: string;
  name: string;
  /** Here in the last half hour, so the hint can say so. */
  here: boolean;
};

/** A family of games, as the game select groups them. */
export type GameGroup = {
  title: string;
  kanji: string;
  /*
   * No board size here. The composer reads the boards a game has from its own
   * spec, because it has to offer all of them rather than be handed one.
   */
  games: { variant: string; label: string; kanji: string }[];
};

export type StartGameProps = {
  families: GameGroup[];
  seats: SeatOnBoard[];
  opponents: Opponent[];
  /**
   * Holding a session — `Reader.signedIn`. A signed-out browser can still play
   * at one screen, and nothing else; a signed-in one can post a seat for anyone.
   */
  signedIn: boolean;
  /**
   * An account to ask with — `Reader.hasAccount`. Naming a member or a computer
   * player sends a challenge, which the route refuses to a caller with no
   * address, so an invite holder is not offered them.
   */
  canAsk: boolean;
};
