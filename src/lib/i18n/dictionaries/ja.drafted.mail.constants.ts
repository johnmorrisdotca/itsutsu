import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the mail.* phrases (ENJA-12): every email the site sends a person, and what a person is told when an
 * email was not sent. Every row has been read by the reviewer agent.
 *
 * An email is addressed to one person in the polite です/ます register, with no あなた where Japanese would leave
 * it out, and a subject is a short statement with no stop. The site's own words are used for the site's own things
 * (対局, 手番, 投了, 引き分け, レーティング), a game is named by its kanji (the way a Japanese reader meets it on the
 * site), and a person's name takes さん where the sentence names a person (never a colour).
 *
 * The footer line that says how to stop getting the email, and the lines that say a child is never emailed or that an
 * address was not saved, are what Canada's anti-spam law and the privacy page promise, so they also carry an `ask`
 * and are listed on the review sheet for a native reader.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

const ASK_STOP =
  "The line every email carries about how to stop getting it, which Canada's anti-spam law wants to work: a native read is recommended.";
const ASK_ADDRESS =
  "Says the site has not saved the recipient's address and will not write again: a promise on the privacy page, so a native read is recommended.";
const ASK_CHILD =
  "About a member under 13, whom the site never emails: a native read is recommended, and the sentence must be as strict as the English.";

const r = (text: string, back: string, ask?: string): DraftedPhrase => ({ text, back, review: AGENT_READ, ...(ask === undefined ? {} : { ask }) });

export const JA_DRAFTED_MAIL: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "mail.because": r(
    "このメールは、{site}で遊んでいる方にお送りしています。ご質問は{address}までお寄せください。",
    "This email is sent to people who play on {site}. Please send questions to {address}.",
    ASK_STOP,
  ),
  "mail.stopHow": r(
    "{words}、または{site}からのメールをすべて止めるには：",
    "To stop {words}, or all emails from {site}:",
    ASK_STOP,
  ),
  "mail.yourGames": r("対局中のページ：", "The games-in-progress page:"),
  "mail.questions": r("ご質問は{address}までお寄せください。", "Please send questions to {address}."),

  "mail.turn.subject": r("{site}で手番が回ってきました", "It has become your move on {site}"),
  "mail.turn.body": r(
    "相手が手を打ちました。盤が、ご自身の手を待っています。",
    "Your opponent has played a move. The board is waiting for your move.",
  ),

  "mail.over.subject": r("{site}での対局が終わりました", "Your game on {site} has ended"),
  "mail.over.draw": r("対局は引き分けで終わりました。", "The game ended in a draw."),
  "mail.over.won": r("対局が終わり、勝ちました。", "The game has ended, and you won."),
  "mail.over.lost": r("対局が終わり、負けました。", "The game has ended, and you lost."),
  "mail.over.record": r("結果は、対局中のページで確認できます：", "You can check the result on the games-in-progress page:"),

  "mail.over.subjectWon": r("{game}で{opponent}に勝ちました", "You beat {opponent} at {game}"),
  "mail.over.subjectLost": r("{game}の対局は{opponent}の勝ちでした", "The {game} game was {opponent}'s win"),
  "mail.over.subjectDraw": r("{game}の対局は{opponent}との引き分けでした", "The {game} game was a draw with {opponent}"),
  "mail.over.headWon": r("{game}の対局で、{opponent}に勝ちました。", "In the {game} game, you beat {opponent}."),
  "mail.over.headLost": r("{game}の対局で、{opponent}に負けました。", "In the {game} game, you lost to {opponent}."),
  "mail.over.headDraw": r("{game}の対局は、{opponent}との引き分けでした。", "The {game} game was a draw with {opponent}."),
  "mail.over.ratingUp": r("レーティングが{change}上がりました。", "Your rating went up by {change}."),
  "mail.over.ratingDown": r("レーティングが{change}下がりました。", "Your rating went down by {change}."),
  "mail.over.finalPosition": r("終局時の盤面：", "The board at the end of the game:"),
  "mail.over.playAgain": r("もう一局：", "One more game:"),
  "mail.over.person": r("{name}さん", "{name} (with the polite suffix -san)"),

  "mail.length.moves": r("{moves}で終わりました。", "It ended in {moves}."),
  "mail.length.in": r("{moves}、{over}で終わりました。", "It ended in {moves}, in {over}."),
  "mail.length.over": r("{moves}、{over}かかって終わりました。", "It ended in {moves}, after taking {over}."),
  "mail.length.underMinute": r("1分未満", "less than 1 minute"),
  "mail.minute.one": r("{count}分", "{count} minute"),
  "mail.minute.other": r("{count}分", "{count} minutes"),
  "mail.hour.one": r("{count}時間", "{count} hour"),
  "mail.hour.other": r("{count}時間", "{count} hours"),
  "mail.day.one": r("{count}日間", "{count} days"),
  "mail.day.other": r("{count}日間", "{count} days"),

  "mail.invite.subject": r("{who}から、{site}へのご招待です", "An invitation to {site} from {who}"),
  "mail.invite.lead": r(
    "{who}から、{site}へのご招待です。ここは、五目並べ、リバーシ、ペンテなどのボードゲームを、自分のペースで1手ずつ遊べるサイトです。",
    "An invitation to {site} from {who}. This is a site where you can play board games such as gomoku, reversi and Pente, one move at a time, at your own pace.",
  ),
  "mail.invite.valid": r(
    "この招待で入れるのは1人で、有効期間は{days}日間です。こちらから参加できます：",
    "This invitation lets in one person and is valid for {days} days. You can join from here:",
  ),
  "mail.invite.why": r(
    "このメールは、{who}が{site}で宛先としてこのアドレスを入力して送ったものです。{site}はこのアドレスを保存しておらず、ほかの誰かが新たに招待を送らない限り、改めてメールをお送りすることはありません。",
    "This email was sent by {who} entering this address as the recipient on {site}. {site} has not saved this address, and will not email you again unless somebody else sends a new invitation.",
    ASK_ADDRESS,
  ),
  "mail.invite.named": r("{name}さん", "{name} (with the polite suffix -san)"),
  "mail.invite.aFriend": r("お友達", "A friend"),

  "mail.refusal.notProduction": r(
    "ここではメールが有効になっていないため、何も送信されませんでした。",
    "Email is not enabled here, so nothing was sent.",
  ),
  "mail.refusal.noKey": r(
    "ここではまだメールが有効になっていないため、何も送信されませんでした。",
    "Email is not yet enabled here, so nothing was sent.",
  ),
  "mail.refusal.memberDayCap": r(
    "1人が1日に送れるメールの上限（{limit}通）に達したため、このメールは送信されませんでした。明日、もう一度お試しください。",
    "The limit on emails one person can send in a day ({limit}) has been reached, so this email was not sent. Please try again tomorrow.",
  ),
  "mail.refusal.siteDayCap": r(
    "サイトが今日送れるメールの上限に達したため、このメールは送信されませんでした。明日、もう一度お試しください。",
    "The site has reached the limit on emails it can send today, so this email was not sent. Please try again tomorrow.",
  ),
  "mail.refusal.requestRepeatCap": r(
    "このアドレスについての依頼、またはいまの場所からの依頼は、今日すでに送信されています。返事をお待ちください。",
    "A request about this address, or from where you are now, has already been sent today. Please wait for a reply.",
  ),
  "mail.refusal.requestDayCap": r(
    "今日の招待の依頼は、すべて送信済みです。代わりに{address}へ、ご自身のことを添えてご連絡ください。",
    "All of today's invitation requests have been sent. Please instead contact {address}, adding something about yourself.",
  ),
  "mail.refusal.siteMonthCap": r(
    "サイトが今月送れるメールの上限に達したため、このメールは送信されませんでした。",
    "The site has reached the limit on emails it can send this month, so this email was not sent.",
  ),
  "mail.refusal.countUnavailable": r(
    "いまはメールを送信できなかったため、何も送信されませんでした。",
    "The email could not be sent just now, so nothing was sent.",
  ),
  "mail.refusal.transportError": r(
    "メールが送信されたことを確認できませんでした。届かない可能性があります。",
    "It could not be confirmed that the email was sent. It may not arrive.",
  ),
  "mail.refusal.noticesOff": r(
    "対局のお知らせはまだ有効になっていないため、何も送信されませんでした。",
    "Notices about games are not yet enabled, so nothing was sent.",
  ),
  "mail.refusal.noAddress": r(
    "宛先のアドレスがないため、何も送信されませんでした。",
    "There is no recipient address, so nothing was sent.",
  ),
  "mail.refusal.noStopLink": r(
    "送信しませんでした。すべてのメールに受信を止める方法を書くことになっていますが、このメールにはそのリンクを付けられませんでした。",
    "It was not sent. Every email is supposed to say how to stop receiving it, but this email could not be given that link.",
    ASK_STOP,
  ),
  "mail.refusal.toAChild": r(
    "送信しませんでした。このアドレスは13歳未満の会員のもので、サイトが子どもにメールを送ることは決してありません。",
    "It was not sent. This address belongs to a member under 13, and the site never sends email to a child.",
    ASK_CHILD,
  ),

  "mail.request.badAddress": r("ご返信できるメールアドレスを入力してください。", "Please enter an email address we can reply to."),
  "mail.request.nameLong": r("お名前は{limit}文字以内でお書きください。", "Please write your name within {limit} characters."),
  "mail.request.aboutLong": r("{limit}文字以内でお書きください。", "Please write within {limit} characters."),
  "mail.request.links": r(
    "リンクは入れないでください。ご自身について一文あれば十分です。",
    "Please do not include links. One sentence about yourself is enough.",
  ),
};
