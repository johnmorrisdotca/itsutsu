/** How one game or puzzle went for the side it is told to: a win or a solve, a loss or a give-up, or anything else. */
export type ResultMarkKind = "success" | "failure" | "other";

export type ResultMarkProps = {
  kind: ResultMarkKind;
  className?: string;
};
