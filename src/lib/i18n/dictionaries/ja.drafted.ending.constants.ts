import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the ending.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_ENDING: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "ending.resign": {
    text: "投了",
    back: "Resign",
    review: AGENT_READ,
  },
  "ending.resignAsk": {
    text: "この対局を投了しますか？相手の勝ちになります。",
    back: "Resign this game? The other side wins.",
    review: AGENT_READ,
  },
  "ending.resignForTwo": {
    text: "{name}の代わりに投了しますか？相手の勝ちになります。",
    back: "Resign this game on behalf of {name}? The other player wins.",
    review: AGENT_READ,
  },
  "ending.resignForMany": {
    text: "{name}の代わりに投了しますか？卓はここで終わり、勝者はいません。",
    back: "Resign this game on behalf of {name}? The table ends here, and there is no winner.",
    review: AGENT_READ,
  },
  "ending.resigned": {
    text: "{name}が投了しました。",
    back: "{name} resigned.",
    review: AGENT_READ,
  },
  "ending.resignedNobody": {
    text: "{name}が投了しました。対局はその場で終わり、勝者はいません。",
    back: "{name} resigned. The game ended where it stood, and there is no winner.",
    review: AGENT_READ,
  },
  "ending.resignedWinners": {
    text: "{name}が投了しました。{winners}の勝ちです。",
    back: "{name} resigned. {winners} wins.",
    review: AGENT_READ,
  },
  "ending.giveUp": {
    text: "あきらめる",
    back: "Give up",
    review: AGENT_READ,
  },
  "ending.giveUpAsk": {
    text: "あきらめますか？ここで終わり、解けないままになります。",
    back: "Give up? It ends here, left unsolved.",
    review: AGENT_READ,
  },
  "ending.newGame": {
    text: "新規対局",
    back: "New game",
    review: AGENT_READ,
  },
  "ending.newGameAsk": {
    text: "新規対局を始めますか？進行中の対局はここで終わり、保存されません。",
    back: "Start a new game? The one in progress ends here and is not saved.",
    review: AGENT_READ,
  },
  "ending.newGameYes": {
    text: "新規対局を始める",
    back: "Start a new game",
    review: AGENT_READ,
  },
  "ending.keepPlaying": {
    text: "続ける",
    back: "Keep playing",
    review: AGENT_READ,
  },
  "ending.newGameKeeps": {
    text: "新規対局を始めます。この対局は「対局中」にそのまま残ります。",
    back: "Starts a new game. This one stays where it is, under In progress.",
    review: AGENT_READ,
  },
  "ending.continue": {
    text: "続きから →",
    back: "Continue →",
    review: AGENT_READ,
  },
  "ending.continueTo": {
    text: "{what}の続きから →",
    back: "Continue {what} →",
    review: AGENT_READ,
  },
  "ending.doorEnds": {
    text: "新規対局を始めると、ここで進行中の対局は終わります。",
    back: "Starting a new game ends the one in progress here.",
    review: AGENT_READ,
  },
  "ending.doorKeeps": {
    text: "新規対局を始めても、進行中の対局はそのまま残ります。",
    back: "Starting a new game leaves the one in progress where it is.",
    review: AGENT_READ,
  },
  "ending.othersGoing.one": {
    text: "「対局中」に、ほかの{game}が{others}{plus}局あります",
    back: "{others}{plus} other {game} game is in In progress",
    review: AGENT_READ,
  },
  "ending.othersGoing.other": {
    text: "「対局中」に、ほかの{game}が{others}{plus}局あります",
    back: "{others}{plus} other {game} games are in In progress",
    review: AGENT_READ,
  },
  "ending.doorAsk": {
    text: "新規対局を始めますか？進行中の対局はここで終わり、保存されません。",
    back: "Start a new game? The one in progress ends here and is not saved.",
    review: AGENT_READ,
  },
  "ending.doorKeep": {
    text: "そのまま残す",
    back: "Keep it",
    review: AGENT_READ,
  },
};
