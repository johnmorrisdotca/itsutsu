import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the privacy.* phrases (ENJA-11): the Privacy page, and the line that says which version governs.
 *
 * Legal text, and text about children and a parent's consent (PRIV-02, PRIV-03). Every row has been read by the
 * reviewer agent (`AGENT_READ`) and every row also carries an `ask`, so the review sheet lists each of them for a
 * native reader: the agent's pass is required and is not enough for this page. The meaning is held as strict as the
 * English, sentence for sentence, and a term is the one the site's own pages already use (年齢の区分, 保護者, 合言葉,
 * アカウントを削除, 保存している情報, 近況, 全員).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

const ASK_LEGAL =
  "Legal text (the Privacy page): the reviewer's pass is not enough, so a native read is wanted before anybody relies on it.";
const ASK_CHILD =
  "About children and a parent's consent: a native read is required, and the sentence must be as strict in meaning as the English.";
const ASK_GOVERNING =
  "The line that says the English version governs: a native read to confirm the wording (参考訳, 優先) is how a Japanese site usually says it, and whether 正本 or 正文 is wanted instead.";
const ASK_AMBIGUOUS =
  "The English is ambiguous (does the account itself go after the days, or only the limit?). The Japanese says what the English most plainly says; John should settle the English, then a native reader the Japanese.";

const r = (text: string, back: string, ask: string = ASK_LEGAL): DraftedPhrase => ({ text, back, review: AGENT_READ, ask });
const child = (text: string, back: string): DraftedPhrase => r(text, back, ASK_CHILD);

export const JA_DRAFTED_PRIVACY: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "privacy.title": r("プライバシー", "Privacy"),
  "privacy.subtitle": r(
    "{site}が保存している情報と、それを誰が見られるか、削除してもらう方法をご説明します。",
    "We explain the information {site} keeps, who can see it, and how to have it deleted.",
  ),
  "privacy.lastChanged": r("最終更新：{date}", "Last updated: {date}"),
  "privacy.governing": r(
    "このページの日本語版は参考訳です。英語版が正式な文書で、内容に違いがあるときは英語版が優先されます。",
    "The Japanese version of this page is a reference translation. The English version is the official document, and where the content differs the English version takes precedence.",
    ASK_GOVERNING,
  ),
  "privacy.wordsAccount": r(
    "合言葉を使い、Googleのアドレスがないアカウントは、Googleと連携しない限り、1つのブラウザに{days}日間だけ存在し、その後はなくなります。",
    "An account that uses 合言葉 and has no Google address exists in one browser for just {days} days unless you link it with Google, and after that it is gone.",
    ASK_AMBIGUOUS,
  ),

  "privacy.short.h": r("要約", "Summary"),
  "privacy.short.paraA": r(
    "{site}が保存するのは、ゲームのサイトを運営するために必要な情報だけです。サインインしたときに本人を確かめる情報、遊んだ対局とその結果、ご自身についてほかの対局者に伝えると決めたこと、そして対局者に送った手紙（メッセージ）です。これらを売ることも、広告を表示することも、ほかのサイトで行動を追跡することもありません。",
    "What {site} keeps is only the information it needs to run a games site. The information that confirms who you are when you sign in, the games you played and their results, what you decided to tell other players about yourself, and the letters (messages) you sent to players. It does not sell any of this, show advertising, or track your behaviour on other sites.",
  ),
  "privacy.short.paraB": r(
    "閲覧は誰でもでき、遊ぶには招待が必要です。招待のない訪問者も、ゲームとその規則、「五つについて」「学び」「感謝」のページ、そしてこのページを読めますが、会員についての情報は何も見えません。お名前、戦績、順位は、サインインしている人にだけ表示されます。",
    "Anyone can read, and an invitation is needed to play. A visitor with no invitation can also read the games and their rules, the pages \"五つについて\", \"学び\" and \"感謝\", and this page, but sees no information about any member. Your name, record and standing are shown only to people who are signed in.",
  ),

  "privacy.what.h": r("保存する情報", "Information we keep"),
  "privacy.what.paraA": r(
    "アカウントのサインイン方法は2通りあり、それぞれに必要な情報だけを保存します。",
    "There are two ways to sign in to an account, and we keep only the information each one needs.",
  ),
  "privacy.what.pointA": r(
    "サインインの方法。Googleの場合は、メールアドレス、名前、画像を受け取ります。アドレスは次回も本人と分かるように保存し、名前と画像は、あとから変更できるプロフィールの最初の内容として保存します。代わりに4つの合言葉を使う場合は、合言葉そのものではなく、パスワードと同じように、元に戻せない形（ハッシュ）に変換した値だけを保存します。そのため元の言葉は読み戻せず、サイトの誰にも、どんな言葉だったかは分かりません。{wordsAccount}",
    "How you sign in. With Google, we receive your email address, name and picture. We keep the address so we recognise you next time, and the name and picture as the first content of a profile you can change later. If you use four 合言葉 instead, we keep not the 合言葉 themselves but only a value converted, as a password is, into a form that cannot be turned back (a hash). So the original words cannot be read back, and nobody at the site can know what the words were. {wordsAccount}",
  ),
  "privacy.what.pointB": r(
    "参加の経緯。使った招待の合言葉、いつ参加したか、最後にいつ訪れたか。",
    "How you joined. The invitation 合言葉 you used, when you joined, and when you last visited.",
  ),
  "privacy.what.pointC": r(
    "プロフィール。すべて任意で、ご自身のページでいつでも変更できます。遊ぶときの名前、市区町村と国、タイムゾーン、自己紹介、対局しない日と不在の期間、盤の見た目の好み、新しい対局の始め方の設定、オンライン中として表示するかどうか、自分の手番のときにメールを受け取るかどうか。",
    "Your profile. All of it is optional, and you can change it at any time on your own page. The name you play under, your city and country, your time zone, your self-introduction, the days you do not play and the periods you are away, your preference for how a board looks, your setting for how a new game starts, whether you are shown as online, and whether you receive email when it is your move.",
  ),
  "privacy.what.pointD": r(
    "対局。遊んだすべての対局の、すべての手、その手を打った日時、双方の席に誰が座ったか、結果。レーティング、戦績、連続記録、経験値、レベルは、これらの対局から計算されます。対局に付いた拍手、リアクション、メモも保存します。終了した対局はその対局専用のアドレスに残り、ご自身の一覧から隠しても、ほかの場所からは消えません。",
    "Games. Every move of every game you played, the day and time the move was made, who sat in each seat, and the result. Rating, record, streaks, experience points and level are calculated from these games. The applause, reactions and notes attached to games are also kept. A finished game stays at the address dedicated to that game, and hiding it from your own list does not remove it from any other place.",
  ),
  "privacy.what.pointE": r(
    "パズル。解き終えたパズルごとに、どのパズルか、かかった時間、いつ解いたか。参加したレースがあれば、相手が誰か、双方の所要時間も保存します。パズルそのものはお使いのブラウザの中で作られ、解いている途中のものはどこにも送られません。",
    "Puzzles. For each puzzle you finished, which puzzle it was, how long it took, and when you solved it. If you took part in a race, we also keep who the other person was and both times. The puzzle itself is made inside your browser, and nothing of one you are still solving is sent anywhere.",
  ),
  "privacy.what.pointF": r(
    "ほかの人に伝えたこと。会員に直接送った手紙（メッセージ）と、ご自身で作る仲間リストと無視リスト。",
    "What you told other people. Letters (messages) you sent directly to members, and the buddy list and ignore list you make yourself.",
  ),
  "privacy.what.pointG": child(
    "年齢の区分。13歳未満、13〜17歳、18歳以上のいずれかで、これより詳しいことは保存しません。13歳未満の会員については、アカウントに同意した人の記録も保存します。親または保護者が入力した名前、親か保護者のどちらであるか、同意した日時です。",
    "Age band. One of under 13, 13 to 17, or 18 and over, and nothing more detailed than that is kept. For a member under 13, we also keep a record of the person who consented to the account: the name a parent or guardian entered, whether they are the parent or a guardian, and the day and time they consented.",
  ),
  "privacy.what.pointH": r(
    "ほかのサイトの戦績。ItsYourTurnとGoldTokenにいた数人の対局者の戦績を、それぞれのサイトから、読み取った日付とともに手作業で書き写したものです。このサイトが敬意を表している人たちを、ここに残すためのものです。対局者の名前、サイト、対局、結果が含まれ、そのサイトで公開されていた以上に私的な情報は含まれません。そのうちの1つがご自身のもので、変更や削除をご希望の場合は、ご連絡ください。",
    "Records from other sites. Records of a few players who were on ItsYourTurn and GoldToken, copied by hand from each site together with the date they were read. They are there so that the people this site pays its respects to are kept here. They contain the player's name, the site, the games and the results, and nothing more private than what was public on that site. If one of them is yours and you wish it changed or removed, please contact us.",
  ),

  "privacy.not.h": r("保存しない情報", "Information we do not keep"),
  "privacy.not.paraA": r(
    "住所、電話番号、支払いカードは、決してお聞きしません。ここには、お金を払うものがありません。",
    "We never ask for your address, phone number or payment card. There is nothing here to pay for.",
  ),
  "privacy.not.paraB": r(
    "参加ページで招待を依頼すると、お名前、アドレス、書いた内容が1通のメールとして私たちに届きますが、サイトはその内容を一切保存しません。保存するのは、同じ場所からの依頼が多すぎないかを見分けるための、元の値が分からない形の回数だけです。会員が友人にメールで招待を送るときは、友人のアドレスはそのメール1通に使われるだけで、保存されません。",
    "When you ask for an invitation on the join page, your name, address and what you wrote reach us as one email, but the site saves none of that content. What it keeps is only a count, in a form from which the original value cannot be known, for telling too many requests from the same place from a person. When a member sends an invitation to a friend by email, the friend's address is used only for that one email and is not kept.",
  ),
  "privacy.not.paraC": r(
    "サイトは、見たページの記録を残さず、分析も行いません。サイトを置いているホスティング会社は、どこでもそうであるように、通常のリクエストの記録（ネットワークアドレス、ページ、時刻）を短期間保存しており、私たちはそれを不具合を探すときにだけ読みます。",
    "The site keeps no record of the pages you viewed and does no analytics. The hosting company that hosts the site, as any does, keeps ordinary request logs (network address, page, time) for a short period, and we read them only when looking for a fault.",
  ),

  "privacy.who.h": r("誰に見えるか", "Who can see it"),
  "privacy.who.paraA": r(
    "招待のない訪問者に見えるのは、ゲームとその規則、「五つについて」「学び」「感謝」のページ、そしてこのページです。会員についての情報は届きません。ただし「感謝」のページには、公に感謝されることを希望したベータ版のテスターの名前が載っています。",
    "What a visitor with no invitation can see is the games and their rules, the pages \"五つについて\", \"学び\" and \"感謝\", and this page. No information about members reaches them. However, the \"感謝\" page carries the names of beta testers who asked to be thanked publicly.",
  ),
  "privacy.who.paraB": r(
    "会員には、名前とその横のレベル、戦績、レーティングと順位、そして遊んだ対局が見えます。このサイトの対局はどれも、遊んでいる最中も終わったあとも、手の記録やリアクションとともに、どの会員でも開けるページだからです。入力した場合は、市区町村、国、タイムゾーン、自己紹介も見え、許可した場合は、いまオンラインかどうかも見えます。メールアドレスは誰にも表示されません。対戦相手にも、ご自身のページにも、どこにも表示されません。",
    "Members can see your name and the level beside it, your record, your rating and standing, and the games you played. This is because every game on this site is a page any member can open, while it is being played and after it has ended, with the record of its moves and its reactions. If you entered them, they can also see your city, country, time zone and self-introduction, and if you allowed it, whether you are online now. Your email address is shown to nobody. It is not shown to your opponent, not on your own page, not anywhere.",
  ),
  "privacy.who.paraC": child(
    "ご自身を仲間にしている会員には、その人の近況に、始めた対局と終えた対局、1日ごとに得た経験値、到達したレベル、1日にパズルの種類ごとに何問解いたかが表示されます。自分の一覧から隠した対局は、その人の近況には出ません。近況の「全員」タブに表示されるのは、すべての対局者がコンピュータか、18歳以上だと申告している終了済みの対局だけです。そのため、18歳未満の会員や、申告していない会員に関することは、そこには一切載りません。",
    "Members who have you as a buddy see, in their feed, the games you start and finish, the experience points you earn day by day, the levels you reach, and how many puzzles of each kind you solved in a day. A game you hid from your own list does not appear in their feed. What is shown on the \"全員\" tab of the feed is only finished games in which every player is a computer or has declared that they are 18 or over. So nothing about a member under 18, or a member who has not declared, is ever on it.",
  ),
  "privacy.who.paraD": r(
    "手紙の宛先の人。手紙は、書いた相手とご自身にだけ表示されます。サイトのどこにも、ほかの人に見せる機能はなく、運営者は、報告された場合を除いて、手紙を読みません。",
    "The person you write to. A letter is shown only to the person you wrote to and to yourself. Nowhere on the site is there a function that shows it to anyone else, and the operator does not read letters except when one has been reported.",
  ),
  "privacy.who.paraE": r(
    "運営者がトークンを渡したほかのサイト。埋め込み表示で、対局または対局者の概要が、閲覧のみの形で、会員が見るのと同じ内容だけ表示されます。それ以上は表示されません。",
    "Another site to which the operator has given a token. In an embedded view, a game or a player's summary is shown in read-only form, with only what a member would see. Nothing more is shown.",
  ),
  "privacy.who.paraF": child(
    "サイトを運営する運営者には、メールアドレス、招待の合言葉、最後に訪れた日時、報告された不具合が見えます。運営者にできるのは、アカウントの停止と復旧、名前の変更、合言葉をなくした会員への新しい合言葉の設定（または本人が選べるよう選択画面を開くこと）、アカウントを持つ人がいなかった名前で保管されている戦績を、その持ち主の会員に結びつけること、会員の年齢の区分の設定と、家族のための保護者の同意の手作業での記録、そして依頼があったときのアカウントの削除です。これらの操作はすべて、誰が、誰に対して、いつ、何を変えたかとともに記録されます。合言葉そのものや保護者の名前が記録されることは決してありません。サイトの誰も、会員になりすましてサインインすることはできません。そのような入口は存在しません。",
    "The operator who runs the site can see the email address, the invitation 合言葉, the day and time of the last visit, and reported problems. What the operator can do is: stop and restore an account, change a name, set a new 合言葉 for a member who has lost theirs (or open the choosing screen so the person can choose), tie a record kept under a name for which nobody had an account to the member who owns it, set a member's age band and record a parent's consent by hand for a family, and delete an account when asked. All of these operations are recorded together with who did it, to whom, when, and what was changed. The 合言葉 themselves and a parent's name are never recorded. Nobody at the site can sign in impersonating a member. There is no such entrance.",
  ),

  "privacy.reports.h": r("不具合の報告", "Reporting a problem"),
  "privacy.reports.paraA": r(
    "不具合は、どのページの下部からでも、誰でも報告できます。保存するのは、書かれた内容、報告したときに開いていたページ（URLの「?」より後ろは除きます。その部分には非公開のリンクが含まれることがあるためです）、サイトのバージョン、日付、追加した場合はスクリーンショット、サインインしている場合はこのサイトでの名前です。報告は、このサイトの作業を計画しているボードのSumilabuに保存され、修正する人が読みます。",
    "Anyone can report a problem from the bottom of any page. What we keep is what was written, the page that was open when you reported (leaving out everything after the \"?\" in the URL, because that part can contain a private link), the version of the site, the date, a screenshot if you added one, and your name on this site if you are signed in. Reports are kept on Sumilabu, the board on which the work of this site is planned, and are read by the people who fix things.",
  ),

  "privacy.cookies.h": r("クッキー", "Cookies"),
  "privacy.cookies.paraA": r(
    "クッキーは、サイトを動かすためだけに使います。サインイン状態を保つもの、言語を覚えておくもの、言語をいま変えたことを記録する短期間のもの、そしてサインインせずにリンクから席に着いた対局ごとのもの（リンクを持つブラウザが席を保てるようにするため）です。Googleでサインインする間は、サインイン用のライブラリが、その手順のためだけの短期間のクッキーを設定します。広告用や分析用のクッキーはなく、第三者のものも一切ありません。",
    "Cookies are used only to run the site. One that keeps you signed in, one that remembers your language, a short-lived one that records that you have just changed your language, and one for each game where you took a seat from a link without signing in (so that the browser holding the link can keep the seat). While you sign in with Google, the sign-in library sets short-lived cookies just for that step. There are no cookies for advertising or analytics, and no third party's at all.",
  ),
  "privacy.cookies.paraB": r(
    "ブラウザは、このサイトのためのいくつかの情報を、自身の保存領域にも保存します。これらは端末の中にとどまります。途中でやめた練習盤の対局、対局についての自分だけのメモ、盤をどちら向きにしたか、「盤だけ表示」を選んだかどうか、閉じた結果カード、そして新規対局の画面で選んでいる途中の選択です。このうち1つだけは端末の外に出ます。不具合を報告すると、ブラウザは自分用のランダムなIDを保存し、報告のたびにそれを送ります。同じブラウザからの複数の報告を、多くの人からの報告と区別できるようにするためです。これは名前でも、アドレスでも、アカウントでもありません。ブラウザでこのサイトのデータを消去すると、これらはすべて消えます。",
    "The browser also keeps some information for this site in its own storage area. These stay inside your device. A practice-board game you stopped partway, your own private notes on a game, which way round you turned a board, whether you chose \"盤だけ表示\", result cards you closed, and the choices you are partway through making on the new-game screen. Only one of these leaves your device. When you report a problem, the browser keeps a random ID for itself and sends it with each report, so that several reports from the same browser can be told apart from reports by many people. It is not your name, your address or your account. If you clear this site's data in your browser, all of these disappear.",
  ),

  "privacy.services.h": r("委託先", "Who else handles it"),
  "privacy.services.paraA": r(
    "サイトの運営を支えるサービスがいくつかあり、それぞれが、必要な情報だけを扱います。",
    "There are several services that support the running of the site, and each handles only the information it needs.",
  ),
  "privacy.services.pointA": r(
    "Google。サインインのために、ご自身が選んだ場合に限って使います。",
    "Google. Used for signing in, only when you choose it.",
  ),
  "privacy.services.pointB": r(
    "サイトを置くVercelと、データベースを保存するNeon。どちらも米国にあります。",
    "Vercel, which hosts the site, and Neon, which stores the database. Both are in the United States.",
  ),
  "privacy.services.pointC": r(
    "サイトが送る少数のメールを配信するResend。",
    "Resend, which delivers the few emails the site sends.",
  ),
  "privacy.services.pointD": r(
    "報告された不具合を保管する、私たち自身のボードのSumilabu。",
    "Sumilabu, our own board, which keeps the reported problems.",
  ),
  "privacy.services.pointE": r(
    "広告ネットワーク、分析サービス、トラッキングピクセルは使っていません。",
    "No advertising network, analytics service or tracking pixel is used.",
  ),

  "privacy.email.h": r("メール", "Email"),
  "privacy.email.paraA": r(
    "サイトが自らメールを送るのは、何かがきっかけになったときだけです。会員が友人に送る招待と、サイトで対局のメールが有効になっている間の、ご自身の対局についてのお知らせ（対局が終わったとき、または自分の手番のとき）で、ご自身のページで選んだ種類に限ります。どのメールにも、サインインしなくても受信を止められる方法が書かれています。招待を依頼したり不具合を報告したりした場合、返事は人から、ご記入のアドレスに届きます。アドレスが販売されたり、他者に渡されたりすることは決してありません。",
    "The site itself sends email only when something prompts it. An invitation a member sends to a friend, and notices about your own games (when a game has ended, or when it is your move) while game emails are switched on at the site, limited to the kinds you chose on your own page. Every email says how to stop receiving it without signing in. When you ask for an invitation or report a problem, the reply comes from a person, to the address you entered. Your address is never sold or given to others.",
  ),

  "privacy.children.h": child("子ども", "Children"),
  "privacy.children.paraA": child(
    "ここで遊ぶ人の中には、家族で一緒に遊ぶ子どもがいます。サイトはそのことを前提に作られています。会員についての情報が招待のない訪問者に届くことはなく、会員のページは招待がなければ開けず、広告もありません。",
    "Among the people who play here are children, who play together with their families. The site is built with that in mind. Information about members does not reach visitors with no invitation, members' pages cannot be opened without an invitation, and there is no advertising.",
  ),
  "privacy.children.paraB": child(
    "参加するとき、ほかの何よりも先に、年齢の区分をお聞きします。13歳未満、13〜17歳、18歳以上のいずれかです。これより詳しいことは聞きもしませんし、保存もしません。13歳未満の会員がここでアカウントを続けるには、親または保護者の同意が必要です。同じページで、親または保護者がお名前を入力し、親か保護者かを答えます。その内容を日付とともに保存します。同意がなければ、アカウントは続けられません。この質問ができる前に参加した会員には、次にご自身のページを開いたときにお尋ねします。運営者が、家族のために回答を手作業で記録することもできます。",
    "When you join, before anything else, we ask your age band. It is one of under 13, 13 to 17, or 18 and over. We neither ask nor keep anything more detailed than that. For a member under 13 to keep an account here, the consent of a parent or guardian is needed. On the same page, the parent or guardian enters their name and answers whether they are a parent or a guardian. We keep that together with the date. Without consent, the account cannot continue. Members who joined before this question existed are asked the next time they open their own page. The operator can also record the answer by hand for a family.",
  ),
  "privacy.children.paraC": child(
    "親または保護者は、お子さまのページ（プロフィール）から、保存しているお子さまの情報を確認し、お子さまのアカウントを削除できます。または{contact}にご連絡いただければ、運営者が代わりに行います。",
    "A parent or guardian can, from the child's page (Profile), check the information we keep about the child and delete the child's account. Or if you contact {contact}, the operator will do it on their behalf.",
  ),
  "privacy.children.pointA": child(
    "13歳未満の会員は、市区町村、国、自己紹介を保存しません。すでに書かれているものは年齢の区分が設定されたときに消去され、あとから追加することもできません。その会員の現地時刻が、誰にも表示されることはありません。",
    "A member under 13 keeps no city, country or self-introduction. What has already been written is erased when the age band is set, and nothing can be added afterwards. The member's local time is never shown to anyone.",
  ),
  "privacy.children.pointB": child(
    "手紙を書いたり、対局を申し込んだりできるのは、お子さま自身の仲間リストにいる人、つまりお子さまが選んだ人だけです。それ以外の人には理由が伝えられ、入力欄は表示されません。",
    "Only people on the child's own buddy list, that is, people the child chose, can write a letter or offer a game. Everyone else is told the reason, and the entry box is not shown.",
  ),
  "privacy.children.pointC": child(
    "13歳未満の会員は、オンライン中として表示されることがなく、最後にサイトを訪れた日時も、設定にかかわらず表示されません。",
    "A member under 13 is never shown as online, and the day and time of their last visit to the site is not shown either, whatever the setting.",
  ),
  "privacy.children.pointD": child(
    "サイトが13歳未満の会員にメールを送ることは決してなく、その会員に代わって招待をメールで送ることもありません。",
    "The site never sends email to a member under 13, and does not send an invitation by email on behalf of such a member.",
  ),
  "privacy.children.pointE": child(
    "それ以外では、子どもも誰とも同じように遊びます。対局、戦績、レーティング、経験値、レベルは、ほかの人と同じように表示されます。子どもの対局も、対局だからです。",
    "Otherwise a child plays just like anyone else. Games, record, rating, experience points and level are shown in the same way as everyone else's. A child's games are games too.",
  ),

  "privacy.keeping.h": r("保存と削除", "Keeping and deleting"),
  "privacy.keeping.paraA": r(
    "アカウントとその中の情報は、アカウントが存在する限り保存します。終了した対局は、サイトが続く限り保存します。対局は、遊んだ2人の両方のものだからです。",
    "We keep an account and the information in it for as long as the account exists. We keep finished games for as long as the site continues. A game belongs to both of the two people who played it.",
  ),
  "privacy.keeping.paraB": r(
    "アカウントを削除するには、ご自身のページを開き、「プロフィール」を選んで、下にある「アカウントを削除」を使ってください。または{contact}にご連絡いただければ、運営者が削除します。プロフィール、手紙、リスト、経験値、パズルの解答記録は削除されます。自分の手を待っている対局も削除されますが、その前に、投了または中止の扱いになります。終了した対局は、相手の対局者のものでもあるため、記録に残ります。ただし、アカウントとの結びつきは外されます。名前を残すか、名前も外すかは、ご自身で選べます。",
    "To delete your account, open your own page, choose \"プロフィール\", and use \"アカウントを削除\" at the bottom. Or if you contact {contact}, the operator will delete it. Your profile, letters, lists, experience points and puzzle solve records are deleted. A game still waiting for your move is also deleted, but before that it is treated as resigned or called off. Finished games remain in the record, because they also belong to the other player. However, the tie to your account is removed. You can choose yourself whether to leave your name on them or take your name off as well.",
  ),
  "privacy.keeping.paraC": r(
    "保存している情報は、同じページの「保存している情報」に、平易な言葉と件数で一覧になっています。このページで説明していない情報は、何も保存していません。",
    "The information we keep is listed, in plain words and counts, under \"保存している情報\" on the same page. We keep no information that this page does not describe.",
  ),

  "privacy.changes.h": r("改定", "Revisions"),
  "privacy.changes.paraA": r(
    "サイトが保存する情報や、それを見られる人が変わるときは、同じ更新でこのページも変わり、上部の日付も新しくなります。このページはテストでコードと突き合わせているため、両者が気づかないうちにずれることはありません。",
    "When the information the site keeps, or who can see it, changes, this page changes in the same update, and the date at the top is renewed. This page is checked against the code by a test, so the two cannot drift apart without anyone noticing.",
  ),
  "privacy.changes.paraB": r("ご質問は{contact}までお寄せください。", "Please send questions to {contact}."),
};
