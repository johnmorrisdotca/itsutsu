import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the home.* phrases (ENJA-10): the front page and the beta invitation. Joined into `JA_DRAFTED`.
 * The computer players are コンピュータ (John, 2026-10-06). Every row has been read by the reviewer agent.
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };
const r = (text: string, back: string): DraftedPhrase => ({ text, back, review: AGENT_READ });

export const JA_DRAFTED_HOME: Partial<Record<PhraseKey, DraftedPhrase>> = {
  "home.hero": r("ボードゲーム、パズル、カードを、自分のペースで。", "Board games, puzzles and cards, at my own pace."),
  "home.catalogue": r(
    "{count}。五目並べからリバーシ、囲碁、ソリティア、麻雀まで、ひとりで解くパズルも、1台のスマートフォンを囲んで遊ぶパーティーゲームもそろっています。目の前の相手とも世界の誰とも遊べて、勝てる形を学べて、終えた対局はすべて残ります。",
    "{count}. From gomoku to Reversi, go, Solitaire and mahjong, there are also puzzles to solve alone and party games played around one smartphone. You can play with someone in front of you or anyone in the world, learn the shapes that win, and every game you finish is kept.",
  ),
  "home.numbers": r(
    "{site}は先行公開中の招待制です。これまでに{players}、人どうしの{games}、そして{here}。",
    "{site} is in early release and by invitation. So far there are {players}, {games} between people, and {here}.",
  ),
  "home.hereNow": r("いま{count}人がオンライン", "{count} people online now"),
  "home.numbersAsk": r("招待を依頼する、またはテストに協力する", "Ask for an invitation, or help with testing"),
  "home.askInvite": r("招待を依頼", "Ask for an invitation"),
  "home.learnGames": r("ゲームを学ぶ", "Learn the games"),

  "home.fiveTitle": r("五目並べ", "Gomoku"),
  "home.fiveBody": r(
    "五目並べ、連珠、Connect6など、石を1列に並べる遊びから広がったゲームの仲間に加え、リバーシ、チェッカー、囲碁もあります。盤上のゲームは全{count}種類で、どれも1クリックで規則を見られます。",
    "Gomoku, renju, Connect6 and the other games that grew from lining up stones, plus Reversi, checkers and go. There are {count} kinds of board games in all, and each one's rules are one click away.",
  ),
  "home.phonesTitle": r("2台のスマートフォンで1つの盤", "One board on two smartphones"),
  "home.phonesBody": r(
    "対局を始めて、もう一方の席をQRコードで渡せば、それぞれの場所から交代で打てます。アカウントもアプリも要りません。",
    "Start a game, hand over the other seat as a QR code, and you can take turns from your own places. No account or app is needed.",
  ),
  "home.keptTitle": r("すべての対局を保存", "Every game saved"),
  "home.keptBody": r(
    "終わった対局は、石の順番どおりに記録され、ずっと残ります。数年たつと手の履歴が消える、ということはありません。再生したり、示したい1手を友達に送ったり、対局者のレーティングの動きを見たりできます。",
    "A finished game is recorded with its stones in order and stays for good. The move history does not vanish after a few years. You can replay it, send a friend the one move you want to show, and see how a player's rating moved.",
  ),
  "home.forkTitle": r("どの局面からも分岐", "Branch from any position"),
  "home.forkBody": r(
    "接戦には、もう一度挑む価値があります。どの対局のどの手からでも、同じ局面から同じ相手との別の対局を始めて、両方を進められます。",
    "A close game is worth another try. From any move of any game, you can start another game against the same opponent from the same position, and carry on both.",
  ),
  "home.opponentsTitle": r("いつでも相手がいる", "There is always an opponent"),
  "home.opponentsBody": r(
    "段階別の5つのコンピュータが、やさしい順にすべてのゲームの相手をします。ほかに、リバーシだけ、五目並べだけを打つ専門のコンピュータが2つあります。コンピュータとの対局もレーティング対局で、戦績は人と同じように残ります。",
    "Five graded computers, from the gentlest, play every game. In addition there are two specialist computers that play only Reversi or only gomoku. Games against computers are also rated games, and the record is kept just like a person's.",
  ),
  "home.ladderTitle": r("ゲームごとの順位表", "A ranking table for each game"),
  "home.ladderBody": r(
    "ゲームごとに、独自のレーティングと順位表があります。コンピュータとの対局は別に集計するので、コンピュータに勝っても、人どうしでの順位は変わりません。",
    "Each game has its own rating and ranking table. Games against computers are counted separately, so beating a computer does not change your ranking among people.",
  ),
  "home.paceTitle": r("自分のペースで", "At your own pace"),
  "home.paceBody": r(
    "時計なしで、打てるときに打てます。1日1手でも構いません。ブリッツ、ラピッド、クラシカルの持ち時間を付けることもできます。昔の持ち回り式サイトのように、十数局を同時に進められ、自分の手番を待つ対局が先に並びます。",
    "With no clock, you can play when you are able. One move a day is fine. You can also add a blitz, rapid or classical time limit. Like the old turn-based sites, you can run a dozen or so games at once, and the games waiting for my move come first.",
  ),
  "home.learnTitle": r("定石を学ぶ", "Learn the standard patterns"),
  "home.learn.one": r(
    "これらのゲームの勝敗を分ける攻め筋、序盤、終盤を解説した攻略ガイドです。それぞれ、当てはまるゲームも示しています。",
    "A strategy guide explaining the attacking lines, openings and endings that decide these games. Each also shows which games it applies to.",
  ),
  "home.learn.other": r(
    "{count}本の攻略ガイドで、これらのゲームの勝敗を分ける攻め筋、序盤、終盤を解説します。それぞれ、当てはまるゲームも示しています。",
    "{count} strategy guides explain the attacking lines, openings and endings that decide these games. Each also shows which games it applies to.",
  ),

  "home.families.title": r("{count}の系統", "{count} families"),
  "home.families.lead": r(
    "始まりは五目並べで、ほかの系統は、その隣で育ったゲームです。リバーシやチェッカーから囲碁、ヘックスまであります。開くと、その系統のゲーム、規則、それぞれの盤の絵を見られます。",
    "It began with gomoku, and the other families are the games that grew up beside it, from Reversi and checkers to go and hex. Open one to see the games of that family, their rules, and a picture of each board.",
  ),

  "home.storyTitle": r("由来", "Origin"),
  "home.story.one": r(
    "このサイトの作者と両親は、長年、2つの家をまたいで、初期のウェブの大きな持ち回り式サイト、ItsYourTurnとGoldTokenで遊んでいました。父とはオセロ、母とは五目並べ、ペンテ、オセロです。1日に何時間も、何十局も同時に開き、手数の1日の上限を上げるために会員にもなりました。20手では昼まで持たなかったからです。それらのサイトは、愛する人どうしの対局は速くなくてよく、大切なのは残ることだと分かっていました。{site}はその続きであり、敬意の表れです。",
    "For many years the creator of this site and his parents played across two homes on ItsYourTurn and GoldToken, the big turn-based sites of the early web. Othello with his father, and gomoku, Pente and Othello with his mother. For hours a day, with dozens of games open at once, they even became members to raise the daily limit on moves, because twenty moves would not last until noon. Those sites understood that a game between people who love each other does not need to be fast, and that what matters is that it stays. {site} is a continuation of that, and a mark of respect for it.",
  ),
  "home.story.two": r(
    "家族は半分が日本人で、ゲームはその血筋とともにありました。五目並べは、1000年前の平安時代から日本で碁盤の上で遊ばれてきました。このサイトの名前は、数の五を日本語で言っただけのもの、{kanji}、つまり5つの石です。",
    "The family is half Japanese, and the games came with that heritage. Gomoku has been played on go boards in Japan since the Heian period, 1,000 years ago. The name of this site is just the number five said in Japanese: {kanji}, that is, five stones.",
  ),
  "home.story.read": r("物語をすべて読む →", "Read the whole story →"),
  "home.door": r(
    "{site} {kanji}は招待制です。合言葉をお持ちの方は{enter}。お持ちでない方は{ask}。",
    "{site} {kanji} is invitation-only. If you have a 合言葉, {enter}. If you do not, {ask}.",
  ),
  "home.doorEnter": r("こちらから入ってください", "please enter from here"),
  "home.doorAsk": r("こちらから依頼してください", "please ask from here"),

  "home.beta.title": r("ベータ版・無料・テスト協力者募集", "Beta version, free, looking for testing collaborators"),
  "home.beta.lead": r(
    "{site}はベータ版です。ゲームは本物で、終わった対局はすべて残りますが、ページは週ごとに変わり、不具合が出ることもあります。無料で、お支払いも購入も要りません。規模が小さいうちは招待制です。",
    "{site} is a beta version. The games are real and every finished game is kept, but pages change from week to week and bugs may appear. It is free, and no payment or purchase is needed. While it is small it is invitation-only.",
  ),
  "home.beta.nobody": r(
    "テストに協力してくださった方は、遊んでいる名前で、{link}にお名前を載せてお礼をしています。ご協力くださったすべての方に感謝しています。",
    "Everyone who helps with testing is thanked on {link} under the name they play with. We are grateful to everyone who has helped.",
  ),
  "home.beta.some.one": r(
    "すでに1人の方が{site}のテストに協力してくださっていて、遊んでいる名前で、{link}にお名前を載せてお礼をしています。ご協力くださったすべての方に感謝しています。",
    "One person is already helping test {site}, and they are thanked on {link} under the name they play with. We are grateful to everyone who has helped.",
  ),
  "home.beta.some.other": r(
    "すでに{count}人の方が{site}のテストに協力してくださっていて、それぞれ遊んでいる名前で、{link}にお名前を載せてお礼をしています。ご協力くださったすべての方に感謝しています。",
    "{count} people are already helping test {site}, and each is thanked on {link} under the name they play with. We are grateful to everyone who has helped.",
  ),
  "home.beta.thanksLink": r("お礼のページ", "the thank-you page"),
  "home.ask.lead": r(
    "テストに協力してくださる方を探しています。ゲームの腕前は問いません。特に助かるのは次のことです。",
    "We are looking for people to help with testing, and skill at the games does not matter. What helps most is the following.",
  ),
  "home.ask.play": r("人やコンピュータを相手に何局か遊ぶこと。パソコンだけでなくスマートフォンでもお願いします。", "Play a few games against people or computers, on a smartphone as well as a computer."),
  "home.ask.report": r("規則が違って見えたところ、分かりにくかったページ、打った手が置いた場所に入らなかったことを教えてください。", "Tell us where a rule looked wrong, which page was confusing, or where a move did not go where you placed it."),
  "home.ask.say": r("次にここで遊びたいゲーム、以前のサイトで遊んでいたゲームを教えてください。", "Tell us which game you want to play here next, and which games you played on earlier sites."),
  "home.ask.member": r(
    "すでに会員なので、テスト協力者でもあります。気づいたことは{mail}までお知らせください。対局のもう一方の席を友達に渡すのもおすすめです。1つの盤を2人で使うのが、いちばんのテストです。",
    "You are already a member, so you are also a testing collaborator. Please send what you notice to {mail}. It is also good to hand the other seat of a game to a friend. Two people on one board is the best test.",
  ),
  "home.ask.stranger": r(
    "参加するには、招待を依頼して、自己紹介を一言添えてください。テストにも協力したい場合は、同じメッセージにそう書いてください。{sites}で遊んでいた方は特に歓迎します。{mail}に直接ご連絡いただくこともできます。",
    "To join, ask for an invitation and add a line about yourself. If you also want to help with testing, say so in the same message. People who played on {sites} are especially welcome. You can also contact {mail} directly.",
  ),

  "home.start.newTitle": r("はじめての方へ", "For those new to it"),
  "home.start.returningTitle": r("以前遊んだことがある方へ", "For those who have played before"),
  "home.start.browse": r("ゲームを見てみる", "Look at the games"),
  "home.start.browseLine": r("{label}：すべてのゲームの規則、盤の絵、発祥を載せています。", "{label}: every game's rules, a picture of its board, and its origin are given."),
  "home.start.guide": r("ガイドを読む", "Read a guide"),
  "home.start.guideLine": r("{label}：勝てる形と、誰もが一度はする間違いを紹介します。", "{label}: it introduces the shapes that win and the mistakes everyone makes once."),
  "home.start.story": r("物語を読む", "Read the story"),
  "home.start.storyLine": r("{label}：このサイトがある理由と、数え方を書いています。", "{label}: it describes why this site exists and how it counts."),
  "home.start.begin": r("対局を始める", "Start a game"),
  "home.start.beginLine": r("{label}：ゲーム、盤、相手（人かコンピュータ）を選びます。", "{label}: choose the game, the board and the opponent (a person or a computer)."),
  "home.start.roots": r("ゲームのルーツ", "The roots of the games"),
  "home.start.rootsLine": r("{label}：1000年続く五目並べ、オセロ、名高い開局を紹介します。", "{label}: it introduces a thousand years of gomoku, Othello, and famous openings."),
  "home.start.bots": r("コンピュータを知る", "Get to know the computers"),
  "home.start.botsLine": r("{label}：段階別の5つと専門の2つのコンピュータと、その強さの測り方を紹介します。", "{label}: it introduces the five graded and two specialist computers, and how their strength was measured."),
  "home.start.beginLineInvite": r("{label}：ゲーム、盤、相手（人かコンピュータ）を選びます（招待が届いたあと）。", "{label}: choose the game, the board and the opponent (a person or a computer) (after an invitation arrives)."),
  "home.start.older": r(
    "{first}や{second}で長年遊んできましたか。{mail}宛てに、サイトと遊んでいた名前を書いてお送りください。戦績を1局ずつコピーして、ここでの対局の隣に載せられます。",
    "Have you played for many years on {first} or {second}? Write to {mail} with the site and the name you played under. Your record can be copied one game at a time and shown beside your games here.",
  ),
};
