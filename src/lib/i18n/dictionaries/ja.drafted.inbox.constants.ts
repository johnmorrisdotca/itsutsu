import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the inbox.* phrases (ENJA-10): one whole sentence a line, with the other player's name and the game's
 * name where `{who}` and `{game}` stand. Joined into `JA_DRAFTED`. Every row has been read by the reviewer agent.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };
const r = (text: string, back: string): DraftedPhrase => ({ text, back, review: AGENT_READ });

export const JA_DRAFTED_INBOX: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "inbox.title": r("受信箱", "Inbox"),
  "inbox.lead": r("留守のあいだに自分の対局で起きたことです。30日間保存されます。", "What happened in my games while I was away. It is kept for 30 days."),
  "inbox.empty": r(
    "まだ何もありません。自分の対局が終わったとき、誰かが対局やレースを申し込んできたとき、その返事が届いたとき、募集した席に誰かが座ったとき、手にメモが添えられたとき、誰かから手紙が届いたときは、ここに表示されます。",
    "There is nothing yet. When my game ends, when someone proposes a game or a race, when a reply to mine arrives, when someone sits at a seat I posted, when a note is attached to a move, or when a letter arrives from someone, it appears here.",
  ),
  "inbox.unread": r("受信箱に新着{count}件", "{count} new in the inbox"),
  "inbox.open": r("対局を見る", "See the game"),
  "inbox.answer": r("返事をする", "Reply to it"),
  "inbox.reply": r("返信", "Reply"),
  "inbox.somebody": r("誰か", "Somebody"),
  "inbox.aGame": r("対局", "a game"),
  "inbox.gameWon": r("{who}との{game}の対局が終わりました。勝ちました。", "The game of {game} against {who} has ended. I won."),
  "inbox.gameLost": r("{who}との{game}の対局が終わりました。負けました。", "The game of {game} against {who} has ended. I lost."),
  "inbox.gameDrawn": r("{who}との{game}の対局が終わりました。引き分けでした。", "The game of {game} against {who} has ended. It was a draw."),
  "inbox.offerAsked": r("{who}から{game}の対局を申し込まれました。", "{who} proposed a game of {game}."),
  "inbox.offerMatch": r("{who}から{game}の{count}番勝負を申し込まれました。", "{who} proposed a {count}-game match of {game}."),
  "inbox.offerDetail": r("{who}から{game}の対局を申し込まれました（{detail}）。", "{who} proposed a game of {game} ({detail})."),
  "inbox.declined": r("{who}が{game}の対局の申し込みを断りました。", "{who} declined the proposal of a game of {game}."),
  "inbox.withdrawn": r("{who}が{game}の対局の申し込みを取り下げました。", "{who} withdrew the proposal of a game of {game}."),
  "inbox.seatTaken": r("{who}が、{game}で募集していた席に座りました。対局が始まりました。", "{who} sat at the seat I had posted for {game}. The game has begun."),
  "inbox.tableInvite": r("{who}から、複数の端末で遊ぶ{game}の席に招待されました。", "{who} invited me to a seat at a table of {game} played on several devices."),
  "inbox.raceOffer": r("{who}から{game}のレースを申し込まれました。", "{who} proposed a race at {game}."),
  "inbox.tableWon": r("{game}のテーブルが終わりました。勝ちました。", "The table of {game} has ended. I won."),
  "inbox.tableShared": r("{game}のテーブルが終わりました。勝利を分け合いました。", "The table of {game} has ended. We shared the win."),
  "inbox.tableLost": r("{game}のテーブルが終わりました。ほかの人が勝ちました。", "The table of {game} has ended. Someone else won."),
  "inbox.tableEnded": r("{game}のテーブルが途中で終了しました。勝者はいません。", "The table of {game} was ended partway. There is no winner."),
  "inbox.message": r("{who}からメッセージ：「{text}」", "A message from {who}: \"{text}\""),
  "inbox.note": r("{game}の対局で、{who}からメモが届きました：「{text}」", "In the game of {game}, a note arrived from {who}: \"{text}\""),
};
