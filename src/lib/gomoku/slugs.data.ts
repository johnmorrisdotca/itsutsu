// Relative, like the rest of this folder: the browser specs import the addresses, and Playwright resolves no alias.
import type { PartyKind } from "../party/party.types";
import type { PuzzleKind } from "../puzzles/puzzles.types";

import type { RuleVariant } from "./gomoku.types";

/**
 * Every game's place in the site's paths.
 *
 * A game is a resource at /games/<slug>, and everything about it — its rules,
 * its record, its ladder, its matches — is a facet underneath that one
 * address. The slugs are a table rather than a transform of the
 * variant key, so that a name can be chosen for how it reads in an address
 * bar — /games/gomoku, not /games/freestyle — and so that renaming a variant
 * key can never silently move a page that people have linked to.
 */
export const GAME_SLUGS: Record<RuleVariant, string> = {
  freestyle: "gomoku",
  standard: "standard",
  renju: "renju",
  omok: "omok",
  caro: "caro",
  ninuki: "ninuki",
  sannuki: "sannuki",
  misereFive: "misere-five",
  makerBreaker: "maker-breaker",
  wildTicTacToe: "wild-tic-tac-toe",
  notakto: "notakto",
  connect6: "connect-six",
  toroidalFive: "toroidal-five",
  obstacleFive: "obstacle-five",
  scatteredRocks: "scattered-rocks",
  rockfall: "rockfall",
  dropFour: "drop-four",
  dominoFive: "domino-five",
  blockFive: "block-five",
  ringDrop: "ring-drop",
  holeDrop: "hole-drop",
  hotDrop: "hot-drop",
  clearDrop: "clear-drop",
  giveawayDrop: "giveaway-drop",
  wormDrop: "wormhole-drop",
  edgeDrop: "edge-drop",
  twistFive: "twist-five",
  twistFour: "twist-four",
  trapThree: "trap-three",
  squareFour: "square-four",
  tictactoe: "tic-tac-toe",
  reversi: "reversi",
  classicReversi: "classic-reversi",
  antiReversi: "anti-reversi",
  miniReversi: "mini-reversi",
  grandReversi: "grand-reversi",
  honeycomb: "honeycomb",
  halma: "halma",
  hex: "hex",
  hexFive: "hex-five",
  checkers: "checkers",
  internationalDraughts: "international-draughts",
  brazilianDraughts: "brazilian-draughts",
  canadianCheckers: "canadian-checkers",
  russianDraughts: "russian-draughts",
  poolCheckers: "pool-checkers",
  chineseCheckers: "chinese-checkers",
  go: "go",
};

/**
 * The puzzles' places in the same paths: /games/number-place, with its
 * rules, family, set-up and solve one segment under it, as a game has.
 * One address shape for both kinds is what lets every name on the site go
 * through `gamePath` and every page-width and gate rule already hold.
 */
export const PUZZLE_SLUGS: Record<PuzzleKind, string> = {
  numberPlace: "number-place",
  hiddenStones: "hidden-stones",
  moreOrLess: "more-or-less",
  jigsaw: "jigsaw",
  diagonal: "diagonal",
  sumCages: "sum-cages",
  towers: "towers",
  blackAndWhite: "black-and-white",
  gomoji: "gomoji",
  gomojiKana: "gomoji-kana",
  gomojiMot: "gomoji-mot",
  gomojiWort: "gomoji-wort",
  gomojiPop: "pop-gomoji",
  tsunagi: "tsunagi",
  kumimoji: "kumimoji",
  koushi: "koushi",
  bridges: "bridges",
  pictureLogic: "picture-logic",
  solitaire: "solitaire",
  freecell: "freecell",
  spider: "spider",
  mahjong: "mahjong",
  cube: "cube",
};

/**
 * The party games' places in the same paths: /games/dots-and-boxes and
 * /games/mancala, each with its rules and its table (`/pass-and-play`)
 * under it, as every game has. A party
 * game's family page is its family's own address (`familyPagePath`), so
 * nothing is answered at /games/<slug>/family for one.
 */
export const PARTY_SLUGS: Record<PartyKind, string> = {
  dotsAndBoxes: "dots-and-boxes",
  superghost: "superghost",
  mancala: "mancala",
  tenka: "tenka",
  mexicanTrain: "mexican-train",
  hearts: "hearts",
  bigTwo: "big-two",
  president: "president",
  goFish: "go-fish",
  crazyEights: "crazy-eights",
};
