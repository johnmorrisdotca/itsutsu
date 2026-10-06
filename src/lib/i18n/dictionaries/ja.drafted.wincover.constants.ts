import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the wincover.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_WINCOVER: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // What the win cover says
  "wincover.seeBoard": {
    text: "盤を見る",
    back: "See the board",
    review: AGENT_READ,
  },
  "wincover.solved": {
    text: "解決",
    back: "Solved",
    review: AGENT_READ,
  },
  "wincover.won": {
    text: "勝ち",
    back: "Won",
    review: AGENT_READ,
  },
  "wincover.youWin": {
    text: "勝ちです",
    back: "You win",
    review: AGENT_READ,
  },
  "wincover.wins": {
    text: "{who}の勝ち",
    back: "{who} wins",
    review: AGENT_READ,
  },
  "wincover.shareWin": {
    text: "{who}で勝ちを分け合いました",
    back: "{who} shared the win",
    review: AGENT_READ,
  },
  "wincover.draw": {
    text: "引き分け",
    back: "Draw",
    review: AGENT_READ,
  },
  "wincover.you": {
    text: "自分",
    back: "Me",
    review: AGENT_READ,
  },
  "wincover.afterTime": {
    text: "（所要{time}）",
    back: "(taking {time})",
    review: AGENT_READ,
  },
  "wincover.afterTimeMoves": {
    text: "（所要{time}、{moves}）",
    back: "(taking {time}, {moves})",
    review: AGENT_READ,
  },
  "wincover.againSamePlayers": {
    text: "同じ顔ぶれでもう一局",
    back: "Another game with the same players",
    review: AGENT_READ,
  },
  "wincover.playAgain": {
    text: "もう一局",
    back: "Another game",
    review: AGENT_READ,
  },
  "wincover.computer": {
    text: "コンピュータ",
    back: "The computer",
    review: AGENT_READ,
  },
};
