import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the reports.* phrases (ENJA-10): the "Report a problem" window. Joined into `JA_DRAFTED`.
 * Every row has been read by the reviewer agent (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };
const r = (text: string, back: string): DraftedPhrase => ({ text, back, review: AGENT_READ });

export const JA_DRAFTED_REPORTS: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "reports.open": r("不具合を報告", "Report a problem"),
  "reports.title": r("不具合の報告", "Report of a problem"),
  "reports.intro": r(
    "何がうまくいかなかったか、そのとき何をしていたかを教えてください。一緒に、開いていたページ、バージョン、日付、画面の写真（追加した場合）だけを保存し、ほかは保存しません。",
    "Please tell us what did not work and what you were doing at the time. Together with it we save only the page you had open, the version, the date and a screenshot (if you add one), and nothing else.",
  ),
  "reports.checking": r("少々お待ちください…", "One moment, please…"),
  "reports.paused": r(
    "ただいま報告の受け付けを一時停止しています。しばらくしてからもう一度お試しください。",
    "Receiving reports is paused at the moment. Please try again after a while.",
  ),
  "reports.sent": r("ありがとうございます。開いていたページと一緒に届きました。", "Thank you. It has arrived, together with the page you had open."),
  "reports.question": r("何が起きましたか？", "What happened?"),
  "reports.placeholder": r(
    "スマートフォンで「待った」を押したあと、打った手が違う交点に置かれました。",
    "On a smartphone, after I pressed \"Undo\", the move I made was placed on a different intersection.",
  ),
  "reports.removeShot": r("スクリーンショットを外す", "Take off the screenshot"),
  "reports.addShot": r("スクリーンショットを追加", "Add a screenshot"),
  "reports.pasteShot": r("または入力欄に貼り付けてください", "or paste one into the input box"),
  "reports.shotAlt": r("報告に添える画面の写真", "The screen picture that goes with the report"),
  "reports.carriesPage": r("ページ", "Page"),
  "reports.carriesVersion": r("バージョン", "Version"),
  "reports.carriesShot": r("スクリーンショット", "Screenshot"),
  "reports.carriesDate": r("日付", "Date"),
  "reports.close": r("閉じる", "Close"),
  "reports.sending": r("送信中…", "Sending…"),
  "reports.send": r("送信", "Send"),
  "reports.rateLimited": r(
    "短い間に報告が多すぎます。{minutes}分後にもう一度お試しください。入力した内容はそのまま残っています。",
    "There are too many reports in a short time. Please try again in {minutes} minutes. What you typed is still here.",
  ),
  "reports.failed": r(
    "いま送信できませんでした。入力した内容は残っています。少ししてからもう一度お試しください。",
    "It could not be sent just now. What you typed is still here. Please try again in a little while.",
  ),
  "reports.shotNotPicture": r("画像ではありません。スクリーンショットはPNG、JPEG、WebPのいずれかにしてください。", "That is not an image. Please make the screenshot one of PNG, JPEG or WebP."),
  "reports.shotTooLarge": r("画像が大きすぎて送れません。画面の一部だけにして、もう一度お試しください。", "The image is too large to send. Please try again with only part of the screen."),
  "reports.tooShort": r("何がうまくいかなかったか、もう少し詳しく書いてください。", "Please write a little more about what did not work."),
  "reports.tooLong": r("{max}文字以内にしてください。", "Please keep it within {max} characters."),
  "reports.shotUnsendable": r("この画像は送れませんでした。もっと小さいものにするか、画像なしで報告を送ってください。", "This image could not be sent. Please use a smaller one, or send the report without an image."),
  "reports.noReporter": r("このブラウザを識別できませんでした。ページを読み込み直して、もう一度お試しください。", "This browser could not be identified. Please reload the page and try again."),
};
