import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { KOMI } from "@/lib/gomoku/rules/go";
import type { SgfGameType, SgfRefusal, SgfTypeRow, SgfTypeSpec } from "./sgf.types";

/**
 * SGF, the Smart Game Format (FF[4], https://www.red-bean.com/sgf/), as far as
 * this site's games can be written in it.
 *
 * SGF numbers the games it describes, and a reader decides what to do with a
 * file by that number alone. So a number is a claim: a file typed as Gomoku
 * tells every program that opens it that nothing is ever captured and that
 * each node is one stone. A capture game written that way replays into a
 * position that never existed, and does it without complaint — which is the
 * "zero is the dangerous answer" fault in AGENTS.md wearing a file extension.
 * A game SGF has no number for gets no file, and its reason is in the table.
 */

export const SGF_GAME_TYPES = {
  go: 1,
  othello: 2,
  gomoku: 4,
  hex: 11,
} as const satisfies Record<string, SgfGameType>;

export const SGF_TYPE_SPECS: Record<SgfGameType, SgfTypeSpec> = {
  1: {
    name: "Go",
    passes: "empty",
    points: "letters",
    komi: KOMI,
    startingDiscs: false,
    rulesComment:
      "Scored by area: every stone on the board and every empty point only one colour surrounds. " +
      "Simple ko; suicide is not allowed; stones left on the board at the end count as alive.",
    carries: { opening: false, handicap: false, obstacles: false },
  },
  2: {
    name: "Othello",
    passes: "unwritable",
    points: "letters",
    komi: null,
    startingDiscs: true,
    rulesComment: null,
    carries: { opening: false, handicap: false, obstacles: false },
  },
  4: {
    name: "Gomoku+Renju",
    passes: "unwritable",
    points: "letters",
    komi: null,
    startingDiscs: false,
    rulesComment: null,
    carries: { opening: true, handicap: true, obstacles: true },
  },
  11: {
    name: "Hex",
    passes: "word",
    points: "hex",
    komi: null,
    startingDiscs: false,
    rulesComment: null,
    carries: { opening: true, handicap: false, obstacles: true },
  },
};

const NO_NUMBER = "SGF's list of game types has no number for this game";

/**
 * Every game here, and what it is written as. A `Record` so a new variant does
 * not compile until somebody has decided — the same way `VARIANT_SPECS` makes
 * a game declare its grid. `sgf.constants.test.ts` holds each mapped row to
 * the rules data, so a row cannot claim a type its spec does not play.
 */
export const SGF_TYPES: Record<RuleVariant, SgfTypeRow> = {
  freestyle: { gm: SGF_GAME_TYPES.gomoku, rules: "Freestyle" },
  standard: { gm: SGF_GAME_TYPES.gomoku, rules: "Standard" },
  renju: { gm: SGF_GAME_TYPES.gomoku, rules: "Renju" },
  omok: { gm: SGF_GAME_TYPES.gomoku, rules: "Omok" },
  caro: { gm: SGF_GAME_TYPES.gomoku, rules: "Caro" },
  ninuki: {
    gm: null,
    why: "Captures take pairs off the board. A Gomoku reader would leave them there, so every position after the first capture would be wrong.",
  },
  sannuki: {
    gm: null,
    why: "Captures take pairs and triples off the board. A Gomoku reader would leave them there, so every position after the first capture would be wrong.",
  },
  connect6: {
    gm: null,
    why: `Two stones a turn and six to win. ${NO_NUMBER}, and as Gomoku it would be a different game under Gomoku's name.`,
  },
  misereFive: {
    gm: null,
    why: `Making five loses. ${NO_NUMBER}; typed as Gomoku, every reader would take the loser's line for a win.`,
  },
  toroidalFive: {
    gm: null,
    why: `The edges join, so a line runs off one side and on at the other. ${NO_NUMBER}, and no SGF board wraps.`,
  },
  obstacleFive: {
    gm: null,
    why: `Dead squares and hotspots are scattered by the seed, and a hotspot counts for either colour. ${NO_NUMBER}, and SGF cannot put either on a Gomoku board.`,
  },
  makerBreaker: { gm: null, why: `One side builds a line of either colour and the other fills the board. ${NO_NUMBER}.` },
  wildTicTacToe: { gm: null, why: `Either player may place either mark. ${NO_NUMBER}.` },
  notakto: { gm: null, why: `Both players place the same mark, and completing a line loses. ${NO_NUMBER}.` },
  tictactoe: { gm: null, why: `Noughts and crosses. ${NO_NUMBER}.` },
  trapThree: { gm: null, why: `Four wins and three loses, on a 5×5 board. ${NO_NUMBER}.` },
  squareFour: { gm: null, why: `Four pieces each, which move once they are all down. ${NO_NUMBER}.` },
  twistFive: { gm: null, why: `Every move ends with a quadrant turning. ${NO_NUMBER}.` },
  twistFour: { gm: null, why: `Every move ends with a quadrant turning. ${NO_NUMBER}.` },
  dropFour: { gm: null, why: `Stones fall to the bottom of a column. ${NO_NUMBER}.` },
  ringDrop: { gm: null, why: `Stones fall down columns that wrap round. ${NO_NUMBER}.` },
  holeDrop: { gm: null, why: `Stones fall down columns, around a dead square. ${NO_NUMBER}.` },
  hotDrop: { gm: null, why: `Stones fall down columns, with a hotspot and a dead square. ${NO_NUMBER}.` },
  clearDrop: { gm: null, why: `Stones fall down columns, and a full bottom row disappears. ${NO_NUMBER}.` },
  giveawayDrop: { gm: null, why: `Stones fall down columns, and making four loses. ${NO_NUMBER}.` },
  edgeDrop: { gm: null, why: `Stones slide in from the edges. ${NO_NUMBER}.` },
  wormDrop: { gm: null, why: `Stones fall down columns, and lines pass through wormholes. ${NO_NUMBER}.` },
  dominoFive: { gm: null, why: `A move lays a two-stone piece from a shared queue. ${NO_NUMBER}.` },
  blockFive: { gm: null, why: `A move lays a four-stone piece from a shared queue. ${NO_NUMBER}.` },
  reversi: { gm: SGF_GAME_TYPES.othello, rules: null },
  miniReversi: { gm: SGF_GAME_TYPES.othello, rules: null },
  grandReversi: { gm: SGF_GAME_TYPES.othello, rules: null },
  classicReversi: {
    gm: null,
    why: "The four centre discs are laid by the players, which is Reversi's older rule and not Othello's. SGF's number 2 is Othello, whose game starts with them already set.",
  },
  antiReversi: {
    gm: null,
    why: "Fewer discs wins. It is played on Othello's board by Othello's moves, but a file typed as Othello would be read for the opposite goal.",
  },
  halma: { gm: null, why: `Pieces step and jump into the far camp. ${NO_NUMBER}.` },
  checkers: { gm: null, why: `${NO_NUMBER}: it numbers chess, shogi and Chinese chess, and not draughts.` },
  internationalDraughts: { gm: null, why: `${NO_NUMBER}: it numbers chess, shogi and Chinese chess, and not draughts.` },
  brazilianDraughts: { gm: null, why: `${NO_NUMBER}: it numbers chess, shogi and Chinese chess, and not draughts.` },
  canadianCheckers: { gm: null, why: `${NO_NUMBER}: it numbers chess, shogi and Chinese chess, and not draughts.` },
  chineseCheckers: { gm: null, why: `Marbles race across a star-shaped board. ${NO_NUMBER}.` },
  hex: { gm: SGF_GAME_TYPES.hex, rules: null },
  go: { gm: SGF_GAME_TYPES.go, rules: null },
};

export const SGF_REFUSALS = {
  noType: "no-sgf-type",
  notFinished: "not-finished",
  boardSize: "board-size",
  winLength: "win-length",
  rulesOutsideType: "rules-outside-type",
  unreadableMove: "unreadable-move",
} as const satisfies Record<string, SgfRefusal>;

/** The largest board SGF's two-letter point reaches: a–z, then A–Z. */
export const SGF_MAX_SIZE = 52;

export const SGF_POINT_LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** DT's own form: a whole date, ISO order, and nothing else. */
export const SGF_CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The type the programs that read SGF register for it. */
export const SGF_MIME = "application/x-go-sgf";

/** How many nodes go on one line of the file, so a long game is not one line of thousands of characters. */
export const SGF_NODES_PER_LINE = 10;
