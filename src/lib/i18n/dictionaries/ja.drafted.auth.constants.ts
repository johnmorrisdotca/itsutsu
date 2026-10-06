import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the auth.* phrases (ENJA-10): the join page, asking for an invite, the stop-emails page and the thank-you
 * page. Joined into `JA_DRAFTED`. The invitation words are 合言葉 throughout (John, 2026-10-06). Every row has been read by the reviewer agent.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };
const r = (text: string, back: string): DraftedPhrase => ({ text, back, review: AGENT_READ });

export const JA_DRAFTED_AUTH: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "auth.join.title": r("参加", "Join"),
  "auth.join.googleFailed": r(
    "Googleでのサインインが完了しませんでした（{error}）。もう一度お試しいただくか、合言葉を使ってください。",
    "Signing in with Google did not complete ({error}). Please try again, or use the 合言葉.",
  ),
  "auth.join.terms": r("利用規約", "Terms of use"),
  "auth.join.operatorLead": r("管理者としてサインインします。", "Sign in as the administrator."),
  "auth.join.shutLead": r(
    "{site}はいま新しい会員を受け付けていません。すでにアカウントをお持ちの方は、これまでどおりGoogleでサインインしてください。",
    "{site} is not accepting new members right now. If you already have an account, please sign in with Google as usual.",
  ),
  "auth.join.pendingOpen": r("ようこそ、{name}さん。Enterキーを押すと入れます。", "Welcome, {name}. Press the Enter key and you are in."),
  "auth.join.pendingCode": r(
    "ようこそ、{name}さん。あと1つ、お伝えした{count}語の合言葉を入力してください。以降はGoogleだけで入れます。",
    "Welcome, {name}. One more thing: please enter the {count}-word 合言葉 we gave you. After this you can get in with Google alone.",
  ),
  "auth.join.openLead": r("Googleでサインインするだけで入れます。合言葉は要りません。", "Just sign in with Google and you are in. No 合言葉 is needed."),
  "auth.join.codeLead": r(
    "Googleでサインインしてください。アカウントがない場合は、お伝えした合言葉で入れます。",
    "Please sign in with Google. If you do not have an account, the 合言葉 we gave you will let you in.",
  ),
  "auth.join.google": r("Googleで続ける", "Continue with Google"),
  "auth.join.useCode": r("Googleアカウントがない場合は、合言葉を使う", "If you do not have a Google account, use the 合言葉"),
  "auth.join.orOperator": r("または、管理者トークンで", "or, with the administrator token"),
  "auth.join.codeLabel": r("合言葉", "合言葉 (the invitation words)"),
  "auth.join.codeHint": r("大文字、空白、ハイフンのどれでも使えます。", "Capital letters, spaces and hyphens all work."),
  "auth.join.email": r("メールアドレス", "Email address"),
  "auth.join.operatorToken": r("管理者トークン", "Administrator token"),
  "auth.join.tooMany": r("試行が多すぎます。1分ほど待ってから、もう一度お試しください。", "There have been too many attempts. Please wait about a minute and try again."),
  "auth.join.refused": r("受け付けられませんでした。", "It was not accepted."),
  "auth.join.unreachable": r("サーバーに接続できませんでした。", "Could not connect to the server."),
  "auth.join.checking": r("確認中…", "Checking…"),
  "auth.join.enter": r("入る", "Enter"),
  "auth.join.notYou": r("別のアカウントを使う", "Use a different account"),

  "auth.ask.open": r("合言葉がない場合は、こちらから依頼できます。", "If you do not have a 合言葉, you can ask for one here."),
  "auth.ask.lead": r(
    "{site}は、規模が小さいうちは招待制です。ご自身のことを教えてください。担当者から返信します。",
    "{site} is invitation-only while it is small. Please tell us about yourself. Someone will reply.",
  ),
  "auth.ask.website": r("ウェブサイト", "Website"),
  "auth.ask.email": r("メールアドレス", "Email address"),
  "auth.ask.name": r("お名前", "Your name"),
  "auth.ask.optional": r("（任意）", "(optional)"),
  "auth.ask.about": r("自己紹介", "Self-introduction"),
  "auth.ask.aboutHint": r(
    "以前どこで遊んでいたか、または誰からの紹介かを書いてください。リンクは書かないでください。",
    "Please write where you played before, or who referred you. Please do not write links.",
  ),
  "auth.ask.sending": r("送信中…", "Sending…"),
  "auth.ask.send": r("招待を依頼", "Ask for an invitation"),
  "auth.ask.closed": r("現在、招待の依頼は受け付けていません。", "Requests for invitations are not being accepted at the moment."),
  "auth.ask.tooMany": r("同じ場所からの依頼が多すぎます。1時間ほど後にもう一度お試しください。", "There are too many requests from the same place. Please try again in about an hour."),
  "auth.ask.sent": r("送信しました。ご記入のアドレスに返信が届きます。", "Sent. A reply will reach the address you wrote."),

  "auth.stop.title": r("メールの配信停止", "Stopping emails"),
  "auth.stop.lead": {
    ...r("{site}から届くメールを選べます。サインインは不要です。", "You can choose which emails you receive from {site}. Signing in is not required."),
    ask: "The page an email's stop link opens, where Canada's anti-spam law wants a way out that needs no sign-in: a native read is recommended.",
  },
  "auth.stop.unknown": r(
    "このリンクでは何も停止できません。途中までしかコピーされていない可能性があります。{address}までご連絡いただければ、手作業でメールを停止します。",
    "This link cannot stop anything. It may have been copied only partway. If you contact {address}, we will stop your emails by hand.",
  ),
  "auth.stop.wordsYourTurn": r("手番をお知らせするメール", "emails that tell you it is your move"),
  "auth.stop.wordsGameOver": r("対局の終了をお知らせするメール", "emails that tell you a game has ended"),
  "auth.stop.youGet": r("{words}が届きます。", "{words} are delivered to you."),
  "auth.stop.youDoNotGet": r("{words}は届きません。", "{words} are not delivered to you."),
  "auth.stop.stopKind": r("{words}を停止", "Stop {words}"),
  "auth.stop.allOn": r("{site}から、対局に関するメールが届くことがあります。", "Emails about your games may come from {site}."),
  "auth.stop.allOff": r("{site}からのメールは一切届きません。", "No emails at all come from {site}."),
  "auth.stop.stopAll": r("{site}からのメールをすべて停止", "Stop all emails from {site}"),
  "auth.stop.turnOn": r("再び受け取る", "Receive them again"),
  "auth.stop.signedInNote": r(
    "サインインしている場合は、すべてのメールの切り替えを設定でも行えます。ご質問は{address}までご連絡ください。",
    "If you are signed in, you can also switch all emails on or off in Settings. For questions, please contact {address}.",
  ),
  "auth.stop.doneAllOff": r("完了しました。今後、{site}からメールは送られません。", "Done. From now on no emails will be sent from {site}."),
  "auth.stop.doneAllOn": r("完了しました。{site}から、対局に関するメールが再び届くようになります。", "Done. Emails about your games will come from {site} again."),
  "auth.stop.doneOff": r("完了しました。{words}は届かなくなります。", "Done. {words} will no longer be delivered."),
  "auth.stop.doneOn": r("完了しました。{words}が再び届きます。", "Done. {words} will be delivered again."),

  "auth.thanks.title": r("感謝", "Thanks"),
  "auth.thanks.lead": r(
    "{site}は無料で、いまはベータ版です。以下の方々は、完成する前から時間を割いて遊んでくださいました。間違っていた規則、押しても何も起きなかったボタン、スマートフォンでは意味の通らなかったページを見つけて、知らせてくださったのです。それによる改善は、私たちと同じくらい皆さんのものです。心から感謝しており、このページはそのためにあります。",
    "{site} is free and is currently in beta. The people below gave their time to play before it was finished. They found rules that were wrong, buttons that did nothing when pressed, and pages that made no sense on a smartphone, and told us. The improvements that come from that are as much theirs as ours. We are deeply grateful, and this page exists for that.",
  ),
  "auth.thanks.testers": r("ベータ版の協力者", "Beta-version collaborators"),
  "auth.thanks.empty": r(
    "最初のお名前はここに載ります。テストに協力してくださっていて、遊んでいる名前でお礼を載せてほしい方は、ご連絡ください。喜んで載せます。",
    "The first names will appear here. If you have been helping with testing and would like thanks posted under the name you play with, please contact us. We will gladly add you.",
  ),
  "auth.thanks.from": r("{place}から", "from {place}"),
  "auth.thanks.since": r("{when}から", "since {when}"),
  "auth.thanks.join": r("ベータ版の協力者になる", "Become a beta-version collaborator"),
  "auth.thanks.older": r("以前のサイトで遊んでいた方へ", "To those who played on the earlier sites"),
  "auth.thanks.olderBody": r(
    "これらのゲームは、{sites}で長年遊ばれてきました。その1人でしたら、ぜひお力を貸してください。人どうしの対局がきちんと続けられているとどんな感じか、すでにご存じのはずです。私たちがいま整えようとしているのはまさにそれで、私たちより先に、見落としにも気づかれるでしょう。そこで遊んでいたお友達もお誘いください。以前の戦績も、コピーしてこちらでの対局の隣に表示できます。",
    "These games have been played for many years on {sites}. If you are one of them, please lend us your strength. You already know what it is like when games between people are kept going properly. That is exactly what we are trying to get right, and you will notice what we have overlooked before we do. Please also invite friends who played there. Your earlier record can also be copied and shown next to your games here.",
  ),
  "auth.thanks.how": r("掲載を希望する場合、やめる場合", "If you want to be listed, or to stop being listed"),
  "auth.thanks.howBody": r(
    "{mail}宛てに、ここで遊んでいる名前と、よろしければ以前のサイトや見てくださった点を書いてお送りください。ご希望がない限りお名前は載せませんし、どなたでも、申し出れば載せるのをやめます。",
    "Please write to {mail} with the name you play under here and, if you like, your earlier site and what you looked at. Names are not listed unless requested, and anyone can have theirs removed by asking.",
  ),
};
