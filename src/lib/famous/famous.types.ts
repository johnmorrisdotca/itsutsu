import type { FAMOUS_NOTATIONS, FAMOUS_SOURCES } from "./famous.constants";

/** How a famous game's moves are written: each family's own notation, as its source kept it. */
export type FamousNotation = (typeof FAMOUS_NOTATIONS)[keyof typeof FAMOUS_NOTATIONS];

/** One famous game as its source records it — see `FAMOUS_GAMES`. */
export type FamousGame = {
  id: string;
  /** The game here that plays it: Othello is `reversi`, Go is `go`. */
  variant: "reversi" | "go";
  size: number;
  notation: FamousNotation;
  event: string;
  /** The round or game number, or what is known about it; null where the source keeps none. */
  round: string | null;
  /** As the source writes it: a day, a year, or several days. */
  date: string;
  place: string | null;
  black: string;
  white: string;
  /** As the source writes it: "W+R", "B+2.5", Othello's disc count "49-15". */
  result: string;
  source: keyof typeof FAMOUS_SOURCES;
  /** Space-separated, in `notation`. */
  moves: string;
};
