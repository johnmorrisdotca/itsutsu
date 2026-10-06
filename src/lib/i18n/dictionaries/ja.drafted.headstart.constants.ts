import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the headstart.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_HEADSTART: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "headstart.stonesDescription": {
    text: "最初の手の前に、星の点に石を置きます。そのあとは相手の色が先に打ち、コミは0.5目です。",
    back: "Stones are placed on the star points before the first move. After that the other colour moves first, and komi is 0.5 points.",
    review: AGENT_READ,
  },
  "headstart.cornersDescription": {
    text: "最初の手の前に、この色の石を隅に置きます。隅の石は、何をしても返りません。",
    back: "Before the first move, discs of this colour are placed in the corners. A disc in a corner can never be flipped.",
    review: AGENT_READ,
  },
  "headstart.menDescription": {
    text: "最初の手の前に、相手の最後列の駒を取り除きます。昔のクラブで行われた、駒落ちのハンデです。",
    back: "Before the first move, pieces are removed from the other side's back row. It is the piece-odds handicap the old clubs used.",
    review: AGENT_READ,
  },
  "headstart.fromGo": {
    text: "囲碁",
    back: "Go",
    review: AGENT_READ,
  },
  "headstart.fromOthello": {
    text: "リバーシ",
    back: "Reversi",
    review: AGENT_READ,
  },
  "headstart.fromDraughts": {
    text: "ドラフツ",
    back: "Draughts",
    review: AGENT_READ,
  },
  "headstart.stones.one": {
    text: "置き石1個",
    back: "1 handicap stone",
    review: AGENT_READ,
  },
  "headstart.stones.other": {
    text: "置き石{count}個",
    back: "{count} handicap stones",
    review: AGENT_READ,
  },
  "headstart.corners.one": {
    text: "隅1か所",
    back: "1 corner",
    review: AGENT_READ,
  },
  "headstart.corners.other": {
    text: "隅{count}か所",
    back: "{count} corners",
    review: AGENT_READ,
  },
  "headstart.men.one": {
    text: "相手の駒を1つ外す",
    back: "removing 1 of the other side's pieces",
    review: AGENT_READ,
  },
  "headstart.men.other": {
    text: "相手の駒を{count}つ外す",
    back: "removing {count} of the other side's pieces",
    review: AGENT_READ,
  },
  "headstart.freeTurn.one": {
    text: "先行1手",
    back: "1 head-start move",
    review: AGENT_READ,
  },
  "headstart.freeTurn.other": {
    text: "先行{count}手",
    back: "{count} head-start moves",
    review: AGENT_READ,
  },
  "headstart.described": {
    text: "{colour}に先行あり：{parts}",
    back: "{colour} has a head start: {parts}",
    review: AGENT_READ,
  },
};
