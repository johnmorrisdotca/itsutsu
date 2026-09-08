import type { ReactNode } from "react";

export type DiagramColour = "black" | "white";

export type DiagramStone = {
  row: number;
  col: number;
  colour: DiagramColour;
  /** Move number or a letter, printed on the stone. */
  label?: string;
  /** Drawn with a red ring: the move the caption is about. */
  ring?: boolean;
  /** Drawn faded and dashed: a stone about to leave the board. */
  taken?: boolean;
};

export type DiagramProps = {
  rows: number;
  cols: number;
  /** Five-in-a-row games sit on the lines; Othello and drop games in the cells. */
  grid: "lines" | "cells";
  stones: DiagramStone[];
  caption: ReactNode;
  /** What a screen reader says instead of the picture. */
  label: string;
};

/** Who wins a solved game with perfect play, drawn as a stone. */
export type Verdict = "first" | "second" | "draw";

export type TimelineEvent = {
  year: number;
  name: string;
  /** A short second line under the name. */
  note?: string;
  /** Rows above (positive) or below (negative) the axis, to keep labels apart. */
  lane: number;
  verdict?: Verdict;
};

export type TimelineProps = {
  from: number;
  to: number;
  /** Years between axis ticks. */
  step: number;
  events: TimelineEvent[];
  caption: ReactNode;
  label: string;
  /** Show the who-wins legend. */
  verdicts?: boolean;
};
