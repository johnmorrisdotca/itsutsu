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

/** The colour a bar or a box is drawn in, from the page's own palette. */
export type FigureTone = "ink" | "moss" | "shu" | "ochre";

export type BarRow = {
  /** What the bar counts, as a reader says it. */
  label: ReactNode;
  value: number;
  /** A short line after the number: which games, or where. */
  note?: ReactNode;
  tone?: FigureTone;
};

export type BarChartProps = {
  rows: BarRow[];
  caption: ReactNode;
  /** What a screen reader says instead of the picture. */
  label: string;
};

export type FlowStep = {
  title: string;
  kanji: string;
  body: ReactNode;
};

export type FlowProps = {
  steps: FlowStep[];
  caption: ReactNode;
  label: string;
};

/** A screenshot of the site, from `public/art/about/`. */
export type ShotProps = {
  src: string;
  alt: string;
  /** The file's own size in pixels, so the page keeps the space before it loads. */
  width: number;
  height: number;
  /** Taken at a phone's width: drawn narrow rather than stretched to the column. */
  phone?: boolean;
};
