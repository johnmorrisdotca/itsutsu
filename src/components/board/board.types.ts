import type { Cell, GameState, Point, Stone } from "@/lib/gomoku/gomoku.types";

export type BoardProps = {
  state: GameState;
  onPlay: (point: Point) => void;
};

export type IntersectionProps = {
  point: Point;
  cell: Cell;
  /** Accessible name, e.g. "H8, empty" or "H8, black stone". */
  label: string;
  isLast: boolean;
  isWinning: boolean;
  /** Colour previewed on hover while the intersection is playable, if any. */
  ghost: Stone | null;
  onPlay: (point: Point) => void;
};

export type StoneMarkProps = {
  stone: Stone;
  isLast?: boolean;
  isWinning?: boolean;
  /** A translucent hover preview rather than a placed stone. */
  ghost?: boolean;
};
