import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the summary.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_SUMMARY: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // The settings, one chip each
  "summary.opening": {
    text: "開局ルール：{opening}",
    back: "Opening rule: {opening}",
    review: AGENT_READ,
  },
  "summary.resignAllowed": {
    text: "投了できる",
    back: "Resigning is allowed",
    review: AGENT_READ,
  },
  "summary.noResign": {
    text: "投了なし",
    back: "No resigning",
    review: AGENT_READ,
  },
  // A handicap, said as a fact about a colour
  "summary.handicap": {
    text: "{colour}にハンデ",
    back: "Handicap for {colour}",
    review: AGENT_READ,
  },
  "summary.handicapWith": {
    text: "{colour}にハンデ：{parts}",
    back: "Handicap for {colour}: {parts}",
    review: AGENT_READ,
  },
  "summary.secondStone": {
    text: "2手目は{where}",
    back: "the second stone: {where}",
    review: AGENT_READ,
  },
  // Who plays whom, in a sentence
  "summary.screen": {
    text: "両方の席は自分たちのものです。1台の端末で、2人が交代で打ちます。",
    back: "Both seats are yours: two people play in turns on this one device.",
    review: AGENT_READ,
  },
  "summary.openingDecidesPosted": {
    text: "開局ルール「{opening}」により、最初の数手が打たれたあとで、どちらがどの色を持つかが決まります。もう一方の席は、応じた人のために掲示されます。",
    back: "Under the opening rule \"{opening}\", who plays which colour is decided once the first few moves are made. The other seat is put up for whoever answers.",
    review: AGENT_READ,
  },
  "summary.openingDecidesAgainst": {
    text: "{against}と対局します。開局ルール「{opening}」により、最初の数手が打たれたあとで、どちらがどの色を持つかが決まります。",
    back: "Playing {against}. Under the opening rule \"{opening}\", who plays which colour is decided once the first few moves are made.",
    review: AGENT_READ,
  },
  "summary.lotPosted": {
    text: "どちらが黒を持つかは、対局が作られるときに抽選で決まります。",
    back: "Who plays black is decided by lot when the game is made.",
    review: AGENT_READ,
  },
  "summary.lotAgainst": {
    text: "{against}と対局します。どちらが黒を持つかは、「始める」を押したときに抽選で決まります。",
    back: "Playing {against}. Who plays black is decided by lot when you press Start.",
    review: AGENT_READ,
  },
  "summary.settledPosted": {
    text: "席は、応じた人のために掲示されます。色は、対局が作られるときに決まります。",
    back: "The seat is put up for whoever answers. The colours are decided when the game is made.",
    review: AGENT_READ,
  },
  "summary.settledAgainst": {
    text: "{against}と対局します。色は、対局が作られるときに決まります。",
    back: "Playing {against}. The colours are decided when the game is made.",
    review: AGENT_READ,
  },
  "summary.seatedPosted": {
    text: "自分は{mine}で、{order}です。{theirs}の席は、応じた人のために、ゲームのページに掲示されます。",
    back: "You are {mine} and play {order}. The {theirs} seat is put up on the games page for whoever answers.",
    review: AGENT_READ,
  },
  "summary.seatedAgainst": {
    text: "{against}と対局します。相手は{theirs}、自分は{mine}で、{order}です。",
    back: "Playing {against}, who plays {theirs}. You are {mine} and play {order}.",
    review: AGENT_READ,
  },
  "summary.moveFirst": {
    text: "先手",
    back: "first",
    review: AGENT_READ,
  },
  "summary.moveSecond": {
    text: "後手",
    back: "second",
    review: AGENT_READ,
  },
  "summary.offerNote": {
    text: "これは申し込みです。{them}は承諾することも断ることもでき、断っても誰にも不利益はありません。",
    back: "This is an offer. {them} can accept or decline, and declining costs nobody anything.",
    review: AGENT_READ,
  },
  "summary.gameOn": {
    text: "{board}の{name}。",
    back: "{name} on {board}.",
    review: AGENT_READ,
  },
  "summary.gameOnBlocked": {
    text: "{board}の{name}（星の点をふさぐ）。",
    back: "{name} on {board} (with the star points blocked).",
    review: AGENT_READ,
  },
  // What the set-up recaps beside the choices
  "summary.againstPlayer": {
    text: "{player}と対局",
    back: "Playing {player}",
    review: AGENT_READ,
  },
  "summary.againstHandOver": {
    text: "席を渡した相手と対局",
    back: "Playing whoever the seat is handed to",
    review: AGENT_READ,
  },
  "summary.computerNamed": {
    text: "{name}（コンピュータ）",
    back: "{name} (a computer)",
    review: AGENT_READ,
  },
  "summary.postForAnyone": {
    text: "誰でも座れる席として掲示する",
    back: "Put the seat up for anyone",
    review: AGENT_READ,
  },
};
