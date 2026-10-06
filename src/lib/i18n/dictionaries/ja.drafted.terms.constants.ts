import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the terms.* phrases (ENJA-11): the terms of play, and the line that says which version governs.
 *
 * Legal text, so every row has been read by the reviewer agent (`AGENT_READ`) and every row also carries an `ask`,
 * which lists it on the review sheet for a native reader. The terms are plain by design (PRIV-05: nothing is said
 * that would not be said to a friend across a board), and the Japanese keeps that register: です/ます, no 法律用語
 * where an everyday word says the same. Terms are the site's own (対局, 持ち時間, 投了, 仲間, 無視する, 運営者).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

const ASK_LEGAL =
  "Legal text (the terms of play): the reviewer's pass is not enough, so a native read is wanted before anybody relies on it.";
const ASK_GOVERNING =
  "The line that says the English version governs: a native read to confirm the wording (参考訳, 優先) is how a Japanese site usually says it, and whether 正本 or 正文 is wanted instead.";

const r = (text: string, back: string, ask: string = ASK_LEGAL): DraftedPhrase => ({ text, back, review: AGENT_READ, ask });

export const JA_DRAFTED_TERMS: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "terms.title": r("利用規約", "Terms of use"),
  "terms.subtitle": r(
    "ここをご利用のすべての方にお願いすることと、サイトがその代わりに行うことです。",
    "What we ask of everyone who uses this place, and what the site does in return.",
  ),
  "terms.lastChanged": r("最終更新：{date}", "Last updated: {date}"),
  "terms.governing": r(
    "この利用規約の日本語版は参考訳です。英語版が正式な文書で、内容に違いがあるときは英語版が優先されます。",
    "The Japanese version of these terms is a reference translation. The English version is the official document, and where the content differs the English version takes precedence.",
    ASK_GOVERNING,
  ),

  "terms.oneAccount.h": r("アカウントは1人1つ", "One account per person"),
  "terms.oneAccount.paraA": r(
    "アカウントは、1人につき1つでお願いします。遊びたいお友達には、その人専用の招待があります。サインインの情報を共有すると、2人の戦績が1つにまとまってしまい、レーティングは誰の実力も表さなくなります。",
    "We ask for one account per person. A friend who wants to play has an invitation of their own. If you share sign-in details, two people's records become one, and the rating stops showing anybody's strength.",
  ),
  "terms.oneAccount.paraB": r(
    "1つの画面を2人で使うのはかまいません。1台で交代して遊ぶ対局は、そのためのものです。この対局は1台で交代して遊んだ対局として保存され、どちらの順位表にも入りません。",
    "Two people using one screen is fine. A game played taking turns on one device is for exactly that. This game is kept as a game played taking turns on one device, and does not enter either person's standings table.",
  ),

  "terms.ownMoves.h": r("自分の手を打つ", "Play your own moves"),
  "terms.ownMoves.paraA": r(
    "コンピュータはサイト自身のもので、プログラムとして名前が付けられ、プログラムどうしでレーティングされています。人との対局は、その人自身が打つようお願いします。ご自身のエンジンで手を選ぶのは、遊んでいることにはならず、盤の向こうの相手から何かを奪うことになります。",
    "The computers are the site's own, named as programs and rated among programs. We ask that a game against a person be played by that person themselves. Choosing moves with an engine of your own is not playing, and takes something from the opponent across the board.",
  ),

  "terms.beKind.h": r("盤の前では思いやりを", "Kindness in front of the board"),
  "terms.beKind.paraA": r(
    "リアクション、手へのメモ、手紙は、対局とその参加者のためのものです。実際の盤を挟んで言えることを言ってください。",
    "Reactions, notes on a move and letters are for the game and its participants. Say what you could say across a real board.",
  ),
  "terms.beKind.paraB": r(
    "そうでない人がいても、我慢する必要はありません。その人のページから無視する設定にすると、その人は手紙を送ることも、対局を申し込むこともできなくなります。どのページの下部にもある「不具合を報告」は、開いていたページとともに運営者に届きます。",
    "Even if there is someone who is not like that, you do not have to put up with it. If you set them to be ignored from their page, that person can no longer send you a letter or offer you a game. \"不具合を報告\", at the bottom of every page, reaches the operator together with the page that was open.",
  ),

  "terms.shut.h": r("アカウントの停止", "Stopping an account"),
  "terms.shut.paraA": r(
    "運営者はアカウントを停止できます。停止されたアカウントは、次に訪れたときから使えなくなり、そのアカウントが参加に使った招待も使えなくなります。終了した対局とレーティングは残ります。ほかの対局者もその対局を遊んだからです。",
    "The operator can stop an account. A stopped account becomes unusable from its next visit, and the invitation the account joined with becomes unusable too. Finished games and the rating remain. This is because the other players played those games as well.",
  ),
  "terms.shut.paraB": r(
    "アカウントにメールアドレスがある場合、運営者はそのアドレスに理由を書いて送ります。問い合わせは{contact}までお願いします。",
    "If the account has an email address, the operator writes the reason and sends it to that address. For enquiries, please contact {contact}.",
  ),

  "terms.ending.h": r("アカウントの終了", "Ending an account"),
  "terms.ending.paraA": r(
    "アカウントは、どちらの側からでもいつでも終了できます。ご自身のアカウントは、ご自身のページの「プロフィール」にある「アカウントを削除」から削除できます。依頼があれば運営者が削除することも、上の説明のとおり停止することもできます。何が削除され、何が残るかは、プライバシーのページに書かれています。",
    "An account can be ended by either side at any time. You can delete your own account from \"アカウントを削除\" under \"プロフィール\" on your own page. If asked, the operator can delete it, or can stop it as described above. What is deleted and what remains is written on the privacy page.",
  ),
  "terms.ending.paraB": r(
    "終了した対局は、双方の対局者のために保存されます。どちらも削除することはできず、アカウントを削除しても、その対局は相手の対局者のもとに残り、削除したアカウントとの結びつきだけが外されます。",
    "A finished game is kept for both players. Neither can delete it, and even if an account is deleted, the game remains with the other player, and only the tie to the deleted account is removed.",
  ),

  "terms.abandoned.h": r("途中でやめた対局", "A game somebody stops playing"),
  "terms.abandoned.paraA": r(
    "対局は、設定されたときの規則で決着します。規則は盤のそばに表示されています。持ち時間がある対局では、時計が決めます。時間切れの扱いは、その対局が定めたとおりです。持ち時間のない対局は、対局者を待ちます。どちらも投了できます。ただし、誰も投了できないように設定されている場合を除きます。",
    "A game is settled by the rules it was set up with. The rules are shown beside the board. In a game with a time allowance, the clock decides. What happens when time runs out is as that game provides. A game with no time allowance waits for its players. Either can resign, except where it was set up so that nobody can resign.",
  ),

  "terms.beta.h": r("無料で、開発中", "Free, and in development"),
  "terms.beta.paraA": r(
    "{site}は無料で、ベータ版です。ほぼ毎週変わり、ときどき止まることもあり、特定の稼働時間はお約束しません。問題があるときは、「不具合を報告」で私たちに伝わります。",
    "{site} is free, and is a beta version. It changes almost every week, it sometimes stops, and we do not promise particular hours of operation. When there is a problem, it reaches us through \"不具合を報告\".",
  ),

  "terms.changes.h": r("規約の変更", "Changes to the terms"),
  "terms.changes.paraA": r(
    "この規約はサイトとともに変わります。変わるときもこのような平易な言葉で書き、上部の日付も新しくなります。",
    "These terms change along with the site. When they change they are also written in plain words like these, and the date at the top is renewed.",
  ),
};
