import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the messages.* phrases (ENJA-10): a conversation with one member, and why a message was not sent.
 * Joined into `JA_DRAFTED`. Every row has been read by the reviewer agent.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };
const r = (text: string, back: string): DraftedPhrase => ({ text, back, review: AGENT_READ });

export const JA_DRAFTED_MESSAGES: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "messages.title": r("手紙", "Letters"),
  "messages.with": r("{who}とのやりとり", "Exchange with {who}"),
  "messages.placeholder": r("メッセージを書く…", "Write a message…"),
  "messages.send": r("送信", "Send"),
  "messages.failed": r("送信できませんでした。少ししてからもう一度お試しください。", "It could not be sent. Please try again in a little while."),
  "messages.empty": r("まだ何も書かれていません。あいさつしてみましょう。相手の受信箱に届きます。", "Nothing has been written yet. Let's say hello. It will reach their inbox."),
  "messages.ignored": r(
    "この人を無視リストに入れているため、相手が書いたものはここに表示されず、解除するまでこちらからも書けません。",
    "Because this person is on my ignore list, what they write is not shown here, and I cannot write to them until I remove them from it.",
  ),
  "messages.you": r("自分", "Me"),
  "messages.childClosed": r(
    "この対局者は13歳未満のため、本人の仲間リストにいる人だけが書き込めます。相手があなたを仲間に追加すると、ここに書けるようになります。",
    "This player is under 13, so only people on their own buddy list can write to them. If they add you as a buddy, you will be able to write here.",
  ),
  "messages.nobody": r("その名前の書き込み先はここにいません。", "There is no one by that name here to write to."),
  "messages.refuseNoSuchMember": r("その名前の書き込み先がいません。", "There is no one by that name to write to."),
  "messages.refuseNotAPerson": r("書き込めるのは人だけです。コンピュータは読みません。", "Only people can be written to. Computers do not read."),
  "messages.refuseToYourself": r("それは自分です。", "That is yourself."),
  "messages.refuseNotTaking": r("この人は、あなたからのメッセージを受け付けていません。", "This person is not accepting messages from you."),
  "messages.refuseYouIgnore": r("この人を無視リストに入れています。書き込むには解除してください。", "You have put this person on your ignore list. Remove them from it to write."),
  "messages.refuseChild": r("この対局者は13歳未満のため、本人の仲間リストにいる人だけが書き込めます。", "This player is under 13, so only people on their own buddy list can write to them."),
  "messages.refuseEmpty": r("先に何か書いてください。", "Please write something first."),
  "messages.refuseTooLong": r("メッセージとしては長すぎます。", "It is too long to be a message."),
};
