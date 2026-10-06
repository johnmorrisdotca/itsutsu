import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the pcard.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer agent's pass (`review`), the same shape the
 * drafted dictionary's own rows take.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_PCARD: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "pcard.replay.dealt": {
    text: "配られたままの配りです。",
    back: "The deal, as it was dealt.",
    review: AGENT_READ,
  },
  "pcard.replay.stepped": {
    text: "スクラバーで、配りから最後のカードがホームに入るまでを、1手ずつたどれます。",
    back: "Step through it with the scrubber, from the deal to the last card home.",
    review: AGENT_READ,
  },
  "pcard.replay.givenUp": {
    text: "ここであきらめました。ここまでの道筋を、さかのぼってたどれます。",
    back: "Given up here: step back through how it got there.",
    review: AGENT_READ,
  },
  "pcard.score.vegas": {
    text: "ベガス {score}",
    back: "Vegas {score}",
    review: AGENT_READ,
  },
  "pcard.score.score": {
    text: "スコア {score}",
    back: "Score {score}",
    review: AGENT_READ,
  },
  "pcard.dealsAria": {
    text: "配り方",
    back: "Deals",
    review: AGENT_READ,
  },
  "pcard.scoreAria": {
    text: "得点方式",
    back: "Score",
    review: AGENT_READ,
  },
  "pcard.mj.freeAria": {
    text: "空き牌",
    back: "Free tiles",
    review: AGENT_READ,
  },
  "pcard.mj.findAria": {
    text: "探す",
    back: "Find",
    review: AGENT_READ,
  },
  "pcard.mj.playersAria": {
    text: "人数",
    back: "Players",
    review: AGENT_READ,
  },
  "pcard.mj.bonusAria": {
    text: "花牌と季節牌",
    back: "Flowers and seasons",
    review: AGENT_READ,
  },
  "pcard.mj.playerOne": {
    text: "1人",
    back: "Solitaire",
    review: AGENT_READ,
  },
  "pcard.mj.playerTwo": {
    text: "2人",
    back: "Two",
    review: AGENT_READ,
  },
  "pcard.mj.playerThree": {
    text: "3人",
    back: "Three",
    review: AGENT_READ,
  },
  "pcard.mj.playerFour": {
    text: "4人",
    back: "Four",
    review: AGENT_READ,
  },
  "pcard.mj.alone": {
    text: "ひとりで、時計と競います。配置の牌をすべて取り除きます。",
    back: "Alone, against the clock: clear the whole layout.",
    review: AGENT_READ,
  },
  "pcard.mj.party.one": {
    text: "{who}が、1つの配置を、1回に1組ずつ取りながら、端末を順番に回して遊びます。三元牌と風牌が最も高得点で、どの席もコンピュータにできます。",
    back: "{who} take turns on one layout, a pair a turn, passing one device round; dragons and winds score most, and any seat can be a computer.",
    review: AGENT_READ,
  },
  "pcard.mj.party.other": {
    text: "{who}が、1つの配置を、1回に1組ずつ取りながら、端末を順番に回して遊びます。三元牌と風牌が最も高得点で、どの席もコンピュータにできます。",
    back: "{who} take turns on one layout, a pair a turn, passing one device round; dragons and winds score most, and any seat can be a computer.",
    review: AGENT_READ,
  },
  "pcard.mj.shuffle": {
    text: "シャッフル",
    back: "Shuffle",
    review: AGENT_READ,
  },
  "pcard.mj.shuffleTitle": {
    text: "シャッフルは、空いているペアがなくなったときに使います",
    back: "Shuffle is for when no free pair is left",
    review: AGENT_READ,
  },
  "pcard.mj.status.one": {
    text: "残り{tiles}枚・空きのペアは{count}組",
    back: "{tiles} tiles left, {count} pair free",
    review: AGENT_READ,
  },
  "pcard.mj.status.other": {
    text: "残り{tiles}枚・空きのペアは{count}組",
    back: "{tiles} tiles left, {count} pairs free",
    review: AGENT_READ,
  },
  "pcard.mj.turn": {
    text: "{name}の番です。ペアを取ってください。",
    back: "{name} to take a pair.",
    review: AGENT_READ,
  },
  "pcard.mj.turnComputer": {
    text: "{name}がペアを選んでいます…",
    back: "{name} to take a pair…",
    review: AGENT_READ,
  },
  "pcard.mj.took": {
    text: "{name}が{pair}を取りました　+{points}",
    back: "{name} took {pair} +{points}",
    review: AGENT_READ,
  },
  "pcard.mj.again": {
    text: "。続けてもう1手打ちます",
    back: ", and goes again",
    review: AGENT_READ,
  },
  "pcard.mj.wins": {
    text: "{name}の勝ちです。",
    back: "{name} wins.",
    review: AGENT_READ,
  },
  "pcard.mj.share": {
    text: "{names}が勝ちを分け合いました。",
    back: "{names} share the win.",
    review: AGENT_READ,
  },
  "pcard.mj.endAsk": {
    text: "全員のために、終えますか？ゲームは保存されません。",
    back: "End it for everybody? It is not kept.",
    review: AGENT_READ,
  },
  "pcard.mj.seatTitle": {
    text: "{wind}の席",
    back: "{wind} seat",
    review: AGENT_READ,
  },
  "pcard.mj.computerPlays": {
    text: "{wind}の席は、コンピュータが打ちます",
    back: "A computer plays the {wind} seat",
    review: AGENT_READ,
  },
  "pcard.mj.seatNameAria": {
    text: "{wind}の席の名前",
    back: "The {wind} seat's name",
    review: AGENT_READ,
  },
  "pcard.mj.replacing": {
    text: "はじめると、このブラウザーに残っているテーブルのゲームは、忘れられます。",
    back: "Beginning forgets the table game this browser is keeping.",
    review: AGENT_READ,
  },
  "pcard.mj.nobody": {
    text: "少なくとも1つの席は人にしてください。",
    back: "At least one seat is a person's.",
    review: AGENT_READ,
  },
  "pcard.mj.start": {
    text: "スタート",
    back: "Start",
    review: AGENT_READ,
  },
  "pcard.mj.pointsAria": {
    text: "得点",
    back: "Points",
    review: AGENT_READ,
  },
  "pcard.mj.continueGame": {
    text: "テーブルのゲームを続ける",
    back: "Continue the table game",
    review: AGENT_READ,
  },
  "pcard.pile.stock": {
    text: "山札",
    back: "The stock",
    review: AGENT_READ,
  },
  "pcard.pile.stockCount.one": {
    text: "山札：{count}枚。{turn}枚ずつめくる",
    back: "The stock: {count} card. Turn {turn} at a time",
    review: AGENT_READ,
  },
  "pcard.pile.stockCount.other": {
    text: "山札：{count}枚。{turn}枚ずつめくる",
    back: "The stock: {count} cards. Turn {turn} at a time",
    review: AGENT_READ,
  },
  "pcard.pile.waste": {
    text: "捨て札",
    back: "The waste",
    review: AGENT_READ,
  },
  "pcard.pile.foundation": {
    text: "{suit}のホーム",
    back: "The {suit} home",
    review: AGENT_READ,
  },
  "pcard.pile.column": {
    text: "{n}列目",
    back: "Column {n}",
    review: AGENT_READ,
  },
  "pcard.pile.freeCell": {
    text: "フリーセル{n}",
    back: "Free cell {n}",
    review: AGENT_READ,
  },
  "pcard.pile.faceDown": {
    text: "裏向きのカード",
    back: "a face-down card",
    review: AGENT_READ,
  },
  "pcard.pile.empty": {
    text: "{pile}：空",
    back: "{pile}: empty",
    review: AGENT_READ,
  },
  "pcard.pile.stockDeals.one": {
    text: "山札：配る分があと{count}回。すべての列にカードを1枚ずつ配る",
    back: "The stock: {count} deal left. Deal a card to every column",
    review: AGENT_READ,
  },
  "pcard.pile.stockDeals.other": {
    text: "山札：配る分があと{count}回。すべての列にカードを1枚ずつ配る",
    back: "The stock: {count} deals left. Deal a card to every column",
    review: AGENT_READ,
  },
  "pcard.pile.runNot": {
    text: "{n}組目：まだできていません",
    back: "Set {n}: not made yet",
    review: AGENT_READ,
  },
  "pcard.pile.runMade": {
    text: "{n}組目：{suit}、完成",
    back: "Set {n}: the {suit}, made",
    review: AGENT_READ,
  },
  "pcard.card.name": {
    text: "{suit}の{rank}",
    back: "{rank} of {suit}",
    review: AGENT_READ,
  },
  "pcard.suit.spades": {
    text: "スペード",
    back: "spades",
    review: AGENT_READ,
  },
  "pcard.suit.hearts": {
    text: "ハート",
    back: "hearts",
    review: AGENT_READ,
  },
  "pcard.suit.diamonds": {
    text: "ダイヤ",
    back: "diamonds",
    review: AGENT_READ,
  },
  "pcard.suit.clubs": {
    text: "クラブ",
    back: "clubs",
    review: AGENT_READ,
  },
  "pcard.rank.ace": {
    text: "エース",
    back: "ace",
    review: AGENT_READ,
  },
  "pcard.rank.jack": {
    text: "ジャック",
    back: "jack",
    review: AGENT_READ,
  },
  "pcard.rank.queen": {
    text: "クイーン",
    back: "queen",
    review: AGENT_READ,
  },
  "pcard.rank.king": {
    text: "キング",
    back: "king",
    review: AGENT_READ,
  },
  "pcard.mj.blocked": {
    text: "動かせない",
    back: "cannot be moved",
    review: AGENT_READ,
  },
  "pcard.mj.layoutAria.one": {
    text: "麻雀の配置、残り{count}枚",
    back: "Mahjong layout, {count} tile left",
    review: AGENT_READ,
  },
  "pcard.mj.layoutAria.other": {
    text: "麻雀の配置、残り{count}枚",
    back: "Mahjong layout, {count} tiles left",
    review: AGENT_READ,
  },
};
