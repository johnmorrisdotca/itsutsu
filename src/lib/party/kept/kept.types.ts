/** How a game played on one device stands in its record (`KEPT_STATUS`). */
export type KeptStatus = "keptPlaying" | "keptFinished" | "keptLeft";

/** Who sat in a seat of a game played on one device (`KEPT_SEAT_KINDS`). */
export type KeptSeatKind = "member" | "computer" | "guest";

/** A seat as the browser describes it: the name typed for it, and whether a computer played it. */
export type KeptSeat = { name: string; computer: boolean };

/**
 * A GAME ON ONE DEVICE, AS ITS BROWSER FILES IT: which game, the game written
 * out in its own encoding, who sat where, and — once its
 * rules have ended it — who won. `left` is a game put away half way.
 */
export type KeptReport = {
  game: string;
  state: string;
  seats: readonly KeptSeat[];
  over: boolean;
  left: boolean;
  winners: readonly number[];
};

/**
 * WHAT A STORE ON ONE DEVICE TELLS ITS RECORD about the game it keeps: its
 * catalogue key, and the three questions only the game's own rules can answer.
 */
export type KeptRecordRules<Game> = {
  game: string;
  over: (game: Game) => boolean;
  winners: (game: Game) => readonly number[];
  seats: (game: Game) => readonly KeptSeat[];
};
