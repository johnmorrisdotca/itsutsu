import type { ComponentType } from "react";

import type { Appearance } from "@/components/board/board.types";
import type { Speaker } from "@/lib/i18n/i18n";
import type { DiceTableRules } from "@/lib/party/diceTable/diceTable.types";

/**
 * WHAT ONE PLAIN DICE GAME'S BOARD IS HANDED, on one device and at a table on
 * several: the game, whose dice it may show, whether the reader may move now, and
 * the hand that makes the move. The set-up, the keeping, the computer and the
 * ending are the table's (`DiceTablePlay`, or `DiceTableOnline`); this only draws
 * the game and turns a press into a move the rules decide.
 */
export type DiceBoardProps<S, M> = {
  game: S;
  appearance: Appearance;
  names: readonly string[];
  /** Whose hidden dice may be drawn (Liar's Dice): the reader's seat, or null for nobody's. */
  viewer: number | null;
  canMove: boolean;
  onMove: (move: M) => void;
};

/** One plain dice game at the table: its rules, its board, what its one choice is called, and how a seat stands. */
export type DiceTableRow<S, M> = {
  rules: DiceTableRules<S, M>;
  Board: ComponentType<DiceBoardProps<S, M>>;
  /** Whether a seat's dice are hidden from the others: the device is covered between two people. */
  hidden: boolean;
  /** What the set-up's one choice is asking, and each option's words. */
  sizeLegend: (say: Speaker) => string;
  sizeWord: (size: number, say: Speaker) => string;
  /** How a seat stands, in a few words: for My games' line and a table's seat list. */
  standing: (game: S, seat: number, say: Speaker) => string;
  /** How many dice a game has thrown: it moving is what the dice's sound answers to. */
  thrown: (game: S) => number;
};
