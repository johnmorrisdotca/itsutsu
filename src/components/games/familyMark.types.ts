import type { Card } from "@/lib/cards/cards.types";
import type { MarkCubeProps } from "./MarkCube";

import type { MarkDomino } from "./games.types";

/** A stone in a family's mark: grid row and column, colour, and whether it is faded (a stone being taken, or a ghost). */
export type MarkStone = { r: number; c: number; white?: boolean; faded?: boolean };

/**
 * A digit in a family's mark: the Numbers family, where nothing is a stone. A faded one is a cell still to fill.
 * Or a letter, on a tile of the word puzzle's colours (`tile`), for a family whose game is words.
 */
export type MarkDigit = { r: number; c: number; value?: number; faded?: boolean; letter?: string; tile?: "hit" | "near" };

export type Mark = {
  /** Lines per side of the little board. */
  n: number;
  /** Cells rather than lines: Othello and the drop games. */
  cells?: boolean;
  stones: MarkStone[];
  /** Digits in cells, for a family of number puzzles. */
  digits?: MarkDigit[];
  /** An extra stroke drawn over the board, in the same 0..n coordinate space. */
  path?: string;
  /** Strokes in ink, drawn under the stones: the bridges between Logic puzzles' islands. */
  ink?: string;
  /** The digits' size, in cells, where they sit inside a stone rather than on a cell; 0.75 otherwise. */
  digitSize?: number;
  /**
   * Playing cards laid on the board, the site's own (`PlayingCard`'s face and
   * back): each at its centre, in cells, turned by `angle` degrees; a card of
   * null is its back. The Cards family's fan.
   */
  cards?: { card: Card | null; x: number; y: number; angle: number }[];
  /** Hitotsu's cards, laid as `cards` are, from its own deck (`HitotsuCardDrawing`): a card id, or null for its back. The Table cards family's wild, beside its French cards. */
  colourCards?: { card: string | null; x: number; y: number; angle: number }[];
  /** Mahjong tiles standing on the board, far ones first: top-left corner, and the character on the face, red where `red`. */
  tiles?: { x: number; y: number; glyph: string; red?: boolean }[];
  /** Dominoes lying across, each its top-left corner (one cell high, two long) and its two ends' pips: the Tiles family's domino. */
  dominoes?: MarkDomino[];
  /** A cube seen from above one corner (`MarkCube`): the Tiles family's. */
  cube?: MarkCubeProps;
};
