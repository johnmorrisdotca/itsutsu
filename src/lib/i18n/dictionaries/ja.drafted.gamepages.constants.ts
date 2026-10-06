import type { PhraseKey } from "../i18n.constants";
import type { DraftedPhrase, Review } from "./ja.drafted.constants";

/**
 * Japanese for the gamepages.* phrases, in a file of its own so the big drafted
 * dictionary is not the one place every ticket edits. Joined into `JA_DRAFTED`.
 * Each row carries the reviewer's pass (`review`).
 */
const AGENT_READ: Review = { by: "agent", on: "2026-10-06" };

export const JA_DRAFTED_GAMEPAGES: Partial<Record<PhraseKey, DraftedPhrase>> = {
  // Page titles, which the tab and the heading share
  "gamepages.games": {
    text: "ゲーム",
    back: "Games",
    review: AGENT_READ,
  },
  "gamepages.game": {
    text: "対局",
    back: "Game",
    review: AGENT_READ,
  },
  "gamepages.newGame": {
    text: "新規対局",
    back: "New game",
    review: AGENT_READ,
  },
  "gamepages.newGameOf": {
    text: "{game}の新規対局",
    back: "New game of {game}",
    review: AGENT_READ,
  },
  "gamepages.startGame": {
    text: "{game}を始める",
    back: "Start {game}",
    review: AGENT_READ,
  },
  "gamepages.playGame": {
    text: "{game}を遊ぶ",
    back: "Play {game}",
    review: AGENT_READ,
  },
  "gamepages.begin": {
    text: "開始",
    back: "Begin",
    review: AGENT_READ,
  },
  "gamepages.howToPlay": {
    text: "遊び方",
    back: "How to play",
    review: AGENT_READ,
  },
  // A match, live or filed
  "gamepages.liveGame": {
    text: "対局中",
    back: "Game in progress",
    review: AGENT_READ,
  },
  "gamepages.gameReview": {
    text: "感想戦",
    back: "Game review",
    review: AGENT_READ,
  },
  "gamepages.gameHistory": {
    text: "棋譜",
    back: "Game history",
    review: AGENT_READ,
  },
  "gamepages.backToHistory": {
    text: "棋譜の一覧に戻る",
    back: "Back to the list of game records",
    review: AGENT_READ,
  },
  "gamepages.started": {
    text: "{when}に開始",
    back: "Started {when}",
    review: AGENT_READ,
  },
  "gamepages.finishedAt": {
    text: "{when}に終了",
    back: "finished {when}",
    review: AGENT_READ,
  },
  "gamepages.friendlyUnrated": {
    text: "親善対局・レーティング対象外",
    back: "Friendly game, not rated",
    review: AGENT_READ,
  },
  "gamepages.playAgainAs": {
    text: "{colour}でもう一度対局",
    back: "Play again as {colour}",
    review: AGENT_READ,
  },
  "gamepages.fork": {
    text: "分岐",
    back: "Fork",
    review: AGENT_READ,
  },
  "gamepages.forkNote": {
    text: "この局面から、同じ相手との2局目を始めます。どちらの対局も続きます。持ち時間と、レーティング対局にするかどうかは、始める前に決めます。盤と規則は、この局面のものを引き継ぎます。",
    back: "Start a second game from this exact position, against the same opponent. Both games continue. The time control and whether it counts for rating are decided before it starts. The board and the rules come over with the position.",
    review: AGENT_READ,
  },
  "gamepages.forkButton": {
    text: "{move}手目から対局",
    back: "Play from move {move}",
    review: AGENT_READ,
  },
  "gamepages.watching": {
    text: "この対局を観戦しています。打つには、自分の席のリンクを開いてください。",
    back: "You are watching this game. To play, open your own seat link.",
    review: AGENT_READ,
  },
  // The notice when a seat could not be claimed
  "gamepages.seatWaiting": {
    text: "席はそのまま空けてあります。",
    back: "Your seat is still being kept free.",
    review: AGENT_READ,
  },
  "gamepages.seatLimit": {
    text: "同時に対局できる数の上限にすでに達しているため、席は確保されませんでした。",
    back: "You have already reached the limit of games at once, so the seat was not claimed for you.",
    review: AGENT_READ,
  },
  "gamepages.seatHeldLine": {
    text: "{held}に着席中のため、同時に対局できる上限（{limit}局）に達しており、席は確保されませんでした。",
    back: "You are seated in {held}, which has reached the limit of games at once ({limit}), so the seat was not claimed for you.",
    review: AGENT_READ,
  },
  "gamepages.heldLink.one": {
    text: "対局中の{count}局",
    back: "{count} game being played",
    review: AGENT_READ,
  },
  "gamepages.heldLink.other": {
    text: "対局中の{count}局",
    back: "{count} games being played",
    review: AGENT_READ,
  },
  "gamepages.heldTitle": {
    text: "席に着いて対局中のゲームです。上限に数えられるのは、これらです。",
    back: "The games being played with you in a seat. These are the ones the limit counts.",
    review: AGENT_READ,
  },
  "gamepages.seatFinish": {
    text: "{link}で1局を終えるか投了してから、もう一度同じリンクを開いてください。リンクはまだ使えます。",
    back: "Finish or resign one game in {link}, then open the same link again. The link can still be used.",
    review: AGENT_READ,
  },
  "gamepages.yourGames": {
    text: "対局中",
    back: "Games in progress",
    review: AGENT_READ,
  },
  // An offer nobody took up
  "gamepages.offerDeclined": {
    text: "この申し込みは断られました",
    back: "This offer was turned down",
    review: AGENT_READ,
  },
  "gamepages.offerWithdrawn": {
    text: "この申し込みは取り下げられました",
    back: "This offer was withdrawn",
    review: AGENT_READ,
  },
  "gamepages.offerBodyDeclined": {
    text: "ここで{board}の{game}が申し込まれましたが、相手は対局しないことを選びました。対局は始まっていないため、結果はなく、勝者も敗者もなく、どちらのレーティングも動いていません。",
    back: "A game of {game} on {board} was offered here, but the other player chose not to play it. The game never started, so there is no result: there is no winner or loser, and neither rating moved.",
    review: AGENT_READ,
  },
  "gamepages.offerBodyWithdrawn": {
    text: "ここで{board}の{game}が申し込まれましたが、返事の前に取り下げられました。対局は始まっていないため、結果はなく、勝者も敗者もなく、どちらのレーティングも動いていません。",
    back: "A game of {game} on {board} was offered here, but the offer was taken back before it was answered. The game never started, so there is no result: there is no winner or loser, and neither rating moved.",
    review: AGENT_READ,
  },
  "gamepages.offerNote": {
    text: "申し込みは、断っても何もかかりません。それが申し込みの良いところです。いつでも、もう一度申し込めます。",
    back: "Refusing an offer costs nothing, which is the point of offers. You can ask again at any time.",
    review: AGENT_READ,
  },
  // A game's own front door
  "gamepages.pictureAlt": {
    text: "対局中の{game}の盤面",
    back: "The board of a game of {game} in progress",
    review: AGENT_READ,
  },
  "gamepages.practiceBoard": {
    text: "練習盤",
    back: "Practice board",
    review: AGENT_READ,
  },
  "gamepages.fromCountry": {
    text: "発祥：{country}",
    back: "Origin: {country}",
    review: AGENT_READ,
    ask: "The country is printed as the data holds it, in English (\"発祥：Japan\"). Localising country names needs a table of its own; John to decide whether to add one.",
  },
  "gamepages.alsoKnownAs": {
    text: "別名：{names}。",
    back: "Also known as: {names}.",
    review: AGENT_READ,
  },
  "gamepages.objective": {
    text: "目的",
    back: "Objective",
    review: AGENT_READ,
  },
  "gamepages.fullRules": {
    text: "{game}の規則（全文）",
    back: "Full rules of {game}",
    review: AGENT_READ,
  },
  "gamepages.moreOnThis": {
    text: "このゲームのほかのページ",
    back: "Other pages about this game",
    review: AGENT_READ,
  },
  "gamepages.rules": {
    text: "規則",
    back: "Rules",
    review: AGENT_READ,
  },
  "gamepages.leaderboard": {
    text: "番付",
    back: "Leaderboard",
    review: AGENT_READ,
  },
  "gamepages.family": {
    text: "系統",
    back: "Family",
    review: AGENT_READ,
  },
  "gamepages.background": {
    text: "背景",
    back: "Background",
    review: AGENT_READ,
  },
  "gamepages.yourGamesOf": {
    text: "自分の棋譜",
    back: "Your game records",
    review: AGENT_READ,
  },
  "gamepages.wikipedia": {
    text: "Wikipediaで{game}について読む ↗",
    back: "Read about {game} on Wikipedia ↗",
    review: AGENT_READ,
  },
  // Page titles and leads
  "gamepages.gamesLead": {
    text: "ここにあるゲームのほとんどは、五目並べに工夫を1つ加えたものです。名前を押すと、そのゲームの規則、戦績、順位表、盤に進めます。",
    back: "Almost every game here is five in a row with one idea changed. Pressing a name takes you to that game's rules, record, standings and board.",
    review: AGENT_READ,
  },
  "gamepages.publicRead": {
    text: "ここにあるゲームは、規則や由来、属する系統まで、だれでも無料で読めます。遊ぶには招待が必要です。",
    back: "Anyone can read about every game here for free: the rules, what it is, where it came from and the family it belongs to. Playing one needs an invite.",
    review: AGENT_READ,
  },
  "gamepages.askInvite": {
    text: "招待がない方はこちら",
    back: "No invite? This way",
    review: AGENT_READ,
  },
  "gamepages.haveInvite": {
    text: "招待を持っています →",
    back: "I have an invite →",
    review: AGENT_READ,
  },
  "gamepages.publicLead": {
    text: "ここにあるゲームのほとんどは、五目並べに工夫を1つ加えたものです。下の名前はどれも、そのゲームに通じています。一覧の3つの見方は、同じゲームの並べ方が違うだけです。",
    back: "Almost every game here is five in a row with one idea changed. Every name below leads to that game, and the three views of the list are just different ways of arranging the same games.",
    review: AGENT_READ,
  },
  "gamepages.inThisFamily": {
    text: "この系統には{count}があり、{game}もその1つです。",
    back: "This family has {count}, and {game} is one of them.",
    review: AGENT_READ,
  },
  "gamepages.fromOtherFamilies": {
    text: "このほか、ほかの系統の{count}もここに並べています。",
    back: "In addition, {count} from other families are listed here too.",
    review: AGENT_READ,
  },
  "gamepages.everyFamily": {
    text: "すべての系統とゲーム",
    back: "Every family and every game",
    review: AGENT_READ,
  },
  "gamepages.partyNote": {
    text: "{count}。どれも、スマートフォンかタブレットを1台、卓で回して遊びます。ほかの系統のゲームには、その所属が書いてあります。",
    back: "{count}, each played by passing one phone or tablet around the table. A game from another family says where it belongs.",
    review: AGENT_READ,
  },
  "gamepages.tableCardsNote": {
    text: "{count}。スマートフォンかタブレットを1台、卓で回して遊びます。ひとつでは、複数の端末でも遊べ、どの席にもコンピュータを座らせられます。",
    back: "{count}, played by passing one phone or tablet around the table. Hitotsu can also be played on several devices, with a computer in any seat.",
    review: AGENT_READ,
  },
  "gamepages.tablesNote": {
    text: "{count}。1台の端末を囲んで、2台の端末で、または4段階の強さのコンピュータと遊びます。",
    back: "{count}, played around one device, on two devices, or against the computer at four strengths.",
    review: AGENT_READ,
  },
  "gamepages.noBackground": {
    text: "{game}の背景画は、まだありません。",
    back: "There is no background art for {game} yet.",
    review: AGENT_READ,
  },
  "gamepages.backgroundWhere": {
    text: "背景画ができたら、ここに載せます。絵より先にこのページを用意しているのは、わざとです。ページのアドレスはゲームを並べる仕組みの一部なので、絵があってもなくても残します。何も描かれていないとはっきり書くほうが、別の目的で作ったものでこの場所を埋めるより良いからです。",
    back: "When there is background art, it will go here. The page exists ahead of the pictures on purpose: the page's address is part of how games are laid out, so it is kept whether or not anything has been drawn, and saying plainly that nothing has been drawn is better than filling the space with something made for another purpose.",
    review: AGENT_READ,
  },
  "gamepages.rulesOf": {
    text: "{game}の規則",
    back: "The rules of {game}",
    review: AGENT_READ,
  },
  "gamepages.yoursCrumb": {
    text: "自分",
    back: "Yours",
    review: AGENT_READ,
  },
  "gamepages.yourGamesTitle": {
    text: "{game}の自分の棋譜",
    back: "Your game records of {game}",
    review: AGENT_READ,
  },
  "gamepages.meUnknown": {
    text: "このページは自分の対局を数えますが、まだだれの対局か分かりません。",
    back: "This page counts your own games, but it does not yet know whose games they are.",
    review: AGENT_READ,
  },
  "gamepages.meNoPlayer": {
    text: "このページは自分の対局を数えますが、このアカウントにはまだ対局者がいません。1局終えると、ここに表示されます。",
    back: "This page counts your own games, but this account has no player yet. Once you finish a game, it will be shown here.",
    review: AGENT_READ,
  },
  "gamepages.everyGameHere": {
    text: "ここで対局された{game}の全対局",
    back: "Every game of {game} played here",
    review: AGENT_READ,
  },
  "gamepages.titleYourGame": {
    text: "{game}の自分の棋譜",
    back: "Your game records of {game}",
    review: AGENT_READ,
  },
  "gamepages.titleSolve": {
    text: "解いた記録",
    back: "A solve",
    review: AGENT_READ,
  },
  "gamepages.titleSolveOf": {
    text: "{game}を解いた記録",
    back: "A solve of {game}",
    review: AGENT_READ,
  },
  "gamepages.titleYourPuzzle": {
    text: "自分のパズル",
    back: "Your puzzle",
    review: AGENT_READ,
  },
  "gamepages.titleYourPuzzleOf": {
    text: "自分の{game}",
    back: "Your {game}",
    review: AGENT_READ,
  },
  "gamepages.titleAllSolves": {
    text: "解いた記録の一覧",
    back: "All solves",
    review: AGENT_READ,
  },
  "gamepages.titleDailyWords": {
    text: "毎日の言葉",
    back: "Daily words",
    review: AGENT_READ,
  },
  "gamepages.titleOnlineTable": {
    text: "オンライン卓",
    back: "Online table",
    review: AGENT_READ,
  },
  "gamepages.titleFromHistory": {
    text: "履歴から",
    back: "From your history",
    review: AGENT_READ,
  },
  // A game's own leaderboard
  "gamepages.linkRules": {
    text: "規則",
    back: "rules",
    review: AGENT_READ,
  },
  "gamepages.linkHistory": {
    text: "棋譜",
    back: "history",
    review: AGENT_READ,
  },
  "gamepages.linkGame": {
    text: "ゲーム",
    back: "the game",
    review: AGENT_READ,
  },
  "gamepages.eloNote": {
    text: "ここのレーティングは、このゲーム固有のElo値です。1600から始まり、名前のある会員どうしの{game}の対局でだけ動きます。最初の数局は未定、落ち着くまでは仮、20局を過ぎると確定です。",
    back: "The ratings here are this game's own Elo values. They start at 1600 and move only through games of {game} between two named members. A standing is undecided for the first few games, provisional while it settles, and settled after twenty games.",
    review: AGENT_READ,
  },
  "gamepages.ask": {
    text: "申し込む",
    back: "Ask",
    review: AGENT_READ,
  },
  "gamepages.noRatedGames": {
    text: "会員どうしの{game}のレーティング対局は、まだありません。",
    back: "There are no rated games of {game} between members yet.",
    review: AGENT_READ,
  },
  "gamepages.beFirst": {
    text: "{game}を最初に遊ぶ →",
    back: "Be the first to play {game} →",
    review: AGENT_READ,
  },
  "gamepages.againstBots": {
    text: "対コンピュータ",
    back: "Against the computer",
    review: AGENT_READ,
  },
  "gamepages.botLadderNote": {
    text: "このゲームだけの別の順位表で、片方の席がコンピュータだった対局を対象にします。このレーティングは上のものとは別で、2つが合算されることはありません。段位はコンピュータの打ち方につけた名前であって、強さの約束ではありません。順位と、その元になった対局を見てください。それが順位表の役目です。",
    back: "A separate ladder, for this game alone, covering games where one seat was a computer. These ratings are separate from the ones above, and the two are never added together. A grade is a name for how a computer plays, not a promise about how well it does: look at the standing and the games behind it, which is what a ladder is for.",
    review: AGENT_READ,
  },
  "gamepages.noBotGames": {
    text: "{game}で、コンピュータを相手にしたレーティング対局を終えた人は、まだいません。",
    back: "Nobody has yet finished a rated game of {game} against a computer.",
    review: AGENT_READ,
  },
  "gamepages.playOne": {
    text: "遊んでみる →",
    back: "Try one →",
    review: AGENT_READ,
  },
  "gamepages.alsoIn": {
    text: "{family}のほかのゲーム：",
    back: "Other games in {family}:",
    review: AGENT_READ,
  },
  // The play page's footer
  // Lists, trails and panels
  "gamepages.whereThisIs": {
    text: "現在の場所",
    back: "Where you are",
    review: AGENT_READ,
  },
  "gamepages.familyAlone": {
    text: "この系統には、今のところこのゲームだけです。",
    back: "So far this is the only game in its family.",
    review: AGENT_READ,
  },
  "gamepages.alsoShownUnder": {
    text: "{shelves}にも載っています。",
    back: "Also shown under {shelves}.",
    review: AGENT_READ,
  },
  "gamepages.titleAlsoInFamily": {
    text: "同じ系統のほかのゲーム",
    back: "Other games in this family",
    review: AGENT_READ,
  },
  "gamepages.titleAlsoOnShelf": {
    text: "同じ棚のほかのゲーム",
    back: "Other games on its shelf",
    review: AGENT_READ,
  },
  "gamepages.theOneYouCameFrom": {
    text: "— いま見ていたゲーム",
    back: "— the one you were just looking at",
    review: AGENT_READ,
  },
  "gamepages.alsoUnder": {
    text: "{family}にも所属",
    back: "also under {family}",
    review: AGENT_READ,
  },
  "gamepages.letterGroup": {
    text: "頭文字で絞る",
    back: "Filter games by first letter",
    review: AGENT_READ,
  },
  "gamepages.all": {
    text: "すべて",
    back: "All",
    review: AGENT_READ,
  },
  "gamepages.kindGroup": {
    text: "勝ち方で絞る",
    back: "Filter games by how they are won",
    review: AGENT_READ,
  },
  "gamepages.any": {
    text: "指定なし",
    back: "No preference",
    review: AGENT_READ,
  },
  "gamepages.noMatch": {
    text: "当てはまるゲームはありません。",
    back: "No game matches.",
    review: AGENT_READ,
  },
  "gamepages.catalogueTabs": {
    text: "ゲームの表示方法",
    back: "How the games are shown",
    review: AGENT_READ,
  },
  "gamepages.notHere": {
    text: "ここで遊べるゲームではありません。ほかのサイトから引き継いだ記録にあるものです。",
    back: "Not a game that can be played here. This comes from a record carried over from another site.",
    review: AGENT_READ,
  },
  "gamepages.countElsewhere": {
    text: "ほかのサイトで数えたものです。ここには開けるゲームがありません。",
    back: "Counted on another site, so there is no game here to open.",
    review: AGENT_READ,
  },
  "gamepages.playedHereEmpty": {
    text: "ここで{game}が対局されたことは、まだありません。",
    back: "No games of {game} have been played here yet.",
    review: AGENT_READ,
  },
  "gamepages.lookingForGame": {
    text: "対局相手を探している人",
    back: "People looking for a game",
    review: AGENT_READ,
  },
  "gamepages.playButton": {
    text: "遊ぶ →",
    back: "Play →",
    review: AGENT_READ,
  },
  "gamepages.openSourceCredit": {
    text: "{package}で動いています（オープンソース）。",
    back: "Runs on {package}, which is open source.",
    review: AGENT_READ,
  },
  "gamepages.ladderRead": {
    text: "{game}について読むのは、だれでもできます。だれが強いかを見るのは、対局する会員向けの部分で、招待が必要です。",
    back: "Anybody can read about {game}. Seeing who is strong at it is for the members who play, and needs an invite.",
    review: AGENT_READ,
  },
  "gamepages.champion": {
    text: "王者：",
    back: "Champion:",
    review: AGENT_READ,
  },
  "gamepages.ladderEmpty": {
    text: "{game}で順位を持つ人は、まだいません。順位は、会員どうしのレーティング対局から生まれます。",
    back: "Nobody has a standing at {game} yet. A standing comes from a rated game between two members.",
    review: AGENT_READ,
  },
  "gamepages.yourRecordAt": {
    text: "{game}での自分の戦績",
    back: "Your record at {game}",
    review: AGENT_READ,
  },
  "gamepages.fullLeaderboard": {
    text: "順位表の全体を見る →",
    back: "See the full leaderboard →",
    review: AGENT_READ,
  },
  // The rules window over a board
  "gamepages.rulesObjective": {
    text: "目的",
    back: "Objective",
    review: AGENT_READ,
  },
  "gamepages.rulesBoard": {
    text: "盤",
    back: "Board",
    review: AGENT_READ,
  },
  "gamepages.rulesPlay": {
    text: "遊び方",
    back: "How to play",
    review: AGENT_READ,
  },
  "gamepages.rulesHouse": {
    text: "ハウスルール",
    back: "House rules",
    review: AGENT_READ,
  },
  "gamepages.rulesClose": {
    text: "閉じる",
    back: "Close",
    review: AGENT_READ,
  },
  "gamepages.rulesOpen": {
    text: "規則",
    back: "Rules",
    review: AGENT_READ,
  },
  "gamepages.playFooter": {
    text: "{game}：{tagline}　詳しくは{rules}をどうぞ。",
    back: "{game}: {tagline} For details, please see {rules}.",
    review: AGENT_READ,
  },
  "gamepages.facetPlay": {
    text: "遊ぶ",
    back: "play",
    review: AGENT_READ,
  },
  "gamepages.facetLeaderboard": {
    text: "番付",
    back: "leaderboard",
    review: AGENT_READ,
  },
  "gamepages.facetFamily": {
    text: "系統",
    back: "family",
    review: AGENT_READ,
  },
  "gamepages.show": {
    text: "開く",
    back: "open",
    review: AGENT_READ,
  },
  "gamepages.hide": {
    text: "閉じる",
    back: "close",
    review: AGENT_READ,
  },
  "gamepages.listIntro": {
    text: "ゲームは{games}種類、{families}の系統に分かれています。どれにも専用のページがあり、その下に規則、戦績、順位表、盤があります。",
    back: "There are {games} games in {families} families. Each has a page of its own, with the rules, the record, the standings and a board under it.",
    review: AGENT_READ,
  },
  "gamepages.realTitle": {
    text: "実戦から",
    back: "From real games",
    review: AGENT_READ,
  },
  "gamepages.realLead": {
    text: "ここで対局された直近{count}局の終わり方です。どれも、その対局のページに進めます。",
    back: "How the last {count} games played here ended. Each one leads to its game page.",
    review: AGENT_READ,
  },
  "gamepages.realEmpty": {
    text: "ここでこのゲームを終えた人は、まだいないため、描くものがありません。",
    back: "Nobody has finished a game of this here yet, so there is nothing to draw.",
    review: AGENT_READ,
  },
  "gamepages.realFirst": {
    text: "最初に遊ぶ →",
    back: "Be the first to play →",
    review: AGENT_READ,
  },
  "gamepages.realShut": {
    text: "ここで会員が対局した盤は、会員だけに見せています。",
    back: "The boards of games members have played here are shown to members only.",
    review: AGENT_READ,
  },
  "gamepages.realJoin": {
    text: "招待がない方はこちら →",
    back: "No invite? This way →",
    review: AGENT_READ,
  },
  "gamepages.realOpen": {
    text: "この対局を開く",
    back: "Open this game",
    review: AGENT_READ,
  },
};
