export type MoveCountProps = {
  /** The move shown, 0 being the start. */
  at: number;
  /** The last move there is. */
  last: number;
  /** What the start is called, where it is not "Move 0 of …": a card game's "The deal". */
  start?: string;
  className?: string;
  testId?: string;
};
