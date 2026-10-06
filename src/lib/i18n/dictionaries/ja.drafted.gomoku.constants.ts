import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the gomoku.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_GOMOKU: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // The two seats, when nobody gave a name
  "gomoku.seatOne": {
    text: "対局者1",
    back: "Player 1",
    review: AGENT_READ,
  },
  "gomoku.seatTwo": {
    text: "対局者2",
    back: "Player 2",
    review: AGENT_READ,
  },
  "gomoku.playerNumber": {
    text: "対局者{number}",
    back: "Player {number}",
    review: AGENT_READ,
  },
  // The obstacle layouts and the draw limits, with what each does
  "gomoku.obstacleNone": {
    text: "すべての交点に打てます。",
    back: "Every intersection can be played.",
    review: AGENT_READ,
  },
  "gomoku.obstacleHoshi": {
    text: "星の点がふさがれます。中央の天元は空いたままです。",
    back: "The star points are blocked. Tengen, in the centre, stays open.",
    review: AGENT_READ,
  },
  "gomoku.drawNone": {
    text: "制限はありません。どちらかが勝つか、盤が埋まるまで続きます。",
    back: "There is no limit. It goes on until somebody wins or the board fills up.",
    review: AGENT_READ,
  },
  "gomoku.drawHalf": {
    text: "盤の点の数の半分の手数が進んでも勝負がつかなければ、引き分けになります。",
    back: "If half as many moves as the board has points have been played and nobody has won, it is a draw.",
    review: AGENT_READ,
  },
  "gomoku.drawThreeQuarters": {
    text: "盤の点の数の4分の3の手数が進んでも勝負がつかなければ、引き分けになります。",
    back: "If three quarters as many moves as the board has points have been played and nobody has won, it is a draw.",
    review: AGENT_READ,
  },
  // A hand-picked board, in words
  "gomoku.cells": {
    text: "{count}マス",
    back: "{count} cells",
    review: AGENT_READ,
  },
  "gomoku.hexagon": {
    text: "{count}マスの六角形の盤",
    back: "a hexagonal board of {count} cells",
    review: AGENT_READ,
  },
  "gomoku.hexagram": {
    text: "{count}マスの六芒星の盤",
    back: "a six-pointed star board of {count} cells",
    review: AGENT_READ,
  },
  "gomoku.squareA": {
    text: "{size}×{size}の盤",
    back: "a {size}×{size} board",
    review: AGENT_READ,
  },
  "gomoku.squareAn": {
    text: "{size}×{size}の盤",
    back: "an {size}×{size} board",
    review: AGENT_READ,
  },
  // How many games a shelf holds, home and guest
  "gomoku.shelfGuests": {
    text: "ほかの系統から{games}",
    back: "{games} from other families",
    review: AGENT_READ,
  },
  "gomoku.shelfBoth": {
    text: "{games}、ほかの系統から{guests}ゲーム",
    back: "{games}, and {guests} games from other families",
    review: AGENT_READ,
  },
};
