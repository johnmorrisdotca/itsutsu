/** One seat already on the board, as the composer needs to read it. */
export type SeatOnBoard = {
  id: string;
  variant: string;
  moveTimeMs: number | null;
  /** The member sitting in it, as they are named. */
  who: string;
};

/** Somebody the sentence can name as an opponent. */
export type Opponent = {
  email: string;
  name: string;
  /** Here in the last half hour, so the hint can say so. */
  here: boolean;
};

/** A family of games, as the game select groups them. */
export type GameGroup = {
  title: string;
  kanji: string;
  games: { variant: string; label: string; kanji: string; size: number }[];
};

export type StartGameProps = {
  families: GameGroup[];
  seats: SeatOnBoard[];
  opponents: Opponent[];
  /** A signed-out browser can still play at one screen, and nothing else. */
  signedIn: boolean;
};
